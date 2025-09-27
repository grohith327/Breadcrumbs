import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  verifications: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_identifier_value", ["identifier", "value"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  links: defineTable({
    title: v.string(),
    url: v.string(),
    tags: v.optional(v.array(v.string())),
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_created_at", ["createdAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId"],
    }),
});