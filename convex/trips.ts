import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all trips for the current user (owned + shared)
 * Returns trips where user is owner OR is a member with accepted status
 * Sorted by updatedAt desc
 */
export const getMyTrips = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Get all trip memberships for this user
    const memberships = await ctx.db
      .query("tripMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get the trips for these memberships
    const trips = await Promise.all(
      memberships.map(async (membership) => {
        const trip = await ctx.db.get(membership.tripId);
        if (!trip) return null;

        return {
          ...trip,
          userRole: membership.role,
        };
      })
    );

    // Filter out nulls and sort by updatedAt desc
    return trips
      .filter((trip) => trip !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get a single trip by ID
 * Check user has access (owner or accepted member)
 * Return trip with owner profile info
 */
export const getTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user has access
    const membership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (!membership) {
      throw new ConvexError("Access denied");
    }

    // Get owner profile
    const owner = await ctx.db.get(trip.ownerId);

    return {
      ...trip,
      owner: owner
        ? {
            _id: owner._id,
            name: owner.name,
            email: owner.email,
            image: owner.image,
          }
        : null,
    };
  },
});

/**
 * Create a new trip
 * Set current user as owner
 * Auto-create tripMember entry with role "owner" and status "accepted"
 * Auto-create two default plans: "Plan A" (green) and "Plan B" (blue)
 * Log activity: "created_trip"
 */
export const createTrip = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    coverImageUrl: v.optional(v.string()),
    homeBase: v.optional(v.object({
      name: v.string(),
      lat: v.number(),
      lng: v.number(),
      city: v.string(),
    })),
    destination: v.optional(v.string()),
    travelerInfo: v.optional(v.string()),
    interests: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const now = Date.now();

    // Create the trip
    const tripId = await ctx.db.insert("trips", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      coverImageUrl: args.coverImageUrl,
      homeBase: args.homeBase,
      destination: args.destination,
      travelerInfo: args.travelerInfo,
      interests: args.interests,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create trip member entry for owner
    await ctx.db.insert("tripMembers", {
      tripId,
      userId,
      role: "owner",
      status: "accepted",
      invitedBy: userId,
      invitedAt: now,
      acceptedAt: now,
    });

    // Create default Plan A (green)
    await ctx.db.insert("tripPlans", {
      tripId,
      name: "Plan A",
      color: "#10B981",
      isDefault: true,
      order: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create default Plan B (blue)
    await ctx.db.insert("tripPlans", {
      tripId,
      name: "Plan B",
      color: "#3B82F6",
      isDefault: true,
      order: 1,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("tripActivity", {
      tripId,
      userId,
      action: "created_trip",
      metadata: {
        tripName: args.name,
      },
      createdAt: now,
    });

    return tripId;
  },
});

/**
 * Update trip details
 * Check user is owner
 * Update provided fields + updatedAt
 * Log activity: "updated_trip"
 */
export const updateTrip = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    homeBase: v.optional(v.object({
      name: v.string(),
      lat: v.number(),
      lng: v.number(),
      city: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user is owner
    if (trip.ownerId !== userId) {
      throw new ConvexError("Only the owner can update trip details");
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.coverImageUrl !== undefined) updates.coverImageUrl = args.coverImageUrl;
    if (args.homeBase !== undefined) updates.homeBase = args.homeBase;

    // Update the trip
    await ctx.db.patch(args.tripId, updates);

    // Log activity
    await ctx.db.insert("tripActivity", {
      tripId: args.tripId,
      userId,
      action: "updated_trip",
      metadata: {
        updatedFields: Object.keys(updates).filter(k => k !== "updatedAt"),
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Delete a trip and all related data
 * Check user is owner
 * Delete: tripMembers, tripInviteLinks, tripPlans, tripLocations,
 *         tripScheduleItems, tripComments, tripActivity, then the trip itself
 */
export const deleteTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user is owner
    if (trip.ownerId !== userId) {
      throw new ConvexError("Only the owner can delete this trip");
    }

    // Delete tripMembers
    const members = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete tripInviteLinks
    const inviteLinks = await ctx.db
      .query("tripInviteLinks")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const link of inviteLinks) {
      await ctx.db.delete(link._id);
    }

    // Delete tripPlans
    const plans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const plan of plans) {
      await ctx.db.delete(plan._id);
    }

    // Delete tripLocations
    const locations = await ctx.db
      .query("tripLocations")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const location of locations) {
      await ctx.db.delete(location._id);
    }

    // Delete tripScheduleItems
    const scheduleItems = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const item of scheduleItems) {
      await ctx.db.delete(item._id);
    }

    // Delete tripComments
    const comments = await ctx.db
      .query("tripComments")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete tripActivity
    const activities = await ctx.db
      .query("tripActivity")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Finally, delete the trip itself
    await ctx.db.delete(args.tripId);

    return { success: true };
  },
});

/**
 * Get trip with plans and members
 * Return trip + array of plans + array of members with profiles
 * Check user access
 */
export const getTripWithDetails = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user has access
    const membership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (!membership) {
      throw new ConvexError("Access denied");
    }

    // Get plans
    const plans = await ctx.db
      .query("tripPlans")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    // Sort plans by order
    plans.sort((a, b) => a.order - b.order);

    // Get members with profiles
    const members = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const membersWithProfiles = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user: user
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

    return {
      trip,
      plans,
      members: membersWithProfiles,
    };
  },
});
