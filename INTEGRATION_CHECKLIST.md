# ActivityDetailPanel Integration Checklist

## Overview
This checklist helps you integrate the ActivityDetailPanel component into TripViewPage.tsx to enable viewing activity details when clicking a schedule item.

## Pre-Integration Verification

- [x] Component created: `/src/components/trips/ActivityDetailPanel.tsx`
- [x] Component exported in: `/src/components/trips/index.ts`
- [x] TypeScript compilation: PASSED
- [x] Production build: PASSED
- [x] Documentation created:
  - [x] README.md (comprehensive guide)
  - [x] example.tsx (usage example)
  - [x] SUMMARY.md (implementation details)
  - [x] VISUAL.md (visual structure guide)

## Integration Steps

### Step 1: Add State Management
**File**: `/src/pages/TripViewPage.tsx`
**Location**: After existing state declarations (around line 40)

```tsx
// Add this state variable
const [selectedActivityId, setSelectedActivityId] = useState<Id<'tripScheduleItems'> | null>(null);
```

**Status**: [ ] Complete

---

### Step 2: Extract Selected Activity Data
**File**: `/src/pages/TripViewPage.tsx`
**Location**: After the scheduleItems query (around line 65)

```tsx
// Find the selected activity from existing scheduleItems
const selectedActivity = scheduleItems?.find(item => item._id === selectedActivityId) || null;
const location = selectedActivity?.location || undefined;
```

**Note**: The location data is already included in the scheduleItems response from Convex, so no additional query is needed.

**Status**: [ ] Complete

---

### Step 3: Add Delete Mutation
**File**: `/src/pages/TripViewPage.tsx`
**Location**: After existing queries (around line 67)

```tsx
// Import useMutation at the top
import { useQuery, useMutation } from 'convex/react';

// Add delete mutation
const deleteActivity = useMutation(api.tripScheduleItems.deleteScheduleItem);
```

**Status**: [ ] Complete

---

### Step 4: Update Schedule Item Click Handler
**File**: `/src/pages/TripViewPage.tsx`
**Location**: Schedule item onClick handler (around line 425)

**Before**:
```tsx
onClick={() => {
  console.log('View schedule item:', item._id);
  // TODO: Open schedule item details
}}
```

**After**:
```tsx
onClick={() => setSelectedActivityId(item._id)}
```

**Status**: [ ] Complete

---

### Step 5: Import ActivityDetailPanel
**File**: `/src/pages/TripViewPage.tsx`
**Location**: Top of file with other imports

```tsx
import { ActivityDetailPanel } from '../components/trips/ActivityDetailPanel';
```

**Status**: [ ] Complete

---

### Step 6: Add ActivityDetailPanel Component
**File**: `/src/pages/TripViewPage.tsx`
**Location**: Before the closing `</div>` tag (around line 523, after ImportItineraryModal)

```tsx
{/* Activity Detail Panel */}
<ActivityDetailPanel
  isOpen={!!selectedActivityId}
  onClose={() => setSelectedActivityId(null)}
  activity={selectedActivity}
  location={location}
  userRole={userRole}
  onEdit={() => {
    // TODO: Open edit modal when EditActivityModal is created
    console.log('Edit activity:', selectedActivityId);
    setSelectedActivityId(null);
  }}
  onDelete={async () => {
    if (!selectedActivityId) return;
    try {
      await deleteActivity({ itemId: selectedActivityId });
      setSelectedActivityId(null);
      // Optional: Show success toast
      console.log('Activity deleted successfully');
    } catch (error) {
      console.error('Failed to delete activity:', error);
      // Optional: Show error toast
    }
  }}
/>
```

**Status**: [ ] Complete

---

## Testing Checklist

### Visual Testing
- [ ] Panel slides in smoothly from right side
- [ ] Panel width is 400px on desktop, full-width on mobile
- [ ] Glassmorphic design matches existing components
- [ ] Backdrop appears with blur effect
- [ ] Colors match sunset/ocean theme

### Interaction Testing
- [ ] Clicking a schedule item opens the panel
- [ ] Clicking X button closes the panel
- [ ] Clicking backdrop closes the panel
- [ ] Panel shows correct activity title and date
- [ ] Time section displays start/end times
- [ ] Duration is calculated correctly
- [ ] Flexible badge shows when isFlexible is true

### Location Testing
- [ ] Location section shows when activity has locationId
- [ ] Location name displays correctly
- [ ] Category badge shows with correct color
- [ ] Mini map displays location marker
- [ ] Map is non-interactive (no dragging/zooming)
- [ ] Coordinates display correctly

### Notes Testing
- [ ] Notes display when present
- [ ] Empty state shows for editors when no notes
- [ ] Notes section hidden for viewers when no notes
- [ ] Whitespace preserved in notes display

### Role-Based Access
- [ ] Owner sees edit and delete buttons
- [ ] Editor sees edit and delete buttons
- [ ] Commenter sees NO action buttons
- [ ] Viewer sees NO action buttons

### Delete Flow
- [ ] Delete button shows confirmation modal
- [ ] Confirmation modal displays activity title
- [ ] Cancel button dismisses modal
- [ ] Delete button executes mutation
- [ ] Panel closes after successful delete
- [ ] Schedule refreshes after delete

### Accessibility
- [ ] Keyboard navigation works (Tab key)
- [ ] Close button is keyboard accessible
- [ ] Edit/delete buttons are keyboard accessible
- [ ] Screen reader announces dialog
- [ ] Focus trap works correctly

### Responsive Design
- [ ] Mobile: Panel is full-width
- [ ] Desktop: Panel is 400px wide
- [ ] Content scrolls when tall
- [ ] Header stays sticky
- [ ] Footer stays sticky (when visible)

### Error Handling
- [ ] Handles null activity gracefully
- [ ] Handles missing location gracefully
- [ ] Shows error if delete fails
- [ ] Prevents duplicate delete clicks

---

## Post-Integration Tasks

### Optional Enhancements
- [ ] Add success/error toast notifications
- [ ] Create EditActivityModal for onEdit handler
- [ ] Add loading state during delete
- [ ] Add optimistic updates for better UX
- [ ] Add keyboard shortcuts (Esc to close)

### Code Quality
- [ ] Remove console.log statements
- [ ] Add comments for complex logic
- [ ] Update PropTypes/TypeScript types if needed
- [ ] Run linter and fix any warnings

### Documentation
- [ ] Update TripViewPage component documentation
- [ ] Add integration notes to project README
- [ ] Document any customizations made

---

## Rollback Plan

If issues arise, revert in this order:

1. **Remove ActivityDetailPanel component** (Step 6)
2. **Remove delete mutation** (Step 3)
3. **Remove state** (Steps 1 & 2)
4. **Restore original onClick** (Step 4)
5. **Remove import** (Step 5)

---

## Expected Behavior

### Opening Panel
1. User clicks schedule item card
2. Panel slides in from right with spring animation
3. Backdrop appears with blur
4. Activity details load and display
5. Map shows location (if available)

### Closing Panel
1. User clicks X, backdrop, or completes action
2. Panel slides out to right
3. Backdrop fades out
4. State resets to null

### Deleting Activity
1. User clicks delete button
2. Confirmation modal appears over panel
3. User confirms deletion
4. Mutation executes
5. Panel closes
6. Schedule refreshes automatically (Convex reactivity)

---

## Troubleshooting

### Panel doesn't open
- Check: selectedActivityId state is being set
- Check: activity prop is not null
- Check: isOpen prop receives truthy value

### Panel opens but shows no content
- Check: scheduleItems query is returning data
- Check: selectedActivity is found in array
- Check: activity._id matches selectedActivityId

### Map doesn't show
- Check: location prop is defined
- Check: lat/lng values are valid numbers
- Check: Leaflet CSS is imported

### Delete doesn't work
- Check: deleteActivity mutation is imported
- Check: itemId parameter matches API (not scheduleItemId)
- Check: User has editor or owner role
- Check: Network tab for error response

### Styling looks wrong
- Check: Tailwind classes are available
- Check: GlassPanel components are imported correctly
- Check: No CSS conflicts with z-index
- Check: Framer Motion is working

---

## File Locations Reference

```
/src/pages/TripViewPage.tsx                      ← Integration target
/src/components/trips/ActivityDetailPanel.tsx    ← Main component
/src/components/trips/ActivityDetailPanel.example.tsx
/src/components/trips/ActivityDetailPanel.README.md
/src/components/trips/ActivityDetailPanel.VISUAL.md
/src/components/trips/ActivityDetailPanel.SUMMARY.md
/src/components/trips/index.ts                   ← Exports
/convex/tripScheduleItems.ts                     ← API methods
```

---

## Success Criteria

Integration is complete when:
- [x] All 6 integration steps completed
- [ ] All visual tests pass
- [ ] All interaction tests pass
- [ ] All role-based access tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Production build succeeds
- [ ] Component works on mobile and desktop

---

## Support

For questions or issues:
1. Check ActivityDetailPanel.README.md for detailed documentation
2. Review ActivityDetailPanel.example.tsx for usage patterns
3. See ActivityDetailPanel.VISUAL.md for visual structure
4. Review ActivityDetailPanel.SUMMARY.md for implementation details

---

**Last Updated**: 2025-12-16
**Status**: Ready for Integration
**Estimated Time**: 15-20 minutes
