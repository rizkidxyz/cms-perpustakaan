import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { randomBytes } from "node:crypto";

import { prisma } from "./prisma";
import { hashSessionToken } from "./security";

export const SESSION_COOKIE = "perpus_session";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  priority: "high",
};

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");

  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  // Bersihkan session lama yang kedaluwarsa.
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  // Tunggu request masuk sebelum membaca waktu dinamis.
  await connection();

  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token || token.length > 128) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Sekarang aman membaca waktu aktual.
  if (session.expiresAt <= new Date()) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function requireStaff() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!["ADMIN", "EDITOR"].includes(user.role)) {
    redirect("/");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}
