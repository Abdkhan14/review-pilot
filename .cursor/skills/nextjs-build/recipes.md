# Recipes

Copy-paste patterns for Next.js 16 App Router. Every snippet has a ❌ and a ✅.
Generic names (`getItem`, `parseCreateBody`, `verifySession`) are intentional —
replace them with your own.

---

## 1. GET Route Handler with `await params`

```ts
// app/api/items/[id]/route.ts
import type { NextRequest } from "next/server";
import { findById } from "@/lib/item-repo";
import { verifySession } from "@/lib/auth";

// ❌ Sync params, no auth, logic inlined
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await db.item.findUnique({ where: { id: params.id } });
  return Response.json(item);
}

// ✅ Async params, session checked, lib called
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/items/[id]">
) {
  const session = await verifySession(req);
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const item = await findById(id);
  if (!item) return new Response(null, { status: 404 });

  return Response.json(item);
}
```

---

## 2. POST Route Handler with Zod Validation

```ts
// app/api/items/route.ts
import { z } from "zod";
import { createItem } from "@/lib/item-repo";
import { verifySession } from "@/lib/auth";

const CreateBody = z.object({
  name: z.string().min(1),
  type: z.enum(["a", "b"]),
  notes: z.string().optional(),
});

// ❌ Raw body used directly — invalid input causes obscure errors
export async function POST(req: Request) {
  const body = await req.json();
  const item = await db.item.create({ data: body });
  return Response.json(item, { status: 201 });
}

// ✅ Parse at the boundary; bad input returns 400 immediately
export async function POST(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return new Response(null, { status: 401 });

  const parse = CreateBody.safeParse(await req.json());
  if (!parse.success) {
    return Response.json({ errors: parse.error.flatten() }, { status: 400 });
  }

  const item = await createItem(parse.data);
  return Response.json(item, { status: 201 });
}
```

---

## 3. `proxy.ts` Session Gate (replaces deprecated `middleware.ts`)

```ts
// proxy.ts  (project root — same level as app/)
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";

// ❌ Old file name + old export name
// middleware.ts
export function middleware(req: NextRequest) { ... }

// ✅ New file name + new export name; Node.js runtime (not Edge)
export async function proxy(req: NextRequest) {
  const cookie = req.cookies.get("session")?.value;
  const valid = cookie ? await verifySessionCookie(cookie) : false;

  if (!valid) {
    const isApi = req.nextUrl.pathname.startsWith("/api/");
    if (isApi) {
      return new NextResponse(null, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect admin UI and admin APIs; skip static assets
    "/admin/:path*",
    "/api/admin/:path*",
    // Add other protected segments here
  ],
};
```

**Key rules:**
- File is `proxy.ts`, export is `proxy`. (`middleware.ts` still works but is deprecated.)
- Runs on Node.js — no Edge runtime restrictions; `jose`, `bcrypt`, etc. work.
- Matcher must NOT have a negative lookahead for `api` if you want to protect `/api/admin`. A common mistake is copying the default Next.js starter matcher that excludes api.
- Never put static asset paths (`_next/static`, `favicon.ico`, images) in the matcher.

---

## 4. Server Page + Client Leaf

Keep the page as a Server Component so it can fetch data without a round-trip.
Push `"use client"` down to the smallest interactive piece.

```tsx
// ❌ Whole page is a Client Component — data fetched with useEffect
// app/items/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function ItemPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<Item | null>(null);
  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then((r) => r.json())
      .then(setItem);
  }, [params.id]);
  if (!item) return <p>Loading…</p>;
  return <h1>{item.title}</h1>;
}

// ✅ Server Component fetches; client leaf handles the button
// app/items/[id]/page.tsx  (no "use client" here)
import { CopyButton } from "./_components/CopyButton";
import { getItem } from "@/lib/item-repo";
import { notFound } from "next/navigation";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <main>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
      <CopyButton text={item.description} />
    </main>
  );
}

// app/items/[id]/_components/CopyButton.tsx
"use client";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

---

## 5. `redirect()` and `notFound()` in Pages vs Routes

These helpers behave differently inside pages vs route handlers.

```tsx
// In a page (throws internally — do NOT wrap in try/catch)
import { redirect, notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) notFound();                    // renders not-found.tsx
  if (item.status === "archived") redirect("/items"); // 307 redirect
  return <h1>{item.title}</h1>;
}
```

```ts
// In a route handler — use Response / NextResponse directly
import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const item = await getItem(id);

  if (!item) return new Response(null, { status: 404 });
  if (item.status === "archived") {
    return NextResponse.redirect(new URL("/items", "http://localhost"));
  }
  return Response.json(item);
}
```

---

## 6. `server-only` on Vendor / DB Modules

Prevents secrets from leaking into the client bundle at build time.

```ts
// lib/db.ts
import "server-only";          // ← build error if imported in "use client" tree
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
export const db = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
```

```ts
// lib/openai.ts
import "server-only";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function complete(prompt: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return res.choices[0]?.message.content ?? "";
}
```

```ts
// lib/auth.ts
import "server-only";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signSession(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionCookie(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
```

---

## 7. Redirect After Form Submission (Server Action)

```tsx
// app/login/page.tsx
import { loginAction } from "./_actions/login";

export default function LoginPage() {
  return (
    <form action={loginAction}>
      <input name="password" type="password" />
      <button type="submit">Log in</button>
    </form>
  );
}

// app/login/_actions/login.ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession } from "@/lib/auth";
import { timingSafeEqual } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password")?.toString() ?? "";
  const valid = timingSafeEqual(password, process.env.ADMIN_PASSWORD!);
  if (!valid) redirect("/login?error=1");

  const token = await signSession({ role: "admin" });
  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}
```
