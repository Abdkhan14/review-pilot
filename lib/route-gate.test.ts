import { describe, it, expect } from "vitest";
import { accessLevel, resolveGate } from "./route-gate";

describe("accessLevel", () => {
  const base = { id: "u1", name: "Maria", email: "maria@joespizza.com" };

  it("is none when signed out", () => {
    expect(accessLevel(null)).toBe("none");
  });

  it("is admin for the admin role", () => {
    expect(accessLevel({ ...base, role: "admin" })).toBe("admin");
  });

  it.each(["user", null])("is user for role %s", (role) => {
    expect(accessLevel({ ...base, role })).toBe("user");
  });
});

describe("resolveGate: admin area", () => {
  it.each(["/admin", "/admin/demos", "/api/admin/businesses"])("allows an admin on %s", (path) => {
    expect(resolveGate(path, "admin")).toEqual({ action: "allow" });
  });

  it.each(["/admin", "/api/admin/businesses"])("forbids a signed-in non-admin on %s", (path) => {
    expect(resolveGate(path, "user")).toEqual({ action: "forbidden" });
  });

  it("sends a signed-out visitor to sign-in and back to the page they asked for", () => {
    expect(resolveGate("/admin/demos", "none")).toEqual({
      action: "redirect",
      to: "/sign-in?callbackURL=%2Fadmin%2Fdemos",
    });
  });

  it("returns unauthorized for a signed-out admin API call", () => {
    expect(resolveGate("/api/admin/businesses", "none")).toEqual({ action: "unauthorized" });
  });

  it("allows paths outside the admin area", () => {
    expect(resolveGate("/b/joes-pizza-a3k9", "none")).toEqual({ action: "allow" });
  });
});

describe("resolveGate: owner area", () => {
  it.each(["admin", "user"] as const)("allows a signed-in %s on /app", (access) => {
    expect(resolveGate("/app", access)).toEqual({ action: "allow" });
  });

  it("sends a signed-out visitor to sign-in and back to /app", () => {
    expect(resolveGate("/app", "none")).toEqual({
      action: "redirect",
      to: "/sign-in?callbackURL=%2Fapp",
    });
  });

  it("returns unauthorized for a signed-out owner API call", () => {
    expect(resolveGate("/api/app/qr", "none")).toEqual({ action: "unauthorized" });
  });

  it("does not treat lookalike paths as protected", () => {
    expect(resolveGate("/apple", "none")).toEqual({ action: "allow" });
    expect(resolveGate("/administrator", "none")).toEqual({ action: "allow" });
  });
});
