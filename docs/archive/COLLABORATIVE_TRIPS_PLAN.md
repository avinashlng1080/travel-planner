# Collaborative Trip Planning — Action Plan

*"The people who are crazy enough to think they can change the world are the ones who do."*

---

## The Vision

Transform this travel planner from a single-user tool into a **family collaboration platform**. Every trip becomes a shared canvas where family members contribute ideas, debate plans, and build memories together—before the journey even begins.

The elegance lies in simplicity: **One trip. Multiple perspectives. Unified experience.**

---

## Architecture Philosophy

### Why This Design?

Current state: A hardcoded trip with Plan A/B toggle. Beautiful, but lonely.

Future state: User-owned trips with dynamic plans and real-time collaboration.

The key insight: **Plans are not just A and B—they're conversations**. "Grandma wants temples, kids want playgrounds, parents need coffee." Each plan represents a voice in the family discussion.

### Core Principles

1. **Ownership is clear** — Every trip has one owner who controls access
2. **Roles are intuitive** — Owner, Editor, Commenter, Viewer (no complex permissions matrices)
3. **Real-time is expected** — Changes appear instantly across all family devices
4. **Comments are contextual** — Attach feedback to specific activities, not just the trip
5. **History is preserved** — See who changed what and when

---

## Database Schema Design

### New Tables

```typescript
// convex/schema.ts additions

// User profiles with display information
userProfiles: defineTable({
  userId: v.id("users"),
  name: v.string(),
  avatarUrl: v.optional(v.string()),
  email: v.string(),
  createdAt: v.number(),
}).index("by_userId", ["userId"]),

// User-owned trips (replaces hardcoded trip)
trips: defineTable({
  ownerId: v.id("users"),
  name: v.string(),
  description: v.optional(v.string()),
  startDate: v.string(),
  endDate: v.string(),
  coverImageUrl: v.optional(v.string()),
  homeBase: v.optional(v.object({
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["ownerId"])
  .index("by_dates", ["startDate", "endDate"]),

// Trip membership and permissions
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

// Share links for easy invitation
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

// Dynamic plans per trip (replaces fixed A/B)
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

// Trip-specific locations (user can add custom spots)
tripLocations: defineTable({
  tripId: v.id("trips"),
  locationId: v.optional(v.id("locations")), // Reference to global location, or null for custom
  // Custom location fields (used when locationId is null)
  customName: v.optional(v.string()),
  customLat: v.optional(v.number()),
  customLng: v.optional(v.number()),
  customCategory: v.optional(v.string()),
  customDescription: v.optional(v.string()),
  // Metadata
  addedBy: v.id("users"),
  addedAt: v.number(),
  notes: v.optional(v.string()),
})
  .index("by_trip", ["tripId"]),

// Schedule items now reference tripPlans instead of fixed A/B
tripScheduleItems: defineTable({
  tripId: v.id("trips"),
  planId: v.id("tripPlans"),
  dayDate: v.string(), // ISO date string
  locationId: v.optional(v.id("tripLocations")),
  // Activity details
  title: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  notes: v.optional(v.string()),
  isFlexible: v.boolean(),
  // Metadata
  createdBy: v.id("users"),
  updatedBy: v.optional(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.number(),
  order: v.number(),
})
  .index("by_plan", ["planId"])
  .index("by_trip_and_date", ["tripId", "dayDate"])
  .index("by_plan_and_date", ["planId", "dayDate"]),

// Comments on trips, plans, or specific activities
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

// Activity log for collaboration awareness
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
    v.literal("resolved_comment")
  ),
  targetId: v.optional(v.string()), // ID of affected entity
  targetType: v.optional(v.string()), // Type of affected entity
  metadata: v.optional(v.any()), // Additional context
  createdAt: v.number(),
})
  .index("by_trip", ["tripId"])
  .index("by_trip_and_time", ["tripId", "createdAt"]),
```

---

## Implementation Phases

### Phase 1: Foundation (User Profiles & Trip Ownership)

**Goal**: Users can create and own trips.

**Tasks**:
1. Add `userProfiles` table and auto-create on signup
2. Add `trips` table with CRUD operations
3. Create trip dashboard page (list owned trips)
4. Create "New Trip" flow with basic details
5. Migrate viewing experience to trip-context

**Files to Create/Modify**:
- `convex/schema.ts` — Add new tables
- `convex/userProfiles.ts` — Profile queries/mutations
- `convex/trips.ts` — Trip CRUD operations
- `src/pages/DashboardPage.tsx` — Trip list view
- `src/pages/CreateTripPage.tsx` — New trip form
- `src/components/trips/TripCard.tsx` — Dashboard card

### Phase 2: Dynamic Plans

**Goal**: Replace fixed A/B with user-created plans.

**Tasks**:
1. Add `tripPlans` table with CRUD
2. Create plan management UI in trip view
3. Update schedule items to reference plans
4. Add plan color picker and naming
5. Support unlimited plans per trip

**Files to Create/Modify**:
- `convex/tripPlans.ts` — Plan CRUD
- `convex/tripScheduleItems.ts` — Schedule with plan references
- `src/components/trips/PlanManager.tsx` — Plan list/create UI
- `src/components/trips/PlanTab.tsx` — Plan switcher
- Update `FloatingHeader.tsx` — Dynamic plan toggle

### Phase 3: Sharing & Permissions

**Goal**: Invite family members with appropriate access.

**Tasks**:
1. Add `tripMembers` and `tripInviteLinks` tables
2. Create invite modal (email + shareable link)
3. Implement permission checks on all mutations
4. Add member management panel for owners
5. Create join-via-link flow

**Files to Create/Modify**:
- `convex/tripMembers.ts` — Membership management
- `convex/tripInvites.ts` — Invite link generation
- `src/components/trips/InviteModal.tsx` — Invite UI
- `src/components/trips/MemberList.tsx` — Member management
- `src/pages/JoinTripPage.tsx` — Accept invite flow

### Phase 4: Comments & Collaboration

**Goal**: Family can discuss plans in context.

**Tasks**:
1. Add `tripComments` table
2. Create comment thread UI for activities
3. Add comment indicators on schedule items
4. Implement comment notifications
5. Add resolve/unresolve functionality

**Files to Create/Modify**:
- `convex/tripComments.ts` — Comment CRUD
- `src/components/trips/CommentThread.tsx` — Comment list
- `src/components/trips/CommentBubble.tsx` — Inline comment indicator
- `src/components/trips/CommentPanel.tsx` — Right sidebar for comments

### Phase 5: Activity Feed & Polish

**Goal**: Awareness of family activity + refinement.

**Tasks**:
1. Add `tripActivity` table with logging
2. Create activity feed component
3. Add real-time presence indicators
4. Implement avatar display across UI
5. Polish animations and transitions

**Files to Create/Modify**:
- `convex/tripActivity.ts` — Activity logging
- `src/components/trips/ActivityFeed.tsx` — Recent changes
- `src/components/trips/PresenceIndicator.tsx` — Who's viewing
- `src/components/ui/Avatar.tsx` — User avatar component

---

## Permission Matrix

| Action | Owner | Editor | Commenter | Viewer |
|--------|-------|--------|-----------|--------|
| View trip | ✅ | ✅ | ✅ | ✅ |
| Edit trip details | ✅ | ❌ | ❌ | ❌ |
| Delete trip | ✅ | ❌ | ❌ | ❌ |
| Create/edit plans | ✅ | ✅ | ❌ | ❌ |
| Add/edit activities | ✅ | ✅ | ❌ | ❌ |
| Add comments | ✅ | ✅ | ✅ | ❌ |
| Resolve comments | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ | ❌ |
| Leave trip | ❌ | ✅ | ✅ | ✅ |

---

## UI/UX Design Notes

### Dashboard Page
- Grid of trip cards with cover images
- "Create New Trip" prominent CTA
- Filter: All / My Trips / Shared With Me
- Quick actions: Open, Share, Delete

### Trip View (Enhanced Current UI)
- Plan tabs replace A/B toggle (dynamic, colorful)
- Member avatars in header (click for member panel)
- Comment count badges on activities
- Activity feed in collapsible right panel

### Invite Flow
1. Owner clicks "Share" button
2. Modal with two options:
   - **Email invite**: Enter email + select role
   - **Copy link**: Generate shareable link with role
3. Pending invites shown in member list
4. Invitee receives email or clicks link → Join page

### Comment UX
- Click comment icon on any activity → Opens thread
- Floating comment panel on right side
- Mentions with @name autocomplete
- Mark as resolved (hides from active view)

---

## Migration Strategy

### Preserving Existing Data

The current hardcoded trip data should become a **template** that users can clone:

1. Keep `locations` table as global reference data
2. On "Create Trip", offer "Start from Malaysia Template"
3. Template clones locations and default plans into user's trip
4. Original seeded data remains for new users

### Backward Compatibility

- Existing auth users get auto-created profiles
- Landing page continues to work for unauthenticated users
- Trip planner page requires selecting a trip first

---

## Implementation Progress

### Backend (Convex) - ✅ COMPLETE
| File | Status | Functions |
|------|--------|-----------|
| `schema.ts` | ✅ | All tables defined with proper indexes |
| `userProfiles.ts` | ✅ | getMyProfile, getProfile, createProfile, updateProfile, ensureProfile |
| `trips.ts` | ✅ | getMyTrips, getTrip, createTrip, updateTrip, deleteTrip, getTripWithDetails |
| `tripMembers.ts` | ✅ | getMembers, inviteMember, createInviteLink, joinViaLink, acceptInvite, declineInvite, updateMemberRole, removeMember, leaveTrip, getPendingInvites, revokeInviteLink |
| `tripPlans.ts` | ✅ | getPlans, getPlan, createPlan, updatePlan, deletePlan, reorderPlans, setDefaultPlan |
| `tripComments.ts` | ✅ | getCommentsByTrip, getCommentsByPlan, getCommentsByScheduleItem, getCommentCounts, addComment, updateComment, deleteComment, resolveComment, unresolveComment |
| `tripScheduleItems.ts` | ✅ | getScheduleItems, getScheduleItemsByDate, createScheduleItem, updateScheduleItem, deleteScheduleItem, reorderScheduleItems, moveItemBetweenPlans |
| `tripActivity.ts` | ✅ | getActivityFeed, getRecentActivity, logActivity (internal) |

### Frontend (React) - ✅ COMPLETE
| File | Status | Notes |
|------|--------|-------|
| `DashboardPage.tsx` | ✅ | Connected to Convex, trip filtering, loading states |
| `TripCard.tsx` | ✅ | Complete |
| `CreateTripCard.tsx` | ✅ | Complete |
| `CreateTripModal.tsx` | ✅ | Connected to Convex mutations |
| `MemberList.tsx` | ✅ | Complete |
| `InviteModal.tsx` | ✅ | Complete |
| `TripViewPage.tsx` | ✅ | Trip detail view with plans and schedule |
| `JoinTripPage.tsx` | ✅ | Accept invite via link with success/error states |
| `CommentPanel.tsx` | ✅ | Sliding drawer with comment thread, add/edit/delete/resolve |
| `ActivityFeed.tsx` | ✅ | Timeline view with compact/full modes |
| `App.tsx` | ✅ | Dashboard routing integrated |

### All Tasks Completed ✅
1. ~~Connect DashboardPage to Convex~~ - ✅ Done
2. ~~Create tripScheduleItems.ts~~ - ✅ Done
3. ~~Create tripActivity.ts~~ - ✅ Done
4. ~~Create TripViewPage~~ - ✅ Done
5. ~~Integrate Dashboard into App.tsx~~ - ✅ Done
6. ~~Create JoinTripPage~~ - ✅ Done
7. ~~Create CommentPanel~~ - ✅ Done
8. ~~Create ActivityFeed~~ - ✅ Done

---

## Testing Checklist

### Phase 1
- [x] User profile created on signup
- [x] Can create new trip
- [ ] Trip appears in dashboard (needs Convex connection)
- [ ] Can open trip and view map

### Phase 2
- [x] Can create custom plans
- [x] Can rename and recolor plans
- [ ] Schedule items persist per plan (needs tripScheduleItems.ts)
- [ ] Plan switcher works with 3+ plans

### Phase 3
- [x] Can invite by email
- [x] Can generate share link
- [ ] Invitee can join via link (needs JoinTripPage)
- [x] Permission checks prevent unauthorized edits
- [x] Owner can change roles
- [x] Members can leave trip

### Phase 4
- [x] Can add comment to activity
- [ ] Comment thread displays correctly (needs CommentPanel)
- [x] Can resolve/unresolve comments
- [ ] Comment count shows on activity

### Phase 5
- [ ] Activity feed shows recent changes (needs ActivityFeed)
- [ ] Real-time updates work across devices
- [ ] Avatars display throughout UI
- [ ] Animations are smooth

---

## Success Metrics

1. **Adoption**: Users create trips within first session
2. **Collaboration**: Average 2+ members per trip
3. **Engagement**: Comments used on 30%+ of trips
4. **Retention**: Users return to view/edit shared trips

---

*This isn't just a feature. It's the foundation for how families plan adventures together.*
