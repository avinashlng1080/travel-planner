# Map Routing Improvements Plan

**Branch:** `feat/map-routing-improvements`
**Priority:** High
**Estimated Impact:** Significant UX improvement for trip visualization

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Design (Leaflet)](#architecture-design)
3. [Implementation Phases (Leaflet)](#implementation-phases)
4. [Google Maps Migration Plan](#google-maps-migration-plan)
5. [Testing Checklist](#testing-checklist)
6. [Risk Assessment](#risk-assessment)

---

## Problem Statement

The current map routing has three key issues identified from user feedback:

### Issue 1: Routes Loop Back (Star Pattern)
**Current Behavior:** Routes form a "star" pattern, going from the center (home base) outward to each location and back, instead of showing a linear progression.

**Root Cause:** Found in `src/hooks/useDayRoute.ts:67-70`:
```typescript
const sortedItems = dayScheduleItems.sort((a, b) => {
  if (a.order !== b.order) return a.order - b.order;
  return a.startTime.localeCompare(b.startTime);
});
```

The sorting is correct (order first, then time), but the visual issue occurs because:
1. When items are manually reordered via drag-and-drop, the `order` field updates
2. The route respects this new order, which may not be chronologically logical
3. If the first activity is "Airport" (arrival), then activities are added in between, the route shows: Airport → Site A → Site B → (back towards Airport area)

**Expected Behavior:** Route should show a logical progression based on the time-of-day schedule, with option for manual override.

### Issue 2: Home Base Marker Not Prominent
**Current Behavior:** Home base uses the same house SVG marker as other locations but can get visually lost among many markers.

**Location:** `src/components/Map/FullScreenMap.tsx:71-79` - home-base SVG marker

**Expected Behavior:** Home base should have:
- Larger icon size
- Distinctive "Home" icon (Lucide Home icon inside)
- Always visible (not filtered out)
- Higher z-index to stay above other markers

### Issue 3: Map Doesn't React to Activity Clicks
**Current Behavior:** Clicking an activity in TripPlannerPanel opens ActivityDetailPanel but doesn't focus the map on that location.

**Root Cause:** Disconnected state management:
- `TripViewPage.tsx` has `selectedActivityId` state
- `FullScreenMap.tsx` receives `selectedLocation` prop (Location type)
- These two are never synchronized
- `selectedLocationAtom` in `src/atoms/uiAtoms.ts` is separate from activity selection

**Flow Analysis:**
```
TripPlannerPanel.onActivityClick(activityId)
  → TripViewPage.setSelectedActivityId(activityId)
  → ActivityDetailPanel opens
  → Map: No reaction (selectedLocation unchanged)
```

**Expected Behavior:** When clicking activity in Trip Planner:
1. Map should fly to the activity's location
2. Location marker should highlight (pulsing effect)
3. Optionally show a popup/tooltip with activity details

---

## Architecture Design

### Solution 1: Hybrid Time-Based Sorting with Manual Override

**Approach:** Sort activities primarily by `startTime` for route display, while preserving `order` field for UI list ordering.

**Files to Modify:**

1. **`src/hooks/useDayRoute.ts`**
   - Create new sorting strategy: `sortByTimeForRouting()`
   - Route should always use chronological order (startTime)
   - This ensures the polyline shows logical travel progression

```typescript
// New sorting function for route visualization
function sortByTimeForRouting(items: ScheduleItem[]) {
  return [...items].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });
}
```

2. **`src/utils/sortScheduleItems.ts`**
   - Keep existing `sortScheduleItems()` for UI display (order-based)
   - Add new export `sortScheduleItemsForRoute()` (time-based)

**Trade-offs:**
- (+) Routes always make geographical sense
- (+) No changes to drag-and-drop behavior
- (-) Users might be confused if list order differs from route order
- Mitigation: Add visual numbering on route (1 → 2 → 3)

### Solution 2: Enhanced Home Base Marker

**Approach:** Create distinct, always-visible home base marker.

**Files to Modify:**

1. **`src/components/Map/FullScreenMap.tsx`**
   - Create new `createHomeBaseMarkerSVG()` function
   - Larger size (52x52 vs 40x40)
   - Add Lucide Home icon in center
   - Higher z-index via `zIndexOffset` prop
   - Always render (bypass category filter)

```typescript
function createHomeBaseIcon(isSelected: boolean = false) {
  const size = isSelected ? 60 : 52;
  // Larger house with Home icon inside
  // Pulsing ring animation
  // Higher contrast colors
  return L.divIcon({
    html: createHomeBaseMarkerSVG(size, isSelected),
    className: 'custom-marker home-base-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}
```

2. **`src/components/Map/FullScreenMap.tsx` - Marker rendering**
   - Split home-base markers from regular location markers
   - Render home-base markers last (on top)
   - Add `zIndexOffset={1000}` to home-base Marker component

### Solution 3: Activity-to-Map Synchronization

**Approach:** Create new atom `focusedActivityAtom` that syncs activity selection to map focus.

**Files to Modify:**

1. **`src/atoms/uiAtoms.ts`**
   - Add new atom: `focusedActivityAtom`
   - Type: `{ activityId: string; locationId: string; lat: number; lng: number } | null`

```typescript
export interface FocusedActivity {
  activityId: string;
  locationId: string;
  lat: number;
  lng: number;
}

export const focusedActivityAtom = atom<FocusedActivity | null>(null);
```

2. **`src/pages/TripViewPage.tsx`**
   - When activity is clicked, look up its location
   - Set `focusedActivityAtom` with location coordinates
   - This triggers map to fly to location

```typescript
const handleActivityClick = (activityId: string) => {
  setSelectedActivityId(activityId as Id<'tripScheduleItems'>);

  // Find activity and its location
  const activity = scheduleItems?.find(item => item._id === activityId);
  if (activity?.locationId) {
    const location = tripLocations?.find(loc => loc._id === activity.locationId);
    if (location) {
      setFocusedActivity({
        activityId,
        locationId: activity.locationId,
        lat: location.customLat || location.baseLocation?.lat || 0,
        lng: location.customLng || location.baseLocation?.lng || 0,
      });
    }
  }
};
```

3. **`src/components/Map/FullScreenMap.tsx`**
   - Add new controller: `FocusedActivityController`
   - Listen to `focusedActivityAtom`
   - Fly to coordinates when activity is focused
   - Highlight the marker with pulsing effect

```typescript
interface FocusedActivityControllerProps {
  focusedActivity: FocusedActivity | null;
}

function FocusedActivityController({ focusedActivity }: FocusedActivityControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (focusedActivity) {
      map.flyTo([focusedActivity.lat, focusedActivity.lng], 15, {
        duration: 0.8,
      });
    }
  }, [focusedActivity, map]);

  return null;
}
```

4. **Marker highlighting**
   - Pass `focusedActivityId` to FullScreenMap
   - In marker rendering, check if marker's locationId matches focused activity
   - Apply pulsing CSS animation to focused marker

---

## Implementation Phases

### Phase 1: Route Sorting Fix (Priority: Critical)

**Goal:** Fix looping routes by using time-based sorting for route visualization.

**Tasks:**
1. [ ] Create `sortScheduleItemsForRoute()` in `src/utils/sortScheduleItems.ts`
2. [ ] Update `src/hooks/useDayRoute.ts` to use time-based sorting
3. [ ] Add route numbering markers (optional enhancement)
4. [ ] Test with various day itineraries

**Files:**
- `src/utils/sortScheduleItems.ts`
- `src/hooks/useDayRoute.ts`

**Testing:**
- Create a day with Airport arrival, 3 city locations, return to home base
- Verify route shows: Airport → Location 1 → Location 2 → Location 3 → Home
- Verify drag-and-drop still works in TripPlannerPanel

### Phase 2: Home Base Enhancement (Priority: High)

**Goal:** Make home base marker distinctive and always visible.

**Tasks:**
1. [ ] Create `createHomeBaseMarkerSVG()` function with larger, distinctive design
2. [ ] Add pulsing ring animation for home base
3. [ ] Render home base markers separately with `zIndexOffset={1000}`
4. [ ] Ensure home base bypasses category filter
5. [ ] Add CSS for `.home-base-marker` class

**Files:**
- `src/components/Map/FullScreenMap.tsx`

**Design:**
- Size: 52x52px (regular: 40x40px)
- Color: Keep #F97316 (sunset coral)
- Shape: House with visible Home icon inside
- Ring: Subtle pulsing orange glow
- Always on top of other markers

### Phase 3: Activity-Map Sync (Priority: High)

**Goal:** Map reacts when clicking activities in Trip Planner panel.

**Tasks:**
1. [ ] Create `focusedActivityAtom` in `src/atoms/uiAtoms.ts`
2. [ ] Update `TripViewPage.tsx` to set focused activity on click
3. [ ] Create `FocusedActivityController` component in `FullScreenMap.tsx`
4. [ ] Add marker highlighting for focused activity
5. [ ] Add CSS for pulsing/highlighting effect
6. [ ] Clear focused activity when closing ActivityDetailPanel

**Files:**
- `src/atoms/uiAtoms.ts`
- `src/pages/TripViewPage.tsx`
- `src/components/Map/FullScreenMap.tsx`

**UX Flow:**
1. User clicks activity in Trip Planner
2. Map smoothly flies to location (0.8s animation)
3. Marker pulses/highlights
4. ActivityDetailPanel opens
5. Clicking map elsewhere clears highlight

### Phase 4: Route Numbering (Priority: Nice-to-Have)

**Goal:** Add numbered circles along the route showing visit order.

**Tasks:**
1. [ ] Create `RouteNumberMarker` component
2. [ ] Add numbered circles at each waypoint
3. [ ] Style to match plan color (green for A, blue for B)
4. [ ] Numbers should be small (20x20px) and positioned at waypoint

**Files:**
- `src/components/Map/DayRouteLayer.tsx` (or new `RouteNumberMarkers.tsx`)

---

## Google Maps Migration Plan

### Overview

This section provides a comprehensive migration plan from the current React-Leaflet + OpenRouteService stack to Google Maps Platform. This is a **separate initiative** that can be executed after or instead of the Leaflet-based improvements above.

**Branch:** `feat/google-maps-migration`

---

### Current Stack Analysis

#### Dependencies to Remove
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.12"
}
```

#### Files Using Leaflet (8 files total)

| File | Lines | Leaflet Usage |
|------|-------|---------------|
| `src/components/Map/FullScreenMap.tsx` | 593 | Main map, markers, controllers, layers |
| `src/components/Map/RoutingLayer.tsx` | 86 | Polyline for routes |
| `src/components/Map/DayRouteLayer.tsx` | 68 | Day-specific route polyline |
| `src/components/Map/POILayer.tsx` | 161 | POI markers with emoji icons |
| `src/components/Map/CustomMarker.tsx` | 69 | Reusable marker component |
| `src/components/trips/ActivityDetailPanel.tsx` | ~200 | Mini map in detail panel |
| `src/hooks/useRouting.ts` | 195 | OpenRouteService API |
| `src/hooks/useDayRoute.ts` | 107 | Route waypoint builder |

#### Current API Usage
- **OpenRouteService**: Free tier 2,000 req/day for driving directions
- **CARTO Tiles**: Free base map tiles (light/dark/satellite via ESRI)
- **No API keys required** for map rendering (only for routing)

---

### Google Maps Dependencies

#### Recommended Library: `@vis.gl/react-google-maps`
Modern, well-maintained React wrapper with hooks-based API (successor to `@react-google-maps/api`).

```bash
npm install @vis.gl/react-google-maps
npm uninstall leaflet react-leaflet @types/leaflet
```

#### Alternative: `@react-google-maps/api`
More established but less modern API.

```bash
npm install @react-google-maps/api
```

---

### Google Maps API Requirements

#### APIs to Enable (Google Cloud Console)

| API | Purpose | Pricing |
|-----|---------|---------|
| **Maps JavaScript API** | Base map rendering | $7 per 1,000 loads |
| **Directions API** | Route calculation | $5 per 1,000 requests |
| **Places API** (optional) | Location search, autocomplete | $17 per 1,000 requests |
| **Geocoding API** (optional) | Address ↔ coordinates | $5 per 1,000 requests |

#### Pricing Estimate

Google provides **$200/month free credit** which covers:
- ~28,500 map loads/month
- ~40,000 directions requests/month

For a travel planning app with moderate usage, this should be **sufficient for free tier**.

#### Environment Variables

```env
# .env
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Remove
# VITE_ORS_API_KEY=...
```

#### Convex Environment (for server-side usage)
```
GOOGLE_MAPS_API_KEY=AIza...
```

---

### Component Migration Map

#### Leaflet → Google Maps Equivalents

| Leaflet Component | Google Maps Equivalent | Notes |
|-------------------|----------------------|-------|
| `<MapContainer>` | `<APIProvider>` + `<Map>` | API key required |
| `<TileLayer>` | Built-in (Google tiles) | No separate component |
| `<Marker>` | `<AdvancedMarker>` | Custom HTML supported |
| `<Popup>` | `<InfoWindow>` | Slightly different API |
| `<Polyline>` | `<Polyline>` (from drawing lib) | Or use DirectionsRenderer |
| `useMap()` | `useMap()` | Similar hook API |
| `useMapEvents()` | Event props on `<Map>` | Different pattern |
| `L.divIcon()` | `<AdvancedMarker>` children | React components as markers |
| `L.latLngBounds()` | `google.maps.LatLngBounds` | Direct API usage |
| `map.flyTo()` | `map.panTo()` + `map.setZoom()` | Or use `moveCamera()` |
| `map.fitBounds()` | `map.fitBounds()` | Same concept |
| `<LayersControl>` | Custom UI + `setMapTypeId()` | Manual implementation |

---

### Migration Phases

#### Phase M1: Setup and Infrastructure

**Tasks:**
1. [ ] Create Google Cloud project
2. [ ] Enable Maps JavaScript API
3. [ ] Enable Directions API
4. [ ] Generate API key with domain restrictions
5. [ ] Add `VITE_GOOGLE_MAPS_API_KEY` to `.env`
6. [ ] Install `@vis.gl/react-google-maps`
7. [ ] Create `src/components/Map/GoogleMap/` directory structure

**New Files:**
```
src/components/Map/GoogleMap/
├── GoogleMapProvider.tsx    # APIProvider wrapper
├── GoogleFullScreenMap.tsx  # Main map component
├── GoogleMarker.tsx         # Custom marker with SVG
├── GoogleRouteLayer.tsx     # Directions renderer
├── GooglePOILayer.tsx       # POI markers
└── index.ts                 # Exports
```

#### Phase M2: Core Map Component

**Goal:** Create `GoogleFullScreenMap.tsx` with feature parity to `FullScreenMap.tsx`.

**Tasks:**
1. [ ] Create `GoogleMapProvider.tsx` with `<APIProvider>`
2. [ ] Create `GoogleFullScreenMap.tsx` with base map
3. [ ] Implement map controls (zoom, map type)
4. [ ] Add map event handlers (click, drag, zoom)
5. [ ] Create `MapController` equivalent using `useMap()` hook

**Code Structure:**

```tsx
// src/components/Map/GoogleMap/GoogleMapProvider.tsx
import { APIProvider } from '@vis.gl/react-google-maps';

interface GoogleMapProviderProps {
  children: React.ReactNode;
}

export function GoogleMapProvider({ children }: GoogleMapProviderProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key is required');
    return <div>Map unavailable</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      {children}
    </APIProvider>
  );
}
```

```tsx
// src/components/Map/GoogleMap/GoogleFullScreenMap.tsx
import { Map, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

interface MapControllerProps {
  selectedLocation: { lat: number; lng: number } | null;
}

function MapController({ selectedLocation }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && map) {
      map.panTo(selectedLocation);
      map.setZoom(15);
    }
  }, [selectedLocation, map]);

  return null;
}

export function GoogleFullScreenMap({ ... }) {
  return (
    <div className="fixed inset-0 z-0">
      <Map
        defaultCenter={{ lat: 3.1089, lng: 101.7279 }}
        defaultZoom={13}
        mapId="YOUR_MAP_ID" // For Advanced Markers
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={true}
        streetViewControl={false}
        fullscreenControl={false}
      >
        <MapController selectedLocation={selectedLocation} />
        {/* Markers and routes */}
      </Map>
    </div>
  );
}
```

#### Phase M3: Custom Markers Migration

**Goal:** Migrate all custom SVG markers to Google Maps `<AdvancedMarker>`.

**Approach:** Use React components as marker content (Google Maps supports this natively with AdvancedMarker).

**Tasks:**
1. [ ] Create `GoogleMarker.tsx` component
2. [ ] Convert `createCategoryMarkerSVG()` to React component
3. [ ] Create `HomeBaseMarker.tsx` with enhanced styling
4. [ ] Create `DynamicPinMarker.tsx` for AI-suggested pins
5. [ ] Create `POIMarker.tsx` for emoji markers
6. [ ] Implement marker click handlers
7. [ ] Implement marker selection/highlighting state

**Code Structure:**

```tsx
// src/components/Map/GoogleMap/markers/CategoryMarker.tsx
import { AdvancedMarker } from '@vis.gl/react-google-maps';

interface CategoryMarkerProps {
  position: { lat: number; lng: number };
  category: string;
  isSelected: boolean;
  planIndicator: 'A' | 'B' | 'both' | null;
  onClick: () => void;
}

export function CategoryMarker({
  position,
  category,
  isSelected,
  planIndicator,
  onClick,
}: CategoryMarkerProps) {
  const size = isSelected ? 48 : 40;

  return (
    <AdvancedMarker
      position={position}
      onClick={onClick}
      zIndex={isSelected ? 100 : 1}
    >
      <div
        className={`category-marker ${isSelected ? 'selected' : ''}`}
        style={{ width: size, height: size }}
      >
        {/* SVG content - same as createCategoryMarkerSVG() but as JSX */}
        <svg viewBox="0 0 40 44" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          {/* Category-specific SVG path */}
          {getCategorySVGPath(category)}
          {/* Plan indicator ring */}
          {planIndicator && <PlanRing type={planIndicator} />}
        </svg>
      </div>
    </AdvancedMarker>
  );
}
```

```tsx
// src/components/Map/GoogleMap/markers/HomeBaseMarker.tsx
import { AdvancedMarker } from '@vis.gl/react-google-maps';

export function HomeBaseMarker({ position, isSelected, onClick }) {
  const size = isSelected ? 60 : 52;

  return (
    <AdvancedMarker
      position={position}
      onClick={onClick}
      zIndex={1000} // Always on top
    >
      <div className="home-base-marker animate-pulse-subtle">
        <svg viewBox="0 0 52 56" width={size} height={size}>
          {/* Enhanced home base SVG */}
          <circle cx="26" cy="28" r="24" fill="none" stroke="#F97316" strokeWidth="3" opacity="0.5">
            <animate attributeName="r" values="24;28;24" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          <path d="M26 4 L48 22 L48 52 L4 52 L4 22 Z" fill="#F97316" stroke="white" strokeWidth="2"/>
          {/* Home icon in center */}
          <text x="26" y="38" textAnchor="middle" fill="white" fontSize="18">🏠</text>
        </svg>
      </div>
    </AdvancedMarker>
  );
}
```

#### Phase M4: Routing Migration

**Goal:** Replace OpenRouteService with Google Directions API.

**Approach:** Use `@googlemaps/react-wrapper` DirectionsService or fetch API directly.

**Tasks:**
1. [ ] Create `useGoogleRouting.ts` hook
2. [ ] Implement Directions API call
3. [ ] Create `GoogleRouteLayer.tsx` using Polyline or DirectionsRenderer
4. [ ] Migrate `useDayRoute.ts` to use new hook
5. [ ] Handle API errors gracefully
6. [ ] Implement route caching

**Code Structure:**

```tsx
// src/hooks/useGoogleRouting.ts
import { useState, useEffect, useRef } from 'react';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface GoogleRoutingResult {
  coordinates: RoutePoint[];
  distance?: number; // km
  duration?: number; // minutes
  isLoading: boolean;
  error: string | null;
}

export function useGoogleRouting(
  waypoints: RoutePoint[],
  enabled = true
): GoogleRoutingResult {
  const [result, setResult] = useState<GoogleRoutingResult>({
    coordinates: [],
    isLoading: false,
    error: null,
  });

  const cacheRef = useRef<Map<string, GoogleRoutingResult>>(new Map());

  useEffect(() => {
    if (!enabled || waypoints.length < 2) {
      setResult({ coordinates: [], isLoading: false, error: null });
      return;
    }

    const fetchRoute = async () => {
      setResult(prev => ({ ...prev, isLoading: true }));

      try {
        const directionsService = new google.maps.DirectionsService();

        // Build waypoints for Google Directions API
        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        const intermediateWaypoints = waypoints.slice(1, -1).map(wp => ({
          location: new google.maps.LatLng(wp.lat, wp.lng),
          stopover: true,
        }));

        const response = await directionsService.route({
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints: intermediateWaypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false, // Keep original order
        });

        if (response.status === 'OK') {
          // Extract route coordinates
          const route = response.routes[0];
          const coordinates: RoutePoint[] = [];

          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              step.path.forEach(point => {
                coordinates.push({ lat: point.lat(), lng: point.lng() });
              });
            });
          });

          // Calculate totals
          const totalDistance = route.legs.reduce((sum, leg) =>
            sum + (leg.distance?.value || 0), 0) / 1000;
          const totalDuration = route.legs.reduce((sum, leg) =>
            sum + (leg.duration?.value || 0), 0) / 60;

          setResult({
            coordinates,
            distance: totalDistance,
            duration: totalDuration,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error(`Directions request failed: ${response.status}`);
        }
      } catch (err) {
        console.error('[useGoogleRouting] Error:', err);
        setResult({
          coordinates: waypoints, // Fallback to straight lines
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch route',
        });
      }
    };

    const timeoutId = setTimeout(fetchRoute, 300);
    return () => clearTimeout(timeoutId);
  }, [waypoints, enabled]);

  return result;
}
```

```tsx
// src/components/Map/GoogleMap/GoogleRouteLayer.tsx
import { Polyline } from '@vis.gl/react-google-maps';
import { useGoogleRouting } from '../../../hooks/useGoogleRouting';

interface GoogleRouteLayerProps {
  waypoints: { lat: number; lng: number }[];
  color: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  isDashed?: boolean;
}

export function GoogleRouteLayer({
  waypoints,
  color,
  strokeWeight = 4,
  strokeOpacity = 0.8,
  isDashed = false,
}: GoogleRouteLayerProps) {
  const { coordinates, isLoading } = useGoogleRouting(waypoints, waypoints.length >= 2);

  if (isLoading || coordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      path={coordinates}
      strokeColor={color}
      strokeWeight={strokeWeight}
      strokeOpacity={strokeOpacity}
      icons={isDashed ? [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
        offset: '0',
        repeat: '20px',
      }] : undefined}
    />
  );
}
```

#### Phase M5: Info Windows & Popups

**Goal:** Migrate Leaflet Popups to Google Maps InfoWindows.

**Tasks:**
1. [ ] Create `GoogleInfoWindow.tsx` component
2. [ ] Style info windows to match current design
3. [ ] Implement open/close state management
4. [ ] Handle multiple info windows (only one open at a time)

**Code Structure:**

```tsx
// src/components/Map/GoogleMap/GoogleInfoWindow.tsx
import { InfoWindow } from '@vis.gl/react-google-maps';

interface GoogleInfoWindowProps {
  position: { lat: number; lng: number };
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function GoogleInfoWindow({
  position,
  isOpen,
  onClose,
  children,
}: GoogleInfoWindowProps) {
  if (!isOpen) return null;

  return (
    <InfoWindow
      position={position}
      onCloseClick={onClose}
      options={{
        pixelOffset: new google.maps.Size(0, -40),
        maxWidth: 300,
      }}
    >
      <div className="font-sans p-2">
        {children}
      </div>
    </InfoWindow>
  );
}
```

#### Phase M6: Map Controls & Layer Switching

**Goal:** Implement layer switching (Street/Satellite/Dark mode).

**Tasks:**
1. [ ] Create `MapTypeControl.tsx` component
2. [ ] Implement map type switching (roadmap, satellite, hybrid)
3. [ ] Add custom styled map for dark mode
4. [ ] Position controls to match current design

**Code Structure:**

```tsx
// src/components/Map/GoogleMap/MapTypeControl.tsx
import { useMap } from '@vis.gl/react-google-maps';

const MAP_TYPES = [
  { id: 'roadmap', label: 'Street Map' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'hybrid', label: 'Hybrid' },
];

export function MapTypeControl() {
  const map = useMap();
  const [currentType, setCurrentType] = useState('roadmap');

  const handleTypeChange = (typeId: string) => {
    if (map) {
      map.setMapTypeId(typeId);
      setCurrentType(typeId);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/50 p-2">
        {MAP_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => handleTypeChange(type.id)}
            className={`px-3 py-2 rounded-lg text-sm ${
              currentType === type.id
                ? 'bg-sunset-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### Phase M7: POI Layer Migration

**Goal:** Migrate POI markers to Google Maps.

**Tasks:**
1. [ ] Create `GooglePOILayer.tsx` component
2. [ ] Convert emoji markers to AdvancedMarker
3. [ ] Maintain hover effects
4. [ ] Keep popup styling

#### Phase M8: Integration & Testing

**Goal:** Replace Leaflet with Google Maps throughout the app.

**Tasks:**
1. [ ] Update `TripViewPage.tsx` to use `GoogleFullScreenMap`
2. [ ] Update `ActivityDetailPanel.tsx` mini-map
3. [ ] Remove Leaflet dependencies from `package.json`
4. [ ] Remove Leaflet CSS import
5. [ ] Test all map interactions
6. [ ] Performance testing
7. [ ] Mobile testing

#### Phase M9: Cleanup & Documentation

**Tasks:**
1. [ ] Delete old Leaflet components
2. [ ] Update environment variable documentation
3. [ ] Update README with Google Maps setup
4. [ ] Add API key security instructions

---

### File Migration Checklist

| Current File | New File | Status |
|--------------|----------|--------|
| `src/components/Map/FullScreenMap.tsx` | `src/components/Map/GoogleMap/GoogleFullScreenMap.tsx` | [ ] |
| `src/components/Map/RoutingLayer.tsx` | `src/components/Map/GoogleMap/GoogleRouteLayer.tsx` | [ ] |
| `src/components/Map/DayRouteLayer.tsx` | `src/components/Map/GoogleMap/GoogleDayRouteLayer.tsx` | [ ] |
| `src/components/Map/POILayer.tsx` | `src/components/Map/GoogleMap/GooglePOILayer.tsx` | [ ] |
| `src/components/Map/CustomMarker.tsx` | `src/components/Map/GoogleMap/markers/CategoryMarker.tsx` | [ ] |
| `src/hooks/useRouting.ts` | `src/hooks/useGoogleRouting.ts` | [ ] |
| `src/hooks/useDayRoute.ts` | (Update to use new hook) | [ ] |
| `src/components/trips/ActivityDetailPanel.tsx` | (Update map section) | [ ] |

---

### Environment Setup

#### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Travel Planner"
3. Enable APIs:
   - Maps JavaScript API
   - Directions API
   - (Optional) Places API
4. Create API Key:
   - Go to APIs & Services → Credentials
   - Create Credentials → API Key
   - Restrict key:
     - Application restrictions: HTTP referrers
     - Website restrictions: `localhost:*`, `your-domain.com/*`
     - API restrictions: Maps JavaScript API, Directions API
5. Copy API key to `.env`

#### Map ID for Advanced Markers

Advanced Markers require a Map ID:
1. Go to Google Maps Platform → Map Management
2. Create new Map ID
3. Select "JavaScript" and "Vector"
4. Add Map ID to your `<Map>` component

---

### Rollback Plan

If migration issues arise:

1. **Keep Leaflet components** in `src/components/Map/Leaflet/` during migration
2. **Feature flag**: Use environment variable to switch between implementations
   ```typescript
   const MapComponent = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true'
     ? GoogleFullScreenMap
     : LeafletFullScreenMap;
   ```
3. **Gradual rollout**: Deploy to staging first, monitor for issues
4. **Revert path**: `git revert` the migration PR if critical issues found

---

### Cost Monitoring

Set up billing alerts in Google Cloud:

1. Go to Billing → Budgets & Alerts
2. Create budget: $50/month warning, $100/month cap
3. Enable email notifications
4. Monitor usage in Maps Platform → Metrics

---

## File Change Summary (Leaflet Improvements)

| File | Changes |
|------|---------|
| `src/utils/sortScheduleItems.ts` | Add `sortScheduleItemsForRoute()` export |
| `src/hooks/useDayRoute.ts` | Use time-based sorting for route waypoints |
| `src/atoms/uiAtoms.ts` | Add `focusedActivityAtom` and `FocusedActivity` type |
| `src/pages/TripViewPage.tsx` | Handle activity click → set focused activity |
| `src/components/Map/FullScreenMap.tsx` | Home base marker enhancement, FocusedActivityController |
| `src/components/Map/DayRouteLayer.tsx` | (Optional) Route numbering |

---

## Testing Checklist

### Route Sorting
- [ ] Day with 5+ activities in non-chronological order displays correctly
- [ ] Drag-and-drop reorder in UI still works
- [ ] Route shows linear progression (no backtracking unless schedule requires it)

### Home Base
- [ ] Home base marker is larger and more visible
- [ ] Home base always visible regardless of category filter
- [ ] Home base renders on top of nearby markers
- [ ] Pulsing animation is subtle, not distracting

### Activity-Map Sync
- [ ] Click activity → map flies to location
- [ ] Correct marker highlights
- [ ] Closing detail panel clears highlight
- [ ] Works on both desktop and mobile

### Google Maps Migration
- [ ] All markers render correctly
- [ ] Routes display without errors
- [ ] Pan/zoom smooth performance
- [ ] Info windows open/close properly
- [ ] Layer switching works
- [ ] Mobile gestures work
- [ ] API usage within budget

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Route order confusion | Medium | Low | Add visual route numbers |
| Performance with many markers | Low | Medium | Use marker clustering for 50+ locations |
| Mobile touch conflicts | Low | Low | Test on touch devices |
| Google Maps API costs | Low | Medium | Monitor usage, set billing alerts |
| Google Maps API quota | Low | High | Implement caching, request batching |
| Migration regression | Medium | High | Feature flags, gradual rollout |

---

## Success Metrics

1. **Route Clarity:** Routes should never "star" pattern unless schedule actually requires returning to same location
2. **Home Base Visibility:** Users can instantly identify home base on any zoom level
3. **Interaction Flow:** < 1 second from activity click to map focus
4. **API Efficiency:** < 100 Directions API calls per active user per day
5. **Performance:** Map loads in < 2 seconds on 4G connection

---

## References

- Screenshot showing looping route issue (provided by user)
- Current implementation: `src/hooks/useDayRoute.ts:67-70`
- Home base marker: `src/components/Map/FullScreenMap.tsx:71-79`
- Activity click handling: `src/components/Itinerary/DayPlan.tsx:174`
- Google Maps React: https://visgl.github.io/react-google-maps/
- Google Directions API: https://developers.google.com/maps/documentation/directions
- Google Maps Pricing: https://mapsplatform.google.com/pricing/
