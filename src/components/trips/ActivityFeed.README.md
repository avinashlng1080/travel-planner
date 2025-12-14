# ActivityFeed Component

A component that displays recent collaboration activity on a trip, showing actions taken by team members with avatars, timestamps, and contextual information.

## Overview

The `ActivityFeed` component provides a timeline view of trip activity, perfect for keeping team members informed about changes and updates. It supports both compact (sidebar) and full-page modes.

## Features

- **Real-time activity tracking** - Shows recent collaboration events
- **User avatars** - Displays avatar or initials for each user
- **Relative timestamps** - Human-readable time (e.g., "2 hours ago")
- **Action icons** - Visual indicators for different action types
- **Compact & Full modes** - Flexible layouts for different UI contexts
- **Staggered animations** - Smooth entry/exit animations
- **Empty state** - Friendly message when no activity exists
- **Loading skeleton** - Smooth loading experience

## Props

```tsx
interface ActivityFeedProps {
  tripId: Id<'trips'>;     // The trip to show activity for
  limit?: number;          // Max activities to fetch (default: 50)
  compact?: boolean;       // Compact mode for sidebars (default: false)
}
```

## Usage

### Sidebar (Compact Mode)

```tsx
import { ActivityFeed } from '@/components/trips/ActivityFeed';
import { Id } from '../../../convex/_generated/dataModel';

function TripSidebar({ tripId }: { tripId: Id<'trips'> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Recent Activity</h2>
      <ActivityFeed tripId={tripId} compact={true} />
    </div>
  );
}
```

### Full Page

```tsx
import { ActivityFeed } from '@/components/trips/ActivityFeed';

function ActivityPage({ tripId }: { tripId: Id<'trips'> }) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Activity</h1>
      <ActivityFeed tripId={tripId} compact={false} limit={100} />
    </div>
  );
}
```

### Custom Limit

```tsx
<ActivityFeed
  tripId={tripId}
  compact={false}
  limit={20}  // Show last 20 activities
/>
```

## Activity Types

The component supports the following activity types:

| Action | Icon | Color | Description |
|--------|------|-------|-------------|
| `created_trip` | FileText | Sunset | Trip was created |
| `updated_trip` | Edit | Blue | Trip details updated |
| `invited_member` | UserPlus | Purple | New member invited |
| `joined_trip` | UserPlus | Green | Member joined the trip |
| `created_plan` | Plus | Ocean | New plan created |
| `updated_plan` | Edit | Blue | Plan was updated |
| `added_activity` | MapPin | Green | Activity added to plan |
| `updated_activity` | Edit | Blue | Activity updated |
| `deleted_activity` | Trash | Red | Activity removed |
| `added_comment` | MessageSquare | Amber | Comment added |
| `resolved_comment` | CheckCircle | Green | Comment resolved |

## Display Modes

### Compact Mode (`compact={true}`)

- Shows last 5 activities
- Scrollable container (max-height: 400px)
- "View all activity" button at bottom
- Ideal for sidebars and panels
- No header text

### Full Mode (`compact={false}`)

- Shows up to `limit` activities (default: 50)
- Full header with title and count
- No scrolling (shows all activities)
- Ideal for dedicated activity pages

## Data Flow

1. Component calls `api.tripActivity.getRecentActivity` query
2. Query returns activities with user profiles enriched
3. Each activity includes:
   - User info (name, email, avatar)
   - Action type
   - Timestamp
   - Formatted message
   - Optional metadata (description, links)

## Styling

The component uses the project's glassmorphic design system:

- `GlassPanel` for the container
- `GlassButton` for actions
- `Avatar` for user display
- Framer Motion for animations
- Tailwind CSS for styling

## States

### Loading
Shows animated skeleton with placeholder items

### Empty
Displays empty state with clock icon and helpful message

### Populated
Shows timeline of activities with staggered animations

## Navigation

Activity items can link to affected items (plans, activities, etc.). Currently, navigation is logged to console. To implement navigation:

```tsx
// In ActivityItem component, update the onClick handler:
onClick={() => {
  // Example with React Router:
  navigate(`/trips/${activity.tripId}/${activity.targetType}/${activity.targetId}`);

  // Or with custom navigation:
  onNavigate?.(activity.targetType, activity.targetId);
}}
```

## Accessibility

- Semantic HTML with `time` elements
- Proper ARIA labels (add as needed)
- Keyboard navigation support for interactive elements
- High contrast colors for readability

## Performance

- Uses Convex real-time queries for efficient data fetching
- Memoized calculations for display limit
- AnimatePresence for smooth list updates
- Virtualization could be added for very long lists

## Future Enhancements

- [ ] Filter by activity type
- [ ] Filter by user
- [ ] Date range filtering
- [ ] Export activity log
- [ ] Grouping by date
- [ ] Infinite scroll for large lists
- [ ] Real-time updates with animations
- [ ] Activity search

## Related Components

- `MemberList` - Shows trip members
- `Avatar` - User avatar display
- `GlassPanel` - Container component

## Convex Backend

The component uses the following Convex query:

```typescript
// convex/tripActivity.ts
export const getRecentActivity = query({
  args: {
    tripId: v.id("trips"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Returns enriched activities with user profiles
  },
});
```

Activity logging happens automatically through the `logActivity` internal mutation called by other mutations when changes occur.
