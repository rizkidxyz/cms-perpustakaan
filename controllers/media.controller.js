import "server-only";

import path from "node:path";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { getCurrentUser } from "../lib/auth";
import { isSameOrigin, jsonNoStore, readJsonBody } from "../lib/cms-security";
import { cleanupUnusedMedia, sweepOrphanMedia } from "../lib/media-cleanup";
import {
  buildMediaUrl,
  detectImage,
  detectVideo,
  getMediaDirectory,
  getMediaType,
  resolveMediaPath,
} from "../lib/media-storage";

// Sapu orphan maksimal sekali per jam agar tidak membebani setiap upload.
const ORPHAN_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
let lastOrphanSweepAt = 0;

// Tipe media dipilih lewat query (?type=videos); default tetap gambar.
function resolveUploadType(request) {
  try {
    const type = new URL(request.url).searchParams.get("type");
    return type === "videos" ? "videos" : "images";
  } catch {
    return "images";
  }
}

function uploadLabel(mediaType) {
  return mediaType?.label || "media";
}

async function maybeSweepOrphanMedia() {
  const now = Date.now();
  if (now - lastOrphanSweepAt < ORPHAN_SWEEP_INTERVAL_MS) return;
  lastOrphanSweepAt = now;
  await sweepOrphanMedia();
}

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
}

function notFoundResponse() {
  return textResponse("Media tidak ditemukan.", 404);
}

export async function uploadMedia(request) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);

  try {
    const user = await getCurrentUser();
    if (!user) return jsonNoStore({ message: "Autentikasi diperlukan." }, 401);
    if (!["ADMIN", "EDITOR"].includes(user.role)) return jsonNoStore({ message: "Akses ditolak." }, 403);

    await maybeSweepOrphanMedia();

    const uploadType = resolveUploadType(request);
    const mediaType = getMediaType(uploadType);
    if (!mediaType) return jsonNoStore({ message: "Tipe media tidak didukung." }, 400);

    const label = uploadLabel(mediaType);
    const isVideo = uploadType === "videos";

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > mediaType.maxSize + 256 * 1024) {
      return jsonNoStore({ message: `Ukuran ${label} maksimal ${mediaType.maxLabel}.` }, 413);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return jsonNoStore({ message: `File ${label} tidak ditemukan.` }, 400);
    }
    if (file.size < 1 || file.size > mediaType.maxSize) {
      return jsonNoStore(
        { message: `Ukuran ${label} harus antara 1 byte dan ${mediaType.maxLabel}.` },
        413,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = isVideo ? detectVideo(buffer) : detectImage(buffer);
    if (!detected || !mediaType.extensions[detected.ext]) {
      return jsonNoStore(
        { message: `Format ${label} tidak didukung. Gunakan ${mediaType.formatLabel}.` },
        415,
      );
    }

    const absoluteDirectory = getMediaDirectory(uploadType);
    await mkdir(/* turbopackIgnore: true */ absoluteDirectory, { recursive: true });

    const filename = `${randomUUID()}.${detected.ext}`;
    await writeFile(path.join(/* turbopackIgnore: true */ absoluteDirectory, filename), buffer, { flag: "wx" });

    const url = buildMediaUrl(uploadType, filename);
    return jsonNoStore(
      {
        message: `${label.charAt(0).toUpperCase()}${label.slice(1)} berhasil diunggah.`,
        url,
        mime: detected.mime,
        size: buffer.length,
      },
      201,
    );
  } catch (error) {
    console.error("[CMS MEDIA UPLOAD]", error);
    return jsonNoStore({ message: "Gagal mengunggah media." }, 500);
  }
}

// Dipanggil client ketika gambar yang baru di-upload dibuang sebelum konten disimpan.
// cleanupUnusedMedia tidak akan menghapus gambar yang masih direferensikan konten.
export async function discardMedia(request) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);

  try {
    const user = await getCurrentUser();
    if (!user) return jsonNoStore({ message: "Autentikasi diperlukan." }, 401);
    if (!["ADMIN", "EDITOR"].includes(user.role)) return jsonNoStore({ message: "Akses ditolak." }, 403);

    const parsed = await readJsonBody(request, 20_000);
    if (!parsed.ok) return jsonNoStore({ message: parsed.error }, parsed.status);

    const rawUrls = Array.isArray(parsed.value.urls) ? parsed.value.urls : [];
    const urls = [...new Set(
      rawUrls.filter((url) => typeof url === "string" && url.length > 0 && url.length <= 2048),
    )].slice(0, 20);

    const deleted = await cleanupUnusedMedia(urls);
    return jsonNoStore({ message: "Pembersihan media selesai.", deleted });
  } catch (error) {
    console.error("[CMS MEDIA DISCARD]", error);
    return jsonNoStore({ message: "Gagal membersihkan media." }, 500);
  }
}

// Parse satu rentang byte. Rentang ganda diabaikan (server mengirim file penuh).
function parseByteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
  if (!match) return null;

  const [, startRaw, endRaw] = match;
  if (!startRaw && !endRaw) return null;

  let start;
  let end;

  if (!startRaw) {
    const suffixLength = Number(endRaw);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(startRaw);
    end = endRaw ? Number(endRaw) : size - 1;
  }

  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 0 || start >= size || end < start) return null;

  return { start, end: Math.min(end, size - 1) };
}

export async function serveMedia(request, segments) {
  const resolved = resolveMediaPath(segments);
  if (!resolved) return notFoundResponse();

  try {
    const fileInfo = await stat(/* turbopackIgnore: true */ resolved.absolutePath);
    if (!fileInfo.isFile()) return notFoundResponse();

    const size = fileInfo.size;
    const headers = {
      "Content-Type": resolved.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${path.basename(resolved.absolutePath)}"`,
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    };

    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const range = parseByteRange(rangeHeader, size);

      if (!range) {
        return new Response(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-store",
          },
        });
      }

      headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
      headers["Content-Length"] = String(range.end - range.start + 1);

      const stream = Readable.toWeb(
        createReadStream(/* turbopackIgnore: true */ resolved.absolutePath, {
          start: range.start,
          end: range.end,
        }),
      );

      return new Response(stream, { status: 206, headers });
    }

    headers["Content-Length"] = String(size);

    const stream = Readable.toWeb(
      createReadStream(/* turbopackIgnore: true */ resolved.absolutePath),
    );

    return new Response(stream, { status: 200, headers });
  } catch (error) {
    if (error?.code === "ENOENT") return notFoundResponse();
    console.error("[CMS MEDIA READ]", error);
    return textResponse("Gagal membaca media.", 500);
  }
}
