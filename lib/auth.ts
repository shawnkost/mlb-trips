import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";

import * as schema from "@/db/schema";
import { getDb } from "@/lib/db";
import { sendEmailInBackground } from "@/lib/email";

const productionURL = "https://mlb-trips.vercel.app";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        sendEmailInBackground({
          to: user.email,
          subject: "Reset your MLB Trips password",
          text: `Reset your password: ${url}`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        sendEmailInBackground({
          to: user.email,
          subject: "Verify your MLB Trips email",
          text: `Verify your email address: ${url}`,
        });
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    user: { deleteUser: { enabled: true } },
    trustedOrigins: [
      "http://localhost:3000",
      productionURL,
      "https://mlb-trips-*-shawnkosts-projects.vercel.app",
    ],
    rateLimit: { storage: "database" },
    plugins: [
      ...(process.env.VERCEL
        ? [
            oAuthProxy({
              productionURL,
              secret: process.env.OAUTH_PROXY_SECRET,
            }),
          ]
        : []),
      nextCookies(),
    ],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  return (auth ??= createAuth());
}
