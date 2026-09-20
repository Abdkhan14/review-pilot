import { randomBytes } from "crypto";

export function makeSlug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) throw new Error("name must not be empty");

  const suffix = randomBytes(2).toString("hex");
  return `${base}-${suffix}`;
}
