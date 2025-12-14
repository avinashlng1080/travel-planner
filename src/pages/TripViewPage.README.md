# TripViewPage Component

A comprehensive page component for viewing and navigating a specific trip with its plans and schedule.

## Features

- **Trip Header**: Displays trip name, dates, description, and user role badge
- **Member Avatars**: Shows trip members with avatar stack (first 3 + count)
- **Dynamic Plan Tabs**: Color-coded tabs for switching between different trip plans
- **Schedule View**: Day-by-day schedule with time-based activities
- **Loading States**: Skeleton loading for trip data and schedule items
- **Error States**: Graceful handling of missing or inaccessible trips
- **Back Navigation**: Returns to dashboard/previous view
- **Glassmorphic UI**: Follows the sunset/ocean color scheme and glass panel design

## Props

```typescript
interface TripViewPageProps {
  tripId: Id<'trips'>;    // Convex ID of the trip to display
  onBack: () => void;      // Callback when user clicks back button
}
```

## Usage

### Basic Integration

```tsx
import { TripViewPage } from '@/pages/TripViewPage';
import type { Id } from '../../convex/_generated/dataModel';

function MyComponent() {
  const tripId = 'jx74y8h6s8k6s8k6s8k6s8k6' as Id<'trips'>;

  return (
    <TripViewPage
      tripId={tripId}
      onBack={() => console.log('Navigate back')}
    />
  );
}
```

### With State Management

```tsx
import { useState } from 'react';
import { TripViewPage } from '@/pages/TripViewPage';

function TripManager() {
  const [selectedTripId, setSelectedTripId] = useState<Id<'trips'> | null>(null);

  if (selectedTripId) {
    return (
      <TripViewPage
        tripId={selectedTripId}
        onBack={() => setSelectedTripId(null)}
      />
    );
  }

  return <DashboardPage onSelectTrip={setSelectedTripId} />;
}
```

### With React Router

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { TripViewPage } from '@/pages/TripViewPage';

function TripViewRoute() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  if (!tripId) {
    navigate('/dashboard');
    return null;
  }

  return (
    <TripViewPage
      tripId={tripId as Id<'trips'>}
      onBack={() => navigate('/dashboard')}
    />
  );
}

// In your router:
<Route path="/trips/:tripId" element={<TripViewRoute />} />
```

## Data Requirements

### Convex Queries

The component uses the following Convex queries:

1. **`api.trips.getTripWithDetails`**
   - Returns: `{ trip, plans, members }`
   - Requires: User must be an accepted member of the trip
   - Includes: Trip details, all plans sorted by order, member profiles

2. **`api.tripScheduleItems.getScheduleItemsByPlan`** (when available)
   - Returns: Array of schedule items for the selected plan
   - Requires: Plan ID
   - Includes: Schedule items sorted by date and order

### Expected Data Structure

```typescript
// Trip with Details
{
  trip: {
    _id: Id<'trips'>,
    name: string,
    description?: string,
    startDate: string,      // 'YYYY-MM-DD'
    endDate: string,
    coverImageUrl?: string,
    createdAt: number,
    updatedAt: number
  },
  plans: Array<{
    _id: Id<'tripPlans'>,
    name: string,
    description?: string,
    color: string,          // Hex color code
    icon?: string,
    order: number,
    isDefault: boolean
  }>,
  members: Array<{
    _id: Id<'tripMembers'>,
    role: 'owner' | 'editor' | 'commenter' | 'viewer',
    status: 'pending' | 'accepted' | 'declined',
    user: {
      _id: Id<'users'>,
      name?: string,
      email?: string,
      image?: string
    }
  }>
}

// Schedule Items
Array<{
  _id: Id<'tripScheduleItems'>,
  title: string,
  dayDate: string,        // 'YYYY-MM-DD'
  startTime: string,      // 'HH:MM AM/PM'
  endTime: string,
  notes?: string,
  isFlexible: boolean,
  order: number
}>
```

## UI Components

The page uses the following glassmorphic components from `@/components/ui/GlassPanel`:

- `GlassPanel` - Container panels with backdrop blur
- `GlassButton` - Styled buttons with variants
- `GlassBadge` - Small colored badges

## States & Interactions

### Loading State
- Shows centered loading spinner with trip icon
- Displays "Loading trip..." message
- Smooth fade-in animation when data loads

### Error State
- Shows if trip is not found or user lacks access
- Displays error icon and message
- Provides "Back to Dashboard" button

### Plan Selection
- First plan is auto-selected when data loads
- Clicking a plan tab switches the schedule view
- Selected plan is highlighted with white background
- Color indicators show plan colors

### Schedule Display
- Groups activities by date (day sections)
- Sorts activities by time within each day
- Shows time range, title, notes for each activity
- Flexible activities have an "Amber" badge
- Staggered entrance animations for smooth loading

## Styling

### Color Scheme
- **Sunset Gradient**: `from-sunset-500 to-ocean-600`
- **Role Colors**:
  - Owner: sunset (orange)
  - Editor: blue
  - Commenter: purple
  - Viewer: slate (gray)

### Glassmorphic Style
```css
bg-white/95 backdrop-blur-xl border border-slate-200/50
```

### Responsive Design
- Mobile: Single column, compact header
- Tablet: Expanded header with labels
- Desktop: Full width with all details

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on all buttons
- Screen reader friendly

## TODO / Future Enhancements

1. **Schedule Items Query**: Currently commented out - needs `api.tripScheduleItems` to be exported by Convex
2. **Plan Editing**: Add ability to edit plan details (owner/editor only)
3. **Schedule Item Details**: Click to view/edit individual schedule items
4. **Share Modal**: Implement trip sharing functionality
5. **Map Integration**: Show locations on an interactive map
6. **Activity Filters**: Filter schedule by time, location, or tags
7. **Export Schedule**: Download as PDF or iCal
8. **Collaborative Features**: Real-time updates, comments, presence
9. **Mobile Gestures**: Swipe between plans on mobile
10. **Optimistic Updates**: Immediate UI feedback while mutations process

## File Location

```
src/pages/TripViewPage.tsx
```

## Dependencies

```json
{
  "react": "^18.x",
  "convex": "^1.x",
  "framer-motion": "^11.x",
  "lucide-react": "^0.x"
}
```

## Related Components

- `DashboardPage` - Main trip listing page
- `TripCard` - Individual trip cards in dashboard
- `GlassPanel` - Glassmorphic UI components
- `FullScreenMap` - Map view for trip locations (future integration)

## Example Screenshots

### Trip View with Plans
```
┌─────────────────────────────────────────────────────────┐
│ ← Back        Malaysia Family Adventure [Owner]  Share  │
├─────────────────────────────────────────────────────────┤
│ 📅 Dec 21, 2025 - Jan 6, 2026                          │
│ Epic 2-week journey through KL, Penang, and Langkawi   │
│                                         👤👤👤 +2        │
├─────────────────────────────────────────────────────────┤
│ [🔵 Plan A]  [🔴 Plan B]  [🟢 Rainy Day Plan]         │
├─────────────────────────────────────────────────────────┤
│ 📅 Monday, December 21, 2025                            │
│                                                          │
│ 🕐 9:00 AM    Breakfast at Hotel          →             │
│    10:30 AM                                              │
│                                                          │
│ 🕐 11:00 AM   Petronas Towers Tour         →            │
│    2:00 PM    Great views! Book in advance              │
│                                           [Flexible]     │
└─────────────────────────────────────────────────────────┘
```

## Notes

- The component is fully typed with TypeScript
- Uses Framer Motion for smooth animations
- Follows the established glassmorphic design system
- Compatible with Convex real-time updates
- Designed for easy integration with existing dashboard
