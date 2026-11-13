// Pengecekan koneksi database sesuai DB_PROVIDER di .env.

import "dotenv/config";

import { getProvider } from "../lib/db-config.js";
import { prisma } from "../lib/prisma.js";

try {
  const rows = await prisma.$queryRaw`
    SELECT current_user AS "user", current_database() AS "database"
  `;

  console.log("--------------------------------");
  console.log("KONEKSI DATABASE OK");
  console.log(`Provider: ${getProvider()}`);
  console.log(rows[0]);
  console.log("--------------------------------");
} catch (error) {
  console.error("KONEKSI DATABASE GAGAL:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
