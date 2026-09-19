# Examples

Three complete worked examples optimised for cheaper models. Each example shows:

- **Intent** — what this change does in one sentence
- **Files** — exactly what to create and what not to touch
- **Test** — written first; fails before implementation
- **Implementation** — the smallest code that makes the test pass
- **Stop here** — what NOT to also build in this same PR

Study the shape. Clone it for your own feature.

---

## Example 1: Pure Helper — `buildPublicUrl`

### Intent

Add a pure function that constructs the public URL for a resource so it is built
the same way everywhere and never duplicated as a string literal.

### Files

```
lib/
  build-public-url.ts       ← CREATE
  build-public-url.test.ts  ← CREATE
```

Nothing else. Do not create `lib/index.ts`. Do not touch any route file.

### Test (write this first)

```ts
// lib/build-public-url.test.ts
import { describe, it, expect } from "vitest";
import { buildPublicUrl } from "./build-public-url";

describe("buildPublicUrl", () => {
  it("combines APP_URL and a slug into a full URL", () => {
    expect(buildPublicUrl("https://example.com", "my-item")).toBe(
      "https://example.com/items/my-item"
    );
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildPublicUrl("https://example.com/", "my-item")).toBe(
      "https://example.com/items/my-item"
    );
  });

  it("throws when slug is empty", () => {
    expect(() => buildPublicUrl("https://example.com", "")).toThrow(
      /slug/i
    );
  });
});
```

Run `npm test`. All three tests should **fail** — the file does not exist yet.

### Implementation

```ts
// lib/build-public-url.ts

/**
 * Returns the full public URL for an item by its slug.
 * Always use this function; never build the URL inline.
 */
export function buildPublicUrl(origin: string, slug: string): string {
  if (!slug) throw new Error("slug must not be empty");
  const base = origin.replace(/\/$/, "");
  return `${base}/items/${slug}`;
}
```

Run `npm test`. All three tests should **pass**.

### Stop here

Do NOT also:
- Add the function to a barrel `lib/index.ts`
- Call this function from any route or page in the same PR
- Add a `getPublicUrl` variant or any overloads
- Write a Playwright test

The next PR will import this helper from the route that needs it.

Note: `buildPublicUrl` is worth extracting because multiple callers will use it. A page-only `if (!row) notFound(); if (BASIC) redirect(...)` is **not** worth a new `lib/` file — keep it in the page.

---

## Example 2: Auth Primitives — Signed Cookie (no HTTP yet)

### Intent

Add timing-safe password comparison and HMAC sign/verify helpers that the login
route will use. This PR is pure functions and cryptography — no HTTP.

### Files

```
lib/
  auth.ts         ← CREATE
  auth.test.ts    ← CREATE
```

No routes, no pages, no `proxy.ts` yet.

### Test (write this first)

```ts
// lib/auth.test.ts
import { describe, it, expect } from "vitest";
import {
  timingSafeEqual,
  signSession,
  verifySession,
} from "./auth";

describe("timingSafeEqual", () => {
  it("returns true when strings match", () => {
    expect(timingSafeEqual("correct-password", "correct-password")).toBe(true);
  });

  it("returns false when strings differ", () => {
    expect(timingSafeEqual("correct-password", "wrong-password")).toBe(false);
  });

  it("returns false for strings of different length (no early exit leak)", () => {
    expect(timingSafeEqual("short", "this-is-much-longer")).toBe(false);
  });
});

describe("signSession / verifySession", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSession({ role: "admin" });
    expect(typeof token).toBe("string");
    const payload = await verifySession(token);
    expect(payload).toMatchObject({ role: "admin" });
  });

  it("throws on a tampered token", async () => {
    const bad = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.bad_signature";
    await expect(verifySession(bad)).rejects.toThrow();
  });

  it("throws on an expired token", async () => {
    const expired = await signSession({ role: "admin" }, "-1s");
    await expect(verifySession(expired)).rejects.toThrow();
  });
});
```

Run `npm test`. All tests should **fail**.

### Implementation

```ts
// lib/auth.ts
import "server-only";
import { timingSafeEqual as nodeTimingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

// ─── Secret ────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(s);
}

// ─── Password comparison ───────────────────────────────────────────────────

/**
 * Constant-time string comparison. Always compare the full length to avoid
 * leaking timing information about the correct password.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a.padEnd(64));   // pad to fixed length
  const bufB = enc.encode(b.padEnd(64));
  return nodeTimingSafeEqual(bufA, bufB) && a.length === b.length;
}

// ─── Session cookie ────────────────────────────────────────────────────────

/** Signs a JWT with AUTH_SECRET. `expiresIn` defaults to "7d". */
export async function signSession(
  payload: Record<string, unknown>,
  expiresIn: string = "7d"
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

/** Verifies a JWT. Throws on invalid or expired tokens. */
export async function verifySession(
  token: string
): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as Record<string, unknown>;
}
```

Run `npm test`. All tests should **pass**.

### Stop here

Do NOT also:
- Add `POST /api/auth/login` or `proxy.ts` in this PR
- Store sessions in a database
- Add a `logout` helper
- Write a Playwright test

The login route is the next PR. It will import `timingSafeEqual` and `signSession`
from this file.

---

## Example 3: Thin Route — POST with 403 / 404 / 200 Split

### Intent

Add a `POST /api/items/[id]/publish` route that marks an item as published.
Business logic lives in `lib/item-repo.ts`. The route only parses, authorises,
calls the helper, and returns a `Response`.

### Files

```
app/api/items/[id]/publish/
  route.ts       ← CREATE
  route.test.ts  ← CREATE
lib/
  item-repo.ts   ← ADD the `publishItem` function (or the whole file if new)
```

Do not touch any page file. Do not create UI.

### Test (write this first)

```ts
// app/api/items/[id]/publish/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import * as itemRepo from "@/lib/item-repo";
import * as auth from "@/lib/auth";

vi.mock("@/lib/item-repo");
vi.mock("@/lib/auth");

const mockVerify = vi.mocked(auth.verifySession);
const mockFindById = vi.mocked(itemRepo.findById);
const mockPublish = vi.mocked(itemRepo.publishItem);

function makeReq(id: string, role?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (role) headers["cookie"] = `session=mock-token`;

  // We control what verifySession returns based on role
  if (role === "admin") {
    mockVerify.mockResolvedValue({ role: "admin" });
  } else if (role) {
    mockVerify.mockResolvedValue({ role });
  } else {
    mockVerify.mockResolvedValue(null as any); // no session
  }

  return new NextRequest(`http://localhost/api/items/${id}/publish`, {
    method: "POST",
    headers,
  });
}

async function callRoute(id: string, role?: string) {
  const req = makeReq(id, role);
  const ctx = { params: Promise.resolve({ id }) };
  return POST(req, ctx as any);
}

describe("POST /api/items/[id]/publish", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when there is no valid session", async () => {
    mockVerify.mockResolvedValue(null as any);
    const res = await callRoute("item-1");
    expect(res.status).toBe(401);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("returns 403 when the session role is not admin", async () => {
    const res = await callRoute("item-1", "viewer");
    expect(res.status).toBe(403);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("returns 404 when the item does not exist", async () => {
    mockFindById.mockResolvedValue(null);
    const res = await callRoute("missing", "admin");
    expect(res.status).toBe(404);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("returns 200 and the published item on success", async () => {
    const item = { id: "item-1", title: "Hello", status: "draft" };
    const published = { ...item, status: "published" };
    mockFindById.mockResolvedValue(item);
    mockPublish.mockResolvedValue(published);

    const res = await callRoute("item-1", "admin");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "published" });
  });
});
```

Run `npm test`. All tests should **fail**.

### Implementation

```ts
// app/api/items/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { findById, publishItem } from "@/lib/item-repo";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/items/[id]/publish">
) {
  // 1. Auth
  const session = await verifySession(
    req.cookies.get("session")?.value ?? ""
  ).catch(() => null);
  if (!session) return new Response(null, { status: 401 });
  if (session.role !== "admin") return new Response(null, { status: 403 });

  // 2. Load resource
  const { id } = await ctx.params;
  const item = await findById(id);
  if (!item) return new Response(null, { status: 404 });

  // 3. Run domain logic via lib — no business logic inline
  const published = await publishItem(id);

  // 4. Return
  return Response.json(published);
}
```

```ts
// lib/item-repo.ts  (add this function; keep existing functions unchanged)
import "server-only";
import { db } from "@/lib/db";

export async function publishItem(id: string) {
  return db.item.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });
}
```

Run `npm test`. All tests should **pass**.

### Stop here

Do NOT also:
- Add a `DELETE /api/items/[id]/publish` (unpublish) route
- Add a UI button or page in this PR
- Add rate limiting
- Run Playwright tests

One behavior per PR. The consumer UI that calls this endpoint is a separate PR.

---

## Shape Summary

These three examples share the same pattern. Clone it for any new feature.

| Step | What you do |
|---|---|
| 1 intent | One sentence; no "and" |
| 2 files | List exactly what to create; say what NOT to touch |
| 3 test | Write first; run `npm test`; confirm failures |
| 4 implement | Smallest code that passes; no extra functions |
| 5 run | `npm test`; fix until green |
| 6 stop | List what NOT to also add |
