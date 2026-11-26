import { describe, it, expect } from "vitest";
import { accessLevel, resolveAdminGate } from "./admin-gate";

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

describe("resolveAdminGate", () => {
  it.each(["/admin", "/admin/demos", "/api/admin/businesses"])("allows an admin on %s", (path) => {
    expect(resolveAdminGate(path, "admin")).toEqual({ action: "allow" });
  });

  it.each(["/admin", "/api/admin/businesses"])("forbids a signed-in non-admin on %s", (path) => {
    expect(resolveAdminGate(path, "user")).toEqual({ action: "forbidden" });
  });

  it("sends a signed-out visitor to sign-in and back to the page they asked for", () => {
    expect(resolveAdminGate("/admin/demos", "none")).toEqual({
      action: "redirect",
      to: "/sign-in?callbackURL=%2Fadmin%2Fdemos",
    });
  });

  it("returns unauthorized for a signed-out admin API call", () => {
    expect(resolveAdminGate("/api/admin/businesses", "none")).toEqual({ action: "unauthorized" });
  });

  it("allows paths outside the admin area", () => {
    expect(resolveAdminGate("/b/joes-pizza-a3k9", "none")).toEqual({ action: "allow" });
  });
});
