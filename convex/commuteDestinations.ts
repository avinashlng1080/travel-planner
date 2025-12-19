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
 * Get all commute destinations for a trip
 * Returns destinations ordered by the order field
 */
export const getDestinations = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Check user has access to trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Get all destinations for this trip, ordered by order field
    const destinations = await ctx.db
      .query("commuteDestinations")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    // Sort by order field
    return destinations.sort((a, b) => a.order - b.order);
  },
});

/**
 * Add a commute destination to a trip
 * Creates a new destination with auto-assigned order
 * Checks editor/owner permission
 * Logs activity: "added_commute_destination"
 */
export const addDestination = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    placeId: v.optional(v.string()),
    address: v.optional(v.string()),
    category: v.optional(v.string()),
    travelMode: v.union(
      v.literal("DRIVING"),
      v.literal("TRANSIT"),
      v.literal("BICYCLING"),
      v.literal("WALKING")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      args.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Validation
    if (!args.name.trim()) {
      throw new ConvexError("Destination name is required");
    }

    if (args.lat < -90 || args.lat > 90) {
      throw new ConvexError("Invalid latitude: must be between -90 and 90");
    }

    if (args.lng < -180 || args.lng > 180) {
      throw new ConvexError("Invalid longitude: must be between -180 and 180");
    }

    // Get current max order for this trip
    const existingDestinations = await ctx.db
      .query("commuteDestinations")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const maxOrder = existingDestinations.reduce(
      (max, dest) => Math.max(max, dest.order),
      -1
    );

    // Create the destination with next order
    const destinationId = await ctx.db.insert("commuteDestinations", {
      tripId: args.tripId,
      name: args.name.trim(),
      lat: args.lat,
      lng: args.lng,
      placeId: args.placeId,
      address: args.address,
      category: args.category,
      travelMode: args.travelMode,
      addedBy: userId,
      addedAt: Date.now(),
      order: maxOrder + 1,
    });

    // Log activity
    await logActivity(ctx, args.tripId, userId, "added_commute_destination", {
      destinationId,
      name: args.name,
      travelMode: args.travelMode,
    });

    return destinationId;
  },
});

/**
 * Update a commute destination
 * Allows partial updates of name, address, lat, lng, category, travelMode
 * Checks editor/owner permission
 * Logs activity: "updated_commute_destination"
 */
export const updateDestination = mutation({
  args: {
    destinationId: v.id("commuteDestinations"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    category: v.optional(v.string()),
    travelMode: v.optional(
      v.union(
        v.literal("DRIVING"),
        v.literal("TRANSIT"),
        v.literal("BICYCLING"),
        v.literal("WALKING")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the destination
    const destination = await ctx.db.get(args.destinationId);
    if (!destination) {
      throw new ConvexError("Destination not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      destination.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Validation
    if (args.name !== undefined && !args.name.trim()) {
      throw new ConvexError("Destination name cannot be empty");
    }

    if (args.lat !== undefined && (args.lat < -90 || args.lat > 90)) {
      throw new ConvexError("Invalid latitude: must be between -90 and 90");
    }

    if (args.lng !== undefined && (args.lng < -180 || args.lng > 180)) {
      throw new ConvexError("Invalid longitude: must be between -180 and 180");
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.address !== undefined) updates.address = args.address;
    if (args.lat !== undefined) updates.lat = args.lat;
    if (args.lng !== undefined) updates.lng = args.lng;
    if (args.category !== undefined) updates.category = args.category;
    if (args.travelMode !== undefined) updates.travelMode = args.travelMode;

    // Update the destination
    await ctx.db.patch(args.destinationId, updates);

    // Log activity
    await logActivity(
      ctx,
      destination.tripId,
      userId,
      "updated_commute_destination",
      {
        destinationId: args.destinationId,
        updates: Object.keys(updates),
      }
    );

    return { success: true };
  },
});

/**
 * Delete a commute destination
 * Removes destination and reorders remaining destinations
 * Checks editor/owner permission
 * Logs activity: "deleted_commute_destination"
 */
export const deleteDestination = mutation({
  args: {
    destinationId: v.id("commuteDestinations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Get the destination
    const destination = await ctx.db.get(args.destinationId);
    if (!destination) {
      throw new ConvexError("Destination not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      destination.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Store destination data for activity log before deletion
    const destinationData = {
      name: destination.name,
      travelMode: destination.travelMode,
      order: destination.order,
    };

    // Delete the destination
    await ctx.db.delete(args.destinationId);

    // Get remaining destinations for this trip
    const remainingDestinations = await ctx.db
      .query("commuteDestinations")
      .withIndex("by_trip", (q) => q.eq("tripId", destination.tripId))
      .collect();

    // Reorder remaining destinations to fill the gap
    const sortedDestinations = remainingDestinations.sort(
      (a, b) => a.order - b.order
    );

    await Promise.all(
      sortedDestinations.map(async (dest, index) => {
        if (dest.order !== index) {
          await ctx.db.patch(dest._id, { order: index });
        }
      })
    );

    // Log activity
    await logActivity(
      ctx,
      destination.tripId,
      userId,
      "deleted_commute_destination",
      {
        destinationId: args.destinationId,
        ...destinationData,
      }
    );

    return { success: true };
  },
});

/**
 * Reorder commute destinations
 * Updates order field for drag-to-reorder functionality
 * Checks editor/owner permission
 * Logs activity: "reordered_commute_destinations"
 */
export const reorderDestinations = mutation({
  args: {
    tripId: v.id("trips"),
    destinationIds: v.array(v.id("commuteDestinations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      args.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Validate all destinations exist and belong to this trip
    const destinations = await Promise.all(
      args.destinationIds.map(async (id) => {
        const dest = await ctx.db.get(id);
        if (!dest) {
          throw new ConvexError(`Destination not found: ${id}`);
        }
        if (dest.tripId !== args.tripId) {
          throw new ConvexError(
            "All destinations must belong to the specified trip"
          );
        }
        return dest;
      })
    );

    // Update order for each destination based on array position
    await Promise.all(
      args.destinationIds.map(async (id, index) => {
        await ctx.db.patch(id, { order: index });
      })
    );

    // Log activity
    await logActivity(
      ctx,
      args.tripId,
      userId,
      "reordered_commute_destinations",
      {
        destinationCount: args.destinationIds.length,
      }
    );

    return { success: true };
  },
});
