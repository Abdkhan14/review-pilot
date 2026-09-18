import "server-only";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { resolveDbTarget } from "./db-target";

function createPrismaClient(): PrismaClient {
  const target = resolveDbTarget(process.env);

  if (target.kind === "turso") {
    const libsql = createClient({ url: target.url, authToken: target.token });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  return new PrismaClient();
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
