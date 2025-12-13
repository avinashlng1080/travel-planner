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
});
