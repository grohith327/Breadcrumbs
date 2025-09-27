import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("links", {
      title: args.title,
      url: args.url,
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("links")
      .withIndex("by_created_at")
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("links"),
    title: v.string(),
    url: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) {
      return await ctx.db
        .query("links")
        .withIndex("by_created_at")
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("links")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query)
      )
      .collect();
  },
});

export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db.query("links").collect();
    const tagSet = new Set<string>();

    links.forEach(link => {
      if (link.tags) {
        link.tags.forEach(tag => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  },
});