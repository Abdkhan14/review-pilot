import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/admin-cookie", () => ({
  hasAdminCookie: vi.fn(),
}));

import { hasAdminCookie } from "@/lib/admin-cookie";
import { isAdminEmail, isNewLandingEnabled, isSelfServeEnabled, isViewer } from "./flags";
import type { CookieReader } from "./admin-cookie";

const mockHasAdminCookie = vi.mocked(hasAdminCookie);

const emptyCookies: CookieReader = { get: () => undefined };

beforeEach(() => {
  mockHasAdminCookie.mockReset();
  delete process.env.FF_NEW_LANDING;
  delete process.env.FF_SELF_SERVE;
  delete process.env.TESTER_EMAILS;
  delete process.env.ADMIN_EMAILS;
});

afterEach(() => {
  delete process.env.FF_NEW_LANDING;
  delete process.env.FF_SELF_SERVE;
  delete process.env.TESTER_EMAILS;
  delete process.env.ADMIN_EMAILS;
});

describe("isNewLandingEnabled", () => {
  it("returns false when env is unset and not an admin", async () => {
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isNewLandingEnabled(emptyCookies)).toBe(false);
  });

  it("returns true when FF_NEW_LANDING=1", async () => {
    process.env.FF_NEW_LANDING = "1";
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isNewLandingEnabled(emptyCookies)).toBe(true);
  });

  it("returns true when the caller has an admin cookie", async () => {
    mockHasAdminCookie.mockResolvedValue(true);
    expect(await isNewLandingEnabled(emptyCookies)).toBe(true);
  });
});

describe("isSelfServeEnabled", () => {
  it("returns false when env is unset and not an admin", async () => {
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isSelfServeEnabled(emptyCookies)).toBe(false);
  });

  it("returns true when FF_SELF_SERVE=true", async () => {
    process.env.FF_SELF_SERVE = "true";
    mockHasAdminCookie.mockResolvedValue(false);
    expect(await isSelfServeEnabled(emptyCookies)).toBe(true);
  });

  it("returns true when the caller has an admin cookie", async () => {
    mockHasAdminCookie.mockResolvedValue(true);
    expect(await isSelfServeEnabled(emptyCookies)).toBe(true);
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

describe("isAdminEmail", () => {
  it("returns true when email is in ADMIN_EMAILS, ignoring case and spaces", () => {
    process.env.ADMIN_EMAILS = " Owner@Example.com , other@example.com";
    expect(isAdminEmail("owner@example.com")).toBe(true);
  });

  it("returns false when email is not in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    expect(isAdminEmail("tester@example.com")).toBe(false);
  });
});
