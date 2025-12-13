import { query } from "./_generated/server";

// Get all travel plan categories
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("travelPlanCategories").collect();
  },
});
