import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/security.js";

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format ADMIN_EMAIL tidak valid.");
  }

  if (Buffer.byteLength(password, "utf8") < 12) {
    throw new Error("ADMIN_PASSWORD minimal 12 byte.");
  }

  // Periksa apakah admin sudah ada.
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    console.log("--------------------------------");
    console.log("ADMIN SUDAH TERDAFTAR");
    console.log(`Email: ${email}`);
    console.log("Password tidak diubah.");
    console.log("--------------------------------");
    return;
  }

  // Hash password sebelum disimpan.
  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("--------------------------------");
  console.log("ADMIN BERHASIL DIBUAT");
  console.log(`Nama : ${admin.name}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Role : ${admin.role}`);
  console.log("--------------------------------");
}

try {
  await main();
} catch (error) {
  console.error("SEED ERROR:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
