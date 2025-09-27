import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    tags: v.optional(v.array(v.string())),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("links", {
      title: args.title,
      url: args.url,
      tags: args.tags || [],
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getAll = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_user_and_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: {
    id: v.id("links"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.id);
    // Only return the link if it belongs to the user
    if (link && link.userId === args.userId) {
      return link;
    }
    return null;
  },
});

export const update = mutation({
  args: {
    id: v.id("links"),
    title: v.string(),
    url: v.string(),
    tags: v.optional(v.array(v.string())),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;

    // Verify the link belongs to the user
    const existingLink = await ctx.db.get(id);
    if (!existingLink || existingLink.userId !== userId) {
      throw new Error("Link not found or access denied");
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("links"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Verify the link belongs to the user
    const existingLink = await ctx.db.get(args.id);
    if (!existingLink || existingLink.userId !== args.userId) {
      throw new Error("Link not found or access denied");
    }

    return await ctx.db.delete(args.id);
  },
});

export const search = query({
  args: {
    query: v.string(),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) {
      return await ctx.db
        .query("links")
        .withIndex("by_user_and_created", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }

    // Search in titles using the search index
    const titleResults = await ctx.db
      .query("links")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("userId", args.userId)
      )
      .collect();

    // Get all links to search in tags client-side (since Convex doesn't support array search)
    const allLinks = await ctx.db
      .query("links")
      .withIndex("by_user_and_created", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter links that have matching tags
    const queryLower = args.query.toLowerCase();
    const tagResults = allLinks.filter(link =>
      link.tags && link.tags.some(tag =>
        tag.toLowerCase().includes(queryLower)
      )
    );

    // Combine and deduplicate results
    const titleIds = new Set(titleResults.map(link => link._id));
    const combinedResults = [
      ...titleResults,
      ...tagResults.filter(link => !titleIds.has(link._id))
    ];

    // Sort by creation date (newest first)
    return combinedResults.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getAllTags = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("links")
      .withIndex("by_user_and_created", (q) => q.eq("userId", args.userId))
      .collect();

    const tagSet = new Set<string>();

    links.forEach(link => {
      if (link.tags) {
        link.tags.forEach(tag => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  },
});