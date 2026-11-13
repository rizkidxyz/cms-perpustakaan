import "server-only";

import sanitizeHtml from "sanitize-html";
import { getSchema } from "@tiptap/core";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";

import { createTiptapExtensions, normalizeImageLayout } from "./tiptap-extensions";
import { canonicalVideoUrl, normalizeVideoProvider } from "./video-url";

const ALLOWED_NODES = new Set([
  "doc", "paragraph", "text", "heading", "bulletList", "orderedList",
  "listItem", "blockquote", "codeBlock", "horizontalRule", "hardBreak",
  "image", "video", "table", "tableRow", "tableCell", "tableHeader",
]);

const ALLOWED_MARKS = new Set([
  "bold", "italic", "strike", "underline", "code", "link",
  "highlight", "textStyle",
]);

const SAFE_FONTS = new Set([
  "Arial", "Georgia", "Times New Roman", "Courier New", "Verdana",
  "Tahoma", "Trebuchet MS", "sans-serif", "serif", "monospace",
]);

function safeUrl(value, { image = false } = {}) {
  if (typeof value !== "string" || value.length > 2048) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const protocols = image ? ["http:", "https:"] : ["http:", "https:", "mailto:", "tel:"];
    return protocols.includes(parsed.protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

function safeColor(value) {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  const names = new Set(["black", "white", "red", "green", "blue", "gray", "grey", "orange", "purple", "yellow"]);
  if (names.has(v.toLowerCase())) return v.toLowerCase();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
  if (/^(rgb|rgba|hsl|hsla)\([0-9.,%\s+-]+\)$/i.test(v)) return v;
  return undefined;
}

function safeFont(value) {
  if (typeof value !== "string") return undefined;
  const font = value.trim().replace(/^['"]|['"]$/g, "");
  for (const allowed of SAFE_FONTS) {
    if (allowed.toLowerCase() === font.toLowerCase()) return allowed;
  }
  return undefined;
}

function safeFontSize(value) {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return /^\d{1,3}(px|pt|rem)$/.test(v) ? v : undefined;
}

function safeLineHeight(value) {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (!/^\d(\.\d{1,2})?$/.test(v)) return undefined;
  const n = Number(v);
  return n >= 1 && n <= 3 ? v : undefined;
}

function safeDimension(value, max = 2400) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= max ? n : undefined;
}

function cleanMark(mark) {
  if (!mark || typeof mark !== "object" || !ALLOWED_MARKS.has(mark.type)) return null;
  const result = { type: mark.type };
  const attrs = mark.attrs && typeof mark.attrs === "object" ? mark.attrs : {};

  if (mark.type === "link") {
    const href = safeUrl(attrs.href);
    if (!href) return null;
    result.attrs = {
      href,
      ...(attrs.target === "_blank" ? { target: "_blank" } : {}),
      rel: "noopener noreferrer nofollow",
    };
  }

  if (mark.type === "highlight") {
    const color = safeColor(attrs.color);
    if (color) result.attrs = { color };
  }

  if (mark.type === "textStyle") {
    const clean = {};
    const color = safeColor(attrs.color);
    const backgroundColor = safeColor(attrs.backgroundColor);
    const fontFamily = safeFont(attrs.fontFamily);
    const fontSize = safeFontSize(attrs.fontSize);
    const lineHeight = safeLineHeight(attrs.lineHeight);
    if (color) clean.color = color;
    if (backgroundColor) clean.backgroundColor = backgroundColor;
    if (fontFamily) clean.fontFamily = fontFamily;
    if (fontSize) clean.fontSize = fontSize;
    if (lineHeight) clean.lineHeight = lineHeight;
    if (Object.keys(clean).length) result.attrs = clean;
  }

  return result;
}

function cleanNode(node, depth, counter) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    throw new Error("Struktur konten tidak valid.");
  }
  if (depth > 40) throw new Error("Konten terlalu dalam.");
  counter.count += 1;
  if (counter.count > 12000) throw new Error("Jumlah elemen konten terlalu banyak.");
  if (!ALLOWED_NODES.has(node.type)) throw new Error(`Node '${String(node.type)}' tidak diizinkan.`);

  const result = { type: node.type };
  const attrs = node.attrs && typeof node.attrs === "object" ? node.attrs : {};

  if (node.type === "heading") {
    const level = Number(attrs.level || 1);
    const textAlign = ["left", "center", "right", "justify"].includes(attrs.textAlign) ? attrs.textAlign : undefined;
    result.attrs = {
      level: [1, 2, 3].includes(level) ? level : 1,
      ...(textAlign ? { textAlign } : {}),
    };
  }

  if (node.type === "paragraph") {
    const textAlign = ["left", "center", "right", "justify"].includes(attrs.textAlign) ? attrs.textAlign : undefined;
    if (textAlign) result.attrs = { textAlign };
  }

  if (node.type === "orderedList") {
    const start = safeDimension(attrs.start);
    if (start) result.attrs = { start };
  }

  if (node.type === "image") {
    const src = safeUrl(attrs.src, { image: true });
    if (!src) throw new Error("Sumber gambar tidak valid.");
    const width = safeDimension(attrs.width, 10000);
    const height = safeDimension(attrs.height, 10000);
    result.attrs = {
      src,
      layout: normalizeImageLayout(attrs.layout),
      ...(typeof attrs.alt === "string" ? { alt: attrs.alt.slice(0, 300) } : {}),
      ...(typeof attrs.title === "string" ? { title: attrs.title.slice(0, 300) } : {}),
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    };
  }

  if (node.type === "video") {
    const provider = normalizeVideoProvider(attrs.provider);
    const src = canonicalVideoUrl(provider, attrs.src);
    if (!src) throw new Error("Sumber video tidak valid.");

    const title = typeof attrs.title === "string" ? attrs.title.trim().slice(0, 200) : "";
    const poster = attrs.poster ? safeUrl(attrs.poster, { image: true }) : null;

    result.attrs = {
      src,
      provider,
      ...(title ? { title } : {}),
      ...(poster ? { poster } : {}),
    };
  }

  if (node.type === "tableCell" || node.type === "tableHeader") {
    const colspan = safeDimension(attrs.colspan);
    const rowspan = safeDimension(attrs.rowspan);
    result.attrs = {
      ...(colspan && colspan <= 10 ? { colspan } : {}),
      ...(rowspan && rowspan <= 10 ? { rowspan } : {}),
    };
  }

  if (node.type === "text") {
    if (typeof node.text !== "string" || node.text.length > 100000) {
      throw new Error("Teks konten tidak valid.");
    }
    result.text = node.text;
  }

  if (Array.isArray(node.marks)) {
    const marks = node.marks.map(cleanMark).filter(Boolean);
    if (marks.length) result.marks = marks;
  }

  if (Array.isArray(node.content)) {
    result.content = node.content.map((child) => cleanNode(child, depth + 1, counter));
  }

  return result;
}

export function sanitizeTiptapDocument(input) {
  let raw;
  try {
    raw = JSON.stringify(input);
  } catch {
    throw new Error("Konten harus berupa JSON yang valid.");
  }
  if (!raw || Buffer.byteLength(raw, "utf8") > 1_000_000) {
    throw new Error("Ukuran konten maksimal 1 MB.");
  }
  if (!input || input.type !== "doc" || !Array.isArray(input.content)) {
    throw new Error("Format dokumen Tiptap tidak valid.");
  }
  const clean = cleanNode(input, 0, { count: 0 });
  try {
    // Verify node nesting and required attributes against the exact editor schema.
    getSchema(createTiptapExtensions()).nodeFromJSON(clean);
  } catch {
    throw new Error("Struktur dokumen tidak sesuai dengan skema editor.");
  }
  return clean;
}

export function extractPlainText(document) {
  const parts = [];
  function visit(node) {
    if (node?.type === "text" && typeof node.text === "string") parts.push(node.text);
    if (Array.isArray(node?.content)) node.content.forEach(visit);
  }
  visit(document);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// Dipakai untuk ringkasan kartu listing saat excerpt kosong.
// Hanya ambil teks paragraf pertama. Jika tidak ada paragraf, hasilnya kosong
// supaya kartu hanya menampilkan judul.
export function extractFirstParagraphText(document) {
  if (Array.isArray(document?.content)) {
    for (const node of document.content) {
      if (node?.type === "paragraph") {
        const text = extractPlainText(node);
        if (text) return text;
      }
    }
  }
  return "";
}

const HTML_OPTIONS = {
  allowedTags: [
    "p", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s", "del",
    "code", "pre", "blockquote", "ul", "ol", "li", "hr", "br", "a",
    "span", "mark", "img", "div", "video", "source", "iframe",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "data-layout", "loading", "decoding"],
    div: ["class", "data-video-embed", "data-provider", "data-title"],
    video: ["src", "poster", "controls", "preload", "playsinline", "title", "width", "height"],
    source: ["src", "type"],
    iframe: [
      "src", "title", "allow", "allowfullscreen", "referrerpolicy",
      "loading", "frameborder", "width", "height",
    ],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    "*": ["style"],
  },
  allowedIframeHostnames: [
    "www.youtube-nocookie.com",
    "www.youtube.com",
    "player.vimeo.com",
    "drive.google.com",
  ],
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^(rgb|rgba|hsl|hsla)\([0-9.,%\s+-]+\)$/i, /^(black|white|red|green|blue|gray|grey|orange|purple|yellow)$/i],
      "background-color": [/^#[0-9a-f]{3,8}$/i, /^(rgb|rgba|hsl|hsla)\([0-9.,%\s+-]+\)$/i, /^(black|white|red|green|blue|gray|grey|orange|purple|yellow)$/i],
      "font-family": [/^(Arial|Georgia|Times New Roman|Courier New|Verdana|Tahoma|Trebuchet MS|sans-serif|serif|monospace)$/i],
      "font-size": [/^\d{1,3}(px|pt|rem)$/],
      "line-height": [/^[1-3](\.\d{1,2})?$/],
      "text-align": [/^(left|right|center|justify)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
  },
};

export function renderSafeTiptapHtml(document) {
  const safeDocument = sanitizeTiptapDocument(document);
  const html = renderToHTMLString({
    content: safeDocument,
    extensions: createTiptapExtensions(),
  });
  return sanitizeHtml(html, HTML_OPTIONS);
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export function validateImageReference(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) {
    throw new Error("Alamat gambar tidak valid.");
  }
  const trimmed = value.trim();
  const safe = safeUrl(trimmed, { image: true });
  if (!safe) throw new Error("Gambar harus menggunakan URL HTTP(S) atau path lokal.");
  return safe;
}
