import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { rmSync } from "fs";
import {
  findSession,
  findOrCreatePlace,
  createSession,
  pruneSessions,
  listDemoPlaces,
} from "./demo-repo";
import type { PlaceSnapshot } from "./place-snapshot";

vi.mock("server-only", () => ({}));

const DB_PATH = `./prisma/test-demo-repo-${Date.now()}.db`;
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

const SNAPSHOT: PlaceSnapshot = {
  placeId: "ChIJabc",
  name: "Joe's Pizza",
  address: "123 Main St",
  writeReviewUrl: "https://g.co/maps/write",
  fetchedAt: "2026-01-01T00:00:00.000Z",
};

async function fetchDetails(): Promise<PlaceSnapshot> {
  return SNAPSHOT;
}

describe("findOrCreatePlace", () => {
  it("creates a new DemoPlace row on first call", async () => {
    const place = await findOrCreatePlace(db, "ChIJabc", fetchDetails);
    expect(place.name).toBe("Joe's Pizza");
    expect(place.writeReviewUrl).toBe("https://g.co/maps/write");
  });

  it("reuses the row on a second call without calling fetchDetails", async () => {
    const spy = vi.fn().mockResolvedValue(SNAPSHOT);
    await findOrCreatePlace(db, "ChIJabc", spy);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("createSession and findSession", () => {
  it("round-trips a session through the database", async () => {
    await findOrCreatePlace(db, "ChIJabc", fetchDetails);
    const now = new Date();
    const sess = await createSession(db, "ChIJabc", "hash-abc", "great food", now);

    expect(sess.id).toHaveLength(6);
    expect(sess.placeId).toBe("ChIJabc");
    expect(sess.customInstructions).toBe("great food");

    const found = await findSession(db, sess.id);
    expect(found?.id).toBe(sess.id);
    expect(found?.place.name).toBe("Joe's Pizza");
  });
});

describe("pruneSessions", () => {
  it("deletes sessions older than 2 days", async () => {
    await findOrCreatePlace(db, "ChIJabc", fetchDetails);
    const old = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sess = await db.demoSession.create({
      data: {
        id: "pruneX",
        placeId: "ChIJabc",
        ipHash: "old-hash",
        createdAt: old,
        expiresAt: new Date(old.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    await pruneSessions(db, new Date());
    expect(await db.demoSession.findUnique({ where: { id: sess.id } })).toBeNull();
  });
});

describe("listDemoPlaces", () => {
  it("includes todayCount and sessionCount", async () => {
    const now = new Date();
    await db.demoPlace.upsert({
      where: { placeId: "ChIJlist" },
      create: { placeId: "ChIJlist", name: "List Shop" },
      update: {},
    });
    await db.demoSession.create({
      data: {
        id: "list-sess-1",
        placeId: "ChIJlist",
        ipHash: "hash-list",
        expiresAt: new Date(now.getTime() + 86_400_000),
      },
    });

    const places = await listDemoPlaces(db, now);
    const entry = places.find((p) => p.placeId === "ChIJlist");
    expect(entry).toBeDefined();
    expect(entry?.sessionCount).toBeGreaterThanOrEqual(1);
    expect(entry?.todayCount).toBeGreaterThanOrEqual(1);
  });
});
