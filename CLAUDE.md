# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered family travel planner for Malaysia with a PostHog-inspired UI. Features full-screen interactive map, floating glassmorphic panels, drag-and-drop itinerary management, Plan A/B system, and Claude AI chat integration. Built for planning a trip with a toddler (Dec 21, 2025 - Jan 6, 2026).

## Development Commands

```bash
npm run dev          # Start Vite dev server on http://localhost:3000
npm run build        # Production build to dist/
npx convex dev       # Start Convex dev server (run in separate terminal)
```

## Environment Setup

Create `.env` with:
```
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_POSTHOG_KEY=phc_...  # Optional
```

Set in Convex dashboard:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Architecture

### Tech Stack
- **Vite + React 18 + TypeScript** - Frontend framework
- **Convex** - Real-time database, HTTP actions, auth
- **Convex Auth** - Email/password authentication
- **Tailwind CSS** + Framer Motion - Styling and animations
- **React-Leaflet** - Interactive maps (OpenStreetMap/CARTO dark tiles)
- **Zustand** - UI-only state management
- **PostHog** - Analytics (optional)

### File Structure
```
src/
├── components/
│   ├── ui/              # GlassPanel, GlassButton, GlassCard, etc.
│   ├── layout/          # FloatingHeader, LeftSidebar, RightDetailPanel,
│   │                    # BottomItineraryBar, AIChatWidget
│   ├── map/             # FullScreenMap with polylines
│   ├── checklist/       # ChecklistPanel
│   └── auth/            # LoginForm, SignupForm
├── stores/uiStore.ts    # Zustand store for UI state
├── data/tripData.ts     # Location data, day plans (used for Convex seeding)
├── lib/posthog.ts       # Analytics integration
├── App.tsx              # Main layout with floating panels
└── main.tsx             # ConvexAuthProvider setup

convex/
├── schema.ts            # Database schema (locations, dayPlans, scheduleItems, etc.)
├── auth.ts, auth.config.ts  # Convex Auth setup
├── locations.ts         # Location queries
├── dayPlans.ts          # Day plan queries with schedule items
├── scheduleItems.ts     # Schedule item mutations (reorder, update)
├── checklists.ts        # Checklist queries/mutations with defaults
├── chatMessages.ts      # AI chat history
├── claude.ts            # HTTP action for Claude API (server-side)
├── http.ts              # HTTP router for /chat endpoint
└── seed.ts              # Database seeding from tripData.ts
```

### UI Layout (PostHog-style)
```
z-50: FloatingHeader (top), AIChatWidget (bottom-right)
z-40: LeftSidebar (collapsible), RightDetailPanel (location details)
z-30: BottomItineraryBar (expandable)
z-0:  FullScreenMap (fixed background)
```

### Key Patterns

**Glassmorphic Components**:
- `bg-slate-900/80 backdrop-blur-xl border border-slate-700/50`
- Use `GlassPanel`, `GlassCard`, `GlassButton` from `src/components/ui/GlassPanel.tsx`

**State Management**:
- Zustand (`uiStore.ts`) for UI state: selectedLocation, activePlan, visibleCategories
- Convex for persistent data: locations, dayPlans, scheduleItems, checklists, chatMessages

**Claude API**:
- Server-side HTTP action at `convex/claude.ts`
- API key stored in Convex environment variables
- Endpoint: POST to Convex HTTP `/chat`

**Plan A/B System**:
- Plan A: Solid green polyline (#10B981)
- Plan B: Dashed blue polyline (#3B82F6)
- Toggle in header updates map route and BottomItineraryBar

### Data Model (Convex)
```typescript
locations { locationId, name, lat, lng, category, toddlerRating, tips, warnings, ... }
dayPlans { planId, date, title, notes, weatherConsideration }
scheduleItems { itemId, dayPlanId, locationId, planType: 'A'|'B', startTime, order }
checklists { type: 'visa'|'health'|'documents'|'packing', items: [...] }
chatMessages { sessionId, role, content, createdAt }
```

## Testing

```bash
npx playwright test              # Run E2E tests
npx playwright test --ui         # Interactive test UI
```

## First-Time Setup

1. `npm install`
2. `npx convex dev` - Follow prompts to create Convex project
3. In Convex dashboard: Add `ANTHROPIC_API_KEY` to environment variables
4. Create `.env` with `VITE_CONVEX_URL` from Convex dashboard
5. Run seed: Call `seed.seedDatabase()` from Convex dashboard
6. `npm run dev`

## Path Aliases

`@/` maps to `src/` (configured in tsconfig.json and vite.config.ts)
