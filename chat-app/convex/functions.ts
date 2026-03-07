import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        username: args.username,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastSeen: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user with all fields initialized
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      imageUrl: args.imageUrl,
      isOnline: true,
      lastSeen: Date.now(),
      isTyping: false,
      lastTypingUpdate: 0,
    });
    return userId;
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
    console.log("[createOrGetDirectMessage] Creating conversation:", { user1Id: args.user1Id, user2Id: args.user2Id });
    
    // Check if conversation already exists
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
      console.log("[createOrGetDirectMessage] Found existing conversation:", existingConversations._id);
      return existingConversations._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      name: "",
      isGroup: false,
      memberIds: [args.user1Id, args.user2Id],
    });

    console.log("[createOrGetDirectMessage] Created new conversation:", conversationId);

    // Create conversation memberships for both users
    const now = Date.now();
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.user1Id,
      joinedAt: now,
      lastReadAt: now, // Mark as read for the creator
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.user2Id,
      joinedAt: now,
      // Don't set lastReadAt for the other user - they should have unread messages
    });

    console.log("[createOrGetDirectMessage] Created memberships for both users");
    return conversationId;
  },
});

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    console.log("[getUserConversations] Getting conversations for user:", args.userId);
    
    // Get all conversations and filter where user is a member
    const allConversations = await ctx.db.query("conversations").collect();
    const userConversations = allConversations.filter(conversation => 
      conversation.memberIds.includes(args.userId)
    );

    console.log("[getUserConversations] Found conversations:", userConversations.length);
    return userConversations;
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
    console.log("[sendMessage] Sending message:", { conversationId: args.conversationId, content: args.content });
    
    // Verify the sender is part of this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      console.error("[sendMessage] Conversation not found:", args.conversationId);
      throw new Error("Conversation not found");
    }
    
    if (!conversation.memberIds.includes(args.senderId)) {
      console.error("[sendMessage] Sender not in conversation:", args.senderId);
      throw new Error("Sender not in conversation");
    }

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

    // Mark conversation as read for the sender (they just sent a message)
    const senderMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.senderId).eq("conversationId", args.conversationId)
      )
      .first();

    if (senderMembership) {
      await ctx.db.patch(senderMembership._id, { 
        lastReadAt: Date.now() 
      });
      console.log("[sendMessage] Updated sender's lastReadAt");
    } else {
      // Create membership if it doesn't exist
      await ctx.db.insert("conversationMembers", {
        conversationId: args.conversationId,
        userId: args.senderId,
        joinedAt: Date.now(),
        lastReadAt: Date.now(),
      });
      console.log("[sendMessage] Created membership for sender");
    }

    console.log("[sendMessage] Message sent successfully:", messageId);
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

        // Unread count: messages from others after lastReadAt
        const lastReadAt = membership.lastReadAt ?? 0;
        const unreadCount = messages.filter(
          (m) => m.senderId !== args.userId && m.createdAt > lastReadAt
        ).length;

        return {
          ...conversation,
          otherUser,
          lastMessage,
          unreadCount,
        };
      })
    );

    return conversations.filter(Boolean);
  },
});
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return;

    // Find all memberships
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Process each conversation the user was in
    for (const membership of memberships) {
      const conversation = await ctx.db.get(membership.conversationId);
      if (!conversation) continue;

      if (!conversation.isGroup) {
        // For one-on-one conversations, delete the entire conversation and its messages
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();

        for (const msg of messages) {
          await ctx.db.delete(msg._id);
        }

        // Delete all memberships for this conversation
        const allMemberships = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();

        for (const m of allMemberships) {
          await ctx.db.delete(m._id);
        }

        await ctx.db.delete(conversation._id);
      } else {
        // For group conversations, just remove the user from memberIds and delete their membership
        const newMemberIds = conversation.memberIds.filter(id => id !== user._id);
        await ctx.db.patch(conversation._id, { memberIds: newMemberIds });
        await ctx.db.delete(membership._id);
      }
    }

    // Finally delete the user
    await ctx.db.delete(user._id);
  },
});
export const updateUserStatus = mutation({
  args: { clerkId: v.string(), isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    } else {
      console.log("User not found for status update, may need to re-login");
    }
  },
});


export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[markConversationAsRead] Marking conversation as read:", args);
    
    // Get user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      console.log("[markConversationAsRead] User not found for clerkId:", args.clerkId);
      return { ok: false, reason: "user_not_found" };
    }

    // Check if user is part of this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.memberIds.includes(user._id)) {
      console.log("[markConversationAsRead] User not in conversation");
      return { ok: false, reason: "not_in_conversation" };
    }

    // Find or create conversation membership
    let membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId)
      )
      .first();

    const now = Date.now();
    
    if (!membership) {
      // Create membership if it doesn't exist
      const membershipId = await ctx.db.insert("conversationMembers", {
        conversationId: args.conversationId,
        userId: user._id,
        joinedAt: now,
        lastReadAt: now,
      });
      console.log("[markConversationAsRead] Created new membership with lastReadAt:", now, "id:", membershipId);
    } else {
      // Update existing membership
      await ctx.db.patch(membership._id, { lastReadAt: now });
      console.log("[markConversationAsRead] Updated lastReadAt to", now, "for membership", membership._id);
    }

    return { ok: true, lastReadAt: now };
  },
});

export const getUnreadCounts = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    console.log("[getUnreadCounts] Getting unread counts for clerkId:", args.clerkId);
    
    // Get user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      console.log("[getUnreadCounts] User not found for clerkId:", args.clerkId);
      return {};
    }

    // Get all user's conversation memberships
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const unreadCounts: Record<string, number> = {};

    // Calculate unread count for each conversation
    for (const membership of memberships) {
      const conversation = await ctx.db.get(membership.conversationId);
      if (!conversation) continue;

      // Get all messages in this conversation
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", membership.conversationId))
        .collect();

      // Count messages sent after user's last read time
      const unreadCount = messages.filter(msg => 
        msg.senderId !== user._id && // Don't count own messages
        msg.createdAt > (membership.lastReadAt || 0) // Count only messages after last read time
      ).length;

      if (unreadCount > 0) {
        unreadCounts[membership.conversationId] = unreadCount;
      }
    }

    console.log("[getUnreadCounts] Calculated unread counts:", unreadCounts);
    return unreadCounts;
  },
});

export const getUnreadCount = query({
  args: { 
    conversationId: v.id("conversations"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[getUnreadCount] Getting unread count for conversation:", args.conversationId, "clerkId:", args.clerkId);
    
    // Get user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      console.log("[getUnreadCount] User not found for clerkId:", args.clerkId);
      return 0;
    }

    // Get user's membership in this conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId)
      )
      .first();

    if (!membership) {
      console.log("[getUnreadCount] No membership found for user in conversation");
      return 0;
    }

    // Get all messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // Count messages sent after user's last read time
    const unreadCount = messages.filter(msg => 
      msg.senderId !== user._id && 
      msg.createdAt > (membership.lastReadAt || 0) 
    ).length;

    console.log("[getUnreadCount] Unread count:", unreadCount);
    return unreadCount;
  },
});
  export const setTypingStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[setTypingStatus] Setting typing status:", { 
      conversationId: args.conversationId, 
      isTyping: args.isTyping, 
      clerkId: args.clerkId 
    });
    
    // Get user by clerkId instead of using identity
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      console.log("[setTypingStatus] User not found for clerkId:", args.clerkId);
      return null;
    }

    // Check if user is part of this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.memberIds.includes(user._id)) {
      console.log("[setTypingStatus] User not in conversation");
      return null;
    }

    // Update typing status
    await ctx.db.patch(user._id, {
      isTyping: args.isTyping,
      typingConversationId: args.isTyping ? args.conversationId : undefined,
      lastTypingUpdate: Date.now(),
    });

    console.log("[setTypingStatus] Typing status updated successfully");
    return null;
  },
});

export const getTypingIndicators = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    // Get all users in this conversation who are typing
    const typingUsers = await Promise.all(
      conversation.memberIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user || !user.isTyping || user.typingConversationId !== args.conversationId) {
          return null;
        }

        // Check if user is still actively typing (within last 5 seconds)
        const now = Date.now();
        if (user.lastTypingUpdate && (now - user.lastTypingUpdate) > 5000) {
          // User stopped typing more than 5 seconds ago, skip them
       
          return null;
        }

        return {
          userId: user._id,
          username: user.username,
          isTyping: user.isTyping,
          lastSeen: user.lastTypingUpdate || now,
        };
      })
    );

    return typingUsers.filter(Boolean);
  },
});
