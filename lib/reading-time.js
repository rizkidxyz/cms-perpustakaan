import "server-only";

import { extractPlainText } from "./cms-content";

export const WORDS_PER_MINUTE = 225;

// Perkiraan waktu baca dari isi dokumen Tiptap.
// Hasil di bawah satu menit dianggap terlalu singkat untuk ditampilkan.
export function estimateReadingTime(content) {
  const text = extractPlainText(content);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const minutes = words / WORDS_PER_MINUTE;

  if (minutes < 1) return null;

  return { minutes: Math.round(minutes), words };
}
