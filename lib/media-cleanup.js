import "server-only";

import { readdir, stat } from "node:fs/promises";

import { prisma } from "./prisma";
import {
  buildMediaUrl,
  collectContentMediaUrls,
  deleteStoredMediaFiles,
  getMediaDirectory,
  isStoredMediaUrl,
  resolveMediaPath,
} from "./media-storage";

export const ORPHAN_MEDIA_MIN_AGE_MS = 24 * 60 * 60 * 1000;

const MEDIA_SWEEP_TYPES = ["images", "videos"];

// Semua gambar milik satu konten: cover + gambar di dalam dokumen Tiptap.
export function getPostMediaUrls(post) {
  const urls = new Set();

  if (post?.coverImage && isStoredMediaUrl(post.coverImage)) {
    urls.add(post.coverImage);
  }

  for (const url of collectContentMediaUrls(post?.content)) {
    if (isStoredMediaUrl(url)) urls.add(url);
  }

  return [...urls];
}

// Hapus file hanya jika tidak ada konten lain yang masih memakai URL tersebut.
// Gagal menghapus file tidak boleh menggagalkan operasi utama.
export async function cleanupUnusedMedia(urls) {
  const candidates = [...new Set(urls)].filter(isStoredMediaUrl);
  if (!candidates.length) return [];

  try {
    const posts = await prisma.post.findMany({
      select: { coverImage: true, content: true },
    });

    const used = new Set();
    for (const post of posts) {
      if (post.coverImage) used.add(post.coverImage);
      for (const url of collectContentMediaUrls(post.content)) used.add(url);
    }

    const removable = candidates.filter((url) => !used.has(url));
    await deleteStoredMediaFiles(removable);
    return removable;
  } catch (error) {
    console.error("[CMS MEDIA CLEANUP]", error);
    return [];
  }
}

// Sapu file gambar yang sudah tidak dipakai konten mana pun dan umurnya sudah lewat.
// Dipakai sebagai jaring pengaman untuk upload yang ditinggalkan (tab ditutup/crash).
export async function sweepOrphanMedia({ minAgeMs = ORPHAN_MEDIA_MIN_AGE_MS } = {}) {
  try {
    const candidates = [];

    for (const type of MEDIA_SWEEP_TYPES) {
      const directory = getMediaDirectory(type);
      let entries;

      try {
        entries = await readdir(/* turbopackIgnore: true */ directory, { withFileTypes: true });
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const resolved = resolveMediaPath([type, entry.name]);
        if (!resolved) continue;
        candidates.push({
          absolutePath: resolved.absolutePath,
          url: buildMediaUrl(type, entry.name),
        });
      }
    }

    if (!candidates.length) return [];

    const posts = await prisma.post.findMany({
      select: { coverImage: true, content: true },
    });

    const used = new Set();
    for (const post of posts) {
      if (post.coverImage) used.add(post.coverImage);
      for (const url of collectContentMediaUrls(post.content)) used.add(url);
    }

    const cutoff = Date.now() - minAgeMs;
    const removable = [];

    for (const candidate of candidates) {
      if (used.has(candidate.url)) continue;
      const info = await stat(/* turbopackIgnore: true */ candidate.absolutePath);
      if (info.mtimeMs <= cutoff) removable.push(candidate.url);
    }

    await deleteStoredMediaFiles(removable);
    return removable;
  } catch (error) {
    console.error("[CMS MEDIA SWEEP]", error);
    return [];
  }
}
