import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get the current user's profile
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject as any))
      .first();

    return profile;
  },
});

// Get a profile by userId
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return profile;
  },
});

// Get multiple profiles by userIds
export const getProfiles = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const profiles = await Promise.all(
      args.userIds.map(async (userId) => {
        return await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
      })
    );

    // Filter out null values
    return profiles.filter((profile) => profile !== null);
  },
});

// Create profile for current user
export const createProfile = mutation({
  args: {
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const userId = identity.subject as any;
    const email = identity.email || "";

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      throw new Error("Profile already exists for this user");
    }

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      name: args.name,
      email,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
    });

    return profileId;
  },
});

// Update current user's profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const userId = identity.subject as any;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const updates: any = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl;
    }

    await ctx.db.patch(profile._id, updates);

    return true;
  },
});

// Ensure profile exists - create if doesn't exist (called on login)
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const userId = identity.subject as any;
    const email = identity.email || "";

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      return existingProfile;
    }

    // Create profile with name from email (before @)
    const name = email.split("@")[0] || "User";

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      name,
      email,
      createdAt: Date.now(),
    });

    const newProfile = await ctx.db.get(profileId);
    return newProfile;
  },
});
