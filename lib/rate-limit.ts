type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function resetRateLimitStore(): void {
  store.clear();
}

export function ipFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimitKey(ip: string, slug: string): string {
  return `${ip}:${slug}`;
}

export function checkRateLimit(
  key: string,
  opts?: { limit?: number; windowMs?: number },
): boolean {
  const limit = opts?.limit ?? 5;
  const windowMs = opts?.windowMs ?? 30_000;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // New window — allow and start counting
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
