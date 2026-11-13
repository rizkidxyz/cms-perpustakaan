import "server-only";

import { prisma } from "../lib/prisma";
import { getCurrentUser } from "../lib/auth";
import { isSameOrigin, jsonNoStore, readJsonBody, isPrismaUniqueError } from "../lib/cms-security";
import { extractPlainText, sanitizeTiptapDocument, slugify, validateImageReference } from "../lib/cms-content";
import {
  adminPostOrderBy,
  buildAdminPostWhere,
  buildPublicPostWhere,
  normalizeAdminFilters,
  normalizePublicFilters,
  publicPostOrderBy,
} from "../lib/post-filters";
import { cleanupUnusedMedia, getPostMediaUrls } from "../lib/media-cleanup";

const POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImage: true,
  status: true,
  visibility: true,
  publishedAt: true,
  categoryId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true, email: true } },
};

function canManagePost(user, post) {
  return user.role === "ADMIN" || post.authorId === user.id;
}

async function getStaff() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: jsonNoStore({ message: "Autentikasi diperlukan." }, 401) };
  if (!(["ADMIN", "EDITOR"].includes(user.role))) {
    return { user: null, response: jsonNoStore({ message: "Akses ditolak." }, 403) };
  }
  return { user, response: null };
}

function validatePostPayload(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 3 || title.length > 180) throw new Error("Judul harus terdiri dari 3–180 karakter.");

  const slug = slugify(body.slug || title);
  if (!slug || slug.length > 160) throw new Error("Slug tidak valid.");

  const status = body.status === "PUBLISHED" ? "PUBLISHED" : body.status === "DRAFT" ? "DRAFT" : null;
  const visibility = body.visibility === "UNLISTED" ? "UNLISTED" : body.visibility === "PUBLIC" ? "PUBLIC" : null;
  if (!status || !visibility) throw new Error("Status atau visibilitas konten tidak valid.");

  const content = sanitizeTiptapDocument(body.content);
  const plainText = extractPlainText(content);
  if (status === "PUBLISHED" && plainText.length < 1) {
    throw new Error("Konten tidak boleh kosong ketika diterbitkan.");
  }

  const rawExcerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
  if (rawExcerpt.length > 500) throw new Error("Ringkasan maksimal 500 karakter.");
  // Ringkasan bersifat opsional: jangan ambil otomatis dari isi konten.
  const excerpt = rawExcerpt || null;

  const categoryId = typeof body.categoryId === "string" && body.categoryId.trim()
    ? body.categoryId.trim()
    : null;
  if (categoryId && categoryId.length > 191) throw new Error("Kategori tidak valid.");

  const coverImage = validateImageReference(body.coverImage);

  return { title, slug, excerpt, content, coverImage, status, visibility, categoryId };
}

export async function listAdminPosts(request) {
  try {
    const { user, response } = await getStaff();
    if (response) return response;

    const filters = normalizeAdminFilters(new URL(request.url).searchParams);
    const where = buildAdminPostWhere(user, filters);

    const [items, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        select: POST_SELECT,
        orderBy: adminPostOrderBy(filters.sort),
        skip: (filters.page - 1) * filters.perPage,
        take: filters.perPage,
      }),
      prisma.post.count({ where }),
    ]);

    return jsonNoStore({
      items,
      pagination: {
        page: filters.page,
        perPage: filters.perPage,
        total,
        pages: Math.max(1, Math.ceil(total / filters.perPage)),
      },
    });
  } catch (error) {
    console.error("[CMS LIST POSTS]", error);
    return jsonNoStore({ message: "Gagal mengambil daftar konten." }, 500);
  }
}

export async function createPost(request) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);
  const { user, response } = await getStaff();
  if (response) return response;

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return jsonNoStore({ message: parsed.error }, parsed.status);

  try {
    const data = validatePostPayload(parsed.value);
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true, isActive: true } });
      if (!category || !category.isActive) return jsonNoStore({ message: "Kategori tidak ditemukan atau tidak aktif." }, 400);
    }

    const post = await prisma.post.create({
      data: {
        ...data,
        authorId: user.id,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
      select: POST_SELECT,
    });

    return jsonNoStore({ message: "Konten berhasil dibuat.", post }, 201);
  } catch (error) {
    if (isPrismaUniqueError(error)) return jsonNoStore({ message: "Slug sudah digunakan. Silakan gunakan slug lain." }, 409);
    if (error instanceof Error && !error.code) return jsonNoStore({ message: error.message }, 400);
    console.error("[CMS CREATE POST]", error);
    return jsonNoStore({ message: "Gagal membuat konten." }, 500);
  }
}

export async function getAdminPost(request, id) {
  try {
    const { user, response } = await getStaff();
    if (response) return response;

    const post = await prisma.post.findUnique({ where: { id }, select: POST_SELECT });
    if (!post) return jsonNoStore({ message: "Konten tidak ditemukan." }, 404);
    if (!canManagePost(user, post)) return jsonNoStore({ message: "Akses ditolak." }, 403);

    return jsonNoStore({ post });
  } catch (error) {
    console.error("[CMS GET POST]", error);
    return jsonNoStore({ message: "Gagal mengambil konten." }, 500);
  }
}

export async function updatePost(request, id) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);
  const { user, response } = await getStaff();
  if (response) return response;

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return jsonNoStore({ message: parsed.error }, parsed.status);

  try {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true, publishedAt: true, coverImage: true, content: true },
    });
    if (!existing) return jsonNoStore({ message: "Konten tidak ditemukan." }, 404);
    if (!canManagePost(user, existing)) return jsonNoStore({ message: "Akses ditolak." }, 403);

    const data = validatePostPayload(parsed.value);
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true, isActive: true } });
      if (!category || !category.isActive) return jsonNoStore({ message: "Kategori tidak ditemukan atau tidak aktif." }, 400);
    }

    let publishedAt = existing.publishedAt;
    if (data.status === "DRAFT") publishedAt = null;
    if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") publishedAt = new Date();
    if (data.status === "PUBLISHED" && !publishedAt) publishedAt = new Date();

    const post = await prisma.post.update({ where: { id }, data: { ...data, publishedAt }, select: POST_SELECT });

    const nextUrls = new Set(getPostMediaUrls(post));
    const removedUrls = getPostMediaUrls(existing).filter((url) => !nextUrls.has(url));
    if (removedUrls.length) await cleanupUnusedMedia(removedUrls);

    return jsonNoStore({ message: "Konten berhasil diperbarui.", post });
  } catch (error) {
    if (isPrismaUniqueError(error)) return jsonNoStore({ message: "Slug sudah digunakan. Silakan gunakan slug lain." }, 409);
    if (error instanceof Error && !error.code) return jsonNoStore({ message: error.message }, 400);
    console.error("[CMS UPDATE POST]", error);
    return jsonNoStore({ message: "Gagal memperbarui konten." }, 500);
  }
}

export async function deletePost(request, id) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);
  try {
    const { user, response } = await getStaff();
    if (response) return response;

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, coverImage: true, content: true },
    });
    if (!existing) return jsonNoStore({ message: "Konten tidak ditemukan." }, 404);
    if (!canManagePost(user, existing)) return jsonNoStore({ message: "Akses ditolak." }, 403);

    const mediaUrls = getPostMediaUrls(existing);

    await prisma.post.delete({ where: { id } });
    if (mediaUrls.length) await cleanupUnusedMedia(mediaUrls);

    return jsonNoStore({ message: "Konten berhasil dihapus." });
  } catch (error) {
    console.error("[CMS DELETE POST]", error);
    return jsonNoStore({ message: "Gagal menghapus konten." }, 500);
  }
}

export async function listPublicPosts(request) {
  try {
    const filters = normalizePublicFilters(new URL(request.url).searchParams);
    const where = buildPublicPostWhere(filters);

    const [items, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        select: {
          id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true } },
        },
        orderBy: publicPostOrderBy(filters.sort),
        skip: (filters.page - 1) * filters.perPage,
        take: filters.perPage,
      }),
      prisma.post.count({ where }),
    ]);

    return jsonNoStore({
      items,
      pagination: {
        page: filters.page,
        perPage: filters.perPage,
        total,
        pages: Math.max(1, Math.ceil(total / filters.perPage)),
      },
    });
  } catch (error) {
    console.error("[PUBLIC POSTS]", error);
    return jsonNoStore({ message: "Gagal mengambil konten." }, 500);
  }
}
