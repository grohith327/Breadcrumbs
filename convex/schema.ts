import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  links: defineTable({
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .searchIndex("search_title_description", {
      searchField: "title",
      filterFields: ["description"],
    }),
});