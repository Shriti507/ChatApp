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

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    senderId: v.id("users"),
    attachments: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      size: v.number(),
      type: v.string(),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),
      attachments: args.attachments,
    });

    // Update conversation's last message
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: Date.now(),
    });

    return messageId;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    return messages;
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    return conversation;
  },
});

export const getConversationWithDetails = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    // Get members
    const members = await Promise.all(
      conversation.memberIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user;
      })
    );

    // Get last message
    let lastMessage = null;
    if (conversation.lastMessageId) {
      lastMessage = await ctx.db.get(conversation.lastMessageId);
    }

    return {
      ...conversation,
      members: members.filter(Boolean),
      lastMessage,
    };
  },
});

export const getUserConversationsWithDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        if (!conversation) return null;

        // Get other user for one-on-one conversations
        const otherUserId = conversation.memberIds.find(id => id !== args.userId);
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;

        // Get last message
        let lastMessage = null;
        if (conversation.lastMessageId) {
          lastMessage = await ctx.db.get(conversation.lastMessageId);
        }

        // Get all messages to check if conversation has any messages
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();

        // Only return conversations that have at least one message
        if (messages.length === 0) {
          return null;
        }

        return {
          ...conversation,
          otherUser,
          lastMessage,
        };
      })
    );

    return conversations.filter(Boolean);
  },
});
