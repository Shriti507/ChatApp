import { AuthConfig } from "convex/server";

// Clerk → Convex auth: Convex validates the JWT using the issuer domain.
// 1. In Convex Dashboard: Settings → Environment Variables → add CLERK_JWT_ISSUER_DOMAIN
//    with your Clerk Frontend API URL (e.g. https://xxx.clerk.accounts.dev).
// 2. In Clerk Dashboard: Convex integration must be activated (creates JWT template with aud: convex).
// 3. Run `npx convex dev` (or `npx convex deploy`) after changing this file or env.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
