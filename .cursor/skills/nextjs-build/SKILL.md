---
name: nextjs-build
description: "Guides Next.js App Router implementation: small-change workflow, quality bar, SOLID principles, code smells, and testing strategy. Use when building, implementing, or coding any feature, page, route handler, or utility in a Next.js App Router project."
disable-model-invocation: true
---

# Build

A focused guide for implementing one small, testable change at a time in a
Next.js App Router project.

## Build Loop

Follow every step in order. Do not skip.

1. **Restate scope.** Write one sentence: "This change adds X." If X contains
   "and", split it — do the first part only.
2. **Read the repo.** Follow the folder structure that already exists. Do not
   invent a parallel tree (`services/`, `helpers/`, `utils2/`, `core/`).
3. **Name the test.** Write the test title you will add. If you cannot name it,
   the change is too big — stop and narrow scope.
4. **Write the test first** (or alongside the code in the same commit/PR).
5. **Write the smallest code that makes it pass.** Reuse existing modules.
   Extract a pure function rather than stuffing logic into a `page` or `route`.
6. **Run `npm test`.** Fix until green.
7. **Self-check** (see end of this file). Do not start the next feature.

---

## Next.js App Router Rules

These are the rules cheaper models most often get wrong. Each has a ❌ / ✅ pair.

### 1. Default to Server Components

`"use client"` only on interactive leaves — forms, buttons with `onClick`,
clipboard calls, local state. Never mark a whole page `"use client"` just
because one child needs it. Extract the interactive leaf instead.

```tsx
// ❌ Entire page is a client component to handle one click
"use client";
export default function ItemPage({ params }: { params: { id: string } }) {
  const [copied, setCopied] = useState(false);
  // ...fetches data with useEffect, leaks secrets via client fetch
}

// ✅ Server page fetches data; tiny client leaf handles the click
export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;        // params is async in Next.js 16
  const item = await getItem(id);     // runs on server, no secret leak
  return (
    <>
      <h1>{item.title}</h1>
      <CopyButton text={item.description} />  {/* client leaf */}
    </>
  );
}
```

### 2. `page.tsx` and `route.ts` Cannot Share a Folder

A UI page and an HTTP handler for the same URL segment conflict. Put API
handlers under `app/api/...`.

```
// ❌ Conflict — Next.js will error
app/login/page.tsx
app/login/route.ts

// ✅ Separate segments
app/login/page.tsx               ← renders the form
app/api/auth/login/route.ts      ← handles POST
```

### 3. Route Handlers: Parse → Call → Return

Route files parse the request, call a domain helper from `lib/`, and return a
`Response`. They do not contain business logic, SQL, or SDK calls.

```ts
// ❌ God route — logic, SDK, and HTTP all in one function
export async function POST(req: Request) {
  const body = await req.json();
  const result = await openaiClient.chat.completions.create({ /* ... */ });
  await db.item.update({ where: { id: body.id }, data: { result } });
  return Response.json({ result });
}

// ✅ Parse → call lib → return
import { parseCreateBody } from "@/lib/schemas";
import { runGeneration } from "@/lib/openai";
import { updateItem } from "@/lib/item-repo";

export async function POST(req: Request) {
  const body = parseCreateBody(await req.json()); // throws ZodError on bad input
  const result = await runGeneration(body);
  await updateItem(body.id, result);
  return Response.json({ result });
}
```

### 4. No Barrel Files

Do not create `lib/index.ts` that re-exports everything. Import directly. Barrel
files break tree-shaking and make bundle analysis impossible.

```ts
// ❌ Barrel
// lib/index.ts
export * from "./auth";
export * from "./db";
export * from "./openai";

// ❌ Consumer
import { verifySession, db, runGeneration } from "@/lib";

// ✅ Direct imports
import { verifySession } from "@/lib/auth";
import { findById } from "@/lib/item-repo";
```

### 5. `params`, `cookies()`, `headers()` Are Async

In Next.js 15+, these all return Promises. Always `await` them.

```ts
// ❌ Sync access — runtime error
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
}

// ✅ Awaited
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
}

// ❌ Route handler — sync cookies
export async function GET() {
  const token = cookies().get("session");
}

// ✅
export async function GET() {
  const token = (await cookies()).get("session");
}
```

### 6. `proxy.ts` — Next.js 16 Gate File

`middleware.ts` is deprecated in Next.js 16 and replaced by `proxy.ts` at the
project root. The proxy runs on the Node.js runtime (not Edge).

```ts
// ❌ Old file / export name
// middleware.ts
export function middleware(req: NextRequest) { ... }

// ✅ New file / export name
// proxy.ts
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) {
    // Pages → redirect to login
    if (!req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // API routes → 401
    return new NextResponse(null, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Gate admin pages and admin APIs; never gate static assets or public routes
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
```

**Gotcha:** A matcher that includes `api` as a negative lookahead will silently
skip all your API routes. Verify the matcher covers exactly the paths you intend.
Do not run the proxy on `/_next/static`, images, or fonts.

### 7. Secrets and `server-only`

Modules that read `process.env` API keys or call vendor SDKs must be server-only.
Mark them with `import "server-only"` so Next.js throws a build error if they
are ever imported into a Client Component bundle.

```ts
// ❌ Vendor call inside a client component
"use client";
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // key exposed

// ✅ Vendor wrapper is server-only
// lib/openai.ts
import "server-only";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDrafts(prompt: string) {
  const res = await client.chat.completions.create({ /* ... */ });
  return res.choices[0].message.content;
}
```

Apply `server-only` to: DB client, any vendor SDK wrapper, auth helpers that
read secret env vars.

### 8. Colocate Tests

Put tests next to the file they test.

```
lib/slug.ts
lib/slug.test.ts          ← not __tests__/slug.test.ts

app/api/items/route.ts
app/api/items/route.test.ts
```

---

## SOLID (Applied)

One line each. Examples use generic names.

- **S — Single Responsibility:** A URL builder does not touch the database.
  A route does not embed SQL or prompt strings.
  `buildPublicUrl(origin, id)` does one thing.

- **O — Open/Closed:** New behavior = new function or file. Do not rewrite a
  neighboring module's API while implementing an unrelated feature.

- **L — Liskov Substitution:** Test doubles (mocks/stubs) implement the same
  TypeScript function signatures as the real module. If the real function is
  `async findById(id: string): Promise<Item | null>`, the mock is the same shape.

- **I — Interface Segregation:** A search helper that returns `{ id, name }[]`
  should not also fetch full records. Keep helpers narrow.

- **D — Dependency Inversion:** Routes depend on a thin `lib/vendor.ts` wrapper,
  not the vendor SDK directly. Tests mock `lib/vendor.ts`. This makes the route
  testable without a real vendor account.

---

## Code Smell → Fix

| Smell | Trigger | Fix |
|---|---|---|
| God route | Route file > ~30 lines of logic | Extract to `lib/` function, import it |
| Secret leak | `process.env.SECRET` in a `"use client"` file | Move to `lib/` + `server-only` |
| Missing boundary validation | `const body = await req.json()` used directly | Parse with Zod at the top of the handler |
| Duplicated URL construction | Same URL string built in 2+ places | Extract to a pure helper, import it |
| `"use client"` on a data page | Whole page is client just to handle one event | Extract the interactive element |
| Empty `catch` | `} catch (_) {}` | At minimum `throw` or return an error `Response` |
| Narrating comments | `// Call the function` above `doThing()` | Delete; keep only why, never what |
| Barrel re-export | `lib/index.ts` exporting everything | Delete; use direct imports |
| `useEffect` copying props to state | `useEffect(() => setState(prop), [prop])` | Use the prop directly |
| Client fetch of vendor | `fetch("/api/vendor")` when RSC can call lib | Call `lib/vendor.ts` from Server Component |
| Changing a public identifier after create | Updating a slug/key used in printed artifacts | Slugs and external identifiers are immutable |

---

## Testing Strategy

> Rule: if you cannot name the test in one sentence, the change is too big.

### Tool selection

| What you're testing | Tool |
|---|---|
| Pure functions, helpers, schemas | Vitest |
| Client Components (clicks, forms) | Vitest + React Testing Library |
| Route handlers | Vitest (direct invocation or `next-test-api-route-handler`) |
| Data access layer | Vitest + temp isolated DB |
| Async Server Components, streaming, real redirects | Playwright (E2E) |
| Full auth flow end-to-end | Playwright |

Do not try to render Async Server Components in jsdom — they require the real
Next.js runtime. Test the data-fetching logic by extracting it to a plain async
function and unit-testing that.

### Core rules

- Extract logic to plain functions. Unit-test those. Pages and routes stay thin.
- Never call live vendor APIs in CI. Mock `lib/vendor.ts`.
- DB tests use a temp isolated store created per test suite, not the developer's
  local database file.
- One test should fail if you revert the change. If no test fails, the feature
  is not tested.

See [testing.md](testing.md) for copy-paste templates.
See [recipes.md](recipes.md) for copy-paste Next.js 16 patterns.
See [examples.md](examples.md) for three complete worked examples.

---

## Self-Check

Before pushing, verify:

- [ ] Scope: one behavior; no extra features snuck in
- [ ] Folder structure: followed existing conventions, no new top-level dirs
- [ ] `"use client"` only on interactive leaves, not whole pages
- [ ] `server-only` on all modules that read secrets or call vendors
- [ ] No barrel `index.ts`
- [ ] `params` / `cookies()` / `headers()` are `await`-ed
- [ ] `proxy.ts` (not `middleware.ts`) used if a request gate was added
- [ ] At least one test that fails if you revert the change
- [ ] No drive-by changes to unrelated files
