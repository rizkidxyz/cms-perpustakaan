import "dotenv/config";

import { defineConfig } from "prisma/config";

const requiredEnv = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_NAME",
  "DATABASE_USER",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} belum diatur.`);
  }
}

const databaseName = process.env.DATABASE_NAME;

if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error("Nama database tidak valid.");
}

const databaseUrl = new URL("mysql://localhost");

databaseUrl.hostname = process.env.DATABASE_HOST;
databaseUrl.port = process.env.DATABASE_PORT;
databaseUrl.username = process.env.DATABASE_USER;
databaseUrl.password = process.env.DATABASE_PASSWORD || "";
databaseUrl.pathname = `/${databaseName}`;

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.mjs",
  },

  datasource: {
    url: databaseUrl.toString(),
  },
});
