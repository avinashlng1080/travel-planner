import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Auth tables from Convex Auth
  ...authTables,

  // Locations table - 38 Malaysia locations
  locations: defineTable({
    locationId: v.string(),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    category: v.union(
      v.literal("home-base"),
      v.literal("toddler-friendly"),
      v.literal("attraction"),
      v.literal("shopping"),
      v.literal("restaurant"),
      v.literal("nature"),
      v.literal("temple"),
      v.literal("playground"),
      v.literal("medical"),
      v.literal("avoid")
    ),
    description: v.string(),
    city: v.string(),
    address: v.optional(v.string()),
    toddlerRating: v.number(),
    isIndoor: v.boolean(),
    bestTimeToVisit: v.array(v.string()),
    estimatedDuration: v.string(),
    grabEstimate: v.string(),
    distanceFromBase: v.string(),
    drivingTime: v.string(),
    warnings: v.array(v.string()),
    tips: v.array(v.string()),
    dressCode: v.optional(v.string()),
    whatToBring: v.array(v.string()),
    whatNotToBring: v.array(v.string()),
    feedingTimes: v.optional(v.array(v.string())),
    bookingRequired: v.boolean(),
    bookingUrl: v.optional(v.string()),
    entranceFee: v.optional(v.string()),
    openingHours: v.string(),
    planIds: v.array(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_locationId", ["locationId"]),

  // Day Plans table - 18 days
  dayPlans: defineTable({
    planId: v.string(),
    date: v.string(),
    dayOfWeek: v.string(),
    title: v.string(),
    notes: v.array(v.string()),
    weatherConsideration: v.union(
      v.literal("outdoor-heavy"),
      v.literal("indoor-heavy"),
      v.literal("mixed")
    ),
  })
    .index("by_date", ["date"])
    .index("by_planId", ["planId"]),

  // Schedule Items table - Plan A and Plan B items
  scheduleItems: defineTable({
    itemId: v.string(),
    dayPlanId: v.id("dayPlans"),
    locationId: v.string(),
    planType: v.union(v.literal("A"), v.literal("B")),
    startTime: v.string(),
    endTime: v.string(),
    notes: v.optional(v.string()),
    isNapTime: v.optional(v.boolean()),
    isFlexible: v.optional(v.boolean()),
    order: v.number(),
  })
    .index("by_dayPlan", ["dayPlanId"])
    .index("by_dayPlan_planType", ["dayPlanId", "planType"]),

  // Travel Plan Categories - 9 categories
  travelPlanCategories: defineTable({
    categoryId: v.string(),
    name: v.string(),
    color: v.string(),
    description: v.string(),
    isDefault: v.boolean(),
  }).index("by_categoryId", ["categoryId"]),

  // Checklists - per user
  checklists: defineTable({
    userId: v.optional(v.id("users")),
    type: v.union(
      v.literal("visa"),
      v.literal("health"),
      v.literal("documents"),
      v.literal("packing")
    ),
    items: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        checked: v.boolean(),
      })
    ),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_type", ["type"]),

  // Chat Messages - AI chat history
  chatMessages: defineTable({
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"]),

  // POIs (Points of Interest) - OpenStreetMap data for shopping malls, zoos, museums, etc.
  pois: defineTable({
    osmId: v.string(),
    osmType: v.string(),
    category: v.string(),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    tags: v.optional(v.any()),
    bounds: v.optional(
      v.object({
        north: v.number(),
        south: v.number(),
        east: v.number(),
        west: v.number(),
      })
    ),
    lastUpdated: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_osmId", ["osmId"]),

  // User Preferences
  userPreferences: defineTable({
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    selectedPlan: v.union(v.literal("A"), v.literal("B")),
    visibleCategories: v.array(v.string()),
    selectedDayId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_sessionId", ["sessionId"]),

  // User Profiles
  userProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  // Trips - User-owned trips
  trips: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    coverImageUrl: v.optional(v.string()),
    homeBase: v.optional(
      v.object({
        name: v.string(),
        lat: v.number(),
        lng: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    destination: v.optional(v.string()),    // "Tokyo, Japan"
    travelerInfo: v.optional(v.string()),   // "2 adults, 1 toddler (2yo)"
    interests: v.optional(v.string()),      // "nature, food, culture"
    timezone: v.optional(v.string()),       // IANA timezone e.g. "Asia/Kuala_Lumpur"
  }).index("by_owner", ["ownerId"]),

  // Trip Members - Trip membership and permissions
  tripMembers: defineTable({
    tripId: v.id("trips"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("editor"),
      v.literal("commenter"),
      v.literal("viewer")
    ),
    invitedBy: v.id("users"),
    invitedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
  })
    .index("by_trip", ["tripId"])
    .index("by_user", ["userId"])
    .index("by_trip_and_user", ["tripId", "userId"]),

  // Trip Invite Links - Shareable invite links
  tripInviteLinks: defineTable({
    tripId: v.id("trips"),
    token: v.string(),
    role: v.union(
      v.literal("editor"),
      v.literal("commenter"),
      v.literal("viewer")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    useCount: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_trip", ["tripId"]),

  // Trip Plans - Dynamic plans per trip (replaces fixed A/B)
  tripPlans: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.optional(v.string()),
    createdBy: v.id("users"),
    order: v.number(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trip", ["tripId"])
    .index("by_trip_and_order", ["tripId", "order"]),

  // Trip Locations - Trip-specific locations
  tripLocations: defineTable({
    tripId: v.id("trips"),
    locationId: v.optional(v.id("locations")),
    customName: v.optional(v.string()),
    customLat: v.optional(v.number()),
    customLng: v.optional(v.number()),
    customCategory: v.optional(v.string()),
    customDescription: v.optional(v.string()),
    addedBy: v.id("users"),
    addedAt: v.number(),
    notes: v.optional(v.string()),
    aiSuggested: v.optional(v.boolean()),
    aiReason: v.optional(v.string()),
    toddlerRating: v.optional(v.number()),
    estimatedDuration: v.optional(v.string()),
    tips: v.optional(v.array(v.string())),
  }).index("by_trip", ["tripId"]),

  // Trip Schedule Items - Schedule items for trip plans
  tripScheduleItems: defineTable({
    tripId: v.id("trips"),
    planId: v.id("tripPlans"),
    dayDate: v.string(),
    locationId: v.optional(v.id("tripLocations")),
    title: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    notes: v.optional(v.string()),
    isFlexible: v.boolean(),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    order: v.number(),
    aiGenerated: v.optional(v.boolean()),
  })
    .index("by_trip", ["tripId"])
    .index("by_plan", ["planId"])
    .index("by_trip_and_date", ["tripId", "dayDate"])
    .index("by_plan_and_date", ["planId", "dayDate"]),

  // Trip Comments - Comments on trips/plans/activities
  tripComments: defineTable({
    tripId: v.id("trips"),
    planId: v.optional(v.id("tripPlans")),
    scheduleItemId: v.optional(v.id("tripScheduleItems")),
    dayDate: v.optional(v.string()),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isResolved: v.boolean(),
  })
    .index("by_trip", ["tripId"])
    .index("by_plan", ["planId"])
    .index("by_schedule_item", ["scheduleItemId"])
    .index("by_user", ["userId"]),

  // Trip Activity - Activity log for collaboration
  tripActivity: defineTable({
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
      v.literal("resolved_comment"),
      v.literal("added_location"),
      v.literal("added_ai_locations"),
      v.literal("ai_generated_itinerary"),
      v.literal("deleted_locations"),
      v.literal("deleted_schedule_items")
    ),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_trip", ["tripId"])
    .index("by_trip_and_time", ["tripId", "createdAt"]),
});
