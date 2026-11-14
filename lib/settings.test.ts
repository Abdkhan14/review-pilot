import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { rmSync } from "fs";
import { getLimits, DEFAULT_LIMITS } from "./settings";

const DB_PATH = `./prisma/test-settings-${Date.now()}.db`;
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

describe("getLimits", () => {
  it("returns all default values when AppSetting table is empty", async () => {
    const limits = await getLimits(db);
    expect(limits).toEqual(DEFAULT_LIMITS);
  });

  it("overrides a single key when stored in the database", async () => {
    await db.appSetting.upsert({
      where: { key: "assisted.dailyHandoffLimit" },
      create: { key: "assisted.dailyHandoffLimit", value: "10" },
      update: { value: "10" },
    });

    const limits = await getLimits(db);
    expect(limits["assisted.dailyHandoffLimit"]).toBe(10);
    // Other keys remain at their defaults.
    expect(limits["trial.generationLimit"]).toBe(DEFAULT_LIMITS["trial.generationLimit"]);
  });

  it("falls back to default when stored value is non-numeric", async () => {
    await db.appSetting.upsert({
      where: { key: "demo.dailyGenerations" },
      create: { key: "demo.dailyGenerations", value: "not-a-number" },
      update: { value: "not-a-number" },
    });

    const limits = await getLimits(db);
    expect(limits["demo.dailyGenerations"]).toBe(DEFAULT_LIMITS["demo.dailyGenerations"]);
  });
});
