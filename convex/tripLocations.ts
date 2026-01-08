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

  if (member?.status !== "accepted") {
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
 * Get all locations for a trip
 * Returns all tripLocations for this trip with optional base location details
 */
export const getLocations = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {throw new ConvexError("Not authenticated");}

    // Check user has access to trip
    await checkTripAccess(ctx, args.tripId, userId);

    // Get all locations for this trip
    const tripLocations = await ctx.db
      .query("tripLocations")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    // Enrich with base location data if locationId exists
    const locationsWithDetails = await Promise.all(
      tripLocations.map(async (tripLoc) => {
        if (!tripLoc.locationId) {
          return {
            ...tripLoc,
            baseLocation: null,
          };
        }

        const baseLocation = await ctx.db.get(tripLoc.locationId);
        return {
          ...tripLoc,
          baseLocation,
        };
      })
    );

    return locationsWithDetails;
  },
});

/**
 * Add a single location to a trip
 * Creates a custom location (not linked to base locations table)
 * Checks editor/owner permission
 * Logs activity: "added_location"
 */
export const addLocation = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {throw new ConvexError("Not authenticated");}

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

    // Create the trip location
    const locationId = await ctx.db.insert("tripLocations", {
      tripId: args.tripId,
      customName: args.name,
      customLat: args.lat,
      customLng: args.lng,
      customCategory: args.category,
      customDescription: args.description,
      notes: args.notes,
      addedBy: userId,
      addedAt: Date.now(),
    });

    // Log activity
    await logActivity(ctx, args.tripId, userId, "added_location", {
      locationId,
      name: args.name,
      category: args.category,
    });

    return locationId;
  },
});

/**
 * Batch add AI-suggested locations to a trip
 * Creates multiple locations with aiSuggested flag
 * Checks editor/owner permission
 * Logs activity: "added_ai_locations"
 */
export const addAISuggestedLocations = mutation({
  args: {
    tripId: v.id("trips"),
    locations: v.array(
      v.object({
        name: v.string(),
        lat: v.number(),
        lng: v.number(),
        category: v.optional(v.string()),
        description: v.optional(v.string()),
        toddlerRating: v.optional(v.number()),
        estimatedDuration: v.optional(v.string()),
        tips: v.optional(v.array(v.string())),
        aiReason: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {throw new ConvexError("Not authenticated");}

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

    // Create all locations
    const locationIds = await Promise.all(
      args.locations.map(async (loc) => {
        // Build notes with AI-provided information
        let notes = "";
        if (loc.aiReason) {
          notes += `AI Suggestion: ${loc.aiReason}\n`;
        }
        if (loc.toddlerRating !== undefined) {
          notes += `Toddler Rating: ${loc.toddlerRating}/5\n`;
        }
        if (loc.estimatedDuration) {
          notes += `Estimated Duration: ${loc.estimatedDuration}\n`;
        }
        if (loc.tips && loc.tips.length > 0) {
          notes += `Tips: ${loc.tips.join(", ")}\n`;
        }

        const locationId = await ctx.db.insert("tripLocations", {
          tripId: args.tripId,
          customName: loc.name,
          customLat: loc.lat,
          customLng: loc.lng,
          customCategory: loc.category,
          customDescription: loc.description,
          notes: notes.trim() || undefined,
          addedBy: userId,
          addedAt: Date.now(),
        });

        return locationId;
      })
    );

    // Log activity
    await logActivity(ctx, args.tripId, userId, "added_ai_locations", {
      locationCount: locationIds.length,
      locationNames: args.locations.map((l) => l.name),
    });

    return locationIds;
  },
});

/**
 * Delete a location from a trip
 * Checks editor/owner permission
 * Also checks if location is used in any schedule items
 * Logs activity: "deleted_location"
 */
export const removeLocation = mutation({
  args: {
    locationId: v.id("tripLocations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {throw new ConvexError("Not authenticated");}

    // Get the location
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new ConvexError("Location not found");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(
      ctx,
      location.tripId,
      userId,
      "editor"
    );

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Check if location is used in any schedule items
    const scheduleItems = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_trip", (q) => q.eq("tripId", location.tripId))
      .collect();

    const isUsed = scheduleItems.some((item) => item.locationId === args.locationId);

    if (isUsed) {
      throw new ConvexError(
        "Cannot delete location: It is being used in one or more schedule items. Please remove it from schedules first."
      );
    }

    // Store location data for activity log before deletion
    const locationData = {
      name: location.customName,
      category: location.customCategory,
    };

    // Delete the location
    await ctx.db.delete(args.locationId);

    // Log activity
    await logActivity(ctx, location.tripId, userId, "deleted_location", {
      locationId: args.locationId,
      ...locationData,
    });

    return { success: true };
  },
});

/**
 * Batch delete multiple locations from a trip (for undo functionality)
 * Checks editor/owner permission
 * Verifies none are used in schedule items
 * Logs activity: "deleted_locations_batch"
 */
export const removeMultipleLocations = mutation({
  args: {
    locationIds: v.array(v.id("tripLocations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {throw new ConvexError("Not authenticated");}

    if (args.locationIds.length === 0) {
      return { success: true };
    }

    // Get all locations and verify they exist
    const locations = await Promise.all(
      args.locationIds.map(async (id) => {
        const loc = await ctx.db.get(id);
        if (!loc) {
          throw new ConvexError(`Location not found: ${id}`);
        }
        return loc;
      })
    );

    // Verify all locations belong to the same trip
    const tripId = locations[0].tripId;
    const allSameTrip = locations.every((loc) => loc.tripId === tripId);
    if (!allSameTrip) {
      throw new ConvexError("All locations must belong to the same trip");
    }

    // Check user is owner or editor
    const { canEdit } = await checkTripAccess(ctx, tripId, userId, "editor");

    if (!canEdit) {
      throw new ConvexError("Access denied: Editor or owner role required");
    }

    // Check if any location is used in schedule items
    const scheduleItems = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();

    const usedLocationIds = new Set(
      scheduleItems.map((item) => item.locationId).filter(Boolean)
    );

    const usedLocations = args.locationIds.filter((id) => usedLocationIds.has(id));

    if (usedLocations.length > 0) {
      throw new ConvexError(
        `Cannot delete ${usedLocations.length} location(s): They are being used in schedule items. Please remove them from schedules first.`
      );
    }

    // Store location data for activity log before deletion
    const locationData = locations.map((loc) => ({
      id: loc._id,
      name: loc.customName,
      category: loc.customCategory,
    }));

    // Delete all locations
    await Promise.all(
      args.locationIds.map(async (id) => {
        await ctx.db.delete(id);
      })
    );

    // Log activity
    await logActivity(ctx, tripId, userId, "deleted_locations_batch", {
      locationCount: args.locationIds.length,
      locations: locationData,
    });

    return { success: true };
  },
});
