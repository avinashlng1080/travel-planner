# Dashboard & Trip Components Structure

## Visual Hierarchy

```
DashboardPage
├── Header (sticky)
│   ├── Logo
│   ├── Settings Button
│   └── User Menu Dropdown
│       └── Sign Out
│
├── Main Content
│   ├── Page Title & Create Button
│   ├── Filter Tabs
│   │   ├── All Trips
│   │   ├── My Trips
│   │   └── Shared With Me
│   │
│   └── Trips Grid (responsive)
│       ├── CreateTripCard (first position)
│       └── TripCard (×N)
│           ├── Cover Image/Gradient
│           ├── Role Badge
│           ├── Member Count Avatars
│           ├── Trip Name
│           ├── Description
│           ├── Date Range
│           └── Actions Menu (owner only)
│               ├── Share Trip
│               └── Delete Trip
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    DashboardPage.tsx                     │
│  - State management (filters, user menu)                │
│  - Authentication (useAuthActions)                      │
│  - Grid layout & animations                             │
└────────────┬────────────────────────────────────────────┘
             │
             ├─────► CreateTripCard.tsx
             │       - Dashed border style
             │       - + icon animation
             │       - onClick handler
             │
             └─────► TripCard.tsx
                     - Cover image/gradient
                     - Badges (role, members)
                     - Dropdown menu
                     - onOpen/onShare/onDelete handlers
```

## Data Flow (with Convex)

```
Convex Backend                    React Frontend
─────────────                     ──────────────

trips table                  ┌──► DashboardPage
tripMembers table            │    - useQuery(getMyTrips)
                             │    - useMutation(deleteTrip)
getMyTrips query ────────────┘    │
                                  ├──► Filter & transform data
                                  │
                                  ├──► CreateTripCard
                                  │    onClick ──► handleCreateTrip()
                                  │
                                  └──► TripCard (×N)
                                       onOpen ──► navigate to trip
                                       onShare ──► open share modal
                                       onDelete ──► deleteTrip mutation
```

## State Management

### UI State (useState)
- `showUserMenu` - User dropdown visibility
- `activeFilter` - Current filter tab ('all' | 'my-trips' | 'shared')

### Server State (Convex)
- `tripsData` - All trips for current user
- `deleteTrip` - Mutation for deleting trips

## Styling Patterns

### Glassmorphism
```css
bg-white/95 backdrop-blur-xl border border-slate-200/50
```

### Gradient Buttons
```css
bg-gradient-to-r from-sunset-500 to-ocean-600
shadow-lg shadow-sunset-500/30
```

### Role Badge Colors
- Owner: `sunset` (bg-sunset-100 text-sunset-700)
- Editor: `blue` (bg-blue-100 text-blue-700)
- Commenter: `purple` (bg-purple-100 text-purple-700)
- Viewer: `slate` (bg-slate-100 text-slate-700)

### Cover Gradient Variations
1. `from-sunset-400 via-sunset-500 to-ocean-600`
2. `from-pink-400 via-purple-500 to-blue-600`
3. `from-green-400 via-emerald-500 to-teal-600`
4. `from-amber-400 via-orange-500 to-red-600`
5. `from-blue-400 via-cyan-500 to-teal-600`

## Animation Timings

### Entrance Animations
- Individual items: `duration: 0.3s`
- Stagger delay: `0.05s` between children
- Initial: `opacity: 0, y: 20`
- Animate: `opacity: 1, y: 0`

### Hover Effects
- Cards: `whileHover={{ y: -4 }}`
- Buttons: `whileHover={{ scale: 1.02 }}`
- Tap: `whileTap={{ scale: 0.98 }}`

### Menu Transitions
- Dropdown: `duration: 0.15s`
- Initial: `opacity: 0, y: -10`

## Responsive Breakpoints

### Grid Layout
- Mobile (default): `grid-cols-1`
- Tablet (md): `grid-cols-2`
- Desktop (lg): `grid-cols-3`

### Header
- Logo text: `hidden sm:block`
- User dropdown chevron: `hidden sm:block`
- Create button: `hidden sm:flex` (shows on mobile as card)

## Accessibility Features

### ARIA Labels
- All buttons have descriptive `aria-label` attributes
- User menu: `aria-label="User menu"`
- Settings: `aria-label="Settings"`
- Cards: `aria-label="Open trip: {name}"`

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Dropdown menus close on outside click
- Focus states on all buttons

### Screen Readers
- Semantic HTML structure
- Proper heading hierarchy (h1, h3)
- Descriptive button text

## File Locations

```
src/
├── components/
│   └── trips/
│       ├── TripCard.tsx              (Trip card component)
│       ├── CreateTripCard.tsx        (Create trip CTA card)
│       ├── index.ts                  (Barrel exports)
│       ├── README.md                 (Integration guide)
│       └── COMPONENT_STRUCTURE.md    (This file)
│
└── pages/
    ├── DashboardPage.tsx                      (Mock data version)
    └── DashboardPage.connected.example.tsx    (Convex version)
```

## Integration Checklist

- [x] Create TripCard component
- [x] Create CreateTripCard component
- [x] Create DashboardPage with mock data
- [x] Add glassmorphic styling
- [x] Add animations and transitions
- [x] Add accessibility features
- [x] Create documentation
- [ ] Connect to Convex queries
- [ ] Add loading states
- [ ] Add error handling
- [ ] Create trip creation modal/page
- [ ] Create trip sharing modal
- [ ] Add routing
- [ ] Add search functionality
- [ ] Add sorting options
- [ ] Add batch operations
- [ ] Add trip templates

## Next Steps

1. **Create Trip Modal**: Build a form for creating new trips
2. **Share Modal**: Implement sharing with email invites and role selection
3. **Connect to Convex**: Replace mock data with real queries
4. **Add Loading Skeletons**: Show loading states while data fetches
5. **Error Handling**: Add toast notifications for errors
6. **Routing**: Set up routes for trip detail view
7. **Optimize Queries**: Batch member count queries for better performance
