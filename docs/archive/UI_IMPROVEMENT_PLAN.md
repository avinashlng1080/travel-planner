# Travel Planner UI Improvement Plan

## Status Update

### What's Working
- Map as full background (FullScreenMap at z-0)
- AI Chat widget (already floating, PostHog-style)
- Right detail panel (floating when location selected)
- CORS and web search on chat
- Light theme applied

### What's NOT Working
1. **Day switching** - Clicking days doesn't update itinerary view
2. **Sidebar items non-functional** - Suggestions, Alerts, Checklist menu items do nothing
3. **UI cramped** - Everything squashed in left sidebar
4. **Drag-and-drop missing** - Components exist but not integrated
5. **No floating windows** - Need PostHog-style panels

### Key Discovery
**Drag-and-drop already implemented!** Found at:
- `src/components/Itinerary/DayPlan.tsx` - Full @dnd-kit implementation
- `src/components/Itinerary/DraggableItem.tsx` - Draggable schedule items
- Just needs integration into the main UI

---

## Implementation Plan

### Phase 1: Fix Day Switching (Critical)

**File:** `src/App.tsx`

**Issue:** `selectedDayId` passed to LeftSidebar is `selectedDayPlan?.id` (computed), not the actual store value. When no day is explicitly selected, the comparison fails.

**Fix:**
```typescript
// Line 186: Change from
selectedDayId={selectedDayPlan?.id}
// To:
selectedDayId={selectedDayId || selectedDayPlan?.id}
```

---

### Phase 2: Create Floating Panel System

#### 2.1 New Component: FloatingPanel.tsx
**File:** `src/components/ui/FloatingPanel.tsx`

PostHog-style floating window with:
- Draggable header (framer-motion drag)
- Minimize/maximize button
- Close button
- Glass styling (backdrop-blur)
- Focus management (bring to front on click)

```typescript
interface FloatingPanelProps {
  id: string;
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}
```

#### 2.2 New Store: floatingPanelStore.ts
**File:** `src/stores/floatingPanelStore.ts`

```typescript
interface FloatingPanelState {
  panels: {
    days: PanelState;
    itinerary: PanelState;
    checklist: PanelState;
    alerts: PanelState;
    suggestions: PanelState;
    filters: PanelState;
  };
  openPanel: (id: string) => void;
  closePanel: (id: string) => void;
  toggleMinimize: (id: string) => void;
  bringToFront: (id: string) => void;
}
```

---

### Phase 3: Convert Sidebar to Navigation Dock

#### 3.1 New Component: NavigationDock.tsx
**File:** `src/components/layout/NavigationDock.tsx`

Minimal vertical icon bar (56px wide) that opens floating panels:
- Calendar icon → Days panel
- Map icon → Itinerary panel
- CheckSquare icon → Checklist panel
- AlertTriangle icon → Alerts panel
- Lightbulb icon → Suggestions panel
- Filter icon → Filters panel

#### 3.2 Deprecate LeftSidebar.tsx
Move content into separate floating panel components.

---

### Phase 4: Create Floating Panel Components

| Panel | File | Size | Content Source |
|-------|------|------|----------------|
| Days | `src/components/floating/DaysPanel.tsx` | 320x400 | Extract from LeftSidebar |
| Itinerary | `src/components/floating/ItineraryPanel.tsx` | 450x600 | Use existing `DayPlan.tsx` with drag-drop |
| Checklist | `src/components/floating/ChecklistFloatingPanel.tsx` | 400x500 | Wrap existing `ChecklistPanel.tsx` |
| Alerts | `src/components/floating/AlertsPanel.tsx` | 400x500 | Wrap existing `SafetyPanel.tsx` |
| Suggestions | `src/components/floating/SuggestionsPanel.tsx` | 350x400 | NEW - weather/time/nearby recommendations |
| Filters | `src/components/floating/FiltersPanel.tsx` | 280x350 | Extract from LeftSidebar |

---

### Phase 5: Integrate Drag-and-Drop

**File:** `src/components/floating/ItineraryPanel.tsx`

Connect existing `DayPlan.tsx` component:
```typescript
<DayPlan
  dayPlan={selectedDayPlan}
  onReorder={(plan, itemIds) => reorderSchedule(selectedDayId, plan, itemIds)}
/>
```

Add to `src/stores/uiStore.ts`:
```typescript
customSchedules: Record<string, { planA?: string[], planB?: string[] }>;
reorderSchedule: (dayId: string, plan: 'A' | 'B', itemIds: string[]) => void;
```

---

### Phase 6: Update App.tsx Layout

```typescript
<div className="h-screen overflow-hidden">
  <FullScreenMap />           {/* z-0 */}
  <FloatingHeader />          {/* z-50 */}
  <NavigationDock />          {/* z-40, left side */}

  {/* Floating Panels - z-40-49 */}
  <DaysPanel />
  <ItineraryPanel />
  <ChecklistFloatingPanel />
  <AlertsPanel />
  <SuggestionsPanel />
  <FiltersPanel />

  {selectedLocation && <RightDetailPanel />}  {/* z-40 */}
  <AIChatWidget />            {/* z-50 */}
</div>
```

---

## Files to Create

1. `src/components/ui/FloatingPanel.tsx`
2. `src/stores/floatingPanelStore.ts`
3. `src/components/layout/NavigationDock.tsx`
4. `src/components/floating/DaysPanel.tsx`
5. `src/components/floating/ItineraryPanel.tsx`
6. `src/components/floating/ChecklistFloatingPanel.tsx`
7. `src/components/floating/AlertsPanel.tsx`
8. `src/components/floating/SuggestionsPanel.tsx`
9. `src/components/floating/FiltersPanel.tsx`

## Files to Modify

1. `src/App.tsx` - Fix day switching, new layout, remove BottomItineraryBar
2. `src/stores/uiStore.ts` - Add reorder actions

## Files to Deprecate

1. `src/components/layout/LeftSidebar.tsx` - Replace with NavigationDock
2. `src/components/layout/BottomItineraryBar.tsx` - Replace with floating ItineraryPanel

---

## Implementation Order

| Step | Task | Parallel Agents |
|------|------|-----------------|
| 1 | Fix day switching in App.tsx | 1 |
| 2 | Create FloatingPanel.tsx + floatingPanelStore.ts | 2 |
| 3 | Create NavigationDock.tsx | 1 |
| 4 | Create all 6 floating panel components | 3 |
| 5 | Update App.tsx with new layout | 1 |
| 6 | Connect drag-and-drop to store | 1 |
| 7 | Test and polish | 1 |

**Estimated: 6 parallel agent batches**
