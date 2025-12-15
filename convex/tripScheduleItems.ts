import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Helper function to check trip access and permissions
 * Returns trip, member, and whether user can edit
 */
async function checkTripAccess(
  ctx: any,
  tripId: any,
  userId: any,
  requiredRole?: "owner" | "editor"
) {
  const trip = await ctx.db.get(tripId);
  if (!trip) {
    throw new ConvexError("Trip not found");
  }

  // Find user's membership in this trip
  const member = await ctx.db
    .query("tripMembers")
    .withIndex("by_trip_and_user", (q: any) =>
      q.eq("tripId", tripId).eq("userId", userId)
    )
    .unique();

  if (!member || member.status !== "accepted") {
    throw new ConvexError("Access denied: You are not a member of this trip");
  }

  const canEdit = member.role === "owner" || member.role === "editor";

  // If a specific role is required, check it
  if (requiredRole) {
    if (requiredRole === "owner" && member.role !== "owner") {
      throw new ConvexError("Access denied: Owner role required");
    }
    if (requiredRole === "editor" && !canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }
  }

  return { trip, member, canEdit };
}

/**
 * Helper function to log activity
 */
async function logActivity(
  ctx: any,
  tripId: any,
  userId: any,
  action: string,
  metadata?: any
) {
  await ctx.db.insert("tripActivity", {
    tripId,
    userId,
    action: action as any, // Cast to any to allow additional action types
    metadata,
    createdAt: Date.now(),
  });
}

/**
 * Get all schedule items for a plan, optionally filtered by dayDate
 * Returns items sorted by date and order with location details
 */
export const getScheduleItems = query({
  args: {
    planId: v.id("tripPlans"),
    dayDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the plan to access tripId
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new ConvexError("Plan not found");
    }

    // Check user has access to trip
    await checkTripAccess(ctx, plan.tripId, userId);

    // Get schedule items for this plan
    let items;
    if (args.dayDate !== undefined) {
      // Get items for specific date
      items = await ctx.db
        .query("tripScheduleItems")
        .withIndex("by_plan_and_date", (q) =>
          q.eq("planId", args.planId).eq("dayDate", args.dayDate!)
        )
        .collect();
    } else {
      // Get all items for this plan
      items = await ctx.db
        .query("tripScheduleItems")
        .withIndex("by_plan", (q) => q.eq("planId", args.planId))
        .collect();
    }

    // Sort by date, then by order
    const sortedItems = items.sort((a, b) => {
      if (a.dayDate !== b.dayDate) {
        return a.dayDate.localeCompare(b.dayDate);
      }
      return a.order - b.order;
    });

    // Enrich with location data if locationId exists
    const itemsWithLocations = await Promise.all(
      sortedItems.map(async (item) => {
        if (!item.locationId) {
          return { ...item, location: null };
        }

        const tripLocation = await ctx.db.get(item.locationId);
        if (!tripLocation) {
          return { ...item, location: null };
        }

        // Type assertion since we know locationId points to tripLocations table
        const loc = tripLocation as any;
        const location: Record<string, any> = {
          _id: loc._id,
          name: loc.customName,
          lat: loc.customLat,
          lng: loc.customLng,
          category: loc.customCategory,
          description: loc.customDescription,
          notes: loc.notes,
        };

        // If it references a base location, get those details too
        if (loc.locationId) {
          const baseLocation = await ctx.db.get(loc.locationId);
          if (baseLocation) {
            const baseLoc = baseLocation as any;
            location.baseName = baseLoc.name;
            location.baseCategory = baseLoc.category;
          }
        }

        return { ...item, location };
      })
    );

    return itemsWithLocations;
  },
});

/**
 * Get all schedule items for a trip on a specific date (across all plans)
 * Returns items grouped by plan, sorted by plan order and item order
 */
export const getScheduleItemsByDate = query({
  args: {
    tripId: v.id("trips"),
    dayDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Check user has access to trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Get all schedule items for this trip and date
    const items = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_trip_and_date", (q) =>
        q.eq("tripId", args.tripId).eq("dayDate", args.dayDate)
      )
      .collect();

    // Get all plans for this trip to determine order
    const plans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const planMap = new Map(plans.map((p) => [p._id, p]));

    // Sort items by plan order, then by item order
    const sortedItems = items.sort((a, b) => {
      const planA = planMap.get(a.planId);
      const planB = planMap.get(b.planId);

      if (!planA || !planB) return 0;

      if (planA.order !== planB.order) {
        return planA.order - planB.order;
      }
      return a.order - b.order;
    });

    // Enrich with location and plan data
    const enrichedItems = await Promise.all(
      sortedItems.map(async (item) => {
        const plan = planMap.get(item.planId);
        let location = null;

        if (item.locationId) {
          const tripLocation = await ctx.db.get(item.locationId);
          if (tripLocation) {
            // Type assertion since we know locationId points to tripLocations table
            const loc = tripLocation as any;
            const locationData: Record<string, any> = {
              _id: loc._id,
              name: loc.customName,
              lat: loc.customLat,
              lng: loc.customLng,
              category: loc.customCategory,
              description: loc.customDescription,
              notes: loc.notes,
            };

            // If it references a base location, get those details too
            if (loc.locationId) {
              const baseLocation = await ctx.db.get(loc.locationId);
              if (baseLocation) {
                const baseLoc = baseLocation as any;
                locationData.baseName = baseLoc.name;
                locationData.baseCategory = baseLoc.category;
              }
            }
            location = locationData;
          }
        }

        return {
          ...item,
          plan: plan
            ? {
                _id: plan._id,
                name: plan.name,
                color: plan.color,
                icon: plan.icon,
              }
            : null,
          location,
        };
      })
    );

    return enrichedItems;
  },
});

/**
 * Create a new schedule item
 * Checks editor/owner permission
 * Sets order to max(existing orders for this plan/date) + 1
 * Logs activity: "added_activity"
 */
export const createScheduleItem = mutation({
  args: {
    planId: v.id("tripPlans"),
    dayDate: v.string(),
    locationId: v.optional(v.id("tripLocations")),
    title: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    notes: v.optional(v.string()),
    isFlexible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the plan to access tripId
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new ConvexError("Plan not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      plan.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Validate location belongs to this trip if provided
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location || location.tripId !== plan.tripId) {
        throw new ConvexError("Invalid location or location does not belong to this trip");
      }
    }

    // Get existing items for this plan/date to determine order
    const existingItems = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_plan_and_date", (q) =>
        q.eq("planId", args.planId).eq("dayDate", args.dayDate)
      )
      .collect();

    const maxOrder =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.order))
        : -1;

    // Create the schedule item
    const itemId = await ctx.db.insert("tripScheduleItems", {
      tripId: plan.tripId,
      planId: args.planId,
      dayDate: args.dayDate,
      locationId: args.locationId,
      title: args.title,
      startTime: args.startTime,
      endTime: args.endTime,
      notes: args.notes,
      isFlexible: args.isFlexible,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: maxOrder + 1,
    });

    // Log activity
    await logActivity(ctx, plan.tripId, userId, "added_activity", {
      scheduleItemId: itemId,
      planId: args.planId,
      dayDate: args.dayDate,
      title: args.title,
    });

    return itemId;
  },
});

/**
 * Update a schedule item
 * Checks editor/owner permission
 * Updates provided fields + updatedAt and updatedBy
 * Logs activity: "updated_activity"
 */
export const updateScheduleItem = mutation({
  args: {
    itemId: v.id("tripScheduleItems"),
    locationId: v.optional(v.id("tripLocations")),
    title: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    isFlexible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the schedule item
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Schedule item not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      item.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Validate location belongs to this trip if provided
    if (args.locationId !== undefined) {
      if (args.locationId) {
        const location = await ctx.db.get(args.locationId);
        if (!location || location.tripId !== item.tripId) {
          throw new ConvexError("Invalid location or location does not belong to this trip");
        }
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    if (args.locationId !== undefined) updates.locationId = args.locationId;
    if (args.title !== undefined) updates.title = args.title;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.isFlexible !== undefined) updates.isFlexible = args.isFlexible;

    // Update the item
    await ctx.db.patch(args.itemId, updates);

    // Log activity
    await logActivity(ctx, item.tripId, userId, "updated_activity", {
      scheduleItemId: args.itemId,
      planId: item.planId,
      dayDate: item.dayDate,
      changes: Object.keys(updates).filter((k) => k !== "updatedAt" && k !== "updatedBy"),
    });

    return { success: true };
  },
});

/**
 * Delete a schedule item
 * Checks editor/owner permission
 * Also deletes all comments associated with this item
 * Logs activity: "deleted_activity"
 */
export const deleteScheduleItem = mutation({
  args: {
    itemId: v.id("tripScheduleItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the schedule item
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Schedule item not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      item.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Delete all comments for this schedule item
    const comments = await ctx.db
      .query("tripComments")
      .withIndex("by_schedule_item", (q) => q.eq("scheduleItemId", args.itemId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete the item
    await ctx.db.delete(args.itemId);

    // Log activity
    await logActivity(ctx, item.tripId, userId, "deleted_activity", {
      scheduleItemId: args.itemId,
      planId: item.planId,
      dayDate: item.dayDate,
      title: item.title,
      deletedCommentsCount: comments.length,
    });

    return { success: true };
  },
});

/**
 * Reorder schedule items within a plan/day
 * Updates order field for items in the specified plan and date
 * Checks editor/owner permission
 */
export const reorderScheduleItems = mutation({
  args: {
    planId: v.id("tripPlans"),
    dayDate: v.string(),
    itemIds: v.array(v.id("tripScheduleItems")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the plan to access tripId
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new ConvexError("Plan not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      plan.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Verify all items belong to this plan and date
    for (const itemId of args.itemIds) {
      const item = await ctx.db.get(itemId);
      if (
        !item ||
        item.planId !== args.planId ||
        item.dayDate !== args.dayDate
      ) {
        throw new ConvexError(
          "Invalid item ID or item does not belong to this plan/date"
        );
      }
    }

    // Update order for each item
    for (let i = 0; i < args.itemIds.length; i++) {
      await ctx.db.patch(args.itemIds[i], {
        order: i,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }

    // Log activity
    await logActivity(ctx, plan.tripId, userId, "reordered_activities", {
      planId: args.planId,
      dayDate: args.dayDate,
      itemCount: args.itemIds.length,
    });

    return { success: true };
  },
});

/**
 * Move a schedule item from one plan to another
 * Can optionally change the date
 * Checks editor/owner permission
 * Updates planId, dayDate (if provided), and order
 * Also updates associated comments to reflect new plan/date
 * Logs activity: "moved_activity"
 */
export const moveItemBetweenPlans = mutation({
  args: {
    itemId: v.id("tripScheduleItems"),
    targetPlanId: v.id("tripPlans"),
    targetDayDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the schedule item
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Schedule item not found");
    }

    // Get source and target plans
    const sourcePlan = await ctx.db.get(item.planId);
    const targetPlan = await ctx.db.get(args.targetPlanId);

    if (!sourcePlan || !targetPlan) {
      throw new ConvexError("Plan not found");
    }

    // Verify both plans belong to the same trip
    if (sourcePlan.tripId !== targetPlan.tripId) {
      throw new ConvexError("Cannot move items between different trips");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      item.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Determine target date (use provided or keep original)
    const targetDate = args.targetDayDate ?? item.dayDate;

    // Get existing items in target plan/date to determine new order
    const targetItems = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_plan_and_date", (q) =>
        q.eq("planId", args.targetPlanId).eq("dayDate", targetDate)
      )
      .collect();

    const maxOrder =
      targetItems.length > 0
        ? Math.max(...targetItems.map((i) => i.order))
        : -1;

    // Update the item
    await ctx.db.patch(args.itemId, {
      planId: args.targetPlanId,
      dayDate: targetDate,
      order: maxOrder + 1,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    // Update comments for this item to reflect new plan/dayDate
    const comments = await ctx.db
      .query("tripComments")
      .withIndex("by_schedule_item", (q) => q.eq("scheduleItemId", args.itemId))
      .collect();

    for (const comment of comments) {
      await ctx.db.patch(comment._id, {
        planId: args.targetPlanId,
        dayDate: targetDate,
      });
    }

    // Log activity
    await logActivity(ctx, item.tripId, userId, "moved_activity", {
      scheduleItemId: args.itemId,
      sourcePlanId: item.planId,
      targetPlanId: args.targetPlanId,
      sourceDayDate: item.dayDate,
      targetDayDate: targetDate,
      title: item.title,
    });

    return { success: true };
  },
});
