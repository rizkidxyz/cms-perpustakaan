import "dotenv/config";

import mariadb from "mariadb";

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = process.env;

if (!DATABASE_NAME || !/^[a-zA-Z0-9_]+$/.test(DATABASE_NAME)) {
  throw new Error("DATABASE_NAME tidak valid.");
}

let connection;

try {
  console.log("Menghubungkan ke MySQL...");

  connection = await mariadb.createConnection({
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT || 3306),
    user: DATABASE_USER,
    password: DATABASE_PASSWORD || "",
    connectTimeout: 10000,
  });

  console.log("MySQL berhasil terhubung.");

  await connection.query(`
    CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
  `);

  console.log("--------------------------------");
  console.log("DATABASE SIAP");
  console.log(`Nama database: ${DATABASE_NAME}`);
  console.log("--------------------------------");
} catch (error) {
  console.error("Gagal menyiapkan database:", error.message);
  process.exitCode = 1;
} finally {
  if (connection) {
    await connection.end();
  }
}
