import "dotenv/config";

import { defineConfig } from "prisma/config";

import {
  getDirectDatabaseUrl,
  getMigrationsPath,
  getSchemaPath,
} from "./lib/db-config.js";

// Prisma CLI memakai koneksi direct (tanpa pooler) supaya operasi DDL aman.
export default defineConfig({
  schema: getSchemaPath(),

  migrations: {
    path: getMigrationsPath(),
    seed: "tsx prisma/seed.mjs",
  },

  datasource: {
    url: getDirectDatabaseUrl(),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
});
