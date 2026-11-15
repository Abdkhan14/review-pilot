import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/admin-cookie", () => ({
  hasAdminCookie: vi.fn(),
}));

import { hasAdminCookie } from "@/lib/admin-cookie";
import { isNewLandingEnabled, isSelfServeEnabled, isViewer } from "./flags";
import type { NextRequest } from "next/server";

const mockHasAdminCookie = vi.mocked(hasAdminCookie);

const fakeReq = {} as NextRequest;

beforeEach(() => {
  mockHasAdminCookie.mockReset();
  delete process.env.FF_NEW_LANDING;
  delete process.env.FF_SELF_SERVE;
  delete process.env.TESTER_EMAILS;
});

afterEach(() => {
  delete process.env.FF_NEW_LANDING;
  delete process.env.FF_SELF_SERVE;
  delete process.env.TESTER_EMAILS;
});

describe("isNewLandingEnabled", () => {
  it("returns false when env is unset and not an admin", async () => {
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isNewLandingEnabled(fakeReq)).toBe(false);
  });

  it("returns true when FF_NEW_LANDING=1", async () => {
    process.env.FF_NEW_LANDING = "1";
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isNewLandingEnabled(fakeReq)).toBe(true);
  });

  it("returns true when the caller has an admin cookie", async () => {
    mockHasAdminCookie.mockResolvedValue(true);
    expect(await isNewLandingEnabled(fakeReq)).toBe(true);
  });
});

describe("isSelfServeEnabled", () => {
  it("returns false when env is unset and not an admin", async () => {
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isSelfServeEnabled(fakeReq)).toBe(false);
  });

  it("returns true when FF_SELF_SERVE=true", async () => {
    process.env.FF_SELF_SERVE = "true";
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isSelfServeEnabled(fakeReq)).toBe(true);
  });

  it("returns true when the caller has an admin cookie", async () => {
    mockHasAdminCookie.mockResolvedValue(true);
    expect(await isSelfServeEnabled(fakeReq)).toBe(true);
  });
});

describe("isViewer", () => {
  it("returns false when email is undefined", () => {
    expect(isViewer(undefined)).toBe(false);
  });

  it("returns false when TESTER_EMAILS is not set", () => {
    expect(isViewer("test@example.com")).toBe(false);
  });

  it("returns true when email is in TESTER_EMAILS", () => {
    process.env.TESTER_EMAILS = "alice@example.com,bob@example.com";
    expect(isViewer("alice@example.com")).toBe(true);
  });

  it("matches case-insensitively", () => {
    process.env.TESTER_EMAILS = "Alice@Example.com";
    expect(isViewer("alice@example.com")).toBe(true);
  });

  it("returns false when email is not in the list", () => {
    process.env.TESTER_EMAILS = "alice@example.com";
    expect(isViewer("bob@example.com")).toBe(false);
  });
});
