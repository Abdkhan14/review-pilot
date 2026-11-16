import "server-only";
import type { PrismaClient, DemoPlace, DemoSession } from "@prisma/client";
import { newDemoId, DEMO_TTL_MS, PRUNE_AFTER_MS } from "@/lib/demo";
import type { PlaceSnapshot } from "@/lib/place-snapshot";

export type DemoSessionWithPlace = DemoSession & { place: DemoPlace };

/** Fetches a session by its short id, including the shop. */
export async function findSession(
  db: PrismaClient,
  id: string,
): Promise<DemoSessionWithPlace | null> {
  return db.demoSession.findUnique({ where: { id }, include: { place: true } });
}

/**
 * Returns the existing DemoPlace for this placeId, or creates one by calling
 * fetchDetails. The fetch is only called once per new shop.
 */
export async function findOrCreatePlace(
  db: PrismaClient,
  placeId: string,
  fetchDetails: (placeId: string) => Promise<PlaceSnapshot>,
): Promise<DemoPlace> {
  const existing = await db.demoPlace.findUnique({ where: { placeId } });
  if (existing) return existing;

  const snapshot = await fetchDetails(placeId);

  return db.demoPlace.create({
    data: {
      placeId,
      name: snapshot.name,
      writeReviewUrl: snapshot.writeReviewUrl || null,
      details: JSON.stringify(snapshot),
      detailsFetchedAt: new Date(),
    },
  });
}

/** Creates a new DemoSession row with a 24-hour expiry. */
export async function createSession(
  db: PrismaClient,
  placeId: string,
  ipHash: string,
  customInstructions: string | undefined,
  now: Date,
): Promise<DemoSession> {
  return db.demoSession.create({
    data: {
      id: newDemoId(),
      placeId,
      ipHash,
      customInstructions: customInstructions ?? null,
      expiresAt: new Date(now.getTime() + DEMO_TTL_MS),
    },
  });
}

/** Deletes sessions older than 2 days. */
export async function pruneSessions(db: PrismaClient, now: Date): Promise<void> {
  await db.demoSession.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - PRUNE_AFTER_MS) } },
  });
}

export type DemoPlaceWithStats = DemoPlace & {
  todayCount: number;
  sessionCount: number;
};

/** Returns all demo shops with today's session count and total session count. */
export async function listDemoPlaces(
  db: PrismaClient,
  now: Date,
): Promise<DemoPlaceWithStats[]> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const places = await db.demoPlace.findMany({ orderBy: { createdAt: "asc" } });

  const [todayCounts, totalCounts] = await Promise.all([
    db.demoSession.groupBy({
      by: ["placeId"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    db.demoSession.groupBy({
      by: ["placeId"],
      _count: { id: true },
    }),
  ]);

  const todayMap = new Map(todayCounts.map((r) => [r.placeId, r._count.id]));
  const totalMap = new Map(totalCounts.map((r) => [r.placeId, r._count.id]));

  return places.map((p) => ({
    ...p,
    todayCount: todayMap.get(p.placeId) ?? 0,
    sessionCount: totalMap.get(p.placeId) ?? 0,
  }));
}
