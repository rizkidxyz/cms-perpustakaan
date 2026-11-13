import "server-only";

import { prisma } from "../lib/prisma";
import { getCurrentUser } from "../lib/auth";
import { isSameOrigin, jsonNoStore, readJsonBody, isPrismaUniqueError } from "../lib/cms-security";
import { slugify } from "../lib/cms-content";

async function getStaff() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: jsonNoStore({ message: "Autentikasi diperlukan." }, 401) };
  if (!["ADMIN", "EDITOR"].includes(user.role)) return { user: null, response: jsonNoStore({ message: "Akses ditolak." }, 403) };
  return { user, response: null };
}

function validateCategory(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 100) throw new Error("Nama kategori harus terdiri dari 2–100 karakter.");
  const slug = slugify(body.slug || name).slice(0, 120);
  if (!slug) throw new Error("Slug kategori tidak valid.");
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 500) throw new Error("Deskripsi kategori maksimal 500 karakter.");
  return {
    name,
    slug,
    description: description || null,
    ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
  };
}

export async function listCategories() {
  try {
    const { response } = await getStaff();
    if (response) return response;
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true, isActive: true, _count: { select: { posts: true } } },
    });
    return jsonNoStore({ categories });
  } catch (error) {
    console.error("[CMS LIST CATEGORIES]", error);
    return jsonNoStore({ message: "Gagal mengambil kategori." }, 500);
  }
}

export async function createCategory(request) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);
  const user = await getCurrentUser();
  if (!user) return jsonNoStore({ message: "Autentikasi diperlukan." }, 401);
  if (user.role !== "ADMIN") return jsonNoStore({ message: "Hanya ADMIN yang dapat mengelola kategori." }, 403);

  const parsed = await readJsonBody(request, 20_000);
  if (!parsed.ok) return jsonNoStore({ message: parsed.error }, parsed.status);

  try {
    const data = validateCategory(parsed.value);
    const category = await prisma.category.create({ data, select: { id: true, name: true, slug: true, description: true, isActive: true } });
    return jsonNoStore({ message: "Kategori berhasil dibuat.", category }, 201);
  } catch (error) {
    if (isPrismaUniqueError(error)) return jsonNoStore({ message: "Nama atau slug kategori sudah digunakan." }, 409);
    if (error instanceof Error && !error.code) return jsonNoStore({ message: error.message }, 400);
    console.error("[CMS CREATE CATEGORY]", error);
    return jsonNoStore({ message: "Gagal membuat kategori." }, 500);
  }
}

export async function updateCategory(request, id) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);
  const user = await getCurrentUser();
  if (!user) return jsonNoStore({ message: "Autentikasi diperlukan." }, 401);
  if (user.role !== "ADMIN") return jsonNoStore({ message: "Hanya ADMIN yang dapat mengelola kategori." }, 403);

  const parsed = await readJsonBody(request, 20_000);
  if (!parsed.ok) return jsonNoStore({ message: parsed.error }, parsed.status);
  try {
    const data = validateCategory(parsed.value);
    const category = await prisma.category.update({ where: { id }, data, select: { id: true, name: true, slug: true, description: true, isActive: true } });
    return jsonNoStore({ message: "Kategori berhasil diperbarui.", category });
  } catch (error) {
    if (error?.code === "P2025") return jsonNoStore({ message: "Kategori tidak ditemukan." }, 404);
    if (isPrismaUniqueError(error)) return jsonNoStore({ message: "Nama atau slug kategori sudah digunakan." }, 409);
    if (error instanceof Error && !error.code) return jsonNoStore({ message: error.message }, 400);
    console.error("[CMS UPDATE CATEGORY]", error);
    return jsonNoStore({ message: "Gagal memperbarui kategori." }, 500);
  }
}

export async function deleteCategory(request, id) {
  if (!isSameOrigin(request)) return jsonNoStore({ message: "Origin tidak diizinkan." }, 403);
  const user = await getCurrentUser();
  if (!user) return jsonNoStore({ message: "Autentikasi diperlukan." }, 401);
  if (user.role !== "ADMIN") return jsonNoStore({ message: "Hanya ADMIN yang dapat mengelola kategori." }, 403);
  try {
    await prisma.category.delete({ where: { id } });
    return jsonNoStore({ message: "Kategori berhasil dihapus. Konten terkait tetap ada tanpa kategori." });
  } catch (error) {
    if (error?.code === "P2025") return jsonNoStore({ message: "Kategori tidak ditemukan." }, 404);
    console.error("[CMS DELETE CATEGORY]", error);
    return jsonNoStore({ message: "Gagal menghapus kategori." }, 500);
  }
}
