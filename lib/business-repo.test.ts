import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { rmSync } from "fs";
import { create, findById, findBySlug, list, update, remove } from "./business-repo";

const DB_PATH = `./prisma/test-business-${Date.now()}.db`;
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
  try {
    rmSync(DB_PATH);
  } catch {}
});

describe("list", () => {
  it("returns an empty array when no rows exist", async () => {
    const rows = await list(db);
    expect(rows).toEqual([]);
  });
});

describe("create", () => {
  it("inserts a row and returns id, slug, name, placeId", async () => {
    const biz = await create(db, {
      name: "Joe's Pizza",
      placeId: "ChIJN1t_test",
      tier: "BASIC",
    });

    expect(biz.id).toBeDefined();
    expect(biz.slug).toMatch(/^joes-pizza-[a-f0-9]{4}$/);
    expect(biz.name).toBe("Joe's Pizza");
    expect(biz.placeId).toBe("ChIJN1t_test");
  });
});

describe("findBySlug", () => {
  it("returns the row matching the slug", async () => {
    const biz = await create(db, {
      name: "Mike's Diner",
      placeId: "ChIJtest_diner",
      tier: "SAAS",
    });

    const found = await findBySlug(db, biz.slug);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Mike's Diner");
  });

  it("returns null for an unknown slug", async () => {
    const found = await findBySlug(db, "does-not-exist-0000");
    expect(found).toBeNull();
  });
});

describe("list after inserts", () => {
  it("returns one row per created business (ordered newest first)", async () => {
    const rows = await list(db);
    // We created 2 businesses above (Joe's Pizza + Mike's Diner)
    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe("Mike's Diner"); // newest first
  });
});

describe("findById", () => {
  it("returns the row matching the id", async () => {
    const biz = await create(db, {
      name: "FindById Shop",
      placeId: "ChIJfindbyid",
      tier: "BASIC",
    });
    const found = await findById(db, biz.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("FindById Shop");
  });

  it("returns null for an unknown id", async () => {
    const found = await findById(db, "nonexistent-cuid-00000000");
    expect(found).toBeNull();
  });
});

describe("update", () => {
  it("updates tier and customInstructions without changing the slug", async () => {
    const biz = await create(db, {
      name: "Update Shop",
      placeId: "ChIJupdate",
      tier: "BASIC",
    });
    const originalSlug = biz.slug;

    const updated = await update(db, biz.id, {
      tier: "SAAS",
      customInstructions: "mention the daily special",
    });

    expect(updated.tier).toBe("SAAS");
    expect(updated.customInstructions).toBe("mention the daily special");
    expect(updated.slug).toBe(originalSlug); // slug must never change
  });

  it("clears customInstructions when set to null", async () => {
    const biz = await create(db, {
      name: "Clear Notes Shop",
      placeId: "ChIJclear",
      tier: "SAAS",
      customInstructions: "some notes",
    });

    const updated = await update(db, biz.id, {
      tier: "SAAS",
      customInstructions: null,
    });

    expect(updated.customInstructions).toBeNull();
  });
});

describe("remove", () => {
  it("deletes the row; findById returns null afterwards", async () => {
    const biz = await create(db, {
      name: "Remove Me Shop",
      placeId: "ChIJremove",
      tier: "BASIC",
    });

    await remove(db, biz.id);

    const found = await findById(db, biz.id);
    expect(found).toBeNull();
  });
});
