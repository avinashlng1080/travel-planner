# Malaysia Family Travel Planner - Product Requirements Document (PRD)

## Executive Summary

A web application to help families plan and execute their Malaysia trip with a toddler. The app combines interactive maps, AI-powered recommendations, drag-and-drop itinerary planning, and comprehensive safety/cultural guidance.

**Client:** Avinash (Staff Engineer traveling with wife and 19-month-old toddler)
**Trip Dates:** December 21, 2025 - January 6, 2026
**Base Location:** M Vertica Residence, Cheras, Kuala Lumpur

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Stories](#2-user-stories)
3. [Technical Stack](#3-technical-stack)
4. [Core Features](#4-core-features)
5. [Data Models](#5-data-models)
6. [UI/UX Requirements](#6-uiux-requirements)
7. [AI Integration](#7-ai-integration)
8. [Offline Support](#8-offline-support)
9. [File Structure](#9-file-structure)
10. [Implementation Priority](#10-implementation-priority)
11. [Pre-loaded Data](#11-pre-loaded-data)
12. [API Endpoints](#12-api-endpoints)
13. [Testing Requirements](#13-testing-requirements)

---

## 1. Project Overview

### 1.1 Problem Statement

Planning a family trip to Malaysia with a toddler requires:
- Understanding which attractions are toddler-friendly
- Knowing dress codes, safety warnings, and cultural etiquette per location
- Having backup plans for rainy days or when toddler is tired
- Managing nap times within the itinerary
- Quick access to emergency information
- Real-time flexibility to adjust plans

### 1.2 Solution

An intelligent travel planner that:
- Displays all trip locations on an interactive OpenStreetMap
- Provides AI-powered contextual recommendations via Claude API
- Allows drag-and-drop itinerary management with Plan A/B per day
- Works offline (critical for areas with poor connectivity like Cameron Highlands)
- Shares trip data with family members via Convex real-time sync

### 1.3 Success Metrics

- User can view entire trip on map within 2 seconds
- AI responds to queries within 3 seconds
- Offline mode provides full read access to itinerary
- Wife can view shared trip in real-time

---

## 2. User Stories

### 2.1 Trip Planning

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-1 | User | See all trip locations on a map | I can understand the geography and distances |
| US-2 | User | Filter locations by category | I can focus on specific types (toddler-friendly, shopping, etc.) |
| US-3 | User | View detailed info for each location | I know what to expect, what to bring, and warnings |
| US-4 | User | See distance and Grab fare from home base | I can budget time and money |
| US-5 | User | Toggle between Plan A and Plan B per day | I have rainy/tired day alternatives |

### 2.2 AI Assistant

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-6 | User | Ask questions about locations | I get contextual advice (dress code, best times, etc.) |
| US-7 | User | Get toddler-specific recommendations | My 19-month-old has a good experience |
| US-8 | User | Receive proactive warnings | I avoid common tourist mistakes |
| US-9 | User | Ask about local food/culture | I enrich my travel experience |

### 2.3 Itinerary Management

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-10 | User | Drag and drop activities within a day | I can reorder my schedule |
| US-11 | User | Move activities between Plan A and B | I can customize backup plans |
| US-12 | User | See nap times blocked out | I respect toddler's schedule |
| US-13 | User | Add custom locations | I can include places I discover |

### 2.4 Safety & Information

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-14 | User | See emergency contact numbers | I can act quickly in emergencies |
| US-15 | User | View weather forecasts | I can plan indoor/outdoor activities |
| US-16 | User | Read cultural etiquette tips | I don't offend locals |
| US-17 | User | Find nearest hospitals | I know where to go if toddler gets sick |

### 2.5 Sharing & Offline

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-18 | User | Share trip with wife | We both have access to the plan |
| US-19 | User | Access itinerary offline | I can use it in Cameron Highlands (poor signal) |
| US-20 | User | Sync changes when back online | Wife sees my updates |

---

## 3. Technical Stack

### 3.1 Frontend

```
Framework: React 18 with TypeScript
Styling: Tailwind CSS
Animation: Framer Motion
Maps: React-Leaflet + OpenStreetMap (FREE, no API key)
Drag & Drop: @dnd-kit/core + @dnd-kit/sortable
Markdown: react-markdown
Icons: Lucide React
State: Zustand (local) + Convex (synced)
```

### 3.2 Backend

```
Database: Convex (real-time sync + offline support)
AI: Anthropic Claude API (claude-sonnet-4-20250514)
Hosting: Vercel (recommended) or any static host
```

### 3.3 Build Tools

```
Bundler: Vite
Package Manager: npm or pnpm
TypeScript: 5.x
```

### 3.4 Required Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "convex": "^1.13.0",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.3.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.400.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-markdown": "^9.0.1",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.12",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}
```

---

## 4. Core Features

### 4.1 Interactive Map (Priority: HIGH)

**Requirements:**
- Use Leaflet with OpenStreetMap tiles (FREE)
- Display all locations with category-colored markers
- Custom marker icons per category (home base, toddler-friendly, temple, etc.)
- Click marker to select location
- Popup with quick info on hover
- Filter markers by category and travel plan
- Center map on home base by default
- Pan to location when selected from list

**Marker Categories & Colors:**
| Category | Color | Icon |
|----------|-------|------|
| home-base | #EC4899 (Pink) | Home |
| toddler-friendly | #F472B6 (Light Pink) | Baby |
| attraction | #10B981 (Green) | Camera |
| shopping | #8B5CF6 (Purple) | ShoppingBag |
| restaurant | #F59E0B (Amber) | Utensils |
| nature | #22C55E (Green) | Trees |
| temple | #EF4444 (Red) | Building |
| playground | #06B6D4 (Cyan) | Baby |
| medical | #DC2626 (Dark Red) | Heart |

### 4.2 Location Detail Panel (Priority: HIGH)

**When a location is selected, display:**
- Name, city, address
- Toddler rating (1-5 stars)
- Indoor/Outdoor badge
- Distance from home base
- Driving time estimate
- Grab fare estimate
- Best times to visit
- Estimated visit duration
- Opening hours
- Entrance fee (if any)
- Warnings (red box) - CRITICAL safety/cultural info
- Pro Tips (green box) - insider recommendations
- Dress Code (amber box) - if applicable
- What to Bring (tags)
- What NOT to Bring (red tags)
- Feeding times (for zoos/aquariums)
- Booking URL (if booking required)
- Google Maps link

### 4.3 Daily Itinerary with Plan A/B (Priority: HIGH)

**Requirements:**
- Display each day of the trip (Dec 21 - Jan 6)
- Each day has:
  - Plan A (main activities)
  - Plan B (rainy/tired alternatives)
- Drag and drop to reorder activities within a plan
- Drag activities between Plan A and Plan B
- Visual indication of nap times (blocked, non-movable)
- Color-coded by location category
- Show start/end times
- Expand/collapse days

**Toddler Schedule Integration:**
```
Wake: 05:00
Morning Nap: 10:00 - 11:00 (1 hour)
Afternoon Nap: 15:00 - 15:30 (30 min)
Bedtime: 20:30
Can sleep in stroller: Yes
```

### 4.4 AI Chat Assistant (Priority: HIGH)

**Requirements:**
- Persistent chat panel (can be minimized)
- Uses Claude API (claude-sonnet-4-20250514)
- Context-aware responses based on:
  - Trip data (locations, dates, itinerary)
  - Toddler age (19 months)
  - Current day/weather
  - Location-specific information
- Markdown rendering for responses
- Suggested quick questions
- Loading indicator during API calls

**System Prompt for Claude:**
```
You are a Malaysia travel expert specializing in family travel with toddlers. 

CONTEXT:
- Family: Parents + 19-month-old toddler
- Trip: December 21, 2025 - January 6, 2026
- Base: M Vertica Residence, Cheras, Kuala Lumpur
- Toddler Schedule: Wakes 5am, naps 10am (1hr) and 3pm (30min), bed 8:30pm
- Can sleep in stroller: Yes
- No food allergies

KNOWLEDGE BASE:
[Include full location data, warnings, tips, cultural info]

GUIDELINES:
1. Always prioritize toddler safety and comfort
2. Provide specific, actionable advice
3. Warn about dress codes before religious sites
4. Suggest alternatives when plans might not suit a toddler
5. Include local phrases when relevant
6. Be concise but thorough
7. Use emoji to make responses scannable
8. Always mention if stroller vs baby carrier is recommended
```

### 4.5 Category & Plan Filters (Priority: MEDIUM)

**Requirements:**
- Toggle visibility of location categories on map
- Toggle visibility of travel plans
- Show count of visible locations
- "Show All" / "Hide All" quick actions
- Persist filter state in local storage

**Travel Plans:**
| ID | Name | Color | Description |
|----|------|-------|-------------|
| plan-a | Main Itinerary | Green | Planned activities |
| plan-b | Rainy/Tired Day | Blue | Indoor alternatives |
| toddler | Toddler Favorites | Pink | Best for 19-month-old |
| shopping | Shopping | Purple | Malls and markets |
| cultural | Cultural | Amber | Temples, museums |
| nature | Nature & Parks | Green | Outdoor spaces |
| food | Food & Dining | Red | Restaurants |
| day-trip | Day Trips | Cyan | Outside KL |
| medical | Medical | Dark Red | Hospitals |

### 4.6 Safety Information Panel (Priority: MEDIUM)

**Sections:**
1. **Emergency Numbers**
   - Police: 999
   - Ambulance: 999
   - Fire: 994
   - Tourist Police: 03-2146 0522
   - US Embassy: +60 3-2168-5000

2. **Travel Advisory**
   - Level 1: Exercise Normal Precautions
   - Warning: Eastern Sabah Coast (not visiting)

3. **Health Tips**
   - Tap water NOT safe
   - Dengue prevention
   - Heat stroke prevention
   - Hand sanitizer

4. **Scam Warnings**
   - Taxi meters
   - Pickpockets
   - Aggressive vendors

5. **Cultural Etiquette**
   - Shoe removal
   - Religious site dress code
   - Right hand usage
   - Don't touch heads
   - Friday prayers

### 4.7 Weather Display (Priority: MEDIUM)

**Requirements:**
- Show weather summary for trip dates
- Highlight that West Coast (KL) is ideal in Dec-Jan
- Warning about East Coast monsoon
- Cameron Highlands temperature note
- Daily weather indicators per itinerary day

### 4.8 Offline Support (Priority: HIGH)

**Requirements:**
- Cache all trip data locally
- Full read access to itinerary offline
- Queue changes made offline
- Sync when connection restored
- Visual indicator of offline mode
- Pre-cache map tiles for key areas (optional enhancement)

**Implementation with Convex:**
- Use Convex's built-in offline support
- Store local copy in IndexedDB via Convex
- Optimistic updates with sync on reconnect

### 4.9 Sharing (Priority: MEDIUM)

**Requirements:**
- Generate shareable link
- Wife can view same trip data
- Real-time sync via Convex
- Read-only sharing option
- Edit sharing option (for wife)

---

## 5. Data Models

### 5.1 Location

```typescript
interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: LocationCategory;
  description: string;
  city: string;
  address?: string;
  toddlerRating: number; // 1-5
  isIndoor: boolean;
  bestTimeToVisit: string[];
  estimatedDuration: string;
  grabEstimate: string;
  distanceFromBase: string;
  drivingTime: string;
  warnings: string[];
  tips: string[];
  dressCode?: string;
  whatToBring: string[];
  whatNotToBring: string[];
  feedingTimes?: string[];
  bookingRequired: boolean;
  bookingUrl?: string;
  entranceFee?: string;
  openingHours: string;
  planIds: string[];
}

type LocationCategory = 
  | 'home-base'
  | 'toddler-friendly'
  | 'attraction'
  | 'shopping'
  | 'restaurant'
  | 'nature'
  | 'temple'
  | 'playground'
  | 'medical'
  | 'avoid';
```

### 5.2 Day Plan

```typescript
interface DayPlan {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  title: string;
  planA: ScheduleItem[];
  planB: ScheduleItem[];
  notes: string[];
  weatherConsideration: 'outdoor-heavy' | 'indoor-heavy' | 'mixed';
}

interface ScheduleItem {
  id: string;
  locationId: string;
  startTime: string; // HH:MM
  endTime: string;
  notes?: string;
  isNapTime?: boolean;
  isFlexible?: boolean;
}
```

### 5.3 Travel Plan

```typescript
interface TravelPlan {
  id: string;
  name: string;
  color: string;
  description: string;
  isDefault: boolean;
}
```

### 5.4 Chat Message

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

### 5.5 User Preferences

```typescript
interface UserPreferences {
  visibleCategories: string[];
  visiblePlans: string[];
  selectedDay: string | null;
  mapCenter: [number, number];
  mapZoom: number;
  chatMinimized: boolean;
  sidebarCollapsed: boolean;
}
```

---

## 6. UI/UX Requirements

### 6.1 Design System

**Theme:** Dark mode with vibrant accents (tropical/travel feel)

**Colors:**
```css
--bg-primary: #0f172a (slate-900)
--bg-secondary: #1e293b (slate-800)
--bg-tertiary: #334155 (slate-700)
--text-primary: #ffffff
--text-secondary: #94a3b8 (slate-400)
--accent-pink: #ec4899
--accent-cyan: #06b6d4
--accent-green: #10b981
--accent-amber: #f59e0b
--accent-red: #ef4444
```

**Typography:**
```css
--font-display: 'Outfit', sans-serif (headers)
--font-body: 'DM Sans', sans-serif (body)
```

**Border Radius:**
- Cards: 16px (rounded-2xl)
- Buttons: 12px (rounded-xl)
- Tags: 9999px (rounded-full)
- Inputs: 12px (rounded-xl)

### 6.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Trip Dates | Share | Settings                    │
├─────────────────────────────────────────────────────────────────┤
│                    │                              │              │
│   FILTERS         │         MAP VIEW             │   DETAIL     │
│   - Categories    │                              │   PANEL      │
│   - Plans         │   [Interactive Leaflet Map]  │              │
│                   │                              │   Location   │
│   LOCATION LIST   │                              │   Details    │
│   - Searchable    │                              │   OR         │
│   - Grouped by    │                              │   Day Plan   │
│     category      │                              │              │
│                   │                              │              │
├───────────────────┴──────────────────────────────┴──────────────┤
│                    AI CHAT (expandable/collapsible)             │
└─────────────────────────────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- Mobile: < 768px (stack vertically, bottom sheet for details)
- Tablet: 768px - 1024px (two columns)
- Desktop: > 1024px (three columns as shown)

### 6.3 Interactions

1. **Map Markers:**
   - Hover: Show tooltip with name
   - Click: Select location, pan map, show detail panel
   - Selected state: Larger marker with pulse animation

2. **Location List:**
   - Click: Select location
   - Hover: Highlight on map

3. **Drag & Drop:**
   - Grab handle visible on schedule items
   - Ghost preview while dragging
   - Drop zones highlight on drag over
   - Smooth reorder animation

4. **Chat:**
   - Typing indicator
   - Message appear animation
   - Auto-scroll to latest
   - Quick question chips

### 6.4 Animations (Framer Motion)

```typescript
// Page load stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Card entrance
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Panel slide
const panelVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};
```

---

## 7. AI Integration

### 7.1 Claude API Setup

**Environment Variable:**
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

**API Call Structure:**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: conversationHistory
  })
});
```

### 7.2 System Prompt

```markdown
You are a Malaysia travel expert specializing in family travel with toddlers.

## TRIP CONTEXT
- **Travelers:** Parents + 19-month-old toddler
- **Dates:** December 21, 2025 - January 6, 2026  
- **Base:** M Vertica Residence, Cheras, Kuala Lumpur
- **Toddler Schedule:**
  - Wakes: 5:00 AM
  - Morning nap: 10:00 AM (1 hour)
  - Afternoon nap: 3:00 PM (30 min)
  - Bedtime: 8:30 PM
  - Can sleep in stroller: Yes
- **Food allergies:** None

## YOUR KNOWLEDGE
[INJECT: Full LOCATIONS array as JSON]
[INJECT: Full DAILY_PLANS array as JSON]
[INJECT: SAFETY_INFO object]
[INJECT: WEATHER_INFO object]

## RESPONSE GUIDELINES
1. **Safety first:** Always prioritize toddler safety
2. **Be specific:** Give exact times, prices, addresses
3. **Warn proactively:** Mention dress codes, scams, health risks
4. **Suggest alternatives:** If something isn't toddler-friendly, suggest what is
5. **Be concise:** Use bullet points and emoji for scannability
6. **Local knowledge:** Include insider tips tourists miss
7. **Stroller vs carrier:** Always specify which is better for each location
8. **Nap-aware:** Consider toddler's nap schedule in suggestions

## RESPONSE FORMAT
- Use markdown for structure
- Use emoji for visual hierarchy
- Keep responses under 300 words unless complex
- End with a follow-up question or suggestion when appropriate
```

### 7.3 Contextual Prompts

The AI should receive context about:
1. Currently selected location (if any)
2. Current day being viewed (if any)
3. Active filters
4. Recent conversation history (last 10 messages)

---

## 8. Offline Support

### 8.1 Convex Offline Strategy

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  locations: defineTable({
    // ... location fields
  }),
  dayPlans: defineTable({
    // ... day plan fields
  }),
  userPreferences: defineTable({
    userId: v.string(),
    preferences: v.any(),
  }),
  chatHistory: defineTable({
    tripId: v.string(),
    messages: v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
  }),
});
```

### 8.2 Local Caching

```typescript
// Use Zustand with persist middleware for local state
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TripStore {
  locations: Location[];
  dayPlans: DayPlan[];
  isOffline: boolean;
  pendingChanges: any[];
  // ... actions
}

const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    {
      name: 'malaysia-trip-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 8.3 Offline Indicators

- Show "Offline" badge in header when disconnected
- Disable AI chat when offline (show message)
- Show "Syncing..." when reconnected
- Show pending changes count

---

## 9. File Structure

```
travel-planner/
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapView.tsx
│   │   │   ├── CustomMarker.tsx
│   │   │   └── MapControls.tsx
│   │   ├── Location/
│   │   │   ├── LocationList.tsx
│   │   │   ├── LocationCard.tsx
│   │   │   └── LocationDetail.tsx
│   │   ├── Itinerary/
│   │   │   ├── DayPlan.tsx
│   │   │   ├── ScheduleItem.tsx
│   │   │   ├── DraggableItem.tsx
│   │   │   └── NapTimeBlock.tsx
│   │   ├── Chat/
│   │   │   ├── AIChat.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── QuickQuestions.tsx
│   │   ├── Filters/
│   │   │   ├── CategoryFilter.tsx
│   │   │   └── PlanFilter.tsx
│   │   ├── Safety/
│   │   │   ├── SafetyPanel.tsx
│   │   │   ├── EmergencyNumbers.tsx
│   │   │   └── WeatherInfo.tsx
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   └── UI/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useLocations.ts
│   │   ├── useDayPlans.ts
│   │   ├── useAIChat.ts
│   │   ├── useOffline.ts
│   │   └── useShare.ts
│   ├── lib/
│   │   ├── claude.ts          # Claude API integration
│   │   ├── prompts.ts         # AI system prompts
│   │   ├── mapUtils.ts        # Map helper functions
│   │   └── dateUtils.ts       # Date formatting
│   ├── stores/
│   │   ├── tripStore.ts       # Zustand store
│   │   └── uiStore.ts         # UI state
│   ├── data/
│   │   └── tripData.ts        # Pre-loaded trip data
│   ├── styles/
│   │   └── globals.css        # Tailwind + custom styles
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── convex/
│   ├── schema.ts
│   ├── locations.ts
│   ├── dayPlans.ts
│   ├── chat.ts
│   └── sharing.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## 10. Implementation Priority

### Phase 1: Core MVP (Week 1)

1. **Project Setup**
   - Initialize Vite + React + TypeScript
   - Configure Tailwind CSS
   - Set up Convex
   - Create file structure

2. **Data Layer**
   - Implement tripData.ts with all locations
   - Create Zustand store
   - Set up Convex schema

3. **Map View**
   - Integrate React-Leaflet
   - Custom markers per category
   - Click to select location
   - Filter by category

4. **Location Detail**
   - Full detail panel
   - All fields from data model
   - Google Maps link

5. **Basic UI**
   - Header
   - Sidebar with location list
   - Responsive layout

### Phase 2: Planning Features (Week 2)

6. **Daily Itinerary**
   - Display all days
   - Plan A / Plan B tabs
   - Time-based schedule

7. **Drag & Drop**
   - Reorder within day
   - Move between plans
   - Nap time blocks (locked)

8. **Filters**
   - Category toggles
   - Plan toggles
   - Persist state

### Phase 3: AI & Polish (Week 3)

9. **AI Chat**
   - Claude API integration
   - System prompt with context
   - Chat UI with markdown

10. **Safety Panel**
    - Emergency numbers
    - Health tips
    - Cultural etiquette

11. **Weather**
    - Static weather info for Dec-Jan
    - Per-day indicators

### Phase 4: Offline & Sharing (Week 4)

12. **Offline Support**
    - Local caching
    - Offline indicator
    - Sync on reconnect

13. **Sharing**
    - Generate share link
    - Real-time sync
    - Read/edit permissions

14. **Final Polish**
    - Animations
    - Loading states
    - Error handling
    - Testing

---

## 11. Pre-loaded Data

All data is pre-loaded in `src/data/tripData.ts`. Key exports:

```typescript
export const HOME_BASE: Location;           // M Vertica Residence
export const LOCATIONS: Location[];          // 25+ locations
export const DAILY_PLANS: DayPlan[];        // 18 days of plans
export const TRAVEL_PLANS: TravelPlan[];    // 9 plan categories
export const TODDLER_SCHEDULE;              // Nap times, etc.
export const SAFETY_INFO;                   // Emergency contacts, tips
export const WEATHER_INFO;                  // Dec-Jan weather guide
```

**Locations include:**
- M Vertica Residence (home base)
- Sunway Velocity Mall
- AEON Taman Maluri
- KLCC Park
- Petronas Twin Towers
- Aquaria KLCC
- Suria KLCC Mall
- Batu Caves
- Genting SkyAvenue
- Skytropolis
- Jalan Alor
- Petaling Street
- Pavilion KL
- KL Bird Park
- Perdana Botanical Gardens
- Titiwangsa Lake Gardens
- Putrajaya Lake
- Sunway Pyramid
- Muzium Negara
- Cameron Highlands
- Sunway Medical Centre
- Gleneagles Hospital
- Zoo View Ampang

---

## 12. API Endpoints

### 12.1 Convex Functions

```typescript
// convex/locations.ts
export const list = query(() => { /* return all locations */ });
export const get = query(({ id }) => { /* return single location */ });
export const add = mutation(({ location }) => { /* add custom location */ });
export const update = mutation(({ id, updates }) => { /* update location */ });

// convex/dayPlans.ts
export const list = query(() => { /* return all day plans */ });
export const update = mutation(({ id, planA, planB }) => { /* update day */ });
export const reorder = mutation(({ dayId, plan, itemIds }) => { /* reorder */ });

// convex/chat.ts
export const getHistory = query(({ tripId }) => { /* get chat history */ });
export const addMessage = mutation(({ tripId, message }) => { /* add message */ });

// convex/sharing.ts
export const createShareLink = mutation(({ tripId, permission }) => { /* create link */ });
export const getSharedTrip = query(({ shareId }) => { /* get shared trip */ });
```

### 12.2 Claude API

```typescript
// src/lib/claude.ts
export async function sendMessage(
  messages: ChatMessage[],
  context: {
    selectedLocation?: Location;
    currentDay?: DayPlan;
  }
): Promise<string>;
```

---

## 13. Testing Requirements

### 13.1 Unit Tests

- Location filtering logic
- Date/time utilities
- Drag and drop reordering

### 13.2 Integration Tests

- Map marker rendering
- Location selection flow
- Chat message flow

### 13.3 E2E Tests

- Full planning workflow
- Offline mode
- Share and view flow

### 13.4 Manual Testing Checklist

- [ ] All locations render on map
- [ ] Clicking marker shows detail
- [ ] Filters work correctly
- [ ] Drag and drop reorders correctly
- [ ] AI responds appropriately
- [ ] Offline mode works
- [ ] Share link works
- [ ] Mobile layout works
- [ ] All links are correct
- [ ] No console errors

---

## Appendix A: Environment Variables

```bash
# .env.example
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
VITE_CONVEX_URL=https://your-project.convex.cloud
```

---

## Appendix B: Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Environment Setup

1. Add `VITE_ANTHROPIC_API_KEY` to Vercel environment variables
2. Set up Convex project and add URL
3. Enable Vercel Analytics (optional)

---

## Appendix C: Future Enhancements

1. **Weather API integration** - Real-time weather from OpenWeatherMap
2. **Push notifications** - Reminders for bookings, nap times
3. **Photo gallery** - Upload trip photos per location
4. **Budget tracker** - Track spending per day/location
5. **Multi-trip support** - Reuse for future trips
6. **PWA** - Installable app with better offline
7. **Voice input** - Ask AI questions by voice
8. **AR view** - Point camera to see location info overlay

---

## Contact & Support

**Project Owner:** Avinash
**Created:** December 2025
**Last Updated:** December 13, 2025

---

*This PRD is the single source of truth for the Malaysia Family Travel Planner project. Claude Code should reference this document for all implementation decisions.*
