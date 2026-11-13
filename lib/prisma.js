import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { getDatabaseUrl, getProvider } from "./db-config.js";

const globalForPrisma = globalThis;

// Adapter dipilih saat runtime sesuai DB_PROVIDER di .env.
function createAdapter() {
  const connectionString = getDatabaseUrl();

  switch (getProvider()) {
    case "mysql":
      return new PrismaMariaDb(connectionString);

    case "neon":
      return new PrismaNeon({
        connectionString,
        max: 5,
        connectionTimeoutMillis: 10000,
      });

    default:
      return new PrismaPg({
        connectionString,
        max: 5,
        connectionTimeoutMillis: 10000,
      });
  }
}

const adapter = globalForPrisma.prismaAdapter ?? createAdapter();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}
