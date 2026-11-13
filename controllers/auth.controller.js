import "server-only";

import { NextResponse } from "next/server";

import { prisma } from "../lib/prisma";

import { verifyLoginPassword, hashRateLimitKey } from "../lib/security";

import {
  createSession,
  destroyCurrentSession,
  getCurrentUser,
} from "../lib/auth";

const RATE_LIMIT = 8;
const RATE_WINDOW = 15 * 60 * 1000;

function jsonResponse(message, status = 200, extra = {}) {
  return NextResponse.json(
    {
      message,
      ...extra,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

// Validasi origin untuk request yang mengubah autentikasi.
function isSameOrigin(request) {
  try {
    const origin = request.headers.get("origin");

    if (!origin) {
      return false;
    }

    const expectedOrigin = new URL(process.env.APP_URL || request.url).origin;

    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

// Ambil IP dari reverse proxy.
function getClientIp(request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  return ip.slice(0, 64);
}

// ========================================
// LOGIN
// ========================================

export async function loginController(request) {
  try {
    if (!isSameOrigin(request)) {
      return jsonResponse("Origin tidak diizinkan.", 403);
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return jsonResponse("Content-Type tidak valid.", 415);
    }

    let body;

    try {
      body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return jsonResponse("Format request tidak valid.", 400);
      }
    } catch {
      return jsonResponse("Format request tidak valid.", 400);
    }

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const password = typeof body.password === "string" ? body.password : "";

    if (
      !email ||
      email.length > 191 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      Buffer.byteLength(password, "utf8") > 1024
    ) {
      return jsonResponse("Email atau password tidak valid.", 400);
    }

    // ====================================
    // RATE LIMIT
    // ====================================

    const ip = getClientIp(request);

    const rateKey = hashRateLimitKey(`login:${ip}`);

    const windowStart = new Date(Date.now() - RATE_WINDOW);

    const attempts = await prisma.loginAttempt.count({
      where: {
        keyHash: rateKey,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (attempts >= RATE_LIMIT) {
      return NextResponse.json(
        {
          message:
            "Terlalu banyak percobaan login. Silakan coba kembali dalam 15 menit.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "900",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // ====================================
    // FIND USER
    // ====================================

    const user = await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    // Gunakan dummy hash apabila email tidak ditemukan.
    const validPassword = await verifyLoginPassword(
      user?.passwordHash ?? null,
      password,
    );

    if (!user || !user.isActive || !validPassword) {
      await prisma.loginAttempt.create({
        data: {
          keyHash: rateKey,
        },
      });

      return jsonResponse("Email atau password salah.", 401);
    }

    // ====================================
    // SUCCESS
    // ====================================

    await createSession(user.id);

    // Bersihkan catatan percobaan IP ini.
    await prisma.loginAttempt.deleteMany({
      where: {
        keyHash: rateKey,
      },
    });

    // Bersihkan percobaan login yang sudah lama.
    await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return jsonResponse("Login berhasil.", 200, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[AUTH LOGIN ERROR]", error);

    return jsonResponse("Terjadi kesalahan pada server.", 500);
  }
}

// ========================================
// LOGOUT
// ========================================

export async function logoutController(request) {
  try {
    if (!isSameOrigin(request)) {
      return jsonResponse("Origin tidak diizinkan.", 403);
    }

    await destroyCurrentSession();

    return jsonResponse("Logout berhasil.");
  } catch (error) {
    console.error("[AUTH LOGOUT ERROR]", error);

    return jsonResponse("Gagal melakukan logout.", 500);
  }
}

// ========================================
// CURRENT SESSION
// ========================================

export async function meController() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonResponse("Belum terautentikasi.", 401);
    }

    return NextResponse.json(
      {
        authenticated: true,
        user,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[AUTH ME ERROR]", error);

    return jsonResponse("Gagal memeriksa sesi.", 500);
  }
}
