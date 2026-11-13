// Konfigurasi koneksi database yang dipilih lewat environment variable.
// Provider yang didukung: mysql, postgresql (alias pg/postgres), dan neon.
//
// Modul ini hanya membaca process.env, jadi aman dipakai oleh Prisma CLI,
// script Node, maupun runtime aplikasi.

const PROVIDERS = new Map([
  ["mysql", "mysql"],
  ["mariadb", "mysql"],
  ["postgresql", "postgresql"],
  ["postgres", "postgresql"],
  ["pg", "postgresql"],
  ["neon", "neon"],
]);

const DEFAULT_SSLMODE = "require";

export function getProvider() {
  const raw = (process.env.DB_PROVIDER || "postgresql").trim().toLowerCase();
  const provider = PROVIDERS.get(raw);

  if (!provider) {
    throw new Error(
      `DB_PROVIDER "${raw}" tidak dikenal. Gunakan: mysql, postgresql, atau neon.`,
    );
  }

  return provider;
}

// schema.prisma hanya mengenal provider "mysql" dan "postgresql".
export function getSchemaProvider() {
  return getProvider() === "mysql" ? "mysql" : "postgresql";
}

function stripPooler(host) {
  return host.replace(/-pooler\./, ".");
}

function withPooler(host) {
  return stripPooler(host).replace(/^([^.]+)\./, "$1-pooler.");
}

function buildUrl(host) {
  const database = process.env.DB_NAME || process.env.PGDATABASE;
  const user = process.env.DB_USER || process.env.PGUSER;
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || "";
  const port = process.env.DB_PORT || process.env.PGPORT;
  const sslmode =
    process.env.DB_SSLMODE || process.env.PGSSLMODE || DEFAULT_SSLMODE;

  if (!host || !database || !user) {
    throw new Error(
      "Konfigurasi database belum lengkap. Isi DB_URL, atau lengkapi DB_HOST, DB_NAME, dan DB_USER.",
    );
  }

  const url = new URL(
    getSchemaProvider() === "mysql" ? "mysql://localhost" : "postgresql://localhost",
  );

  url.hostname = host;
  url.pathname = `/${database}`;
  url.username = user;
  url.password = password;

  if (port) {
    url.port = port;
  }

  // sslmode tidak dikenal driver MySQL, jadi hanya dipasang untuk PostgreSQL.
  if (getSchemaProvider() !== "mysql") {
    url.searchParams.set("sslmode", sslmode);
  }

  return url.toString();
}

function togglePooler(url, pooled) {
  const parsed = new URL(url);

  parsed.hostname = pooled
    ? withPooler(parsed.hostname)
    : stripPooler(parsed.hostname);

  return parsed.toString();
}

// Koneksi untuk aplikasi. Boleh lewat connection pooler.
export function getDatabaseUrl() {
  if (process.env.DB_URL) {
    return process.env.DB_URL;
  }

  const host = process.env.DB_HOST || process.env.PGHOST;

  if (!host) {
    throw new Error("DB_URL atau DB_HOST wajib diisi.");
  }

  return buildUrl(getProvider() === "mysql" ? host : withPooler(host));
}

// Koneksi untuk Prisma CLI (migrate/introspect). Harus direct, tanpa pooler.
export function getDirectDatabaseUrl() {
  if (process.env.DB_URL_DIRECT) {
    return process.env.DB_URL_DIRECT;
  }

  if (process.env.DB_URL) {
    return getProvider() === "mysql"
      ? process.env.DB_URL
      : togglePooler(process.env.DB_URL, false);
  }

  const host = process.env.DB_HOST || process.env.PGHOST;

  if (!host) {
    throw new Error("DB_URL, DB_URL_DIRECT, atau DB_HOST wajib diisi.");
  }

  return buildUrl(host);
}

export function getSchemaPath() {
  return "prisma/schema.active.prisma";
}

export function getMigrationsPath() {
  return getSchemaProvider() === "mysql"
    ? "prisma/migrations-mysql"
    : "prisma/migrations-postgresql";
}
