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

// Move item between Plan A and Plan B
export const moveItemBetweenPlans = mutation({
  args: {
    itemId: v.id("scheduleItems"),
    targetPlanType: v.union(v.literal("A"), v.literal("B")),
    targetIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const { itemId, targetPlanType, targetIndex } = args;

    // Get the item being moved
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");

    const sourcePlanType = item.planType;
    const dayPlanId = item.dayPlanId;

    // If moving within the same plan, just reorder
    if (sourcePlanType === targetPlanType) {
      const items = await ctx.db
        .query("scheduleItems")
        .withIndex("by_dayPlan_planType", (q) =>
          q.eq("dayPlanId", dayPlanId).eq("planType", targetPlanType)
        )
        .collect();

      const sorted = items.sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((i) => i._id === itemId);

      if (oldIndex === targetIndex) return { success: true };

      // Remove item and reinsert at new position
      const reordered = [...sorted];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      // Update all orders
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) {
          await ctx.db.patch(reordered[i]._id, { order: i });
        }
      }

      return { success: true };
    }

    // Moving between different plans
    // 1. Get source plan items and reorder (fill gap)
    const sourceItems = await ctx.db
      .query("scheduleItems")
      .withIndex("by_dayPlan_planType", (q) =>
        q.eq("dayPlanId", dayPlanId).eq("planType", sourcePlanType)
      )
      .collect();

    const filteredSource = sourceItems
      .filter((i) => i._id !== itemId)
      .sort((a, b) => a.order - b.order);

    for (let i = 0; i < filteredSource.length; i++) {
      if (filteredSource[i].order !== i) {
        await ctx.db.patch(filteredSource[i]._id, { order: i });
      }
    }

    // 2. Get target plan items and make room at targetIndex
    const targetItems = await ctx.db
      .query("scheduleItems")
      .withIndex("by_dayPlan_planType", (q) =>
        q.eq("dayPlanId", dayPlanId).eq("planType", targetPlanType)
      )
      .collect();

    const sortedTarget = targetItems.sort((a, b) => a.order - b.order);

    // Shift items at and after targetIndex
    for (let i = sortedTarget.length - 1; i >= targetIndex; i--) {
      await ctx.db.patch(sortedTarget[i]._id, { order: i + 1 });
    }

    // 3. Update the moved item with new planType and order
    await ctx.db.patch(itemId, {
      planType: targetPlanType,
      order: targetIndex,
    });

    return { success: true };
  },
});
