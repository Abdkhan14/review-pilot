import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

import { getSessionUser, type SessionUser } from "@/lib/session";
import { isNewLandingEnabled, isSelfServeEnabled } from "./flags";

const mockSession = vi.mocked(getSessionUser);
const headers = new Headers();

function user(overrides: Partial<SessionUser>): SessionUser {
  return { id: "u1", name: "Maria", email: "maria@joespizza.com", role: "user", ...overrides };
}

beforeEach(() => {
  mockSession.mockReset();
  mockSession.mockResolvedValue(null);
});

afterEach(() => {
  delete process.env.FF_NEW_LANDING;
  delete process.env.FF_SELF_SERVE;
  delete process.env.TESTER_EMAILS;
});

describe.each([
  ["isNewLandingEnabled", isNewLandingEnabled, "FF_NEW_LANDING"],
  ["isSelfServeEnabled", isSelfServeEnabled, "FF_SELF_SERVE"],
] as const)("%s", (_name, isEnabled, envKey) => {
  it("is off with no session and the env flag unset", async () => {
    expect(await isEnabled(headers)).toBe(false);
  });

  it("follows the env flag when signed out", async () => {
    process.env[envKey] = "1";
    expect(await isEnabled(headers)).toBe(true);
  });

  it("is on for an admin session", async () => {
    mockSession.mockResolvedValue(user({ role: "admin" }));
    expect(await isEnabled(headers)).toBe(true);
  });

  it("is on for a tester session", async () => {
    process.env.TESTER_EMAILS = "maria@joespizza.com";
    mockSession.mockResolvedValue(user({}));
    expect(await isEnabled(headers)).toBe(true);
  });

  it("follows the env flag for a plain user", async () => {
    mockSession.mockResolvedValue(user({}));
    expect(await isEnabled(headers)).toBe(false);
    process.env[envKey] = "true";
    expect(await isEnabled(headers)).toBe(true);
  });
});
