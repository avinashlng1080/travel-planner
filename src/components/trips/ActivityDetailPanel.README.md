# ActivityDetailPanel Component

A sliding side panel that displays detailed information about a schedule activity, including time details, location with an interactive mini-map, notes, and action buttons for editing/deleting.

## Features

- **Sliding Animation**: Smooth slide-in from right with spring physics
- **Glassmorphic Design**: Matches the sunset/ocean color scheme
- **Mini Map**: Interactive Leaflet map showing the activity location
- **Time Details**: Start time, end time, and calculated duration
- **Location Info**: Name, category badge, coordinates, and map view
- **Notes Display**: Activity notes with proper formatting
- **Role-Based Actions**: Edit/delete buttons for owners and editors
- **Delete Confirmation**: Safety modal before deleting activities
- **Responsive**: Full-width on mobile, 400px on desktop
- **Accessibility**: Proper ARIA labels, keyboard navigation, focus management

## Props

```typescript
interface ActivityDetailPanelProps {
  isOpen: boolean;                    // Control panel visibility
  onClose: () => void;                // Close handler
  activity: {                         // Activity data from Convex
    _id: Id<'tripScheduleItems'>;
    title: string;
    dayDate: string;                  // ISO date string
    startTime: string;                // HH:MM format
    endTime: string;                  // HH:MM format
    notes?: string;
    isFlexible: boolean;
    locationId?: Id<'tripLocations'>;
  } | null;
  location?: {                        // Location data (optional)
    name: string;
    lat: number;
    lng: number;
    category?: string;
  };
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
  onEdit?: () => void;               // Edit handler (optional)
  onDelete?: () => void;             // Delete handler (optional)
}
```

## Usage

### Basic Implementation

```tsx
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { ActivityDetailPanel } from '@/components/trips';
import { api } from '@/convex/_generated/api';

function TripView() {
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  // Fetch activity details
  const activity = useQuery(
    api.tripScheduleItems.getScheduleItem,
    selectedActivityId ? { scheduleItemId: selectedActivityId } : 'skip'
  );

  // Fetch location if activity has locationId
  const location = useQuery(
    api.tripLocations.getLocation,
    activity?.locationId ? { locationId: activity.locationId } : 'skip'
  );

  const deleteActivity = useMutation(api.tripScheduleItems.deleteScheduleItem);

  return (
    <>
      {/* Schedule item cards */}
      <div onClick={() => setSelectedActivityId(item._id)}>
        {/* Item content */}
      </div>

      {/* Detail panel */}
      <ActivityDetailPanel
        isOpen={!!selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
        activity={activity}
        location={location ? {
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          category: location.category,
        } : undefined}
        userRole="owner"
        onEdit={() => {
          // Handle edit
          setSelectedActivityId(null);
        }}
        onDelete={async () => {
          await deleteActivity({ scheduleItemId: selectedActivityId });
          setSelectedActivityId(null);
        }}
      />
    </>
  );
}
```

### Read-Only Mode (Viewer Role)

```tsx
<ActivityDetailPanel
  isOpen={isOpen}
  onClose={onClose}
  activity={activity}
  location={location}
  userRole="viewer"
  // No onEdit or onDelete - action buttons won't appear
/>
```

### Without Location

```tsx
<ActivityDetailPanel
  isOpen={isOpen}
  onClose={onClose}
  activity={activity}
  // location prop omitted - location section won't appear
  userRole="editor"
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

## Integration with TripViewPage

1. **Add state** for selected activity:
   ```tsx
   const [selectedActivityId, setSelectedActivityId] = useState<Id<'tripScheduleItems'> | null>(null);
   ```

2. **Fetch data** using Convex queries:
   ```tsx
   const selectedActivity = useQuery(
     api.tripScheduleItems.getScheduleItem,
     selectedActivityId ? { scheduleItemId: selectedActivityId } : 'skip'
   );

   const location = useQuery(
     api.tripLocations.getLocation,
     selectedActivity?.locationId ? { locationId: selectedActivity.locationId } : 'skip'
   );
   ```

3. **Update schedule item onClick** (line ~425 in TripViewPage.tsx):
   ```tsx
   onClick={() => setSelectedActivityId(item._id)}
   ```

4. **Add the panel component**:
   ```tsx
   <ActivityDetailPanel
     isOpen={!!selectedActivityId}
     onClose={() => setSelectedActivityId(null)}
     activity={selectedActivity || null}
     location={location ? {
       name: location.name,
       lat: location.lat,
       lng: location.lng,
       category: location.category,
     } : undefined}
     userRole={userRole}
     onEdit={() => {
       // TODO: Open edit modal
       setSelectedActivityId(null);
     }}
     onDelete={async () => {
       if (selectedActivityId) {
         await deleteActivity({ scheduleItemId: selectedActivityId });
         setSelectedActivityId(null);
       }
     }}
   />
   ```

## Design Patterns

### Glassmorphic Styling
- Background: `bg-gradient-to-br from-slate-50 via-white to-sunset-50/30`
- Panels: `GlassPanel` component with `bg-white/95 backdrop-blur-xl`
- Borders: `border-slate-200/50` for subtle separation

### Color Scheme
- **Sunset colors**: Primary actions, time icons
- **Ocean colors**: Duration display, secondary elements
- **Category badges**: Category-specific colors (amber, emerald, purple, etc.)

### Animations
- **Panel slide**: Spring animation (damping: 30, stiffness: 300)
- **Backdrop**: Fade in/out with blur
- **Delete modal**: Scale + fade with spring physics

### Layout Structure
```
┌─────────────────────────────┐
│ Header (title, date, close) │ ← Fixed
├─────────────────────────────┤
│                             │
│ Scrollable Content:         │ ← Flex-1, overflow
│ - Time section              │
│ - Location + mini map       │
│ - Notes                     │
│                             │
├─────────────────────────────┤
│ Action Buttons (edit/del)   │ ← Fixed (if canEdit)
└─────────────────────────────┘
```

## Accessibility

- **ARIA labels**: Dialog role, aria-modal, aria-labelledby
- **Keyboard navigation**: Tab through interactive elements
- **Focus management**: Close button easily accessible
- **Screen readers**: Proper semantic structure
- **Touch targets**: Minimum 44px height for buttons

## Category Colors

The component supports these location categories:
- `restaurant` - Amber
- `attraction` - Emerald
- `shopping` - Purple
- `nature` - Green
- `temple` - Red
- `hotel` - Blue
- `transport` - Slate
- `medical` - Rose
- `playground` - Cyan

## Mini Map Configuration

- **Tile Layer**: CARTO light basemap
- **Zoom Level**: 14 (neighborhood view)
- **Height**: 160px (40 tailwind units)
- **Interactions**: Disabled (dragging, zoom, scroll)
- **Marker**: Default Leaflet marker with popup

## Dependencies

- `react` - Component framework
- `framer-motion` - Animations
- `react-leaflet` - Map integration
- `leaflet` - Map library
- `lucide-react` - Icons
- GlassPanel components from `@/components/ui/GlassPanel`

## Notes

- Panel appears above other content (z-50)
- Backdrop is at z-40 to allow clicking outside to close
- Delete confirmation modal uses z-60/z-70 to appear above panel
- Map requires Leaflet CSS to be imported
- Activity prop can be null (panel won't render)
- Edit/delete buttons only show for owner/editor roles

## Future Enhancements

- [ ] Add comments/discussion thread
- [ ] Show related activities (before/after)
- [ ] Integration with external calendar apps
- [ ] Attachment/photo support
- [ ] Share specific activity
- [ ] Activity history/change log
- [ ] Weather forecast for activity time
- [ ] Travel time to next activity
