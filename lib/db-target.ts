export type DbTarget =
  | { kind: "file" }
  | { kind: "turso"; url: string; token: string };

export function resolveDbTarget(env: Record<string, string | undefined>): DbTarget {
  const url = env["TURSO_DATABASE_URL"];
  const token = env["TURSO_AUTH_TOKEN"];

  if (url && token) return { kind: "turso", url, token };
  if (url && !token) throw new Error("TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is set");
  if (!url && token) throw new Error("TURSO_DATABASE_URL is required when TURSO_AUTH_TOKEN is set");
  return { kind: "file" };
}
