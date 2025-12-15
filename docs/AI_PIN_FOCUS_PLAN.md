# AI-Suggested Pins Focus & Add to Plan

## Summary
When Claude suggests map pins, the map should automatically focus on those pins and display the first pin's details in the right sidebar. Users can then add pins to Plan A or B with a time picker modal.

## Implementation Steps

### 1. Add State for "New Pins" Tracking
**File:** `src/stores/uiStore.ts`

Add a `newlyAddedPins` state field and action to track when pins are freshly added (for triggering map focus):

```typescript
interface UIState {
  // ... existing
  newlyAddedPins: DynamicPin[] | null;  // Pins just added, triggers focus

  // New action
  setNewlyAddedPins: (pins: DynamicPin[] | null) => void;
}
```

Modify `addDynamicPins` to also set `newlyAddedPins` so the map knows to focus.

---

### 2. Create DynamicPinBoundsController
**File:** `src/components/Map/FullScreenMap.tsx`

Add a new controller component that reacts to `newlyAddedPins`:

```typescript
function DynamicPinBoundsController({ newlyAddedPins, onFirstPinSelect }) {
  const map = useMap();

  useEffect(() => {
    if (!newlyAddedPins || newlyAddedPins.length === 0) return;

    // Fit map bounds to show all new pins
    const bounds = L.latLngBounds(newlyAddedPins.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });

    // Select first pin after animation
    setTimeout(() => onFirstPinSelect(newlyAddedPins[0]), 500);
  }, [newlyAddedPins, map, onFirstPinSelect]);

  return null;
}
```

---

### 3. Wire Up Map Focus in TripPlannerApp
**File:** `src/pages/TripPlannerApp.tsx`

- Pass `newlyAddedPins` to FullScreenMap
- After pins are processed and sidebar opens, clear `newlyAddedPins` to prevent re-triggering
- When first pin is selected via callback, convert to Location and call `selectLocation()`

---

### 4. Create AddToPlanModal Component
**File:** `src/components/ui/AddToPlanModal.tsx` (new)

A modal that appears when user clicks "Add to Plan A/B":

```
┌──────────────────────────────────────┐
│  Add to Plan A                    X  │
├──────────────────────────────────────┤
│  [pin icon] [Location Name]          │
│                                      │
│  Day:   [Dropdown: Day 1, Day 2...]  │
│                                      │
│  Start: [Time Picker]                │
│  End:   [Time Picker]                │
│                                      │
│  Notes: [Optional textarea]          │
│                                      │
│  ┌────────────┐  ┌────────────────┐  │
│  │   Cancel   │  │  Add to Plan   │  │
│  └────────────┘  └────────────────┘  │
└──────────────────────────────────────┘
```

Features:
- Day selector (defaults to currently selected day)
- Time pickers with sensible defaults (e.g., after last item in plan)
- Optional notes field
- Submit calls `onAdd({ dayId, startTime, endTime, notes })`

---

### 5. Update RightDetailPanel
**File:** `src/components/Layout/RightDetailPanel.tsx`

- Add state for showing AddToPlanModal
- When "Add to Plan A/B" clicked, open modal with plan type
- Pass location info to modal
- On modal submit, call parent's `onAddToPlan` with full details

---

### 6. Implement onAddToPlan Handler
**File:** `src/pages/TripPlannerApp.tsx`

Currently `onAddToPlan` just logs. Update to:

1. For static locations: Add schedule item to local DAILY_PLANS
2. For dynamic pins: Convert pin to schedule-compatible format, add to plan

For MVP, use local state updates. Later can integrate with Convex mutations.

```typescript
const handleAddToPlan = (plan: 'A' | 'B', details: {
  location: Location;
  dayId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}) => {
  // Add to the appropriate plan's schedule
  // Update local state or call Convex mutation
};
```

---

### 7. Add AI-Suggested Badge to Sidebar
**File:** `src/components/Layout/RightDetailPanel.tsx`

When displaying a dynamic pin (detected by `id.startsWith('dynamic-')`), show a special badge:
- "AI Suggested" badge with sparkle icon in header
- Show the `reason` field if present

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/stores/uiStore.ts` | Add `newlyAddedPins` state + action |
| `src/components/Map/FullScreenMap.tsx` | Add `DynamicPinBoundsController`, pass new props |
| `src/pages/TripPlannerApp.tsx` | Wire up focus flow, implement `onAddToPlan` handler |
| `src/components/Layout/RightDetailPanel.tsx` | Add modal trigger, AI badge |
| `src/components/ui/AddToPlanModal.tsx` | **New file** - Time picker modal |

## Data Flow

```
Claude returns pins
    ↓
handleSendMessage extracts pins
    ↓
addDynamicPins() + setNewlyAddedPins()
    ↓
FullScreenMap receives newlyAddedPins
    ↓
DynamicPinBoundsController fits bounds
    ↓
After 500ms, calls onFirstPinSelect(pin)
    ↓
TripPlannerApp converts pin → Location
    ↓
selectLocation() opens RightDetailPanel
    ↓
User clicks "Add to Plan A"
    ↓
AddToPlanModal opens with time picker
    ↓
User selects day, time, submits
    ↓
Schedule item added to plan
```

## Edge Cases
- Single pin: Center on pin at zoom 14 instead of fitBounds
- No pins returned: No action needed
- User closes sidebar before adding: Pins remain on map
- Dynamic pins persist until user clears them via chat widget

## Testing
1. Ask Claude "recommend restaurants near KLCC"
2. Map should zoom to show suggested pins
3. Right sidebar should open with first pin details
4. Click "Add to Plan A" → modal opens
5. Select day + time → click Add
6. Pin should appear in that day's itinerary
