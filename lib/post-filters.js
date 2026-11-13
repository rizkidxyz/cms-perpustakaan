const MAX_TEXT_LENGTH = 100;
const MAX_SLUG_LENGTH = 120;
const MAX_ID_LENGTH = 191;
const MAX_PAGE = 10000;

export const POST_SORTS = ["terbaru", "lama"];

function readParam(params, key) {
  if (!params) return "";

  if (typeof params.get === "function") {
    return params.get(key) ?? "";
  }

  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readText(params, key, maxLength) {
  return String(readParam(params, key)).trim().slice(0, maxLength);
}

function readPage(params) {
  const value = Number.parseInt(readParam(params, "page"), 10);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 1), MAX_PAGE);
}

function readSort(params) {
  return readParam(params, "urut") === "lama" ? "lama" : "terbaru";
}

// Parameter URL publik: q, urut, kategori (alias category untuk API), page.
export function normalizePublicFilters(params, { perPage = 12 } = {}) {
  return {
    page: readPage(params),
    perPage,
    q: readText(params, "q", MAX_TEXT_LENGTH),
    sort: readSort(params),
    categorySlug: readText(params, "kategori", MAX_SLUG_LENGTH) || readText(params, "category", MAX_SLUG_LENGTH),
  };
}

// Parameter URL admin: q, status, kategoriId, urut, page.
export function normalizeAdminFilters(params, { perPage = 20 } = {}) {
  const status = readParam(params, "status");

  return {
    page: readPage(params),
    perPage,
    q: readText(params, "q", MAX_TEXT_LENGTH),
    status: status === "DRAFT" || status === "PUBLISHED" ? status : "",
    categoryId: readText(params, "kategoriId", MAX_ID_LENGTH),
    sort: readSort(params),
  };
}

export function buildPublicPostWhere({ q = "", categorySlug = "" } = {}) {
  return {
    status: "PUBLISHED",
    visibility: "PUBLIC",
    publishedAt: { not: null },
    ...(categorySlug ? { category: { is: { slug: categorySlug, isActive: true } } } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] } : {}),
  };
}

export function buildAdminPostWhere(user, { q = "", status = "", categoryId = "" } = {}) {
  return {
    ...(q ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }] } : {}),
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(user?.role === "EDITOR" ? { authorId: user.id } : {}),
  };
}

export function publicPostOrderBy(sort) {
  return sort === "lama"
    ? [{ publishedAt: "asc" }, { id: "asc" }]
    : [{ publishedAt: "desc" }, { id: "desc" }];
}

export function adminPostOrderBy(sort) {
  return sort === "lama"
    ? [{ updatedAt: "asc" }, { id: "asc" }]
    : [{ updatedAt: "desc" }, { id: "desc" }];
}

export function buildQueryString(values) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
