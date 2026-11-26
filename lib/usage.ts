import "server-only";
import type { PrismaClient } from "@prisma/client";

/**
 * Atomically increments both the shop's generationsUsed and the session's
 * generations counter, but only while the shop is under its limit and not
 * blocked. Returns false when no increment happened (limit reached or blocked).
 */
export async function reserveGeneration(
  db: PrismaClient,
  sessionId: string,
  placeId: string,
  limit: number,
): Promise<boolean> {
  const result = await db.$transaction(async (tx) => {
    const { count } = await tx.demoPlace.updateMany({
      where: { placeId, blocked: false, generationsUsed: { lt: limit } },
      data: { generationsUsed: { increment: 1 } },
    });
    if (count === 0) return false;
    await tx.demoSession.update({
      where: { id: sessionId },
      data: { generations: { increment: 1 } },
    });
    return true;
  });
  return result;
}

/**
 * Gives a generation slot back after a failed attempt.
 * Guarded with gt: 0 on both counters so they can't go negative.
 */
export async function releaseGeneration(
  db: PrismaClient,
  sessionId: string,
  placeId: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.demoPlace.updateMany({
      where: { placeId, generationsUsed: { gt: 0 } },
      data: { generationsUsed: { decrement: 1 } },
    });
    await tx.demoSession.updateMany({
      where: { id: sessionId, generations: { gt: 0 } },
      data: { generations: { decrement: 1 } },
    });
  });
}

/** Number of demo sessions this IP has started in the last 24 hours. */
export async function visitorSessionsToday(
  db: PrismaClient,
  ipHash: string,
  now: Date,
): Promise<number> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return db.demoSession.count({
    where: { ipHash, createdAt: { gte: since } },
  });
}

/** Total draft generations across the whole site in the last 24 hours. */
export async function siteGenerationsToday(
  db: PrismaClient,
  now: Date,
): Promise<number> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const result = await db.demoSession.aggregate({
    _sum: { generations: true },
    where: { createdAt: { gte: since } },
  });
  return result._sum.generations ?? 0;
}

/**
 * Takes one trial generation for a QR, only while it's under the limit.
 * Returns false when no slot was taken.
 */
export async function reserveTrialGeneration(
  db: PrismaClient,
  businessId: string,
  limit: number,
): Promise<boolean> {
  const { count } = await db.business.updateMany({
    where: { id: businessId, trialGenerations: { lt: limit } },
    data: { trialGenerations: { increment: 1 } },
  });
  return count === 1;
}

/** Gives a trial generation back after a failed attempt; never goes below zero. */
export async function releaseTrialGeneration(db: PrismaClient, businessId: string): Promise<void> {
  await db.business.updateMany({
    where: { id: businessId, trialGenerations: { gt: 0 } },
    data: { trialGenerations: { decrement: 1 } },
  });
}
