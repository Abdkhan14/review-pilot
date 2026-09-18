import { describe, it, expect } from "vitest";
import { resolveAdminGate } from "./admin-gate";

describe("resolveAdminGate", () => {
  // login page is always public
  it("allows /admin/login without cookie", () => {
    expect(resolveAdminGate("/admin/login", false)).toEqual({ action: "allow" });
  });

  it("allows /admin/login with cookie", () => {
    expect(resolveAdminGate("/admin/login", true)).toEqual({ action: "allow" });
  });

  // valid cookie → allow everything
  it("allows /admin with valid cookie", () => {
    expect(resolveAdminGate("/admin", true)).toEqual({ action: "allow" });
  });

  it("allows /admin/businesses with valid cookie", () => {
    expect(resolveAdminGate("/admin/businesses", true)).toEqual({ action: "allow" });
  });

  it("allows /api/admin/businesses with valid cookie", () => {
    expect(resolveAdminGate("/api/admin/businesses", true)).toEqual({ action: "allow" });
  });

  // no cookie on admin page → redirect
  it("redirects /admin without cookie", () => {
    expect(resolveAdminGate("/admin", false)).toEqual({
      action: "redirect",
      to: "/admin/login",
    });
  });

  it("redirects /admin/businesses without cookie", () => {
    expect(resolveAdminGate("/admin/businesses", false)).toEqual({
      action: "redirect",
      to: "/admin/login",
    });
  });

  // no cookie on api/admin → 401
  it("returns unauthorized for /api/admin/businesses without cookie", () => {
    expect(resolveAdminGate("/api/admin/businesses", false)).toEqual({
      action: "unauthorized",
    });
  });

  // public routes stay public (matcher shouldn't call proxy here, but function documents it)
  it("allows /b/joes-pizza-a3k9 without cookie", () => {
    expect(resolveAdminGate("/b/joes-pizza-a3k9", false)).toEqual({ action: "allow" });
  });
});
