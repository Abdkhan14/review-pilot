# Testing Templates

Copy-paste Vitest templates by kind. Replace `getItem`, `findById`, `createItem`,
etc. with your own names. Run with `npm test`.

---

## Setup: `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "node",          // use "jsdom" only for Client Component tests
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom";
```

---

## Kind 1: Pure Function (fixture in / fixture out)

Use for helpers, builders, transformers, parsers.

```ts
// lib/build-public-url.test.ts
import { describe, it, expect } from "vitest";
import { buildPublicUrl } from "./build-public-url";

describe("buildPublicUrl", () => {
  it("combines origin and id into a URL", () => {
    expect(buildPublicUrl("https://example.com", "abc123")).toBe(
      "https://example.com/items/abc123"
    );
  });

  it("trims a trailing slash from origin", () => {
    expect(buildPublicUrl("https://example.com/", "abc123")).toBe(
      "https://example.com/items/abc123"
    );
  });

  it("does not accept an empty id", () => {
    expect(() => buildPublicUrl("https://example.com", "")).toThrow();
  });
});
```

---

## Kind 2: Signed Token / Cookie Crypto

Use for auth helpers — timing-safe compare, HMAC sign/verify.

```ts
// lib/auth.test.ts
import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./auth";

describe("signSession / verifySession", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSession({ role: "admin" });
    const result = await verifySession(token);
    expect(result).toMatchObject({ role: "admin" });
  });

  it("rejects a token signed with a different secret", async () => {
    // Simulate a tampered or foreign token
    const fake = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.bad_sig";
    await expect(verifySession(fake)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    // signSession should accept a custom exp for testing
    const token = await signSession({ role: "admin" }, { expiresIn: "-1s" });
    await expect(verifySession(token)).rejects.toThrow();
  });
});

describe("timingSafeEqual", () => {
  it("returns true for matching strings", () => {
    expect(timingSafeEqual("secret", "secret")).toBe(true);
  });

  it("returns false for non-matching strings", () => {
    expect(timingSafeEqual("secret", "wrong")).toBe(false);
  });
});
```

---

## Kind 3: Route Handler (NextRequest + auth cases)

Use `vitest` to call the route handler as a plain async function.
Use [`next-test-api-route-handler`](https://github.com/Xunnamius/next-test-api-route-handler)
for full request context, or construct `NextRequest` directly for simpler cases.

```ts
// app/api/items/[id]/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import * as itemRepo from "@/lib/item-repo";
import * as auth from "@/lib/auth";

// Mock dependencies — never hit real DB or vendor in tests
vi.mock("@/lib/item-repo");
vi.mock("@/lib/auth");

const mockFindById = vi.mocked(itemRepo.findById);
const mockVerifySession = vi.mocked(auth.verifySession);

function makeRequest(id: string, cookie?: string): NextRequest {
  const url = `http://localhost/api/items/${id}`;
  const headers = cookie ? { cookie: `session=${cookie}` } : {};
  return new NextRequest(url, { headers });
}

async function callRoute(id: string, cookie?: string) {
  const req = makeRequest(id, cookie);
  const ctx = { params: Promise.resolve({ id }) };
  return GET(req, ctx as any);
}

describe("GET /api/items/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when session is missing", async () => {
    mockVerifySession.mockResolvedValue(false);
    const res = await callRoute("item-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when item does not exist", async () => {
    mockVerifySession.mockResolvedValue(true);
    mockFindById.mockResolvedValue(null);
    const res = await callRoute("missing", "valid-cookie");
    expect(res.status).toBe(404);
  });

  it("returns the item as JSON on success", async () => {
    mockVerifySession.mockResolvedValue(true);
    const item = { id: "item-1", title: "Hello", description: "World" };
    mockFindById.mockResolvedValue(item);
    const res = await callRoute("item-1", "valid-cookie");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(item);
  });
});
```

**POST handler with 403 / 400 / 201:**

```ts
// app/api/items/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import * as itemRepo from "@/lib/item-repo";
import * as auth from "@/lib/auth";

vi.mock("@/lib/item-repo");
vi.mock("@/lib/auth");

const mockCreate = vi.mocked(itemRepo.createItem);
const mockVerify = vi.mocked(auth.verifySession);

async function postBody(body: unknown, cookie?: string) {
  const req = new NextRequest("http://localhost/api/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie: `session=${cookie}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/items", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without session", async () => {
    mockVerify.mockResolvedValue(false);
    const res = await postBody({ name: "Test", type: "a" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    mockVerify.mockResolvedValue(true);
    const res = await postBody({ name: "" }, "valid");
    expect(res.status).toBe(400);
  });

  it("returns 201 and the created item", async () => {
    mockVerify.mockResolvedValue(true);
    const created = { id: "new-1", name: "Widget", type: "a" };
    mockCreate.mockResolvedValue(created);
    const res = await postBody({ name: "Widget", type: "a" }, "valid");
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject(created);
  });
});
```

---

## Kind 4: Data Access / Repository (isolated DB)

Use a temp file path for SQLite (never the developer's `dev.db`).

```ts
// lib/item-repo.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createItem, findById, listItems } from "./item-repo";

let db: PrismaClient;

beforeAll(async () => {
  // Temp DB per test suite — never the shared dev.db
  process.env.DATABASE_URL = `file:./test-${Date.now()}.db`;
  db = new PrismaClient();
  await db.$executeRaw`PRAGMA journal_mode=WAL`;
  // Run migrations or push schema
});

afterAll(async () => {
  await db.$disconnect();
  // Optionally: fs.unlinkSync(testDbPath)
});

describe("item repo", () => {
  it("creates and reads back by id", async () => {
    const item = await createItem({ name: "Test Widget", type: "a" });
    expect(item.id).toBeDefined();

    const found = await findById(item.id);
    expect(found).toMatchObject({ name: "Test Widget" });
  });

  it("returns null for an unknown id", async () => {
    const found = await findById("does-not-exist");
    expect(found).toBeNull();
  });

  it("list returns empty array when no rows", async () => {
    const items = await listItems();
    expect(items).toBeInstanceOf(Array);
  });
});
```

---

## Kind 5: Client Component (click / form / clipboard)

Use `"jsdom"` environment and React Testing Library.

```ts
// vitest.config.ts — add a separate config or use `@vitest/browser` if needed
// For jsdom, set environment: "jsdom" per-file with a docblock:
// @vitest-environment jsdom

// app/items/[id]/_components/CopyButton.test.tsx
/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CopyButton } from "./CopyButton";

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe("CopyButton", () => {
  it("copies text to clipboard on click", async () => {
    render(<CopyButton text="Hello world" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Hello world")
    );
  });

  it("shows 'Copied!' feedback after clicking", async () => {
    render(<CopyButton text="Hello world" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Copied!")
    );
  });
});
```

For `useRouter`, mock `next/navigation`:

```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/items",
}));
```

---

## Kind 6: Rate Limit (Nth call → 429)

```ts
// lib/rate-limit.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset in-memory store between tests
    // If your rate limiter is module-level state, import and clear it here
  });

  it("allows requests within the limit", () => {
    const key = "ip-127.0.0.1";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { limit: 5, windowMs: 60_000 })).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    const key = "ip-192.168.1.1";
    for (let i = 0; i < 5; i++) checkRateLimit(key, { limit: 5, windowMs: 60_000 });
    expect(checkRateLimit(key, { limit: 5, windowMs: 60_000 })).toBe(false);
  });
});
```

Route test for 429:

```ts
it("returns 429 when rate limit is exceeded", async () => {
  mockVerify.mockResolvedValue(true);
  mockCreate.mockResolvedValue({ id: "x" });

  const makeRequest = () => postBody({ name: "Test", type: "a" }, "valid");

  // Exhaust the limit
  for (let i = 0; i < 5; i++) await makeRequest();

  const res = await makeRequest();
  expect(res.status).toBe(429);
});
```

---

## Kind 7: External API Wrapper (mocked SDK)

```ts
// lib/openai.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { complete } from "./openai";

// Mock the SDK at module level
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

import OpenAI from "openai";
const mockCreate = vi.mocked(
  new OpenAI({} as any).chat.completions.create
);

describe("complete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the first choice's content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Great service!" } }],
    } as any);

    const result = await complete("Write a review for a coffee shop.");
    expect(result).toBe("Great service!");
  });

  it("returns empty string when choices is empty", async () => {
    mockCreate.mockResolvedValue({ choices: [] } as any);
    const result = await complete("Write a review.");
    expect(result).toBe("");
  });

  it("propagates SDK errors", async () => {
    mockCreate.mockRejectedValue(new Error("Rate limit exceeded"));
    await expect(complete("Write a review.")).rejects.toThrow("Rate limit");
  });
});
```

**Malformed JSON guard (for routes that return JSON from an LLM):**

```ts
it("returns 500 cleanly when the model returns invalid JSON", async () => {
  mockVerify.mockResolvedValue(true);
  // Stub the wrapper to return non-JSON text
  vi.mocked(openaiLib.complete).mockResolvedValue("Sorry, I can't do that.");

  const res = await postBody({ prompt: "test" }, "valid");
  // Should not throw or expose internals
  expect(res.status).toBe(500);
  const body = await res.json();
  expect(body).toHaveProperty("error");
  expect(body.error).not.toContain("Sorry"); // don't leak model output
});
```

---

## Quick Reference: Common Mock Patterns

```ts
// Mock a module
vi.mock("@/lib/vendor");

// Typed mock reference
const mockFn = vi.mocked(vendor.doThing);

// One-off return value
mockFn.mockResolvedValueOnce({ id: "abc" });

// Always return a value
mockFn.mockResolvedValue({ id: "abc" });

// Throw
mockFn.mockRejectedValue(new Error("oops"));

// Assert it was called with specific args
expect(mockFn).toHaveBeenCalledWith("expected-arg");
expect(mockFn).toHaveBeenCalledTimes(1);

// Reset between tests
beforeEach(() => vi.clearAllMocks());
// or per-test: vi.resetAllMocks()
```
