import { query, mutation } from "./_generated/server";
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

  if (membership?.status !== "accepted") {
    throw new Error("You don't have access to this trip");
  }

  return membership;
}

/**
 * Helper function to check if user has at least commenter role
 */
function hasCommenterRole(role: string) {
  return ["owner", "editor", "commenter"].includes(role);
}

/**
 * Helper function to check if user has at least editor role
 */
function hasEditorRole(role: string) {
  return ["owner", "editor"].includes(role);
}

/**
 * Get all comments for a trip
 * Args: { tripId, includeResolved? }
 * Default: exclude resolved comments
 * Returns comments sorted by createdAt desc with user profiles
 */
export const getCommentsByTrip = query({
  args: {
    tripId: v.id("trips"),
    includeResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Get comments for this trip
    const commentsQuery = ctx.db
      .query("tripComments")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId));

    // Filter by resolved status if not including resolved
    const comments = await commentsQuery.collect();
    const filteredComments = args.includeResolved
      ? comments
      : comments.filter((c) => !c.isResolved);

    // Enrich with user profiles
    const commentsWithProfiles = await Promise.all(
      filteredComments.map(async (comment) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", comment.userId))
          .first();

        return {
          ...comment,
          author: profile
            ? {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              }
            : null,
        };
      })
    );

    // Sort by createdAt desc (newest first)
    return commentsWithProfiles.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get comments for a specific plan
 * Args: { planId, includeResolved? }
 * Returns comments with user profiles
 */
export const getCommentsByPlan = query({
  args: {
    planId: v.id("tripPlans"),
    includeResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the plan to access tripId
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, plan.tripId, userId);

    // Get comments for this plan
    const comments = await ctx.db
      .query("tripComments")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    // Filter by resolved status if not including resolved
    const filteredComments = args.includeResolved
      ? comments
      : comments.filter((c) => !c.isResolved);

    // Enrich with user profiles
    const commentsWithProfiles = await Promise.all(
      filteredComments.map(async (comment) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", comment.userId))
          .first();

        return {
          ...comment,
          author: profile
            ? {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              }
            : null,
        };
      })
    );

    // Sort by createdAt desc (newest first)
    return commentsWithProfiles.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get comments for a specific activity/schedule item
 * Args: { scheduleItemId }
 * Returns all comments (including resolved) with user profiles
 * Sorted by createdAt asc (oldest first for thread view)
 */
export const getCommentsByScheduleItem = query({
  args: {
    scheduleItemId: v.id("tripScheduleItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the schedule item to access tripId
    const scheduleItem = await ctx.db.get(args.scheduleItemId);
    if (!scheduleItem) {
      throw new Error("Schedule item not found");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, scheduleItem.tripId, userId);

    // Get all comments for this schedule item (including resolved)
    const comments = await ctx.db
      .query("tripComments")
      .withIndex("by_schedule_item", (q) =>
        q.eq("scheduleItemId", args.scheduleItemId)
      )
      .collect();

    // Enrich with user profiles
    const commentsWithProfiles = await Promise.all(
      comments.map(async (comment) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", comment.userId))
          .first();

        return {
          ...comment,
          author: profile
            ? {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              }
            : null,
        };
      })
    );

    // Sort by createdAt asc (oldest first for thread view)
    return commentsWithProfiles.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Get comment counts per schedule item
 * Args: { tripId, dayDate? }
 * Returns map of scheduleItemId -> unresolved comment count
 * Used for showing badges on activities
 */
export const getCommentCounts = query({
  args: {
    tripId: v.id("trips"),
    dayDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Get all unresolved comments for this trip
    const comments = await ctx.db
      .query("tripComments")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("isResolved"), false))
      .collect();

    // Filter by dayDate if provided and scheduleItemId exists
    const filteredComments = args.dayDate
      ? comments.filter(
          (c) => c.scheduleItemId && c.dayDate === args.dayDate
        )
      : comments.filter((c) => c.scheduleItemId);

    // Count comments per schedule item
    const counts: Record<string, number> = {};
    for (const comment of filteredComments) {
      if (comment.scheduleItemId) {
        const id = comment.scheduleItemId;
        counts[id] = (counts[id] || 0) + 1;
      }
    }

    return counts;
  },
});

/**
 * Add a comment
 * Args: { tripId, content, planId?, scheduleItemId?, dayDate? }
 * Check user has at least commenter role
 * Log activity: "added_comment"
 * Returns new comment ID
 */
export const addComment = mutation({
  args: {
    tripId: v.id("trips"),
    content: v.string(),
    planId: v.optional(v.id("tripPlans")),
    scheduleItemId: v.optional(v.id("tripScheduleItems")),
    dayDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access and at least commenter role
    const membership = await checkTripAccess(
      ctx,
      args.tripId,
      userId
    );

    if (!hasCommenterRole(membership.role)) {
      throw new Error(
        "You need at least commenter role to add comments"
      );
    }

    // Create the comment
    const commentId = await ctx.db.insert("tripComments", {
      tripId: args.tripId,
      planId: args.planId,
      scheduleItemId: args.scheduleItemId,
      dayDate: args.dayDate,
      userId: userId,
      content: args.content,
      createdAt: Date.now(),
      isResolved: false,
    });

    // Log activity
    await ctx.db.insert("tripActivity", {
      tripId: args.tripId,
      userId: userId,
      action: "added_comment",
      targetId: commentId,
      targetType: "comment",
      metadata: {
        planId: args.planId,
        scheduleItemId: args.scheduleItemId,
        dayDate: args.dayDate,
      },
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/**
 * Update a comment
 * Args: { commentId, content }
 * Check user is the comment author
 * Updates content and updatedAt
 * Returns success
 */
export const updateComment = mutation({
  args: {
    commentId: v.id("tripComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check user is the comment author
    if (comment.userId !== userId) {
      throw new Error("You can only edit your own comments");
    }

    // Update the comment
    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a comment
 * Args: { commentId }
 * Check user is comment author OR trip owner
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("tripComments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check user has access to the trip
    const membership = await checkTripAccess(
      ctx,
      comment.tripId,
      userId
    );

    // Check user is comment author OR trip owner
    const isAuthor = comment.userId === userId;
    const isOwner = membership.role === "owner";

    if (!isAuthor && !isOwner) {
      throw new Error(
        "You can only delete your own comments or be a trip owner"
      );
    }

    // Delete the comment
    await ctx.db.delete(args.commentId);

    return { success: true };
  },
});

/**
 * Mark comment as resolved
 * Args: { commentId }
 * Check user is owner or editor
 * Log activity: "resolved_comment"
 */
export const resolveComment = mutation({
  args: {
    commentId: v.id("tripComments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check user has access and at least editor role
    const membership = await checkTripAccess(
      ctx,
      comment.tripId,
      userId
    );

    if (!hasEditorRole(membership.role)) {
      throw new Error("You need at least editor role to resolve comments");
    }

    // Mark as resolved
    await ctx.db.patch(args.commentId, {
      isResolved: true,
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("tripActivity", {
      tripId: comment.tripId,
      userId: userId,
      action: "resolved_comment",
      targetId: args.commentId,
      targetType: "comment",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Re-open a resolved comment
 * Args: { commentId }
 * Check user is owner or editor
 */
export const unresolveComment = mutation({
  args: {
    commentId: v.id("tripComments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check user has access and at least editor role
    const membership = await checkTripAccess(
      ctx,
      comment.tripId,
      userId
    );

    if (!hasEditorRole(membership.role)) {
      throw new Error("You need at least editor role to unresolve comments");
    }

    // Mark as unresolved
    await ctx.db.patch(args.commentId, {
      isResolved: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
