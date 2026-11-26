import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { selfServeFlagOn } from "@/lib/flags";
import { canSignUp } from "@/lib/sign-up";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(db, { provider: "sqlite" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: { enabled: true },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const decision = canSignUp(user.email, selfServeFlagOn());
          // The OAuth callback forwards an APIError's code to the error page as ?error=<code>.
          if (!decision.allowed) {
            throw new APIError("FORBIDDEN", {
              code: decision.reason,
              message: "Sign-ups are not open yet.",
            });
          }
          return { data: { ...user, role: decision.role } };
        },
      },
    },
  },
  plugins: [admin(), nextCookies()],
});
