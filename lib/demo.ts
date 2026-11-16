import type { DemoPlace, DemoSession } from "@prisma/client";
import type { AppLimits } from "@/lib/settings";

export const DEMO_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PRUNE_AFTER_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Returns 6 random base62 characters using the Web Crypto API. */
export function newDemoId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => BASE62[b % 62]).join("");
}

/** SHA-256 of the IP address, hex-encoded. */
export async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The generation limit for a demo shop: its own override, or the site default. */
export function placeLimit(
  place: Pick<DemoPlace, "generationLimit">,
  limits: AppLimits,
): number {
  return place.generationLimit ?? limits["demo.generationsPerPlace"];
}

/** How many tries the shop has left. */
export function triesLeft(
  place: Pick<DemoPlace, "generationsUsed" | "generationLimit">,
  limits: AppLimits,
): number {
  return Math.max(0, placeLimit(place, limits) - place.generationsUsed);
}

/** True when the session link has passed its expiry time. */
export function isExpired(
  session: Pick<DemoSession, "expiresAt">,
  now: Date,
): boolean {
  return session.expiresAt <= now;
}
