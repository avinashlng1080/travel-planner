import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get schedule items for a day plan
export const getByDayPlan = query({
  args: { dayPlanId: v.id("dayPlans") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduleItems")
      .withIndex("by_dayPlan", (q) => q.eq("dayPlanId", args.dayPlanId))
      .collect();
  },
});

// Get schedule items for a day plan by plan type (A or B)
export const getByDayPlanAndType = query({
  args: {
    dayPlanId: v.id("dayPlans"),
    planType: v.union(v.literal("A"), v.literal("B")),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("scheduleItems")
      .withIndex("by_dayPlan_planType", (q) =>
        q.eq("dayPlanId", args.dayPlanId).eq("planType", args.planType)
      )
      .collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

// Reorder schedule items
export const reorder = mutation({
  args: {
    dayPlanId: v.id("dayPlans"),
    planType: v.union(v.literal("A"), v.literal("B")),
    itemIds: v.array(v.id("scheduleItems")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.itemIds.length; i++) {
      await ctx.db.patch(args.itemIds[i], { order: i });
    }
  },
});

// Update a schedule item
export const update = mutation({
  args: {
    id: v.id("scheduleItems"),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    isNapTime: v.optional(v.boolean()),
    isFlexible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanUpdates);
  },
});
