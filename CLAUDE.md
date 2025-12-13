# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered family travel planner for Malaysia, built with React + TypeScript + Vite. Features interactive mapping, drag-and-drop itinerary management, and Claude AI chat integration. Designed for planning a trip with a toddler (Dec 21, 2025 - Jan 6, 2026) based from M Vertica Residence in Cheras, KL.

## Development Commands

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build to dist/
npm run preview    # Preview production build
```

## Environment Setup

Requires `VITE_ANTHROPIC_API_KEY` environment variable for AI chat functionality.

## Architecture

### Tech Stack
- **React 18 + TypeScript 5** with Vite bundler
- **Tailwind CSS** + Framer Motion for styling/animations
- **React-Leaflet** for interactive maps (OpenStreetMap tiles)
- **Zustand** with persist middleware for state management (localStorage key: `malaysia-trip-storage`)
- **@dnd-kit** for drag-and-drop itinerary reordering
- **@anthropic-ai/sdk** for Claude API integration

### Component Organization
Components are organized by feature in `src/components/`:
- `Chat/` - AI chat widget (AIChat, ChatMessage)
- `Map/` - Leaflet map (MapView, CustomMarker)
- `Itinerary/` - Day plans with drag-drop (DayPlan, DraggableItem, ScheduleItem)
- `Filters/` - Category and plan filters
- `Layout/` - Header and Sidebar
- `Location/` - Location details panel
- `Safety/` - Emergency info, weather

### Key Files
- `src/stores/tripStore.ts` - Single Zustand store for all app state (locations, day plans, filters, UI state)
- `src/data/tripData.ts` - All location data, day plans, safety info (25+ pre-populated locations)
- `src/lib/claude.ts` - Claude API client with browser-to-API calls
- `src/lib/prompts.ts` - System prompt generation with full trip context injection
- `src/hooks/useAIChat.ts` - Chat state management with localStorage persistence

### State Management Pattern
Zustand store manages:
- Location/day selection
- 10 category filters (each with name + hex color)
- Plan A/B visibility toggles
- Chat open/closed state

All state persists to localStorage automatically.

### AI Integration
- System prompt embeds full trip context (locations, plans, safety, toddler schedule)
- Direct browser-to-Anthropic API calls require header: `anthropic-dangerous-direct-browser-access: true`
- Model: claude-sonnet-4-20250514 with 1024 max tokens
- Chat history persists in localStorage key: `malaysia-trip-chat-history`

### Data Model
```typescript
Location { id, name, category, lat, lng, description, toddlerRating, tips, warnings, napFriendly }
DayPlan { id, date, title, planA: ScheduleItem[], planB: ScheduleItem[], weatherConsideration }
ScheduleItem { id, time, locationId, duration, notes }
```

### Layout
Three-column responsive layout: Sidebar (filters, day plans) | Map (center) | Location Detail (right panel)
- Chat widget: fixed position, expandable, full-width on mobile

## Testing

```bash
npx playwright test              # Run all E2E tests
npx playwright test --ui         # Interactive test UI
```

Playwright tests are in `tests/` directory.

## Path Aliases

`@/` maps to `src/` (configured in tsconfig.json and vite.config.ts)
