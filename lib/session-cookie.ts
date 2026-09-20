export const ADMIN_COOKIE = "rp_admin";

export const SEVEN_DAYS = 60 * 60 * 24 * 7;

export function adminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
