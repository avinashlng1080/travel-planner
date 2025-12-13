# Claude Code Implementation Instructions

## Quick Start for Claude Code

This document provides step-by-step instructions for Claude Code to implement the Malaysia Family Travel Planner application.

---

## 🚀 Getting Started

### Step 1: Initialize the Project

```bash
cd /Users/user/Documents/GitHub/travel-planner
npm install
```

### Step 2: Set Up Environment

Create `.env` file:
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 3: Run Development Server

```bash
npm run dev
```

---

## 📁 Files Already Created

The following files have been created and contain essential data:

1. **`package.json`** - All dependencies defined
2. **`src/data/tripData.ts`** - Complete trip data including:
   - 25+ locations with full details
   - 18 daily plans (Dec 21 - Jan 6)
   - Travel plan categories
   - Safety information
   - Weather information
   - Toddler schedule

3. **`PRD.md`** - Full product requirements document

---

## 🔨 Implementation Order

Follow this order for best results:

### Phase 1: Setup & Configuration

```
1. Create vite.config.ts
2. Create tsconfig.json
3. Create tailwind.config.js
4. Create postcss.config.js
5. Create src/styles/globals.css
6. Create src/main.tsx
7. Create index.html
```

### Phase 2: Core Components

```
8. Create src/types/index.ts (re-export from tripData)
9. Create src/stores/tripStore.ts (Zustand)
10. Create src/App.tsx (main layout)
11. Create src/components/Layout/Header.tsx
12. Create src/components/Layout/Sidebar.tsx
```

### Phase 3: Map Feature

```
13. Create src/components/Map/MapView.tsx
14. Create src/components/Map/CustomMarker.tsx
15. Fix Leaflet CSS import issue
16. Create src/components/Location/LocationDetail.tsx
17. Create src/components/Location/LocationList.tsx
```

### Phase 4: Filters

```
18. Create src/components/Filters/CategoryFilter.tsx
19. Create src/components/Filters/PlanFilter.tsx
```

### Phase 5: Itinerary

```
20. Create src/components/Itinerary/DayPlan.tsx
21. Create src/components/Itinerary/ScheduleItem.tsx
22. Create src/components/Itinerary/DraggableItem.tsx
23. Implement drag-and-drop with @dnd-kit
```

### Phase 6: AI Chat

```
24. Create src/lib/claude.ts
25. Create src/lib/prompts.ts
26. Create src/components/Chat/AIChat.tsx
27. Create src/components/Chat/ChatMessage.tsx
28. Create src/hooks/useAIChat.ts
```

### Phase 7: Safety & Info

```
29. Create src/components/Safety/SafetyPanel.tsx
30. Create src/components/Safety/EmergencyNumbers.tsx
31. Create src/components/Safety/WeatherInfo.tsx
```

### Phase 8: Convex Integration (Optional)

```
32. Initialize Convex: npx convex dev
33. Create convex/schema.ts
34. Create convex/locations.ts
35. Create convex/dayPlans.ts
36. Create convex/sharing.ts
```

---

## 🎨 Design Specifications

### Color Palette

```css
/* Primary Background */
--slate-900: #0f172a;
--slate-800: #1e293b;
--slate-700: #334155;

/* Text */
--white: #ffffff;
--slate-400: #94a3b8;
--slate-500: #64748b;

/* Accents */
--pink-500: #ec4899;
--cyan-500: #06b6d4;
--green-500: #10b981;
--amber-500: #f59e0b;
--red-500: #ef4444;
--purple-500: #8b5cf6;
```

### Category Colors

```typescript
const CATEGORY_COLORS = {
  'home-base': '#EC4899',      // Pink
  'toddler-friendly': '#F472B6', // Light Pink
  'attraction': '#10B981',      // Green
  'shopping': '#8B5CF6',        // Purple
  'restaurant': '#F59E0B',      // Amber
  'nature': '#22C55E',          // Green
  'temple': '#EF4444',          // Red
  'playground': '#06B6D4',      // Cyan
  'medical': '#DC2626',         // Dark Red
};
```

### Typography

```css
/* Use Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

font-family: 'Outfit', sans-serif; /* Headers */
font-family: 'DM Sans', sans-serif; /* Body */
```

---

## 🗺️ Map Configuration

### Leaflet Setup

```typescript
// Fix default marker icon issue
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
```

### Map Center (Home Base)

```typescript
const HOME_BASE_COORDS: [number, number] = [3.1089, 101.7279];
const DEFAULT_ZOOM = 12;
```

### OpenStreetMap Tiles

```typescript
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
```

---

## 🤖 Claude API Integration

### API Call Function

```typescript
// src/lib/claude.ts
export async function sendToClaudeAPI(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}
```

### System Prompt Template

```typescript
// src/lib/prompts.ts
import { LOCATIONS, DAILY_PLANS, SAFETY_INFO, WEATHER_INFO } from '../data/tripData';

export const getSystemPrompt = () => `
You are a Malaysia travel expert specializing in family travel with toddlers.

## TRIP CONTEXT
- Travelers: Parents + 19-month-old toddler
- Dates: December 21, 2025 - January 6, 2026
- Base: M Vertica Residence, Cheras, Kuala Lumpur
- Toddler: Wakes 5am, naps 10am (1hr) + 3pm (30min), bed 8:30pm
- Can sleep in stroller: Yes
- No food allergies

## LOCATIONS DATA
${JSON.stringify(LOCATIONS, null, 2)}

## SAFETY INFO
${JSON.stringify(SAFETY_INFO, null, 2)}

## WEATHER INFO
${JSON.stringify(WEATHER_INFO, null, 2)}

## RESPONSE GUIDELINES
1. Always prioritize toddler safety
2. Be specific with times, prices, addresses
3. Mention dress codes proactively
4. Suggest stroller vs carrier for each location
5. Use emoji and markdown for readability
6. Keep responses under 300 words
`;
```

---

## 🔄 State Management (Zustand)

### Store Structure

```typescript
// src/stores/tripStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LOCATIONS, DAILY_PLANS, TRAVEL_PLANS } from '../data/tripData';

interface TripState {
  // Data
  locations: Location[];
  dayPlans: DayPlan[];
  travelPlans: TravelPlan[];
  
  // UI State
  selectedLocation: Location | null;
  selectedDay: string | null;
  visibleCategories: string[];
  visiblePlans: string[];
  chatOpen: boolean;
  
  // Actions
  selectLocation: (location: Location | null) => void;
  selectDay: (dayId: string | null) => void;
  toggleCategory: (category: string) => void;
  togglePlan: (planId: string) => void;
  setChatOpen: (open: boolean) => void;
  reorderSchedule: (dayId: string, plan: 'A' | 'B', itemIds: string[]) => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      locations: LOCATIONS,
      dayPlans: DAILY_PLANS,
      travelPlans: TRAVEL_PLANS,
      
      selectedLocation: null,
      selectedDay: null,
      visibleCategories: Object.keys(CATEGORY_CONFIG),
      visiblePlans: ['plan-a', 'plan-b'],
      chatOpen: true,
      
      selectLocation: (location) => set({ selectedLocation: location }),
      selectDay: (dayId) => set({ selectedDay: dayId }),
      toggleCategory: (category) => set((state) => ({
        visibleCategories: state.visibleCategories.includes(category)
          ? state.visibleCategories.filter(c => c !== category)
          : [...state.visibleCategories, category]
      })),
      togglePlan: (planId) => set((state) => ({
        visiblePlans: state.visiblePlans.includes(planId)
          ? state.visiblePlans.filter(p => p !== planId)
          : [...state.visiblePlans, planId]
      })),
      setChatOpen: (open) => set({ chatOpen: open }),
      reorderSchedule: (dayId, plan, itemIds) => set((state) => ({
        dayPlans: state.dayPlans.map(day => {
          if (day.id !== dayId) return day;
          const planKey = plan === 'A' ? 'planA' : 'planB';
          const items = day[planKey];
          const reordered = itemIds.map(id => items.find(item => item.id === id)!);
          return { ...day, [planKey]: reordered };
        })
      })),
    }),
    {
      name: 'malaysia-trip-storage',
    }
  )
);
```

---

## 📱 Responsive Breakpoints

```typescript
// Tailwind classes
// Mobile: default
// Tablet: md:
// Desktop: lg:

// Example responsive layout
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-80">Sidebar</aside>
  <main className="flex-1">Map</main>
  <div className="w-full lg:w-96">Detail Panel</div>
</div>
```

---

## ✅ Testing Checklist

Before considering complete, verify:

- [ ] `npm run dev` starts without errors
- [ ] Map loads and shows all markers
- [ ] Clicking marker shows location detail
- [ ] Category filters hide/show markers
- [ ] Plan filters work correctly
- [ ] Location detail shows all fields
- [ ] "Open in Maps" link works
- [ ] Daily itinerary displays all days
- [ ] Drag and drop reorders items
- [ ] AI chat sends and receives messages
- [ ] Mobile layout is usable
- [ ] No console errors
- [ ] All images/icons load

---

## 🐛 Common Issues & Fixes

### Issue: Leaflet markers not showing
**Fix:** Ensure you import leaflet CSS and fix icon URLs (see Map Configuration above)

### Issue: CORS error on Claude API
**Fix:** The API should be called from a backend. For development, use a proxy or Vite config:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
      },
    },
  },
});
```

### Issue: Drag and drop not working
**Fix:** Ensure @dnd-kit components are properly nested:
```tsx
<DndContext>
  <SortableContext items={itemIds}>
    {items.map(item => <SortableItem key={item.id} id={item.id} />)}
  </SortableContext>
</DndContext>
```

### Issue: Map not resizing correctly
**Fix:** Add CSS to force container height:
```css
.leaflet-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
```

---

## 📞 Key Data to Remember

### Home Base Coordinates
```
M Vertica Residence, Cheras
Lat: 3.1089
Lng: 101.7279
Address: 555, Jln Cheras, Taman Pertama, 56000 Kuala Lumpur
```

### Trip Dates
```
Arrival: December 21, 2025 (10:20 AM)
Departure: January 6, 2026 (12:00 PM)
Total: 17 nights
```

### Toddler Schedule
```
Age: 19 months
Wake: 5:00 AM
Morning Nap: 10:00 AM (1 hour)
Afternoon Nap: 3:00 PM (30 minutes)
Bedtime: 8:30 PM
Can sleep in stroller: Yes
Allergies: None
```

### Key Locations (Most Important)
```
1. M Vertica (Home)
2. Sunway Velocity Mall (800m walk - rainy day backup)
3. AEON Maluri (800m walk - groceries)
4. KLCC Park (toddler wading pool)
5. Aquaria KLCC (use carrier not stroller!)
6. Batu Caves (go at 7am, use carrier, cover knees/shoulders)
7. Genting SkyAvenue (bring warm clothes!)
8. Cameron Highlands (Dec 26-29)
```

---

## 🎯 Success Criteria

The app is complete when:

1. ✅ A family can visualize their entire Malaysia trip on an interactive map
2. ✅ They can get AI-powered advice for any location or situation
3. ✅ They can adjust their daily plans with drag-and-drop
4. ✅ They have instant access to safety information
5. ✅ The app works offline for viewing (critical for Cameron Highlands)
6. ✅ They can share the trip with family members

---

## 📚 Reference Links

- [React Leaflet Docs](https://react-leaflet.js.org/)
- [dnd-kit Docs](https://dndkit.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Convex](https://www.convex.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Anthropic API](https://docs.anthropic.com/)

---

*This instruction document should be used alongside PRD.md for complete context.*
