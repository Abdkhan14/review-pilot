import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { rmSync } from "fs";
import {
  reserveGeneration,
  releaseGeneration,
  reserveTrialGeneration,
  releaseTrialGeneration,
  recordTrialHandoff,
  recordDailyHandoff,
  visitorSessionsToday,
  siteGenerationsToday,
} from "./usage";

vi.mock("server-only", () => ({}));

const DB_PATH = `./prisma/test-usage-${Date.now()}.db`;
const DB_URL = `file:${DB_PATH}`;

let db: PrismaClient;

beforeAll(() => {
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

import { vi } from "vitest";

async function seedPlace(placeId: string) {
  return db.demoPlace.upsert({
    where: { placeId },
    create: { placeId, name: "Test Shop" },
    update: {},
  });
}

async function seedSession(id: string, placeId: string, ipHash: string, now: Date) {
  return db.demoSession.create({
    data: {
      id,
      placeId,
      ipHash,
      expiresAt: new Date(now.getTime() + 86_400_000),
    },
  });
}

describe("reserveGeneration", () => {
  it("increments the shop and session counters", async () => {
    await seedPlace("place-r1");
    const now = new Date();
    await seedSession("sess-r1", "place-r1", "hash-a", now);

    const ok = await reserveGeneration(db, "sess-r1", "place-r1", 5);
    expect(ok).toBe(true);

    const place = await db.demoPlace.findUnique({ where: { placeId: "place-r1" } });
    const sess = await db.demoSession.findUnique({ where: { id: "sess-r1" } });
    expect(place?.generationsUsed).toBe(1);
    expect(sess?.generations).toBe(1);
  });

  it("returns false and does not increment when the shop is at its limit", async () => {
    await seedPlace("place-r2");
    await db.demoPlace.update({ where: { placeId: "place-r2" }, data: { generationsUsed: 5 } });
    const now = new Date();
    await seedSession("sess-r2", "place-r2", "hash-b", now);

    const ok = await reserveGeneration(db, "sess-r2", "place-r2", 5);
    expect(ok).toBe(false);

    const place = await db.demoPlace.findUnique({ where: { placeId: "place-r2" } });
    expect(place?.generationsUsed).toBe(5);
  });

  it("exactly one succeeds when two reserves race with one slot left", async () => {
    await seedPlace("place-r3");
    await db.demoPlace.update({ where: { placeId: "place-r3" }, data: { generationsUsed: 4 } });
    const now = new Date();
    await seedSession("sess-r3a", "place-r3", "hash-c", now);
    await seedSession("sess-r3b", "place-r3", "hash-d", now);

    const [a, b] = await Promise.all([
      reserveGeneration(db, "sess-r3a", "place-r3", 5),
      reserveGeneration(db, "sess-r3b", "place-r3", 5),
    ]);

    expect(a || b).toBe(true);
    expect(a && b).toBe(false);

    const place = await db.demoPlace.findUnique({ where: { placeId: "place-r3" } });
    expect(place?.generationsUsed).toBe(5);
  });

  it("returns false when the shop is blocked", async () => {
    await seedPlace("place-r4");
    await db.demoPlace.update({ where: { placeId: "place-r4" }, data: { blocked: true } });
    const now = new Date();
    await seedSession("sess-r4", "place-r4", "hash-e", now);

    const ok = await reserveGeneration(db, "sess-r4", "place-r4", 5);
    expect(ok).toBe(false);
  });
});

describe("releaseGeneration", () => {
  it("decrements the shop and session counters", async () => {
    await seedPlace("place-rel1");
    await db.demoPlace.update({ where: { placeId: "place-rel1" }, data: { generationsUsed: 2 } });
    const now = new Date();
    await seedSession("sess-rel1", "place-rel1", "hash-f", now);
    await db.demoSession.update({ where: { id: "sess-rel1" }, data: { generations: 1 } });

    await releaseGeneration(db, "sess-rel1", "place-rel1");

    const place = await db.demoPlace.findUnique({ where: { placeId: "place-rel1" } });
    const sess = await db.demoSession.findUnique({ where: { id: "sess-rel1" } });
    expect(place?.generationsUsed).toBe(1);
    expect(sess?.generations).toBe(0);
  });

  it("does not go below 0", async () => {
    await seedPlace("place-rel2");
    const now = new Date();
    await seedSession("sess-rel2", "place-rel2", "hash-g", now);

    await releaseGeneration(db, "sess-rel2", "place-rel2");

    const place = await db.demoPlace.findUnique({ where: { placeId: "place-rel2" } });
    const sess = await db.demoSession.findUnique({ where: { id: "sess-rel2" } });
    expect(place?.generationsUsed).toBe(0);
    expect(sess?.generations).toBe(0);
  });
});

describe("visitorSessionsToday", () => {
  it("counts sessions for the given ipHash in the last 24h", async () => {
    await seedPlace("place-v1");
    const now = new Date();
    await seedSession("sess-v1a", "place-v1", "visitor-hash-1", now);
    await seedSession("sess-v1b", "place-v1", "visitor-hash-1", now);
    await seedSession("sess-v1c", "place-v1", "visitor-hash-2", now);

    expect(await visitorSessionsToday(db, "visitor-hash-1", now)).toBe(2);
    expect(await visitorSessionsToday(db, "visitor-hash-2", now)).toBe(1);
  });
});

describe("siteGenerationsToday", () => {
  it("sums all generations in the last 24h", async () => {
    await seedPlace("place-sg1");
    const now = new Date();
    const s1 = await seedSession("sess-sg1a", "place-sg1", "hash-sg1", now);
    const s2 = await seedSession("sess-sg1b", "place-sg1", "hash-sg2", now);
    await db.demoSession.update({ where: { id: s1.id }, data: { generations: 3 } });
    await db.demoSession.update({ where: { id: s2.id }, data: { generations: 2 } });

    const total = await siteGenerationsToday(db, now);
    expect(total).toBeGreaterThanOrEqual(5);
  });
});

async function seedTrialQr(id: string, trialGenerations: number) {
  return db.business.create({
    data: {
      id,
      slug: `${id}-slug`,
      tier: "OWNED",
      name: "Joe's Pizza",
      placeId: "ChIJ_joes",
      ownerId: "usr_maria",
      trialStartedAt: new Date(),
      trialGenerations,
    },
  });
}

async function trialGenerationsOf(id: string) {
  return (await db.business.findUniqueOrThrow({ where: { id } })).trialGenerations;
}

describe("reserveTrialGeneration", () => {
  it("takes a slot while under the limit", async () => {
    await seedTrialQr("trial-r1", 4);
    expect(await reserveTrialGeneration(db, "trial-r1", 5)).toBe(true);
    expect(await trialGenerationsOf("trial-r1")).toBe(5);
  });

  it("lets only one of two simultaneous requests take the last slot", async () => {
    await seedTrialQr("trial-r2", 4);
    const results = await Promise.all([
      reserveTrialGeneration(db, "trial-r2", 5),
      reserveTrialGeneration(db, "trial-r2", 5),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await trialGenerationsOf("trial-r2")).toBe(5);
  });
});

describe("releaseTrialGeneration", () => {
  it("gives a slot back but never goes below zero", async () => {
    await seedTrialQr("trial-l1", 1);
    await releaseTrialGeneration(db, "trial-l1");
    await releaseTrialGeneration(db, "trial-l1");
    expect(await trialGenerationsOf("trial-l1")).toBe(0);
  });
});

describe("recordTrialHandoff", () => {
  it("counts until the limit, then refuses", async () => {
    await seedTrialQr("trial-h1", 0);
    expect(await recordTrialHandoff(db, "trial-h1", 2)).toBe(true);
    expect(await recordTrialHandoff(db, "trial-h1", 2)).toBe(true);
    expect(await recordTrialHandoff(db, "trial-h1", 2)).toBe(false);
    expect((await db.business.findUniqueOrThrow({ where: { id: "trial-h1" } })).trialHandoffs).toBe(2);
  });
});

describe("recordDailyHandoff", () => {
  const NOV_22 = new Date("2026-11-22T12:00:00Z");
  const NOV_23 = new Date("2026-11-23T09:00:00Z");

  async function handoffRow(id: string) {
    return db.businessHandoff.findUnique({ where: { businessId: id } });
  }

  it("starts today's count, counts up to the cap, then refuses", async () => {
    await seedTrialQr("daily-1", 0);
    expect(await recordDailyHandoff(db, "daily-1", 2, NOV_22)).toBe(true);
    expect(await recordDailyHandoff(db, "daily-1", 2, NOV_22)).toBe(true);
    expect(await recordDailyHandoff(db, "daily-1", 2, NOV_22)).toBe(false);
    expect(await handoffRow("daily-1")).toMatchObject({ count: 2, day: "2026-11-22" });
  });

  it("resets to 1 on the first handoff of a new day", async () => {
    await recordDailyHandoff(db, "daily-1", 2, NOV_23);
    expect(await handoffRow("daily-1")).toMatchObject({ count: 1, day: "2026-11-23" });
  });

  it("lets only cap-many of several simultaneous handoffs count", async () => {
    await seedTrialQr("daily-2", 0);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => recordDailyHandoff(db, "daily-2", 3, NOV_22)),
    );
    expect(results.filter(Boolean)).toHaveLength(3);
    expect((await handoffRow("daily-2"))?.count).toBe(3);
  });

  it("keeps counting when the QR has no cap", async () => {
    await seedTrialQr("daily-3", 0);
    for (let i = 0; i < 8; i++) await recordDailyHandoff(db, "daily-3", null, NOV_22);
    expect((await handoffRow("daily-3"))?.count).toBe(8);
  });
});
