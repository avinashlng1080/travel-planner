# Trip Components

Dashboard components for managing trips with a beautiful glassmorphic UI.

## Components

### `DashboardPage`
Main dashboard page showing all trips (owned + shared).

**Features:**
- Header with user profile dropdown and settings
- Filter tabs: "All" | "My Trips" | "Shared With Me"
- Responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop)
- Staggered entrance animations
- Empty states for each filter
- Mock data included for demonstration

**Usage:**
```tsx
import { DashboardPage } from '@/pages/DashboardPage';

// In your router
<Route path="/dashboard" element={<DashboardPage />} />
```

### `TripCard`
Card component for displaying trip information with hover effects and actions.

**Props:**
```typescript
interface TripCardProps {
  trip: {
    _id: Id<"trips">;
    name: string;
    description?: string;
    startDate: string; // YYYY-MM-DD format
    endDate: string;
    coverImageUrl?: string;
    memberCount: number;
    role: "owner" | "editor" | "commenter" | "viewer";
  };
  onOpen: (tripId: Id<"trips">) => void;
  onShare?: (tripId: Id<"trips">) => void;
  onDelete?: (tripId: Id<"trips">) => void;
}
```

**Features:**
- Cover image or gradient placeholder
- Role badge (owner/editor/commenter/viewer)
- Member count with avatar stack
- Formatted date range display
- Dropdown menu for Share/Delete (owners only)
- Hover effects and animations
- Accessible keyboard navigation

### `CreateTripCard`
Special card that triggers trip creation flow.

**Props:**
```typescript
interface CreateTripCardProps {
  onClick: () => void;
}
```

**Features:**
- Dashed border style
- Large + icon with rotation animation
- Hover effects
- Corner decorations

## Integrating with Convex

The DashboardPage currently uses mock data. To connect to Convex:

### 1. Update DashboardPage to use Convex queries

```tsx
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function DashboardPage() {
  // Replace MOCK_TRIPS with Convex query
  const tripsData = useQuery(api.trips.getMyTrips);
  const deleteTrip = useMutation(api.trips.deleteTrip);

  // Get member counts for each trip
  const trips = tripsData?.map(trip => ({
    ...trip,
    role: trip.userRole,
    memberCount: getMemberCount(trip._id), // Need separate query
  })) ?? [];

  // ... rest of component
}
```

### 2. Create helper query for member counts

In `convex/trips.ts`, add:

```typescript
export const getTripMemberCount = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("tripMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    return members.length;
  },
});
```

### 3. Wire up mutations

```tsx
const handleDeleteTrip = async (tripId: Id<'trips'>) => {
  if (confirm('Are you sure you want to delete this trip?')) {
    await deleteTrip({ tripId });
  }
};

const handleShareTrip = (tripId: Id<'trips'>) => {
  // Open share modal - you'll need to create this
  setShareModalTripId(tripId);
};

const handleCreateTrip = () => {
  // Navigate to create trip page or open modal
  navigate('/trips/new');
};
```

### 4. Optimize with parallel queries

For better performance, batch the member count queries:

```typescript
// Create a new query that returns trips with member counts
export const getMyTripsWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const trips = await getMyTrips(ctx);

    return Promise.all(
      trips.map(async (trip) => {
        const memberCount = await getTripMemberCount(ctx, { tripId: trip._id });
        return {
          ...trip,
          memberCount,
        };
      })
    );
  },
});
```

## Design Patterns

### Glassmorphic Styling
```tsx
bg-white/95 backdrop-blur-xl border border-slate-200/50
```

### Gradient Colors
- Sunset: `from-sunset-500 to-ocean-600`
- Role badges use specific colors per role
- Cover image placeholders use 5 gradient variations

### Animations
- Framer Motion for smooth transitions
- Staggered children animations with `containerVariants`
- Hover effects: `scale: 1.02`, `y: -4`
- Tap effects: `scale: 0.98`

### Accessibility
- Proper ARIA labels on all interactive elements
- Keyboard navigation support
- Focus states on buttons
- Semantic HTML structure
- Screen reader friendly

## File Structure
```
src/
├── components/
│   └── trips/
│       ├── TripCard.tsx
│       ├── CreateTripCard.tsx
│       ├── index.ts          # Barrel export
│       └── README.md          # This file
└── pages/
    └── DashboardPage.tsx
```

## Next Steps

1. **Create Trip Modal/Page**: Build UI for creating new trips
2. **Share Modal**: Implement trip sharing functionality
3. **Connect to Convex**: Replace mock data with real queries
4. **Add Loading States**: Show skeletons while data loads
5. **Error Handling**: Add error boundaries and toast notifications
6. **Routing**: Set up React Router or Next.js routes
7. **Batch Operations**: Add multi-select for batch actions
8. **Search/Filter**: Add search bar and advanced filters
9. **Sorting**: Add sort options (date, name, members, etc.)
10. **Trip Templates**: Allow creating trips from templates
