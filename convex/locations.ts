import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all locations
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("locations").collect();
  },
});

// Get locations by category
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locations")
      .withIndex("by_category", (q) => q.eq("category", args.category as any))
      .collect();
  },
});

// Get locations by multiple categories
export const getByCategories = query({
  args: { categories: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.categories.length === 0) {
      return [];
    }
    const allLocations = await ctx.db.query("locations").collect();
    return allLocations.filter((loc) =>
      args.categories.includes(loc.category)
    );
  },
});

// Get a single location by locationId
export const getByLocationId = query({
  args: { locationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locations")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .unique();
  },
});

// Get multiple locations by locationIds
export const getByLocationIds = query({
  args: { locationIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const allLocations = await ctx.db.query("locations").collect();
    return allLocations.filter((loc) =>
      args.locationIds.includes(loc.locationId)
    );
  },
});
