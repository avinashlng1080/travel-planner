import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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
    throw new Error("Trip not found");
  }

  // Find user's membership in this trip
  const member = await ctx.db
    .query("tripMembers")
    .withIndex("by_trip_and_user", (q: any) =>
      q.eq("tripId", tripId).eq("userId", userId)
    )
    .unique();

  if (!member) {
    throw new Error("Access denied: You are not a member of this trip");
  }

  const canEdit = member.role === "owner" || member.role === "editor";

  // If a specific role is required, check it
  if (requiredRole) {
    if (requiredRole === "owner" && member.role !== "owner") {
      throw new Error("Access denied: Owner role required");
    }
    if (requiredRole === "editor" && !canEdit) {
      throw new Error("Access denied: Editor or owner role required");
    }
  }

  return { trip, member, canEdit };
}

/**
 * Helper function to log activity
 * Note: Some actions used here (deleted_plan, reordered_plans, set_default_plan)
 * may need to be added to the schema's action union type
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
 * Get all plans for a trip
 * Returns plans sorted by order with createdBy user profile
 */
export const getPlans = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check user has access to trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Get all plans for this trip
    const plans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    // Sort by order
    const sortedPlans = plans.sort((a, b) => a.order - b.order);

    // Fetch user profiles for createdBy
    const plansWithUsers = await Promise.all(
      sortedPlans.map(async (plan) => {
        const user = await ctx.db.get(plan.createdBy);
        return {
          ...plan,
          createdByUser: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
        };
      })
    );

    return plansWithUsers;
  },
});

/**
 * Get single plan with schedule items
 * Returns plan with all schedule items for all dates
 */
export const getPlan = query({
  args: { planId: v.id("tripPlans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Check user access via tripId
    await checkTripAccess(ctx, plan.tripId, userId);

    // Get all schedule items for this plan
    const scheduleItems = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    // Sort by date and order
    const sortedItems = scheduleItems.sort((a, b) => {
      if (a.dayDate !== b.dayDate) {
        return a.dayDate.localeCompare(b.dayDate);
      }
      return a.order - b.order;
    });

    return {
      ...plan,
      scheduleItems: sortedItems,
    };
  },
});

/**
 * Create a new plan
 * Sets order to max(existing orders) + 1
 * Sets isDefault to false
 * Logs activity: "created_plan"
 */
export const createPlan = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      args.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new Error("Access denied: Editor or owner role required");
    }

    // Get existing plans to determine order
    const existingPlans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const maxOrder =
      existingPlans.length > 0
        ? Math.max(...existingPlans.map((p) => p.order))
        : -1;

    // Create new plan
    const planId = await ctx.db.insert("tripPlans", {
      tripId: args.tripId,
      name: args.name,
      color: args.color,
      description: args.description,
      icon: args.icon,
      order: maxOrder + 1,
      isDefault: false,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log activity
    await logActivity(ctx, args.tripId, userId, "created_plan", {
      planId,
      planName: args.name,
    });

    return planId;
  },
});

/**
 * Update plan details
 * Updates provided fields + updatedAt
 * Logs activity: "updated_plan"
 */
export const updatePlan = mutation({
  args: {
    planId: v.id("tripPlans"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      plan.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new Error("Access denied: Editor or owner role required");
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.color !== undefined) updates.color = args.color;
    if (args.description !== undefined) updates.description = args.description;
    if (args.icon !== undefined) updates.icon = args.icon;

    // Update the plan
    await ctx.db.patch(args.planId, updates);

    // Log activity
    await logActivity(ctx, plan.tripId, userId, "updated_plan", {
      planId: args.planId,
      planName: plan.name,
      changes: Object.keys(updates).filter((k) => k !== "updatedAt"),
    });
  },
});

/**
 * Delete a plan
 * Cannot delete if it's the only plan (need at least one)
 * Cannot delete if it's the default plan (must change default first)
 * Deletes all tripScheduleItems for this plan first
 */
export const deletePlan = mutation({
  args: { planId: v.id("tripPlans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      plan.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new Error("Access denied: Editor or owner role required");
    }

    // Check if it's the only plan
    const allPlans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", plan.tripId))
      .collect();

    if (allPlans.length === 1) {
      throw new Error("Cannot delete the only plan. At least one plan is required.");
    }

    // Check if it's the default plan
    if (plan.isDefault) {
      throw new Error(
        "Cannot delete the default plan. Please set another plan as default first."
      );
    }

    // Delete all schedule items for this plan
    const scheduleItems = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    for (const item of scheduleItems) {
      await ctx.db.delete(item._id);
    }

    // Delete the plan
    await ctx.db.delete(args.planId);

    // Log activity
    await logActivity(ctx, plan.tripId, userId, "deleted_plan", {
      planId: args.planId,
      planName: plan.name,
      deletedItemsCount: scheduleItems.length,
    });
  },
});

/**
 * Reorder plans
 * Updates order field for each plan based on array position
 */
export const reorderPlans = mutation({
  args: {
    tripId: v.id("trips"),
    planIds: v.array(v.id("tripPlans")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      args.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new Error("Access denied: Editor or owner role required");
    }

    // Verify all plans belong to this trip
    for (const planId of args.planIds) {
      const plan = await ctx.db.get(planId);
      if (!plan || plan.tripId !== args.tripId) {
        throw new Error("Invalid plan ID or plan does not belong to this trip");
      }
    }

    // Update order for each plan
    for (let i = 0; i < args.planIds.length; i++) {
      await ctx.db.patch(args.planIds[i], {
        order: i,
        updatedAt: Date.now(),
      });
    }

    // Log activity
    await logActivity(ctx, args.tripId, userId, "reordered_plans", {
      planIds: args.planIds,
    });
  },
});

/**
 * Set which plan is the default
 * Sets isDefault=false on all other plans for this trip
 * Sets isDefault=true on this plan
 */
export const setDefaultPlan = mutation({
  args: { planId: v.id("tripPlans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      plan.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new Error("Access denied: Editor or owner role required");
    }

    // Get all plans for this trip
    const allPlans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", plan.tripId))
      .collect();

    // Set isDefault=false on all other plans
    for (const p of allPlans) {
      if (p._id !== args.planId && p.isDefault) {
        await ctx.db.patch(p._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Set isDefault=true on this plan
    await ctx.db.patch(args.planId, {
      isDefault: true,
      updatedAt: Date.now(),
    });

    // Log activity
    await logActivity(ctx, plan.tripId, userId, "set_default_plan", {
      planId: args.planId,
      planName: plan.name,
    });
  },
});
