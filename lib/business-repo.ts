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
