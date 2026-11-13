// Menyalin prisma/schema.prisma ke prisma/schema.active.prisma dengan
// provider database sesuai DB_PROVIDER.
//
// Prisma mewajibkan `provider` sebagai string statis di schema, jadi file
// aktif ini yang dipakai Prisma CLI (lihat prisma.config.mjs).

import "dotenv/config";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getSchemaProvider } from "../lib/db-config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "prisma", "schema.prisma");
const target = path.join(root, "prisma", "schema.active.prisma");

const provider = getSchemaProvider();
const template = await readFile(source, "utf8");

const providerPattern = /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"[^"]*"/;

if (!providerPattern.test(template)) {
  throw new Error(
    "Blok `datasource db` dengan `provider` tidak ditemukan di prisma/schema.prisma.",
  );
}

const header = [
  "// FILE INI DIGENERATE OTOMATIS oleh scripts/db-schema.mjs.",
  "// Jangan diedit manual. Sumber: prisma/schema.prisma",
  "",
  "",
].join("\n");

await writeFile(target, header + template.replace(providerPattern, `$1"${provider}"`), "utf8");

console.log(`Schema aktif ditulis: prisma/schema.active.prisma (provider: ${provider})`);
