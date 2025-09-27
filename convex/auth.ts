import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// User operations
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const now = Date.now();
    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    return await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Verification operations for magic links
export const createVerification = mutation({
  args: {
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("verifications", {
      identifier: args.identifier,
      value: args.value,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const getVerification = query({
  args: {
    identifier: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verifications")
      .withIndex("by_identifier_value", (q) =>
        q.eq("identifier", args.identifier).eq("value", args.value)
      )
      .first();
  },
});

export const deleteVerification = mutation({
  args: {
    identifier: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query("verifications")
      .withIndex("by_identifier_value", (q) =>
        q.eq("identifier", args.identifier).eq("value", args.value)
      )
      .first();

    if (verification) {
      await ctx.db.delete(verification._id);
    }
    return verification;
  },
});

// Session operations
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const getSessionByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;
    return await ctx.db.patch(sessionId, updates);
  },
});

export const deleteSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return session;
  },
});