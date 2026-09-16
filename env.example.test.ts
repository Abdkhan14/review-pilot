import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

const content = readFileSync(join(import.meta.dirname, ".env.example"), "utf-8");

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "ADMIN_PASSWORD",
  "AUTH_SECRET",
  "APP_URL",
  "OPENAI_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "SNAPSHOT_MAX_AGE_DAYS",
];

describe(".env.example", () => {
  it.each(REQUIRED_KEYS)("contains %s=", (key) => {
    expect(content).toContain(`${key}=`);
  });
});
