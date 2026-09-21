import "server-only";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { resolveDbTarget } from "./db-target";

/** Prisma CLI resolves SQLite paths from prisma/; Next.js cwd is the repo root. */
function resolveSqliteUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const filePath = url.slice("file:".length);
  if (path.isAbsolute(filePath)) return url;
  return `file:${path.resolve(process.cwd(), "prisma", filePath)}`;
}

function createPrismaClient(): PrismaClient {
  const target = resolveDbTarget(process.env);

  if (target.kind === "turso") {
    const adapter = new PrismaLibSql({
      url: target.url,
      authToken: target.token,
    });
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  const url = resolveSqliteUrl(process.env.DATABASE_URL ?? "file:./dev.db");
  return new PrismaClient({ datasources: { db: { url } } });
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
