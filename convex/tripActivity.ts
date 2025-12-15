import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Helper function to check trip access
 * Returns the user's membership if they have access
 */
async function checkTripAccess(ctx: any, tripId: any, userId: any) {
  const membership = await ctx.db
    .query("tripMembers")
    .withIndex("by_trip_and_user", (q: any) =>
      q.eq("tripId", tripId).eq("userId", userId)
    )
    .first();

  if (!membership || membership.status !== "accepted") {
    throw new Error("You don't have access to this trip");
  }

  return membership;
}

/**
 * Helper function to get readable action description
 */
function getActionDescription(
  action: string,
  metadata?: any,
  userName?: string
): string {
  const name = userName || "Someone";

  switch (action) {
    case "created_trip":
      return `${name} created the trip`;
    case "updated_trip":
      return `${name} updated trip details`;
    case "invited_member":
      return metadata?.invitedEmail
        ? `${name} invited ${metadata.invitedEmail} to the trip`
        : `${name} invited a member to the trip`;
    case "joined_trip":
      return `${name} joined the trip`;
    case "created_plan":
      return metadata?.planName
        ? `${name} created plan "${metadata.planName}"`
        : `${name} created a plan`;
    case "updated_plan":
      return metadata?.planName
        ? `${name} updated plan "${metadata.planName}"`
        : `${name} updated a plan`;
    case "added_activity":
      return metadata?.activityTitle
        ? `${name} added activity "${metadata.activityTitle}"`
        : `${name} added an activity`;
    case "updated_activity":
      return metadata?.activityTitle
        ? `${name} updated activity "${metadata.activityTitle}"`
        : `${name} updated an activity`;
    case "deleted_activity":
      return metadata?.activityTitle
        ? `${name} deleted activity "${metadata.activityTitle}"`
        : `${name} deleted an activity`;
    case "added_comment":
      return `${name} added a comment`;
    case "resolved_comment":
      return `${name} resolved a comment`;
    default:
      return `${name} performed an action`;
  }
}

/**
 * Get recent activity for a trip with pagination
 * Args: { tripId, limit?, cursor? }
 * Returns activities sorted by createdAt desc
 * Include user profile info for each activity
 * Support pagination with cursor
 */
export const getActivityFeed = query({
  args: {
    tripId: v.id("trips"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Default limit
    const limit = args.limit || 50;
    const cursor = args.cursor || 0;

    // Get activities for this trip
    const allActivities = await ctx.db
      .query("tripActivity")
      .withIndex("by_trip_and_time", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .collect();

    // Apply pagination
    const paginatedActivities = allActivities.slice(cursor, cursor + limit);

    // Enrich with user profiles
    const activitiesWithProfiles = await Promise.all(
      paginatedActivities.map(async (activity) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", activity.userId))
          .first();

        const userName = profile?.name || "Unknown User";
        const description = getActionDescription(
          activity.action,
          activity.metadata,
          userName
        );

        return {
          ...activity,
          user: profile
            ? {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              }
            : null,
          description,
        };
      })
    );

    // Calculate if there are more items
    const hasMore = cursor + limit < allActivities.length;
    const nextCursor = hasMore ? cursor + limit : null;

    return {
      activities: activitiesWithProfiles,
      hasMore,
      nextCursor,
      total: allActivities.length,
    };
  },
});

/**
 * Get last N activities for a trip (simpler version)
 * Args: { tripId, limit? }
 * Default limit: 20
 * Returns activities sorted by createdAt desc with user profiles
 */
export const getRecentActivity = query({
  args: {
    tripId: v.id("trips"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Default limit
    const limit = args.limit || 20;

    // Get recent activities for this trip
    const activities = await ctx.db
      .query("tripActivity")
      .withIndex("by_trip_and_time", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .take(limit);

    // Enrich with user profiles
    const activitiesWithProfiles = await Promise.all(
      activities.map(async (activity) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", activity.userId))
          .first();

        const userName = profile?.name || "Unknown User";
        const description = getActionDescription(
          activity.action,
          activity.metadata,
          userName
        );

        return {
          ...activity,
          user: profile
            ? {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              }
            : null,
          description,
        };
      })
    );

    return activitiesWithProfiles;
  },
});

/**
 * Get activity count for a trip
 * Args: { tripId }
 * Returns total number of activities
 */
export const getActivityCount = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Count activities for this trip
    const activities = await ctx.db
      .query("tripActivity")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return activities.length;
  },
});

/**
 * Get activities by action type
 * Args: { tripId, action, limit? }
 * Returns activities of specific type with user profiles
 */
export const getActivitiesByAction = query({
  args: {
    tripId: v.id("trips"),
    action: v.union(
      v.literal("created_trip"),
      v.literal("updated_trip"),
      v.literal("invited_member"),
      v.literal("joined_trip"),
      v.literal("created_plan"),
      v.literal("updated_plan"),
      v.literal("added_activity"),
      v.literal("updated_activity"),
      v.literal("deleted_activity"),
      v.literal("added_comment"),
      v.literal("resolved_comment")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Default limit
    const limit = args.limit || 50;

    // Get all activities for this trip
    const allActivities = await ctx.db
      .query("tripActivity")
      .withIndex("by_trip_and_time", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .collect();

    // Filter by action type and apply limit
    const filteredActivities = allActivities
      .filter((a) => a.action === args.action)
      .slice(0, limit);

    // Enrich with user profiles
    const activitiesWithProfiles = await Promise.all(
      filteredActivities.map(async (activity) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", activity.userId))
          .first();

        const userName = profile?.name || "Unknown User";
        const description = getActionDescription(
          activity.action,
          activity.metadata,
          userName
        );

        return {
          ...activity,
          user: profile
            ? {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              }
            : null,
          description,
        };
      })
    );

    return activitiesWithProfiles;
  },
});

/**
 * Internal mutation to log an activity
 * This is called by other mutations, not directly by frontend
 */
export const logActivity = internalMutation({
  args: {
    tripId: v.id("trips"),
    userId: v.id("users"),
    action: v.union(
      v.literal("created_trip"),
      v.literal("updated_trip"),
      v.literal("invited_member"),
      v.literal("joined_trip"),
      v.literal("created_plan"),
      v.literal("updated_plan"),
      v.literal("added_activity"),
      v.literal("updated_activity"),
      v.literal("deleted_activity"),
      v.literal("added_comment"),
      v.literal("resolved_comment")
    ),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tripActivity", {
      tripId: args.tripId,
      userId: args.userId,
      action: args.action,
      targetId: args.targetId,
      targetType: args.targetType,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});


/**
 * Clean up old activity logs
 * Args: { tripId, olderThanDays? }
 * Only trip owner can clear activity logs
 * Default: 90 days
 */
export const clearOldActivity = mutation({
  args: {
    tripId: v.id("trips"),
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access and is owner
    const membership = await checkTripAccess(
      ctx,
      args.tripId,
      userId
    );

    if (membership.role !== "owner") {
      throw new Error("Only trip owner can clear activity logs");
    }

    // Calculate cutoff date (default: 90 days ago)
    const days = args.olderThanDays ?? 90;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get old activities
    const oldActivities = await ctx.db
      .query("tripActivity")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const activitiesToDelete = oldActivities.filter(
      (activity) => activity.createdAt < cutoffDate
    );

    // Delete old activities
    await Promise.all(
      activitiesToDelete.map((activity) => ctx.db.delete(activity._id))
    );

    return {
      deletedCount: activitiesToDelete.length,
      cutoffDate,
    };
  },
});
