---
name: SID-40 Business repo
overview: "Thin data-access layer for Business: create, findBySlug, list. Repo functions take a db parameter so tests can inject a temp SQLite client without triggering the server-only guard."
todos:
  - id: repo-impl
    content: Branch from SID-39; add lib/business-repo.ts with create, findBySlug, list
    status: pending
  - id: repo-test
    content: Add lib/business-repo.test.ts using a temp SQLite file; npm test green
    status: pending
isProject: false
---

# SID-40 — Business repo

Ticket: [SID-40](https://linear.app/abdullah-side/issue/SID-40/pr-24-business-repo)

**This change adds** `lib/business-repo.ts` — three functions (`create`, `findBySlug`, `list`) that read/write the `Business` table. HTTP routes and Place snapshot fetch come later.

Depends on SID-37 (schema), SID-38 (slug helper), SID-39 (db client).

## Out of scope (do not do)

HTTP routes. Admin auth. QR generation. Place details fetch. `lib/index.ts`.

## Branch

`abdullahibnekhan/sid-40-pr-24-business-repo`, off the SID-39 branch if 2.3 is not on `main` yet.

## Design — dependency injection, not a module-level import

`lib/db.ts` is `server-only`. Importing it in a test file crashes Vitest.  
The fix (same pattern as `resolveDbTarget`): **repo functions accept `db` as a parameter**.

```ts
// lib/business-repo.ts
import type { PrismaClient } from "@prisma/client";
```

No `server-only` import here — the repo is pure data logic.  
The real server code will pass `db` from `lib/db.ts`; tests pass a temp client.

## Files

### `lib/business-repo.ts`

```ts
import type { PrismaClient } from "@prisma/client";
import { makeSlug } from "./slug";

export type CreateBusinessInput = {
  name: string;
  placeId: string;
  tier: "BASIC" | "SAAS";
  customInstructions?: string;
};

export async function create(db: PrismaClient, input: CreateBusinessInput) {
  return db.business.create({
    data: {
      ...input,
      slug: makeSlug(input.name),
    },
  });
}

export async function findBySlug(db: PrismaClient, slug: string) {
  return db.business.findUnique({ where: { slug } });
}

export async function list(db: PrismaClient) {
  return db.business.findMany({ orderBy: { createdAt: "desc" } });
}
```

## Test

### `lib/business-repo.test.ts` — Kind 4 (isolated DB)

Use a **temp SQLite file per test run** (never `dev.db`).  
Schema must be applied before tests run — use `prisma db push` via `execSync` in `beforeAll`.

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { create, findBySlug, list } from "./business-repo";
import { rmSync } from "fs";

const DB_PATH = `./prisma/test-business-${Date.now()}.db`;
const DB_URL = `file:${DB_PATH}`;

let db: PrismaClient;

beforeAll(() => {
  process.env.DATABASE_URL = DB_URL;
  execSync("npx prisma db push --force-reset --skip-generate", {
    env: { ...process.env, DATABASE_URL: DB_URL },
    stdio: "pipe",
  });
  db = new PrismaClient({ datasources: { db: { url: DB_URL } } });
});

afterAll(async () => {
  await db.$disconnect();
  try { rmSync(DB_PATH); } catch {}
});
```

#### Test cases

- `list` returns empty array when no rows exist
- `create` inserts a row; returned object has `id`, `slug`, `name`, `placeId`
- `findBySlug` with the slug from `create` returns the same row
- `findBySlug` with an unknown slug returns `null`
- `list` returns one row after one `create`

## Verify

- `npm test` green (all existing tests + new repo tests)
- No HTTP route changes, no schema changes

## Stop

Do not start SID-41 (admin routes).
