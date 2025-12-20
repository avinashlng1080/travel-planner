import { mutation } from "./_generated/server";
import { LOCATIONS, DAILY_PLANS, TRAVEL_PLANS } from "../src/data/tripData";

// Seed the database with all trip data
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingLocations = await ctx.db.query("locations").first();
    if (existingLocations) {
      console.log("Database already seeded, skipping...");
      return { message: "Already seeded" };
    }

    console.log("Seeding database...");

    // 1. Seed all locations
    console.log(`Seeding ${LOCATIONS.length} locations...`);
    for (const location of LOCATIONS) {
      await ctx.db.insert("locations", {
        locationId: location.id,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        category: location.category,
        description: location.description,
        city: location.city,
        address: location.address,
        toddlerRating: location.toddlerRating,
        isIndoor: location.isIndoor,
        bestTimeToVisit: location.bestTimeToVisit,
        estimatedDuration: location.estimatedDuration,
        grabEstimate: location.grabEstimate,
        distanceFromBase: location.distanceFromBase,
        drivingTime: location.drivingTime,
        warnings: location.warnings,
        tips: location.tips,
        dressCode: location.dressCode,
        whatToBring: location.whatToBring,
        whatNotToBring: location.whatNotToBring,
        feedingTimes: location.feedingTimes,
        bookingRequired: location.bookingRequired,
        bookingUrl: location.bookingUrl,
        entranceFee: location.entranceFee,
        openingHours: location.openingHours,
        planIds: location.planIds,
      });
    }

    // 2. Seed travel plan categories
    console.log(`Seeding ${TRAVEL_PLANS.length} travel plan categories...`);
    for (const plan of TRAVEL_PLANS) {
      await ctx.db.insert("travelPlanCategories", {
        categoryId: plan.id,
        name: plan.name,
        color: plan.color,
        description: plan.description,
        isDefault: plan.isDefault,
      });
    }

    // 3. Seed day plans and schedule items
    console.log(`Seeding ${DAILY_PLANS.length} day plans...`);
    for (const day of DAILY_PLANS) {
      const dayPlanId = await ctx.db.insert("dayPlans", {
        planId: day.id,
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        title: day.title,
        notes: day.notes,
        weatherConsideration: day.weatherConsideration,
      });

      // Insert Plan A items
      for (let i = 0; i < day.planA.length; i++) {
        const item = day.planA[i];
        await ctx.db.insert("scheduleItems", {
          itemId: item.id,
          dayPlanId,
          locationId: item.locationId,
          planType: "A",
          startTime: item.startTime,
          endTime: item.endTime,
          notes: item.notes,
          isNapTime: item.isNapTime,
          isFlexible: item.isFlexible,
          order: i,
        });
      }

      // Insert Plan B items
      for (let i = 0; i < day.planB.length; i++) {
        const item = day.planB[i];
        await ctx.db.insert("scheduleItems", {
          itemId: item.id,
          dayPlanId,
          locationId: item.locationId,
          planType: "B",
          startTime: item.startTime,
          endTime: item.endTime,
          notes: item.notes,
          isNapTime: item.isNapTime,
          isFlexible: item.isFlexible,
          order: i,
        });
      }
    }

    console.log("Database seeded successfully!");
    return {
      message: "Success",
      locations: LOCATIONS.length,
      dayPlans: DAILY_PLANS.length,
      travelPlans: TRAVEL_PLANS.length,
    };
  },
});

// Clear the database (for development)
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    const dayPlans = await ctx.db.query("dayPlans").collect();
    const scheduleItems = await ctx.db.query("scheduleItems").collect();
    const categories = await ctx.db.query("travelPlanCategories").collect();

    for (const item of scheduleItems) {await ctx.db.delete(item._id);}
    for (const plan of dayPlans) {await ctx.db.delete(plan._id);}
    for (const loc of locations) {await ctx.db.delete(loc._id);}
    for (const cat of categories) {await ctx.db.delete(cat._id);}

    return { message: "Database cleared" };
  },
});

// Clear auth data (for fixing corrupted accounts)
export const clearAuthData = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const accounts = await ctx.db.query("authAccounts").collect();
    const sessions = await ctx.db.query("authSessions").collect();
    const tokens = await ctx.db.query("authRefreshTokens").collect();

    for (const token of tokens) {await ctx.db.delete(token._id);}
    for (const session of sessions) {await ctx.db.delete(session._id);}
    for (const account of accounts) {await ctx.db.delete(account._id);}
    for (const user of users) {await ctx.db.delete(user._id);}

    return {
      message: "Auth data cleared",
      deleted: { users: users.length, accounts: accounts.length, sessions: sessions.length, tokens: tokens.length }
    };
  },
});
