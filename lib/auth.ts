import "server-only";
import { timingSafeEqual as nodeTimingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

// ─── Secret ────────────────────────────────────────────────────────────────

async function getSecret(): Promise<CryptoKey> {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET env var is not set");
  return crypto.subtle.importKey(
    "raw",
    Buffer.from(s),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// ─── Password comparison ───────────────────────────────────────────────────

/**
 * Constant-time string comparison. Pads both strings to a fixed length so
 * the comparison never exits early and leaks timing info about the password.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a.padEnd(64));
  const bufB = enc.encode(b.padEnd(64));
  return nodeTimingSafeEqual(bufA, bufB) && a.length === b.length;
}

// ─── Session JWT ───────────────────────────────────────────────────────────

/** Signs a JWT with AUTH_SECRET. `expiresIn` defaults to "7d". */
export async function signSession(
  payload: Record<string, unknown>,
  expiresIn: string = "7d"
): Promise<string> {
  const secret = await getSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/** Verifies a JWT signed with AUTH_SECRET. Throws on invalid or expired tokens. */
export async function verifySession(
  token: string
): Promise<Record<string, unknown>> {
  const secret = await getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as Record<string, unknown>;
}
