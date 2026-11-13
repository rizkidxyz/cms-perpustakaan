// Helper video yang dipakai editor (client) dan renderer (server).
// Tidak boleh mengimpor modul Node/server-only.

export const VIDEO_PROVIDERS = ["file", "youtube", "vimeo", "drive"];
export const DEFAULT_VIDEO_PROVIDER = "file";

export const VIDEO_PROVIDER_LABELS = {
  file: "File / CDN",
  youtube: "YouTube",
  vimeo: "Vimeo",
  drive: "Google Drive",
};

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,20}$/;
const VIMEO_ID_PATTERN = /^\d{6,12}$/;
const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;
const FILE_PATH_PATTERN = /\.(mp4|webm)$/i;
const STORED_VIDEO_URL_PATTERN =
  /^\/api\/media\/videos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|webm)$/i;

const EMBED_URLS = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${id}`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}`,
  drive: (id) => `https://drive.google.com/file/d/${id}/preview`,
};

export function normalizeVideoProvider(value) {
  return VIDEO_PROVIDERS.includes(value) ? value : DEFAULT_VIDEO_PROVIDER;
}

export function isStoredVideoUrl(value) {
  return typeof value === "string" && STORED_VIDEO_URL_PATTERN.test(value);
}

function parseHttpUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function getHostname(url) {
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

function extractYouTubeId(url) {
  const hostname = getHostname(url);

  if (hostname === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/);
    const id = match?.[1];
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  return null;
}

function extractVimeoId(url) {
  const hostname = getHostname(url);
  if (hostname !== "vimeo.com" && !hostname.endsWith(".vimeo.com")) return null;

  const match = url.pathname.match(/\/(\d{6,12})(?:$|[/?#])/);
  const id = match?.[1];
  return id && VIMEO_ID_PATTERN.test(id) ? id : null;
}

function extractDriveId(url) {
  if (getHostname(url) !== "drive.google.com") return null;

  const match = url.pathname.match(/\/file\/d\/([^/]+)/);
  const id = match?.[1] || url.searchParams.get("id");
  return id && DRIVE_ID_PATTERN.test(id) ? id : null;
}

// Ubah URL apa pun menjadi URL embed kanonik yang aman.
export function getVideoEmbedUrl(provider, rawSrc) {
  const normalizedProvider = normalizeVideoProvider(provider);
  if (normalizedProvider === "file") return null;

  const url = parseHttpUrl(rawSrc);
  if (!url) return null;

  const id =
    normalizedProvider === "youtube"
      ? extractYouTubeId(url)
      : normalizedProvider === "vimeo"
        ? extractVimeoId(url)
        : extractDriveId(url);

  if (!id) return null;
  return EMBED_URLS[normalizedProvider](id);
}

// Deteksi provider dari URL yang ditempel pengguna.
export function detectVideoSource(rawValue) {
  const url = parseHttpUrl(rawValue);
  if (!url) return null;

  if (extractYouTubeId(url)) {
    return { provider: "youtube", src: getVideoEmbedUrl("youtube", url.href) };
  }

  if (extractVimeoId(url)) {
    return { provider: "vimeo", src: getVideoEmbedUrl("vimeo", url.href) };
  }

  if (extractDriveId(url)) {
    return { provider: "drive", src: getVideoEmbedUrl("drive", url.href) };
  }

  // File langsung dari CDN: harus berakhiran .mp4 atau .webm.
  if (FILE_PATH_PATTERN.test(url.pathname)) {
    return { provider: "file", src: url.href };
  }

  return null;
}

// Validasi + normalisasi sumber video di server. Provider tidak dipercaya dari client.
export function canonicalVideoUrl(provider, rawSrc) {
  const normalizedProvider = normalizeVideoProvider(provider);

  if (normalizedProvider === "file") {
    const trimmed = typeof rawSrc === "string" ? rawSrc.trim() : "";
    if (!trimmed || trimmed.length > 2048) return null;
    if (isStoredVideoUrl(trimmed)) return trimmed;

    const url = parseHttpUrl(trimmed);
    if (!url || !FILE_PATH_PATTERN.test(url.pathname)) return null;
    return url.href;
  }

  return getVideoEmbedUrl(normalizedProvider, rawSrc);
}
