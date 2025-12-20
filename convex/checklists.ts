import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Default checklist items
const DEFAULT_CHECKLISTS = {
  visa: [
    { id: "v1", text: "Valid passport (6+ months validity)", checked: false },
    { id: "v2", text: "Malaysia visa requirements checked", checked: false },
    { id: "v3", text: "Return flight tickets booked", checked: false },
    { id: "v4", text: "Hotel booking confirmations saved", checked: false },
  ],
  health: [
    { id: "h1", text: "Travel insurance purchased", checked: false },
    { id: "h2", text: "Toddler medications packed", checked: false },
    { id: "h3", text: "Mosquito repellent (20%+ DEET)", checked: false },
    { id: "h4", text: "Sunscreen SPF 50+", checked: false },
    { id: "h5", text: "First aid kit prepared", checked: false },
    { id: "h6", text: "Check vaccination requirements", checked: false },
  ],
  documents: [
    { id: "d1", text: "Passport copies (physical + digital)", checked: false },
    { id: "d2", text: "Emergency contact numbers saved", checked: false },
    { id: "d3", text: "Hotel addresses in local language", checked: false },
    { id: "d4", text: "Credit cards ready + bank notified", checked: false },
    { id: "d5", text: "Travel insurance documents", checked: false },
  ],
  packing: [
    { id: "p1", text: "Baby carrier (for Batu Caves)", checked: false },
    { id: "p2", text: "Stroller for malls", checked: false },
    { id: "p3", text: "Warm clothes for Cameron Highlands", checked: false },
    { id: "p4", text: "Modest clothing for temples", checked: false },
    { id: "p5", text: "Swim gear for KLCC wading pool", checked: false },
    { id: "p6", text: "Rain jacket/umbrella", checked: false },
    { id: "p7", text: "Toddler snacks for travel", checked: false },
  ],
};

// Get all checklists for a session
export const getAll = query({
  args: { sessionId: v.optional(v.string()) },
  handler: async (ctx, _args) => {
    const checklists = await ctx.db.query("checklists").collect();

    // If no checklists exist, return defaults
    if (checklists.length === 0) {
      return Object.entries(DEFAULT_CHECKLISTS).map(([type, items]) => ({
        type,
        items,
        updatedAt: Date.now(),
      }));
    }

    return checklists;
  },
});

// Get a specific checklist by type
export const getByType = query({
  args: { type: v.union(v.literal("visa"), v.literal("health"), v.literal("documents"), v.literal("packing")) },
  handler: async (ctx, args) => {
    const checklist = await ctx.db
      .query("checklists")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!checklist) {
      return {
        type: args.type,
        items: DEFAULT_CHECKLISTS[args.type],
        updatedAt: Date.now(),
      };
    }

    return checklist;
  },
});

// Initialize checklists with defaults
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    for (const [type, items] of Object.entries(DEFAULT_CHECKLISTS)) {
      const existing = await ctx.db
        .query("checklists")
        .withIndex("by_type", (q) => q.eq("type", type as "visa" | "health" | "documents" | "packing"))
        .first();

      if (!existing) {
        await ctx.db.insert("checklists", {
          type: type as "visa" | "health" | "documents" | "packing",
          items,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Toggle a checklist item
export const toggleItem = mutation({
  args: {
    type: v.union(v.literal("visa"), v.literal("health"), v.literal("documents"), v.literal("packing")),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    let checklist = await ctx.db
      .query("checklists")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    // Create checklist if it doesn't exist
    if (!checklist) {
      const checklistId = await ctx.db.insert("checklists", {
        type: args.type,
        items: DEFAULT_CHECKLISTS[args.type],
        updatedAt: Date.now(),
      });
      checklist = await ctx.db.get(checklistId);
    }

    if (!checklist) {return;}

    const updatedItems = checklist.items.map((item) =>
      item.id === args.itemId ? { ...item, checked: !item.checked } : item
    );

    await ctx.db.patch(checklist._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

// Add a custom item to a checklist
export const addItem = mutation({
  args: {
    type: v.union(v.literal("visa"), v.literal("health"), v.literal("documents"), v.literal("packing")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.db
      .query("checklists")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!checklist) {
      await ctx.db.insert("checklists", {
        type: args.type,
        items: [
          ...DEFAULT_CHECKLISTS[args.type],
          { id: `custom-${String(Date.now())}`, text: args.text, checked: false },
        ],
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(checklist._id, {
        items: [
          ...checklist.items,
          { id: `custom-${String(Date.now())}`, text: args.text, checked: false },
        ],
        updatedAt: Date.now(),
      });
    }
  },
});
