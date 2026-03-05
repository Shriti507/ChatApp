import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      imageUrl: args.imageUrl,
      isOnline: true,
      lastSeen: Date.now(),
    });
  },
});

export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getOtherUsers = query({
  args: { currentClerkId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.currentClerkId))
      .first();
    
    if (!currentUser) {
      return await ctx.db.query("users").collect();
    }
    
    return await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), currentUser._id))
      .collect();
  },
});

export const createOrGetConversation = mutation({
  args: {
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if conversation already exists between these two users
    const existingConversations = await ctx.db
      .query("conversations")
      .filter((q) => 
        q.and(
          q.eq(q.field("isGroup"), false),
          q.or(
            q.and(
              q.eq(q.field("memberIds"), [args.user1Id, args.user2Id]),
              q.eq(q.field("memberIds"), [args.user2Id, args.user1Id])
            )
          )
        )
      )
      .first();

    if (existingConversations) {
      return existingConversations._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      name: "",
      isGroup: false,
      memberIds: [args.user1Id, args.user2Id],
    });

    // Add conversation members
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.user1Id,
      joinedAt: Date.now(),
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.user2Id,
      joinedAt: Date.now(),
    });

    return conversationId;
  },
});

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        return conversation;
      })
    );

    return conversations.filter(Boolean);
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});
