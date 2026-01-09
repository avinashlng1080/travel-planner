import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all day plans
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dayPlans").collect();
  },
});

// Get a single day plan by planId
export const getByPlanId = query({
  args: { planId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dayPlans")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();
  },
});

// Get day plan with schedule items
export const getWithSchedule = query({
  args: { planId: v.string() },
  handler: async (ctx, args) => {
    const dayPlan = await ctx.db
      .query("dayPlans")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    if (!dayPlan) {return null;}

    const scheduleItems = await ctx.db
      .query("scheduleItems")
      .withIndex("by_dayPlan", (q) => q.eq("dayPlanId", dayPlan._id))
      .collect();

    const planA = scheduleItems
      .filter((item) => item.planType === "A")
      .sort((a, b) => a.order - b.order);
    const planB = scheduleItems
      .filter((item) => item.planType === "B")
      .sort((a, b) => a.order - b.order);

    return {
      ...dayPlan,
      planA,
      planB,
    };
  },
});

// Get all day plans with their schedule items
export const getAllWithSchedules = query({
  args: {},
  handler: async (ctx) => {
    const dayPlans = await ctx.db.query("dayPlans").collect();
    const allScheduleItems = await ctx.db.query("scheduleItems").collect();

    return dayPlans.map((dayPlan) => {
      const items = allScheduleItems.filter(
        (item) => item.dayPlanId === dayPlan._id
      );
      return {
        ...dayPlan,
        planA: items
          .filter((item) => item.planType === "A")
          .sort((a, b) => a.order - b.order),
        planB: items
          .filter((item) => item.planType === "B")
          .sort((a, b) => a.order - b.order),
      };
    });
  },
});

// Get day plan by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dayPlans")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
  },
});
