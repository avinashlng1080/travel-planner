# Dashboard Page - Quick Start Guide

## What's Been Created

Three new components for the trip dashboard with beautiful glassmorphic UI:

### 1. **DashboardPage** (`src/pages/DashboardPage.tsx`)
Main dashboard showing all trips with filters and grid layout.

**Features:**
- User profile dropdown with sign-out
- Filter tabs: "All Trips" | "My Trips" | "Shared With Me"
- Responsive grid (1/2/3 columns)
- Staggered entrance animations
- Empty states
- Mock data for demonstration

### 2. **TripCard** (`src/components/trips/TripCard.tsx`)
Card component displaying trip information.

**Features:**
- Cover image or gradient placeholder
- Role badges (owner/editor/commenter/viewer with distinct colors)
- Member count with avatar stack (max 3 + "+N")
- Formatted date range
- Dropdown menu for Share/Delete (owners only)
- Hover effects and smooth animations

### 3. **CreateTripCard** (`src/components/trips/CreateTripCard.tsx`)
Special card that triggers trip creation.

**Features:**
- Dashed border style
- Large + icon with rotation on hover
- Corner decorations
- Click to create new trip

## File Structure

```
src/
├── components/
│   └── trips/
│       ├── TripCard.tsx                       ✨ NEW
│       ├── CreateTripCard.tsx                 ✨ NEW
│       ├── index.ts                           ✨ NEW (barrel exports)
│       ├── README.md                          ✨ NEW (integration guide)
│       └── COMPONENT_STRUCTURE.md             ✨ NEW (architecture docs)
│
└── pages/
    ├── DashboardPage.tsx                      ✨ NEW (mock data)
    └── DashboardPage.connected.example.tsx    ✨ NEW (Convex connected)
```

## Quick Start

### Option 1: View with Mock Data (Recommended for Testing)

1. Import the DashboardPage in your router:
```tsx
import { DashboardPage } from '@/pages/DashboardPage';

// In your routes
<Route path="/dashboard" element={<DashboardPage />} />
```

2. Navigate to `/dashboard` to see the page with mock data

3. The page will display:
   - 5 sample trips with different roles and cover images
   - Working filters and animations
   - All UI interactions (except actual data mutations)

### Option 2: Connect to Convex (Production Ready)

1. Use the connected example as reference:
```bash
# Rename files (backup originals first)
mv src/pages/DashboardPage.tsx src/pages/DashboardPage.mock.tsx
mv src/pages/DashboardPage.connected.example.tsx src/pages/DashboardPage.tsx
```

2. Ensure you have the required Convex queries (already in `convex/trips.ts`):
   - `getMyTrips` - Fetch all trips for current user
   - `deleteTrip` - Delete a trip
   - `getTripMembers` - Get member count (needs to be created)

3. The component will automatically:
   - Load real trips from Convex
   - Show loading state while fetching
   - Enable real delete functionality

## Design Patterns Used

### Glassmorphic UI
```tsx
bg-white/95 backdrop-blur-xl border border-slate-200/50
```
Consistent with the rest of the app (FloatingHeader, GlassPanel, etc.)

### Gradient Colors
- Primary gradient: `from-sunset-500 to-ocean-600`
- 5 cover gradient variations for trips without images
- Role-specific badge colors

### Animations (Framer Motion)
- Container with staggered children (`staggerChildren: 0.05`)
- Card hover: `y: -4`, `scale: 1.02`
- Smooth transitions: `duration: 0.3s`

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Semantic HTML structure
- Screen reader friendly

## Component Props

### TripCard
```typescript
interface TripCardProps {
  trip: {
    _id: Id<"trips">;
    name: string;
    description?: string;
    startDate: string;        // YYYY-MM-DD
    endDate: string;          // YYYY-MM-DD
    coverImageUrl?: string;
    memberCount: number;
    role: "owner" | "editor" | "commenter" | "viewer";
  };
  onOpen: (tripId: Id<"trips">) => void;
  onShare?: (tripId: Id<"trips">) => void;
  onDelete?: (tripId: Id<"trips">) => void;
}
```

### CreateTripCard
```typescript
interface CreateTripCardProps {
  onClick: () => void;
}
```

## Usage Examples

### Import Components
```tsx
import { TripCard, CreateTripCard } from '@/components/trips';
import type { Id } from '../../convex/_generated/dataModel';
```

### Use TripCard
```tsx
<TripCard
  trip={{
    _id: tripId,
    name: "Malaysia Family Adventure",
    description: "Epic 2-week journey",
    startDate: "2025-12-21",
    endDate: "2026-01-06",
    memberCount: 3,
    role: "owner",
  }}
  onOpen={(id) => navigate(`/trips/${id}`)}
  onShare={(id) => openShareModal(id)}
  onDelete={(id) => deleteTrip({ tripId: id })}
/>
```

### Use CreateTripCard
```tsx
<CreateTripCard onClick={() => navigate('/trips/new')} />
```

## Responsive Behavior

### Mobile (< 768px)
- Single column grid
- Full-width cards
- Stacked header elements
- Hidden desktop-only elements

### Tablet (768px - 1024px)
- 2-column grid
- Compact spacing
- Visible all elements

### Desktop (> 1024px)
- 3-column grid
- Optimal spacing
- All features visible
- Create button in header

## Next Steps

### Essential
1. **Create Trip Modal/Page** - Build form for creating trips
2. **Share Modal** - Implement sharing functionality
3. **Connect to Convex** - Replace mock data
4. **Add Routing** - Navigate to trip detail view

### Nice to Have
5. **Loading Skeletons** - Show while data loads
6. **Error Handling** - Toast notifications
7. **Search** - Filter trips by name
8. **Sorting** - Sort by date, name, etc.
9. **Batch Operations** - Multi-select actions
10. **Trip Templates** - Quick-start templates

## Troubleshooting

### Cards not showing?
- Check that trips data is properly formatted
- Verify the grid is rendering: inspect with React DevTools

### Animations not working?
- Ensure Framer Motion is installed: `npm install framer-motion`
- Check that parent has proper initial/animate states

### Gradients look different?
- Verify Tailwind config includes custom colors (sunset, ocean)
- Check `tailwind.config.js` for color definitions

### TypeScript errors?
- Ensure Convex types are generated: `npx convex dev`
- Import types from `convex/_generated/dataModel`

## Testing Checklist

- [ ] Dashboard loads with mock data
- [ ] Filter tabs work correctly
- [ ] Cards have smooth animations
- [ ] Hover effects work on cards
- [ ] Dropdown menu shows for owner role
- [ ] Create trip card is clickable
- [ ] Empty states show when no trips
- [ ] User menu dropdown works
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

## Screenshots

*(Screenshots would be added here showing the dashboard in action)*

### Desktop View
- Full 3-column grid
- All features visible
- Glassmorphic header

### Mobile View
- Single column
- Touch-optimized
- Compact layout

### Empty State
- Centered message
- CTA button
- Helpful guidance

## Support

For questions or issues:
1. Check `src/components/trips/README.md` for integration details
2. Review `src/components/trips/COMPONENT_STRUCTURE.md` for architecture
3. See `DashboardPage.connected.example.tsx` for Convex integration

---

**Built with:**
- React 18 + TypeScript
- Framer Motion (animations)
- Tailwind CSS (styling)
- Convex (backend)
- Lucide React (icons)

**Design inspired by:**
- PostHog dashboard
- Glassmorphism UI trend
- Modern SaaS applications
