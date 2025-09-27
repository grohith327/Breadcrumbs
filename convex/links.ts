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
    selectedTags: v.array(v.string()),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Get all links for filtering
    const allLinks = await ctx.db
      .query("links")
      .withIndex("by_user_and_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // If no search criteria, return all links
    if (!args.query.trim() && args.selectedTags.length === 0) {
      return allLinks;
    }

    let results = allLinks;

    // Filter by selected tags (must have ALL selected tags)
    if (args.selectedTags.length > 0) {
      results = results.filter(link =>
        link.tags && args.selectedTags.every(selectedTag =>
          link.tags!.some(linkTag => linkTag.toLowerCase() === selectedTag.toLowerCase())
        )
      );
    }

    // Filter by title search if query exists
    if (args.query.trim()) {
      const queryLower = args.query.toLowerCase();
      results = results.filter(link =>
        link.title.toLowerCase().includes(queryLower)
      );
    }

    return results;
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