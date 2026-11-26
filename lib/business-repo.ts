import type { PrismaClient } from "@prisma/client";
import { makeSlug } from "./slug";

export type CreateBusinessInput = {
  name: string;
  placeId: string;
  tier: "BASIC" | "SAAS";
  customInstructions?: string;
  writeReviewUrl?: string;
  details?: string; // JSON string of normalized PlaceSnapshot
  detailsFetchedAt?: Date;
};

export type UpdateBusinessInput = {
  tier: "BASIC" | "SAAS";
  customInstructions?: string | null;
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

export async function findById(db: PrismaClient, id: string) {
  return db.business.findUnique({ where: { id } });
}

export async function update(
  db: PrismaClient,
  id: string,
  input: UpdateBusinessInput
) {
  // slug is intentionally excluded — update never touches it
  return db.business.update({ where: { id }, data: input });
}

export async function list(db: PrismaClient) {
  return db.business.findMany({ orderBy: { createdAt: "desc" } });
}

export async function remove(db: PrismaClient, id: string) {
  return db.business.delete({ where: { id } });
}

const OWNED_TIER = "OWNED";

export type CreateTrialQrInput = {
  ownerId: string;
  name: string;
  placeId: string;
  customInstructions?: string;
  writeReviewUrl: string;
  details: string; // JSON string of normalized PlaceSnapshot
  detailsFetchedAt: Date;
};

/**
 * Uses up the owner's one free trial and creates the QR on it, atomically.
 * Returns null, creating nothing, when the trial was already used.
 */
export async function createTrialQr(db: PrismaClient, input: CreateTrialQrInput, now = new Date()) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: input.ownerId, trialUsedAt: null },
      data: { trialUsedAt: now },
    });
    if (count === 0) return null;
    return tx.business.create({
      data: { ...input, tier: OWNED_TIER, slug: makeSlug(input.name), trialStartedAt: now },
    });
  });
}

/** The owner's QRs, newest first, with today's handoff row. */
export async function listOwned(db: PrismaClient, ownerId: string) {
  return db.business.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { handoff: true },
  });
}

/** One of the owner's QRs; null when it doesn't exist or belongs to someone else. */
export async function findOwned(db: PrismaClient, id: string, ownerId: string) {
  return db.business.findFirst({ where: { id, ownerId }, include: { handoff: true } });
}

/** A self-serve QR by its scan slug; businesses made in admin are excluded. */
export async function findOwnedBySlug(db: PrismaClient, slug: string) {
  return db.business.findFirst({
    where: { slug, ownerId: { not: null } },
    include: { handoff: true },
  });
}
