import argon2 from "argon2";

import { createHash, createHmac, randomBytes } from "node:crypto";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Dummy hash untuk membantu menyamakan
// proses verifikasi ketika email tidak ditemukan.
const dummyHashPromise = argon2.hash(
  randomBytes(32).toString("hex"),
  ARGON2_OPTIONS,
);

export async function hashPassword(password) {
  if (
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") < 12 ||
    Buffer.byteLength(password, "utf8") > 1024
  ) {
    throw new Error("Password harus memiliki minimal 12 byte.");
  }

  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyLoginPassword(storedHash, password) {
  const hash = storedHash || (await dummyHashPromise);

  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashRateLimitKey(value) {
  const secret = process.env.AUTH_SECRET;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("AUTH_SECRET minimal 32 byte.");
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}
