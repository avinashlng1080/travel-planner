# Mobile Responsiveness Plan

> *"Touch targets must be generous. Color must never be the only indicator. WCAG 2.1 Level AA is the floor, not the ceiling."* — CLAUDE.md

## Current State: NOT Mobile Responsive

The app is desktop-first with virtually zero responsive breakpoints in core components. Critical panels exceed mobile viewport widths, and touch targets are below recommended minimums.

---

## Critical Issues Summary

| Issue | Components Affected | Severity |
|-------|-------------------|----------|
| Fixed widths > 375px | TripPlannerPanel (420px), RightDetailPanel (384px), AIChatWidget (384px), SuggestionsPanel (380px) | **CRITICAL** |
| No responsive breakpoints | NavigationDock, LeftSidebar, BottomItineraryBar, all floating panels | **CRITICAL** |
| Touch targets < 44px | All header buttons, nav dock, panel controls, checkboxes | **HIGH** |
| Panel positions off-screen | Checklist panel (x: 500), BottomItineraryBar (left: 288px offset) | **HIGH** |
| Drag handles invisible on touch | DraggableItem uses `hover:` for visibility | **HIGH** |
| Font sizes too small | text-[9px], text-[10px], text-[11px] throughout | **MEDIUM** |

---

## Implementation Phases

### Phase 1: Critical Layout Fixes (Unblocks Mobile Usage)

These issues completely break the mobile experience and must be fixed first.

#### 1.1 RightDetailPanel - Full Screen on Mobile
**File:** `src/components/layout/RightDetailPanel.tsx`

```tsx
// Before
className="fixed top-14 right-0 bottom-0 z-40 w-96"

// After
className="fixed top-0 md:top-14 left-0 md:left-auto right-0 bottom-0 z-40 w-full md:w-96"
```

#### 1.2 NavigationDock - Hide on Mobile
**File:** `src/components/layout/NavigationDock.tsx`

```tsx
// Before
className="fixed left-0 z-40 w-14 flex flex-col"

// After
className="hidden md:fixed md:left-0 md:z-40 md:w-14 md:flex md:flex-col"
```

#### 1.3 BottomItineraryBar - Fix Positioning
**File:** `src/components/layout/BottomItineraryBar.tsx`

```tsx
// Before
className="fixed bottom-0 left-72 right-0 z-30"

// After
className="fixed bottom-0 left-0 md:left-14 lg:left-72 right-0 z-30"
```

#### 1.4 LeftSidebar - Hide on Mobile
**File:** `src/components/layout/LeftSidebar.tsx`

```tsx
// Before
className="fixed top-14 left-0 bottom-0 z-40"

// After
className="hidden lg:fixed lg:top-14 lg:left-0 lg:bottom-0 lg:z-40"
```

#### 1.5 Create Mobile Navigation Bar
**File:** `src/components/layout/MobileNavBar.tsx` (NEW)

Bottom tab bar visible only on mobile with icons for:
- Days/Calendar
- Itinerary/Map
- Checklist
- Filters
- Chat toggle

```tsx
className="fixed md:hidden bottom-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-xl border-t"
```

---

### Phase 2: Floating Panel System (Responsive Sizing)

#### 2.1 Create useResponsivePanel Hook
**File:** `src/hooks/useResponsivePanel.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';

interface ResponsivePanelSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
}

export function useResponsivePanel(
  desktopWidth: number,
  desktopHeight: number
): ResponsivePanelSize {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;

  return {
    width: isMobile
      ? windowSize.width - 32
      : isTablet
        ? Math.min(windowSize.width - 64, desktopWidth)
        : desktopWidth,
    height: isMobile
      ? Math.min(windowSize.height * 0.85, desktopHeight)
      : desktopHeight,
    isMobile,
    isTablet,
  };
}
```

#### 2.2 Update FloatingPanel for Mobile
**File:** `src/components/ui/FloatingPanel.tsx`

- Full-screen maximize on mobile (no margins)
- Bottom sheet animation on mobile
- Larger touch targets for controls
- Swipe-to-close gesture support

#### 2.3 Update Default Panel Positions
**File:** `src/stores/floatingPanelStore.ts`

```typescript
const getDefaultPosition = (id: PanelId): Position => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return { x: 16, y: 70 }; // All panels start at same position on mobile
  }

  const positions: Record<PanelId, Position> = {
    tripPlanner: { x: 70, y: 70 },
    days: { x: 70, y: 70 },
    checklist: { x: 500, y: 100 },
    alerts: { x: 400, y: 200 },
    suggestions: { x: 200, y: 150 },
    filters: { x: 70, y: 400 },
  };

  return positions[id];
};
```

#### 2.4 Update All Floating Panels
Apply responsive sizing to each panel:

| Panel | Desktop Size | Mobile Size |
|-------|-------------|-------------|
| TripPlannerPanel | 420 x 580 | 100vw - 32px x 85vh |
| DaysPanel | 320 x 450 | 100vw - 32px x 70vh |
| FiltersPanel | 300 x 400 | 100vw - 32px x 60vh |
| SuggestionsPanel | 380 x 450 | 100vw - 32px x 70vh |
| ChecklistFloatingPanel | 400 x 500 | 100vw - 32px x 80vh |
| AlertsPanel | 400 x 450 | 100vw - 32px x 70vh |

---

### Phase 3: Touch Target Improvements

Per WCAG 2.1 and Apple/Google guidelines, minimum touch target is **44x44px**.

#### 3.1 Panel Control Buttons
**File:** `src/components/ui/FloatingPanel.tsx`

```tsx
// Before
<button className="p-1.5 text-slate-600">
  <Minus className="w-4 h-4" />
</button>

// After
<button className="p-2.5 md:p-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0">
  <Minus className="w-5 h-5 md:w-4 md:h-4" />
</button>
```

#### 3.2 Navigation Dock Buttons
**File:** `src/components/layout/NavigationDock.tsx`

```tsx
// Before
className="w-10 h-10"

// After
className="w-11 h-11" // 44px
```

#### 3.3 Header Buttons
**File:** `src/components/layout/FloatingHeader.tsx`

```tsx
// Before
className="p-2"

// After
className="p-2.5 min-w-[44px] min-h-[44px]"
```

#### 3.4 Form Inputs
**File:** `src/components/ui/GlassPanel.tsx`

```tsx
// Before (GlassInput)
className="px-4 py-2"

// After
className="px-4 py-3" // Results in ~48px height
```

#### 3.5 Checkboxes with Touch Area
**File:** `src/components/floating/FiltersPanel.tsx`

```tsx
// Wrap checkbox in larger touch area
<label className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg">
  <input type="checkbox" className="w-5 h-5" />
  <span>{label}</span>
</label>
```

---

### Phase 4: Drag-and-Drop Touch Support

#### 4.1 Always Show Drag Handles on Mobile
**File:** `src/components/Itinerary/DraggableItem.tsx`

```tsx
// Before
className="opacity-0 group-hover:opacity-100"

// After
className="opacity-100 md:opacity-0 md:group-hover:opacity-100"
```

#### 4.2 Optimize Touch Sensor
**File:** `src/components/Itinerary/PlanBuilder.tsx`

```tsx
// Before
useSensor(TouchSensor, {
  activationConstraint: { delay: 200, tolerance: 8 },
})

// After
useSensor(TouchSensor, {
  activationConstraint: { delay: 150, tolerance: 12 },
})
```

#### 4.3 Larger Drop Zones on Mobile
**File:** `src/components/Itinerary/PlanColumn.tsx`

```tsx
// Before
className="min-h-[200px]"

// After
className="min-h-[300px] md:min-h-[200px]"
```

---

### Phase 5: Chat Widget Mobile Experience

**File:** `src/components/layout/AIChatWidget.tsx`

#### 5.1 Responsive Width

```tsx
const isMobile = windowSize.width < 768;

const normalSize = {
  width: isMobile ? windowSize.width - 32 : 384,
  height: isMobile ? windowSize.height - 100 : 500,
};
```

#### 5.2 Remove Nav Dock Offset on Mobile

```tsx
const NAV_DOCK_WIDTH = isMobile ? 0 : 56;
```

#### 5.3 Full-Screen Positioning on Mobile

```tsx
animate={{
  right: isMobile ? 16 : (isMaximized ? PADDING : 16),
  bottom: isMobile ? 16 : (isMaximized ? PADDING : 16),
  width: isMobile && isMaximized ? windowSize.width - 32 : currentWidth,
}}
```

---

### Phase 6: Typography & Readability

#### 6.1 Minimum Font Sizes
Replace tiny font sizes with responsive alternatives:

```tsx
// Before
className="text-[9px]"
className="text-[10px]"
className="text-[11px]"

// After
className="text-xs" // 12px minimum
className="text-xs md:text-[10px]"
className="text-sm md:text-xs"
```

#### 6.2 Responsive Headings
**File:** `src/pages/LandingPage.tsx`

```tsx
// Before
className="text-4xl sm:text-5xl lg:text-6xl"

// After
className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl"
```

---

### Phase 7: Map Optimizations

**File:** `src/components/map/FullScreenMap.tsx`

#### 7.1 Responsive Marker Sizing

```tsx
const getMarkerSize = (isSelected: boolean) => {
  const isMobile = window.innerWidth < 768;
  if (isSelected) {
    return isMobile ? 52 : 48;
  }
  return isMobile ? 44 : 40;
};
```

#### 7.2 Touch-Friendly Map Controls

```css
/* In globals.css */
@media (max-width: 768px) {
  .leaflet-control-zoom a {
    width: 44px !important;
    height: 44px !important;
    line-height: 44px !important;
    font-size: 20px !important;
  }
}
```

#### 7.3 Mobile Popup Styling

```css
/* In globals.css */
@media (max-width: 768px) {
  .leaflet-popup-content-wrapper {
    max-width: calc(100vw - 48px) !important;
  }
  .leaflet-popup-content {
    font-size: 14px !important;
  }
}
```

---

## Recommended Breakpoint Strategy

Add to `tailwind.config.js`:

```javascript
theme: {
  screens: {
    'xs': '375px',   // iPhone SE and up
    'sm': '640px',   // Large phones / small tablets
    'md': '768px',   // Tablets
    'lg': '1024px',  // Desktop
    'xl': '1280px',  // Large desktop
    '2xl': '1536px', // Extra large
  },
}
```

---

## Testing Checklist

### Devices
- [ ] iPhone SE (375px) - smallest modern device
- [ ] iPhone 14 (390px) - current standard
- [ ] iPhone 14 Plus (428px) - large phone
- [ ] Android (360px) - common budget phones
- [ ] iPad Mini (768px) - tablet breakpoint
- [ ] iPad (1024px) - large tablet

### Interactions
- [ ] All touch targets >= 44px
- [ ] No horizontal scrolling on any page
- [ ] Virtual keyboard doesn't break layout
- [ ] Landscape orientation works
- [ ] Drag-and-drop works on touch
- [ ] Panels don't overflow viewport
- [ ] Map is usable with touch gestures

### Accessibility
- [ ] VoiceOver navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Text is readable at all sizes

---

## Files to Create

1. `src/hooks/useResponsivePanel.ts` - Viewport-aware panel sizing
2. `src/components/layout/MobileNavBar.tsx` - Bottom navigation for mobile

## Files to Modify

### Phase 1 (Critical)
- `src/components/layout/RightDetailPanel.tsx`
- `src/components/layout/NavigationDock.tsx`
- `src/components/layout/BottomItineraryBar.tsx`
- `src/components/layout/LeftSidebar.tsx`
- `src/App.tsx` (add MobileNavBar)

### Phase 2 (Panels)
- `src/components/ui/FloatingPanel.tsx`
- `src/stores/floatingPanelStore.ts`
- `src/components/floating/TripPlannerPanel.tsx`
- `src/components/floating/DaysPanel.tsx`
- `src/components/floating/FiltersPanel.tsx`
- `src/components/floating/SuggestionsPanel.tsx`
- `src/components/floating/ChecklistFloatingPanel.tsx`
- `src/components/floating/AlertsPanel.tsx`

### Phase 3 (Touch Targets)
- `src/components/ui/GlassPanel.tsx`
- `src/components/layout/FloatingHeader.tsx`
- `src/components/layout/AIChatWidget.tsx`
- `src/pages/LandingPage.tsx`
- `src/components/auth/AuthModal.tsx`

### Phase 4 (Drag-and-Drop)
- `src/components/Itinerary/DraggableItem.tsx`
- `src/components/Itinerary/PlanBuilder.tsx`
- `src/components/Itinerary/PlanColumn.tsx`

### Phase 5 (Chat)
- `src/components/layout/AIChatWidget.tsx`

### Phase 6 (Typography)
- Multiple files with small font sizes

### Phase 7 (Map)
- `src/components/map/FullScreenMap.tsx`
- `src/styles/globals.css`

---

## Success Metrics

- [ ] Lighthouse Mobile Score > 90
- [ ] All touch targets >= 44px
- [ ] No horizontal overflow on 320px viewport
- [ ] Time to Interactive < 3s on 3G
- [ ] WCAG 2.1 AA compliance
