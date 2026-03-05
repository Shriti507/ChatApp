import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    imageUrl: v.string(),
    isOnline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
  }).index("by_clerk", ["clerkId"]),
  
  conversations: defineTable({
    name: v.string(),
    isGroup: v.boolean(),
    memberIds: v.array(v.id("users")),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageTime: v.optional(v.number()),
  }),
  
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    attachments: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      size: v.number(),
      type: v.string(),
      url: v.string(),
    }))),
  }).index("by_conversation", ["conversationId"]),
  
  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    joinedAt: v.number(),
  }).index("by_conversation", ["conversationId"])
   .index("by_user", ["userId"]),
});
