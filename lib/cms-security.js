import "server-only";

export function isSameOrigin(request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin) return false;

    const configuredUrl = process.env.APP_URL;
    const expectedOrigin = configuredUrl
      ? new URL(configuredUrl).origin
      : new URL(request.url).origin;

    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export async function readJsonBody(request, maxBytes = 1_200_000) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, status: 415, error: "Content-Type harus application/json." };
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    return { ok: false, status: 413, error: "Ukuran payload terlalu besar." };
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, status: 400, error: "Request tidak dapat dibaca." };
  }

  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { ok: false, status: 413, error: "Ukuran payload terlalu besar." };
  }

  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, status: 400, error: "Format JSON tidak valid." };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, status: 400, error: "Format JSON tidak valid." };
  }
}

export function jsonNoStore(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export function isPrismaUniqueError(error) {
  return error && typeof error === "object" && error.code === "P2002";
}
