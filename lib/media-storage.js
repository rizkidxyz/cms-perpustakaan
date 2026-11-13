import "server-only";

import path from "node:path";
import { unlink } from "node:fs/promises";

export const MEDIA_STORAGE_ROOT = process.env.MEDIA_STORAGE_DIR
  ? path.resolve(process.env.MEDIA_STORAGE_DIR)
  : path.join(process.cwd(), "storage");

export const MEDIA_TYPES = {
  images: {
    maxSize: 5 * 1024 * 1024,
    maxLabel: "5 MB",
    label: "gambar",
    formatLabel: "JPEG, PNG, WEBP, atau GIF",
    extensions: {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    },
  },
  videos: {
    maxSize: 100 * 1024 * 1024,
    maxLabel: "100 MB",
    label: "video",
    formatLabel: "MP4 atau WEBM",
    extensions: {
      mp4: "video/mp4",
      webm: "video/webm",
    },
  },
};

const FILENAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;
const MEDIA_URL_PATTERN = /^\/api\/media\/([a-z]+)\/([0-9a-f-]{36}\.[a-z0-9]+)$/i;
const MEDIA_NODE_TYPES = new Set(["image", "video"]);

export function getMediaType(type) {
  return Object.hasOwn(MEDIA_TYPES, type) ? MEDIA_TYPES[type] : null;
}

export function getMediaDirectory(type) {
  return path.join(MEDIA_STORAGE_ROOT, type);
}

export function buildMediaUrl(type, filename) {
  return `/api/media/${type}/${filename}`;
}

export function detectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: "image/png", ext: "png" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  const signature = buffer.toString("ascii", 0, 6);
  if (signature === "GIF87a" || signature === "GIF89a") {
    return { mime: "image/gif", ext: "gif" };
  }
  return null;
}

// MP4 dan HEIC/AVIF sama-sama memakai box "ftyp", jadi brand harus dibatasi
// ke container video. Brand gambar (heic, heix, hevc, heim, heis, hevm, hevs,
// mif1, msf1, avif, avis) sengaja tidak dimasukkan.
const MP4_VIDEO_BRANDS = new Set([
  "isom",
  "iso2",
  "iso4",
  "iso5",
  "iso6",
  "mp41",
  "mp42",
  "mp71",
  "avc1",
  "dash",
  "mmp4",
  "msdh",
  "msix",
  "M4V ",
  "qt  ",
  "3gp4",
  "3gp5",
  "3g2a",
]);

// Brand gambar yang juga memakai box "ftyp" dan harus tetap ditolak.
const MP4_IMAGE_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "avif",
  "avis",
]);

const FTYP_HEADER_SIZE = 12;
const FTYP_BRAND_SIZE = 4;

// Sebagian MP4 memakai major brand yang tidak umum, tetapi tetap mencantumkan
// brand video pada daftar compatible brands di dalam box "ftyp".
function hasMp4VideoBrand(buffer) {
  const majorBrand = buffer.toString("ascii", 8, FTYP_HEADER_SIZE);
  if (MP4_IMAGE_BRANDS.has(majorBrand)) return false;
  if (MP4_VIDEO_BRANDS.has(majorBrand)) return true;

  const boxSize = buffer.readUInt32BE(0);
  // boxSize 0/1 berarti ukuran khusus (sampai EOF / largesize); batasi ke
  // panjang buffer agar aman.
  const boxEnd = boxSize >= FTYP_HEADER_SIZE ? Math.min(buffer.length, boxSize) : buffer.length;

  for (let offset = FTYP_HEADER_SIZE + FTYP_BRAND_SIZE; offset + FTYP_BRAND_SIZE <= boxEnd; offset += FTYP_BRAND_SIZE) {
    if (MP4_VIDEO_BRANDS.has(buffer.toString("ascii", offset, offset + FTYP_BRAND_SIZE))) {
      return true;
    }
  }

  return false;
}

export function detectVideo(buffer) {
  // MP4 memakai box "ftyp" pada byte 4-8. Batasi ke brand video agar
  // HEIC/AVIF (juga memakai ftyp) tidak ikut diterima.
  if (buffer.length >= FTYP_HEADER_SIZE && buffer.toString("ascii", 4, 8) === "ftyp") {
    return hasMp4VideoBrand(buffer) ? { mime: "video/mp4", ext: "mp4" } : null;
  }

  // WebM (dan Matroska) memakai header EBML.
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { mime: "video/webm", ext: "webm" };
  }

  return null;
}

// Hanya menerima /api/media/<type>/<uuid>.<ext> yang cocok dengan registry.
export function resolveMediaPath(segments) {
  if (!Array.isArray(segments) || segments.length !== 2) return null;

  const [type, filename] = segments;
  const mediaType = getMediaType(type);
  if (!mediaType || !FILENAME_PATTERN.test(filename)) return null;

  const extension = path.extname(filename).slice(1).toLowerCase();
  const contentType = mediaType.extensions[extension];
  if (!contentType) return null;

  const directory = getMediaDirectory(type);
  const absolutePath = path.join(directory, filename);
  if (!absolutePath.startsWith(`${directory}${path.sep}`)) return null;

  return { absolutePath, contentType };
}

export function getMediaPathFromUrl(url) {
  if (typeof url !== "string") return null;
  const match = url.match(MEDIA_URL_PATTERN);
  if (!match) return null;
  return resolveMediaPath([match[1], match[2]])?.absolutePath ?? null;
}

export function isStoredMediaUrl(url) {
  return Boolean(getMediaPathFromUrl(url));
}

export function collectContentMediaUrls(node, urls = new Set()) {
  if (!node || typeof node !== "object") return urls;

  if (MEDIA_NODE_TYPES.has(node.type)) {
    const src = node.attrs?.src;
    if (typeof src === "string") urls.add(src);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) collectContentMediaUrls(child, urls);
  }

  return urls;
}

export async function deleteStoredMediaFiles(urls) {
  const paths = [...new Set(urls)].map(getMediaPathFromUrl).filter(Boolean);
  if (!paths.length) return 0;

  const results = await Promise.allSettled(paths.map((absolutePath) => unlink(/* turbopackIgnore: true */ absolutePath)));

  for (const result of results) {
    if (result.status === "rejected" && result.reason?.code !== "ENOENT") {
      console.error("[CMS MEDIA DELETE]", result.reason);
    }
  }

  return paths.length;
}
