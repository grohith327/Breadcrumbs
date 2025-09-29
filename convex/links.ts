import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    tags: v.optional(v.array(v.string())),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const linkId = await ctx.db.insert("links", {
      title: args.title,
      url: args.url,
      tags: args.tags || [],
      userId: args.userId,
      summaryStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Schedule summary generation in the background
    await ctx.scheduler.runAfter(0, internal.links.generateSummary, {
      linkId,
    });

    return linkId;
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

export const getSummary = query({
  args: {
    linkId: v.id("links"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);

    // Only return the summary if it belongs to the user
    if (link && link.userId === args.userId) {
      return {
        summary: link.summary,
        summaryStatus: link.summaryStatus,
        summaryError: link.summaryError,
      };
    }

    return null;
  },
});

// Internal mutation to update summary status
export const updateSummaryStatus = internalMutation({
  args: {
    linkId: v.id("links"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      summaryStatus: args.status,
      updatedAt: Date.now(),
    };

    if (args.summary !== undefined) {
      updateData.summary = args.summary;
    }

    if (args.error !== undefined) {
      updateData.summaryError = args.error;
    }

    await ctx.db.patch(args.linkId, updateData);
  },
});

// Background action to generate summaries
export const generateSummary = internalAction({
  args: {
    linkId: v.id("links"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the link details
      const link = await ctx.runQuery(internal.links.getLinkForSummary, {
        linkId: args.linkId,
      });

      if (!link) {
        throw new Error("Link not found");
      }

      // Call the scraping API
      const scrapeResponse = await fetch(`${process.env.CONVEX_SITE_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: link.url }),
      });

      const scrapeResult = await scrapeResponse.json();

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Failed to scrape page');
      }

      // Call the OpenAI API
      const summaryResponse = await fetch(`${process.env.CONVEX_SITE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: scrapeResult.data.markdown,
          title: scrapeResult.data.title,
          url: scrapeResult.data.url,
        }),
      });

      const summaryResult = await summaryResponse.json();

      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Failed to generate summary');
      }

      // Update the link with the summary
      await ctx.runMutation(internal.links.updateSummaryStatus, {
        linkId: args.linkId,
        status: "completed",
        summary: summaryResult.summary,
      });

    } catch (error) {
      console.error('Failed to generate summary:', error);

      // Update the link with error status
      await ctx.runMutation(internal.links.updateSummaryStatus, {
        linkId: args.linkId,
        status: "failed",
        error: error instanceof Error ? error.message : 'Failed to generate summary',
      });
    }
  },
});

// Internal query to get link for summary generation
export const getLinkForSummary = internalQuery({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.linkId);
  },
});