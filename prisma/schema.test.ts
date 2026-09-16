import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

const schema = readFileSync(
  join(import.meta.dirname, "schema.prisma"),
  "utf-8"
);

describe("prisma/schema.prisma", () => {
  it("uses sqlite provider", () => {
    expect(schema).toContain('provider = "sqlite"');
  });

  it("defines the Business model", () => {
    expect(schema).toContain("model Business {");
  });

  const REQUIRED_FIELDS = [
    "id",
    "slug",
    "tier",
    "name",
    "placeId",
    "customInstructions",
    "details",
    "detailsFetchedAt",
    "createdAt",
  ];

  it.each(REQUIRED_FIELDS)("Business has field: %s", (field) => {
    expect(schema).toContain(field);
  });

  it("does not have a writeReviewUrl column", () => {
    expect(schema).not.toContain("writeReviewUrl");
  });

  it("documents BASIC and SAAS tier values", () => {
    expect(schema).toContain("BASIC");
    expect(schema).toContain("SAAS");
  });

  it("has no User model", () => {
    expect(schema).not.toContain("model User");
  });
});
