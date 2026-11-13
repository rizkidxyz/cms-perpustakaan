import "dotenv/config";
import { prisma } from "../lib/prisma.js";

const defaults = [
  { name: "Berita", slug: "berita", description: "Informasi dan berita terbaru perpustakaan." },
  { name: "Pengumuman", slug: "pengumuman", description: "Pengumuman resmi dari perpustakaan." },
  { name: "Kegiatan", slug: "kegiatan", description: "Dokumentasi dan informasi kegiatan perpustakaan." },
  { name: "Lainnya", slug: "lainnya", description: "Informasi perpustakaan lainnya." },
];

try {
  for (const category of defaults) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("Kategori awal berhasil dipastikan tersedia.");
} catch (error) {
  console.error("Gagal membuat kategori awal:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
