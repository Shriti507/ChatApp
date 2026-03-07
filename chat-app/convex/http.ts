import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";

const http = httpRouter();

http.route({
  path: "/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    console.log("[Webhook] Headers:", { svix_id, svix_timestamp, svix_signature });
    console.log("[Webhook] WEBHOOK_SECRET exists:", !!process.env.CLERK_WEBHOOK_SECRET);

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occurred -- no svix headers", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error("[Webhook] Missing CLERK_WEBHOOK_SECRET");
      return new Response("Configuration error", { status: 500 });
    }

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", {
        status: 400,
      });
    }

    const eventType = evt.type;
    const { id } = evt.data;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { username, first_name, last_name, image_url, email_addresses } = evt.data;
      
      // For Google users, username might be null, use email or name instead
      const userIdentifier = username || 
        (email_addresses && email_addresses[0]?.email_address?.split('@')[0]) ||
        first_name || 
        last_name || 
        "User";
        
      await ctx.runMutation(api.functions.createUser, {
        clerkId: id as string,
        username: userIdentifier,
        imageUrl: image_url || "",
      });
    }

    if (eventType === "user.deleted") {
      await ctx.runMutation(api.functions.deleteUser, {
        clerkId: id as string,
      });
    }

    return new Response("", { status: 200 });
  }),
});

export default http;
