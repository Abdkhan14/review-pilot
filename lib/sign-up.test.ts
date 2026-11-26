import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { canSignUp } from "./sign-up";

beforeEach(() => {
  process.env.ADMIN_EMAILS = "owner@example.com";
  process.env.TESTER_EMAILS = "tester@example.com";
});

afterEach(() => {
  delete process.env.ADMIN_EMAILS;
  delete process.env.TESTER_EMAILS;
});

describe("canSignUp", () => {
  it("lets anyone sign up as a user when self-serve is on", () => {
    expect(canSignUp("maria@joespizza.com", true)).toEqual({
      allowed: true,
      reason: "self_serve",
      role: "user",
    });
  });

  it("lets an admin email sign up as admin when self-serve is off", () => {
    expect(canSignUp("owner@example.com", false)).toEqual({
      allowed: true,
      reason: "admin",
      role: "admin",
    });
  });

  it("still gives an admin email the admin role when self-serve is on", () => {
    expect(canSignUp("owner@example.com", true)).toMatchObject({ role: "admin" });
  });

  it("lets a tester email sign up as a user when self-serve is off", () => {
    expect(canSignUp("tester@example.com", false)).toEqual({
      allowed: true,
      reason: "tester",
      role: "user",
    });
  });

  it("refuses everyone else when self-serve is off", () => {
    expect(canSignUp("maria@joespizza.com", false)).toEqual({
      allowed: false,
      reason: "signups_closed",
    });
  });
});
