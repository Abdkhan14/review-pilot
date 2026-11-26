import { describe, it, expect, afterEach } from "vitest";
import { envFlagOn, isAdminEmail, isViewer } from "./access";

afterEach(() => {
  delete process.env.FF_SELF_SERVE;
  delete process.env.TESTER_EMAILS;
  delete process.env.ADMIN_EMAILS;
});

describe("envFlagOn", () => {
  it.each([["1", true], ["true", true], ["0", false], ["", false]])(
    "reads FF_SELF_SERVE=%s as %s",
    (value, expected) => {
      process.env.FF_SELF_SERVE = value;
      expect(envFlagOn("FF_SELF_SERVE")).toBe(expected);
    },
  );
});

describe("isViewer", () => {
  it("returns false when email is undefined", () => {
    expect(isViewer(undefined)).toBe(false);
  });

  it("returns false when TESTER_EMAILS is not set", () => {
    expect(isViewer("test@example.com")).toBe(false);
  });

  it("matches case-insensitively and ignores spaces", () => {
    process.env.TESTER_EMAILS = " Alice@Example.com , bob@example.com";
    expect(isViewer("alice@example.com")).toBe(true);
  });

  it("returns false when email is not in the list", () => {
    process.env.TESTER_EMAILS = "alice@example.com";
    expect(isViewer("bob@example.com")).toBe(false);
  });
});

describe("isAdminEmail", () => {
  it("returns true when email is in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "owner@example.com,other@example.com";
    expect(isAdminEmail("Owner@Example.com")).toBe(true);
  });

  it("does not treat testers as admins", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    process.env.TESTER_EMAILS = "tester@example.com";
    expect(isAdminEmail("tester@example.com")).toBe(false);
  });
});
