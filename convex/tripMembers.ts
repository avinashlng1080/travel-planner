import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all members of a trip
 */
export const getMembers = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this trip
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    if (!userMembership || userMembership.status !== "accepted") {
      throw new Error("You don't have access to this trip");
    }

    // Get all accepted members
    const members = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Enrich with user profiles
    const membersWithProfiles = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .first();

        return {
          _id: member._id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.acceptedAt || member._creationTime,
          profile: profile
            ? {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              }
            : null,
        };
      })
    );

    // Sort by role (owner first) then name
    const roleOrder = { owner: 0, editor: 1, commenter: 2, viewer: 3 };
    membersWithProfiles.sort((a, b) => {
      const roleCompare = roleOrder[a.role] - roleOrder[b.role];
      if (roleCompare !== 0) return roleCompare;

      const nameA = a.profile?.name || "";
      const nameB = b.profile?.name || "";
      return nameA.localeCompare(nameB);
    });

    return membersWithProfiles;
  },
});

/**
 * Invite a user by email
 */
export const inviteMember = mutation({
  args: {
    tripId: v.id("trips"),
    email: v.string(),
    role: v.union(v.literal("editor"), v.literal("commenter"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check current user is owner
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", currentUserId)
      )
      .first();

    if (!userMembership || userMembership.role !== "owner") {
      throw new Error("Only trip owners can invite members");
    }

    // Find user by email in userProfiles
    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let targetUserId: any;

    if (targetProfile) {
      targetUserId = targetProfile.userId;

      // Check if user is already a member
      const existingMember = await ctx.db
        .query("tripMembers")
        .withIndex("by_trip_and_user", (q) =>
          q.eq("tripId", args.tripId).eq("userId", targetUserId)
        )
        .first();

      if (existingMember) {
        throw new Error("User is already a member of this trip");
      }
    } else {
      // Create a placeholder userId for the email (they'll see invite when they sign up)
      targetUserId = `pending:${args.email}` as any;
    }

    const now = Date.now();
    // Create tripMember with status "pending"
    await ctx.db.insert("tripMembers", {
      tripId: args.tripId,
      userId: targetUserId,
      role: args.role,
      status: "pending",
      invitedBy: currentUserId,
      invitedAt: now,
    });

    // Log activity
    await ctx.db.insert("tripActivity", {
      tripId: args.tripId,
      userId: currentUserId,
      action: "invited_member",
      metadata: {
        email: args.email,
        role: args.role,
      },
      createdAt: now,
    });

    return {
      success: true,
      pending: !targetProfile,
    };
  },
});

/**
 * Generate shareable invite link
 */
export const createInviteLink = mutation({
  args: {
    tripId: v.id("trips"),
    role: v.union(v.literal("editor"), v.literal("commenter"), v.literal("viewer")),
    expiresInDays: v.optional(v.number()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check current user is owner
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    if (!userMembership || userMembership.role !== "owner") {
      throw new Error("Only trip owners can create invite links");
    }

    // Generate random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const now = Date.now();
    // Calculate expiration date
    let expiresAt: number | undefined;
    if (args.expiresInDays) {
      expiresAt = now + args.expiresInDays * 24 * 60 * 60 * 1000;
    }

    // Create tripInviteLinks entry
    await ctx.db.insert("tripInviteLinks", {
      tripId: args.tripId,
      token,
      role: args.role,
      createdBy: userId,
      createdAt: now,
      expiresAt,
      maxUses: args.maxUses,
      useCount: 0,
    });

    return { token };
  },
});

/**
 * Join trip using invite link
 */
export const joinViaLink = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find invite link by token
    const inviteLink = await ctx.db
      .query("tripInviteLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!inviteLink) {
      throw new Error("Invalid invite link");
    }

    // Check not expired
    if (inviteLink.expiresAt && inviteLink.expiresAt < Date.now()) {
      throw new Error("This invite link has expired");
    }

    // Check not at max uses
    if (inviteLink.maxUses && inviteLink.useCount >= inviteLink.maxUses) {
      throw new Error("This invite link has reached its maximum number of uses");
    }

    // Check user not already a member
    const existingMember = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", inviteLink.tripId).eq("userId", userId)
      )
      .first();

    if (existingMember) {
      throw new Error("You are already a member of this trip");
    }

    const now = Date.now();
    // Create tripMember with status "accepted"
    await ctx.db.insert("tripMembers", {
      tripId: inviteLink.tripId,
      userId: userId,
      role: inviteLink.role,
      status: "accepted",
      invitedBy: inviteLink.createdBy,
      invitedAt: inviteLink.createdAt,
      acceptedAt: now,
    });

    // Increment useCount
    await ctx.db.patch(inviteLink._id, {
      useCount: inviteLink.useCount + 1,
    });

    // Log activity
    await ctx.db.insert("tripActivity", {
      tripId: inviteLink.tripId,
      userId: userId,
      action: "joined_trip",
      metadata: {
        method: "invite_link",
      },
      createdAt: now,
    });

    return { tripId: inviteLink.tripId };
  },
});

/**
 * Accept a pending invitation
 */
export const acceptInvite = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find pending member entry for current user
    const memberEntry = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    if (!memberEntry) {
      throw new Error("No invitation found");
    }

    if (memberEntry.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    const now = Date.now();
    // Update status to "accepted", set acceptedAt
    await ctx.db.patch(memberEntry._id, {
      status: "accepted",
      acceptedAt: now,
    });

    // Log activity
    await ctx.db.insert("tripActivity", {
      tripId: args.tripId,
      userId: userId,
      action: "joined_trip",
      metadata: {
        method: "email_invite",
      },
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Decline invitation
 */
export const declineInvite = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find pending member entry
    const memberEntry = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    if (!memberEntry) {
      throw new Error("No invitation found");
    }

    if (memberEntry.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    // Update status to "declined"
    await ctx.db.patch(memberEntry._id, {
      status: "declined",
    });

    return { success: true };
  },
});

/**
 * Change a member's role
 */
export const updateMemberRole = mutation({
  args: {
    tripId: v.id("trips"),
    userId: v.string(),
    newRole: v.union(
      v.literal("owner"),
      v.literal("editor"),
      v.literal("commenter"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check current user is owner
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    if (!userMembership || userMembership.role !== "owner") {
      throw new Error("Only trip owners can update member roles");
    }

    // Find target member
    const targetMember = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", args.userId as any)
      )
      .first();

    if (!targetMember) {
      throw new Error("Member not found");
    }

    // Cannot change owner's role
    if (targetMember.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }

    // Update the role
    await ctx.db.patch(targetMember._id, {
      role: args.newRole,
    });

    return { success: true };
  },
});

/**
 * Remove a member from trip
 */
export const removeMember = mutation({
  args: {
    tripId: v.id("trips"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find target member
    const targetMember = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", args.userId as any)
      )
      .first();

    if (!targetMember) {
      throw new Error("Member not found");
    }

    // Cannot remove the owner
    if (targetMember.role === "owner") {
      throw new Error("Cannot remove the trip owner");
    }

    // Check current user is owner OR user is removing themselves
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    const isOwner = userMembership?.role === "owner";
    const isRemovingSelf = args.userId === userId;

    if (!isOwner && !isRemovingSelf) {
      throw new Error("You don't have permission to remove this member");
    }

    // Delete the tripMember entry
    await ctx.db.delete(targetMember._id);

    return { success: true };
  },
});

/**
 * Current user leaves a trip
 */
export const leaveTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find user's membership
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    if (!userMembership) {
      throw new Error("You are not a member of this trip");
    }

    // Check user is not the owner
    if (userMembership.role === "owner") {
      throw new Error("Trip owners cannot leave. Please transfer ownership or delete the trip.");
    }

    // Delete their tripMember entry
    await ctx.db.delete(userMembership._id);

    return { success: true };
  },
});

/**
 * Get current user's pending invites
 */
export const getPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all pending memberships for this user
    const pendingMemberships = await ctx.db
      .query("tripMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Enrich with trip details and inviter profile
    const invites = await Promise.all(
      pendingMemberships.map(async (membership) => {
        const trip = await ctx.db.get(membership.tripId);

        let inviterProfile = null;
        if (membership.invitedBy) {
          inviterProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", membership.invitedBy))
            .first();
        }

        return {
          _id: membership._id,
          tripId: membership.tripId,
          role: membership.role,
          invitedAt: membership._creationTime,
          trip: trip
            ? {
                name: trip.name,
                description: trip.description,
                startDate: trip.startDate,
                endDate: trip.endDate,
              }
            : null,
          inviter: inviterProfile
            ? {
                name: inviterProfile.name,
                email: inviterProfile.email,
              }
            : null,
        };
      })
    );

    return invites;
  },
});

/**
 * Get pending invites sent for a trip
 */
export const getTripPendingInvites = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Check user is owner or editor
    const membership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "editor")) {
      throw new ConvexError("Access denied");
    }

    // Get all pending memberships for this trip
    const pendingMemberships = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Enrich with user emails
    const invites = await Promise.all(
      pendingMemberships.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          _id: member._id,
          userId: member.userId,
          email: user?.email || "Unknown",
          role: member.role,
          invitedAt: member.invitedAt,
        };
      })
    );

    return invites;
  },
});

/**
 * Get active invite links for a trip
 */
export const getTripInviteLinks = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Check user is owner or editor
    const membership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "editor")) {
      throw new ConvexError("Access denied");
    }

    // Get all invite links for this trip
    const inviteLinks = await ctx.db
      .query("tripInviteLinks")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return inviteLinks.map((link) => ({
      _id: link._id,
      token: link.token,
      role: link.role,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      useCount: link.useCount,
    }));
  },
});

/**
 * Delete an invite link
 */
export const revokeInviteLink = mutation({
  args: { linkId: v.id("tripInviteLinks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the invite link
    const inviteLink = await ctx.db.get(args.linkId);
    if (!inviteLink) {
      throw new Error("Invite link not found");
    }

    // Check current user is owner of the trip
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", inviteLink.tripId).eq("userId", userId)
      )
      .first();

    if (!userMembership || userMembership.role !== "owner") {
      throw new Error("Only trip owners can revoke invite links");
    }

    // Delete the link
    await ctx.db.delete(args.linkId);

    return { success: true };
  },
});
