# Collaboration Panel Implementation Plan

## Overview

This plan outlines the implementation of a comprehensive Collaboration Panel for the Travel Planner app. The panel will expose all existing collaboration features (Share, Members, Comments, Activity) that are currently implemented in the backend but not wired to the frontend.

**Status**: Backend fully implemented, frontend wiring needed
**Estimated Time**: 2-3 hours
**Model**: Sonnet 4.5 recommended

---

## Problem Statement

The app has enterprise-grade collaboration functionality in the backend:
- Email invitations (`tripMembers.inviteMember`)
- Shareable links (`tripMembers.createInviteLink`, `tripMembers.joinViaLink`)
- Member management (`tripMembers.getMembers`, `updateMemberRole`, `removeMember`)
- Comments system (`tripComments.*`)
- Activity feed (`tripActivity.*`)
- Role-based permissions (Owner, Editor, Commenter, Viewer)

**But**: The frontend doesn't expose these features:
- `DashboardPage.tsx:67-70`: Share button just logs to console
- `TripViewPage.tsx`: No access to collaboration features
- `App.tsx`: Join route `/join/:token` not connected
- Member count hardcoded to `1` in TripCard

---

## Solution Architecture

### New Components

```
src/
├── atoms/
│   └── collaborationAtoms.ts (NEW)          # Tab state, comment targets
├── components/
│   └── floating/
│       └── CollaborationPanel.tsx (NEW)     # Tabbed collaboration hub
```

### Modified Files

```
src/
├── App.tsx                                   # Add /join/:token routing
├── pages/
│   ├── DashboardPage.tsx                     # Wire InviteModal to Share button
│   └── TripViewPage.tsx                      # Add CollaborationPanel
├── components/
│   └── Layout/
│       └── NavigationDock.tsx                # Add Collaboration icon
├── atoms/
│   └── floatingPanelAtoms.ts                 # Add 'collaboration' panel ID
convex/
└── tripMembers.ts                            # Add getMemberCount query
```

---

## Implementation Phases

### Phase 1: Foundation (Backend + Atoms)

#### Task 1.1: Add Member Count Query
**File**: `convex/tripMembers.ts`
**Location**: After line 703 (end of file)

Add this query:
```typescript
/**
 * Get member count for a trip (accepted members only)
 */
export const getMemberCount = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    // Check user has access
    const userMembership = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip_and_user", (q) =>
        q.eq("tripId", args.tripId).eq("userId", userId)
      )
      .first();

    if (!userMembership || userMembership.status !== "accepted") {
      return 0;
    }

    // Count accepted members
    const members = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    return members.length;
  },
});
```

#### Task 1.2: Create Collaboration Atoms
**File**: `src/atoms/collaborationAtoms.ts` (NEW)

```typescript
import { atom } from 'jotai';
import type { Id } from '../../convex/_generated/dataModel';

// Active tab in collaboration panel
export type CollaborationTab = 'share' | 'members' | 'comments' | 'activity';

export const collaborationTabAtom = atom<CollaborationTab>('members');

// Comment panel target for specific discussions
export const commentTargetAtom = atom<{
  type: 'trip' | 'plan' | 'activity';
  planId?: Id<'tripPlans'>;
  scheduleItemId?: Id<'tripScheduleItems'>;
} | null>(null);

// Quick access to invite modal from anywhere
export const quickInviteOpenAtom = atom<boolean>(false);
```

#### Task 1.3: Update Floating Panel Atoms
**File**: `src/atoms/floatingPanelAtoms.ts`

1. Update `PanelId` type (around line 12):
```typescript
export type PanelId =
  | 'tripPlanner'
  | 'days'
  | 'checklist'
  | 'filters'
  | 'suggestions'
  | 'alerts'
  | 'itinerary'
  | 'collaboration';  // ADD THIS
```

2. Add default panel config in `DEFAULT_PANELS` (around line 70):
```typescript
collaboration: {
  isOpen: false,
  isMinimized: false,
  position: getDefaultPosition(900, 70),
  zIndex: 8,
},
```

---

### Phase 2: CollaborationPanel Component

#### Task 2.1: Create CollaborationPanel
**File**: `src/components/floating/CollaborationPanel.tsx` (NEW)

This is a large component (~350 lines). Key structure:

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Share2, MessageCircle, Activity, X, Minus, Maximize2 } from 'lucide-react';
import { useAtom, useSetAtom } from 'jotai';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { GlassPanel, GlassButton } from '../ui/GlassPanel';
import { FloatingPanel } from '../ui/FloatingPanel';
import { panelsAtom, closePanelAtom, bringToFrontAtom } from '../../atoms/floatingPanelAtoms';
import { collaborationTabAtom } from '../../atoms/collaborationAtoms';
import { InviteModal } from '../trips/InviteModal';
import { MemberList } from '../trips/MemberList';
import { ActivityFeed } from '../trips/ActivityFeed';

// Import or inline CommentPanel content

interface CollaborationPanelProps {
  tripId: Id<'trips'>;
  tripName: string;
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
}

const tabs = [
  { id: 'share' as const, label: 'Share', icon: Share2 },
  { id: 'members' as const, label: 'Members', icon: Users },
  { id: 'comments' as const, label: 'Comments', icon: MessageCircle },
  { id: 'activity' as const, label: 'Activity', icon: Activity },
];

export function CollaborationPanel({ tripId, tripName, userRole }: CollaborationPanelProps) {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const [activeTab, setActiveTab] = useAtom(collaborationTabAtom);

  // State for inline invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  const panelState = panels.collaboration;

  // Queries
  const members = useQuery(api.tripMembers.getMembers, { tripId });

  if (!panelState.isOpen) return null;

  return (
    <FloatingPanel
      id="collaboration"
      title="Collaboration"
      icon={<Users className="w-5 h-5" />}
      className="w-[400px]"
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Hide share tab for non-owners
          if (tab.id === 'share' && userRole !== 'owner') return null;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors
                ${isActive
                  ? 'text-sunset-600 border-b-2 border-sunset-500'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'share' && userRole === 'owner' && (
          <ShareTabContent
            tripId={tripId}
            tripName={tripName}
            onOpenModal={() => setShowInviteModal(true)}
          />
        )}

        {activeTab === 'members' && (
          <MembersTabContent
            tripId={tripId}
            members={members}
            userRole={userRole}
            onInvite={() => {
              setActiveTab('share');
              setShowInviteModal(true);
            }}
          />
        )}

        {activeTab === 'comments' && (
          <CommentsTabContent tripId={tripId} userRole={userRole} />
        )}

        {activeTab === 'activity' && (
          <ActivityTabContent tripId={tripId} />
        )}
      </div>

      {/* Inline Invite Modal */}
      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          tripId={tripId}
          tripName={tripName}
        />
      )}
    </FloatingPanel>
  );
}

// Sub-components for each tab...
function ShareTabContent({ tripId, tripName, onOpenModal }) { /* ... */ }
function MembersTabContent({ tripId, members, userRole, onInvite }) { /* ... */ }
function CommentsTabContent({ tripId, userRole }) { /* ... */ }
function ActivityTabContent({ tripId }) { /* ... */ }
```

**Implementation Notes**:
- Use `FloatingPanel` wrapper for consistent drag/minimize behavior
- Each tab content should be extracted into sub-components
- `ShareTabContent`: Quick actions + button to open full InviteModal
- `MembersTabContent`: Render `MemberList` with role management
- `CommentsTabContent`: Trip-level comments (use CommentPanel logic inline or simplified)
- `ActivityTabContent`: Render `ActivityFeed` component

#### Task 2.2: Export from Floating Index
**File**: `src/components/floating/index.ts`

Add export:
```typescript
export { CollaborationPanel } from './CollaborationPanel';
```

---

### Phase 3: Navigation Integration

#### Task 3.1: Update NavigationDock
**File**: `src/components/Layout/NavigationDock.tsx`

1. Import Users icon (line ~1):
```typescript
import {
  Map, Calendar, CheckSquare, Filter, Sparkles, AlertTriangle,
  List, FileText, Users  // ADD Users
} from 'lucide-react';
```

2. Add to `navItems` array (around line 64):
```typescript
const navItems = [
  { id: 'tripPlanner', icon: Map, label: 'Trip Planner' },
  { id: 'checklist', icon: CheckSquare, label: 'Checklist' },
  { id: 'filters', icon: Filter, label: 'Filters' },
  { id: 'collaboration', icon: Users, label: 'Collaborate' },  // ADD THIS
  // ... other items
];
```

#### Task 3.2: Add CollaborationPanel to TripViewPage
**File**: `src/pages/TripViewPage.tsx`

1. Import (line ~16):
```typescript
import { TripPlannerPanel, ChecklistFloatingPanel, FiltersPanel, CollaborationPanel } from '../components/floating';
```

2. Add after FiltersPanel (around line 209):
```typescript
<FiltersPanel />

{/* Collaboration Panel */}
<CollaborationPanel
  tripId={tripId}
  tripName={trip.name}
  userRole={userRole}
/>

<TripPlannerPanel
```

---

### Phase 4: Dashboard Share Integration

#### Task 4.1: Wire Share Button on Dashboard
**File**: `src/pages/DashboardPage.tsx`

1. Import InviteModal (line ~10):
```typescript
import { InviteModal } from '../components/trips/InviteModal';
```

2. Add state (after line 23):
```typescript
const [shareModalTripId, setShareModalTripId] = useState<Id<'trips'> | null>(null);
const [shareModalTripName, setShareModalTripName] = useState<string>('');
```

3. Replace handleShareTrip (lines 67-70):
```typescript
const handleShareTrip = (tripId: Id<'trips'>) => {
  const trip = trips?.find(t => t._id === tripId);
  if (trip) {
    setShareModalTripId(tripId);
    setShareModalTripName(trip.name);
  }
};
```

4. Add InviteModal render (before closing `</div>` around line 274):
```typescript
{/* Invite Modal */}
{shareModalTripId && (
  <InviteModal
    isOpen={true}
    onClose={() => {
      setShareModalTripId(null);
      setShareModalTripName('');
    }}
    tripId={shareModalTripId}
    tripName={shareModalTripName}
  />
)}
```

5. Fix memberCount (line 256):
```typescript
// Option A: Use data from getTripWithDetails if available
memberCount: trip.memberCount || 1,

// Option B: Query separately (avoid if possible for performance)
```

**Note**: The `getMyTrips` query should be modified to return member counts. See Phase 1 enhancement below.

#### Task 4.2: Enhance getMyTrips Query (Optional but Recommended)
**File**: `convex/trips.ts`

Modify the `getMyTrips` handler to include member count:
```typescript
// Inside getMyTrips handler, after fetching trips
const tripsWithCounts = await Promise.all(
  trips.map(async (t) => {
    if (!t) return null;

    const memberCount = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", t._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect()
      .then(members => members.length);

    return { ...t, memberCount };
  })
);
```

---

### Phase 5: Join Route Integration

#### Task 5.1: Add Join Route to App.tsx
**File**: `src/App.tsx`

1. Import JoinTripPage and useEffect:
```typescript
import { useState, useEffect } from 'react';
import { JoinTripPage } from './pages/JoinTripPage';
```

2. Update AppView type:
```typescript
type AppView = 'dashboard' | 'trip' | 'legacy-planner' | 'join';
```

3. Add join state and URL parsing:
```typescript
const [joinToken, setJoinToken] = useState<string | null>(null);

// Parse URL for join tokens
useEffect(() => {
  const path = window.location.pathname;
  const joinMatch = path.match(/^\/join\/([a-f0-9]+)$/);
  if (joinMatch) {
    setJoinToken(joinMatch[1]);
    setCurrentView('join');
  }
}, []);
```

4. Add join view rendering (after auth check, before dashboard):
```typescript
// Join trip flow
if (currentView === 'join' && joinToken) {
  return (
    <JoinTripPage
      token={joinToken}
      onSuccess={(tripId) => {
        setSelectedTripId(tripId);
        setCurrentView('trip');
        setJoinToken(null);
        window.history.replaceState({}, '', '/');
      }}
      onCancel={() => {
        setCurrentView('dashboard');
        setJoinToken(null);
        window.history.replaceState({}, '', '/');
      }}
    />
  );
}
```

---

## Testing Checklist

### Unit Tests
- [ ] `collaborationAtoms.ts` - Tab switching logic
- [ ] `getMemberCount` query - Returns correct count

### Integration Tests
- [ ] CollaborationPanel renders all tabs
- [ ] Share tab shows InviteModal
- [ ] Members tab shows MemberList with correct role actions
- [ ] Comments tab shows trip-level comments
- [ ] Activity tab shows recent activity

### E2E Tests (Playwright)
- [ ] Dashboard share flow: Click share → InviteModal opens → Generate link → Copy
- [ ] TripView share flow: Open Collaboration panel → Share tab → Invite by email
- [ ] Join flow: Visit `/join/:token` → Auto-join → Redirect to trip
- [ ] Error handling: Expired link shows error message

### Accessibility Tests
- [ ] Tab navigation with keyboard (ArrowLeft/Right)
- [ ] Screen reader announces tab changes
- [ ] All buttons have aria-labels
- [ ] Focus management when opening/closing panels

---

## File Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `convex/tripMembers.ts` | Modify | +40 lines |
| `convex/trips.ts` | Modify | +15 lines |
| `src/atoms/collaborationAtoms.ts` | Create | ~25 lines |
| `src/atoms/floatingPanelAtoms.ts` | Modify | +5 lines |
| `src/components/floating/CollaborationPanel.tsx` | Create | ~350 lines |
| `src/components/floating/index.ts` | Modify | +1 line |
| `src/components/Layout/NavigationDock.tsx` | Modify | +5 lines |
| `src/pages/DashboardPage.tsx` | Modify | +25 lines |
| `src/pages/TripViewPage.tsx` | Modify | +10 lines |
| `src/App.tsx` | Modify | +30 lines |

**Total**: ~500 lines of code

---

## Success Criteria

1. **Share from Dashboard**: User can click Share on any trip card, InviteModal opens
2. **Share from Trip View**: Collaboration panel accessible from NavigationDock, Share tab works
3. **View Members**: Members tab shows all trip members with roles
4. **Comments**: Comments tab shows trip-level discussion
5. **Activity Feed**: Activity tab shows who did what
6. **Join via Link**: `/join/:token` URL auto-joins user to trip
7. **Member Count**: TripCard shows actual member count, not hardcoded 1

---

## Notes for Implementation

1. **Start with Phase 1 & 4**: These are the minimum to get sharing working
2. **CollaborationPanel can be simplified**: Start with just Share + Members tabs, add Comments/Activity later
3. **Reuse existing components**: MemberList, ActivityFeed, InviteModal are all tested and working
4. **Test incrementally**: Verify each phase works before moving to the next
5. **Convex reactivity**: No manual refresh needed - Convex auto-updates all connected clients
