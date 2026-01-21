# 🌴 Family Travel Planner

An AI-powered travel planning application for families with toddlers. Features interactive maps, drag-and-drop itinerary planning, weather forecasts, and intelligent recommendations via Claude AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)

## ✨ Features

### Core Planning
- 🗺️ **Interactive Google Maps** - Real-time routing with custom category markers and visual hierarchy
- 🤖 **AI Assistant** - Claude-powered travel advice with web search and map pin suggestions
- 📅 **Plan A/B Per Day** - Main itinerary + backup alternatives with visual route differentiation
- 👶 **Toddler-Focused** - Safety ratings, nap time blocking, warnings, and mood tracking
- 🔄 **Drag & Drop** - Reorder activities with smooth animations and hybrid time-based sorting

### Smart Context & Adaptation
- 🎨 **Adaptive UI Theme** - Energy-based visual feedback that shifts colors based on user/toddler status
- 💪 **User Context Tracking** - Real-time energy level, toddler mood, and health monitoring with Plan B mode
- 🌍 **Location-Agnostic** - AI-generated destination context (emergency numbers, safety tips, cultural etiquette) for any country
- 📍 **POI Discovery** - Contextual points of interest with emoji markers and viewport-based loading

### Weather & Safety
- 🌤️ **Weather Integration** - 7-day forecasts from Open-Meteo API with 15-minute auto-refresh
- 🌊 **Flash Flood Alerts** - Risk calculation (Low/Moderate/High/Severe) with Plan B suggestions
- 🏥 **Safety Panel** - Emergency numbers, health tips, scam warnings, and cultural guidance

### Navigation & Commutes
- 🚗 **Commute Planning** - Multi-destination route visualization with travel mode selection
- 🛤️ **Day-by-Day Routes** - Visual route rendering per selected day (Plan A solid, Plan B dashed)

### User Experience
- 📱 **Mobile Responsive** - FAB navigation, safe areas, touch-optimized
- 🎯 **Onboarding Tutorial** - Interactive guide for first-time users
- 🌐 **Real-time Collaboration** - Share trips with family members
- ♿ **WCAG 2.1 AA Compliant** - Accessible touch targets and screen reader support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Google Maps API key (with Maps JavaScript API + Distance Matrix API enabled)
- Anthropic API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/travel-planner.git
cd travel-planner

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Add your API keys to .env.local
# VITE_GOOGLE_MAPS_KEY=your-google-maps-api-key
# VITE_GOOGLE_MAPS_ID=your-map-id (optional, for custom styling)
# VITE_CONVEX_URL=https://your-project.convex.cloud
# VITE_POSTHOG_KEY=phc_... (optional analytics)

# Set ANTHROPIC_API_KEY in Convex dashboard after deployment

# Start Convex backend (in separate terminal)
npx convex dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Google Maps Setup

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Distance Matrix API
   - (Optional) Places API for location search
3. Add API key to `.env.local` as `VITE_GOOGLE_MAPS_KEY`
4. Free tier: $200/month credit (sufficient for personal use)

## 📁 Project Structure

```
travel-planner/
├── src/
│   ├── atoms/             # Jotai state management
│   │   ├── uiAtoms.ts     # UI state (chat, categories, plans)
│   │   ├── floatingPanelAtoms.ts  # Panel z-index/position
│   │   ├── userContextAtoms.ts    # Energy, mood, health tracking + theme
│   │   └── onboardingAtoms.ts     # Tutorial state
│   ├── components/        # 80+ React components
│   │   ├── Map/          # Google Maps integration
│   │   ├── Layout/       # Header, navigation, FAB
│   │   ├── Itinerary/    # Day planning with drag-and-drop
│   │   ├── Chat/         # AI chat interface
│   │   ├── floating/     # 17 floating panel types
│   │   ├── trips/        # Trip management, activities
│   │   ├── auth/         # Login/signup forms
│   │   ├── onboarding/   # Interactive tutorial
│   │   ├── weather/      # Weather cards and alerts
│   │   ├── Safety/       # Emergency info
│   │   └── ui/           # Base components (FAB, Modal, etc.)
│   ├── data/
│   │   └── tripData.ts   # Sample location data
│   ├── hooks/            # 18+ custom React hooks
│   │   ├── useGoogleRouting.ts   # Route calculations
│   │   ├── useCommutes.ts        # Commute planning
│   │   ├── useWeather.ts         # Weather integration
│   │   ├── useEnergyTheme.ts     # Adaptive UI theme based on energy
│   │   ├── useDestinationContext.ts  # AI-generated country info
│   │   ├── useGeolocation.ts     # Live location tracking
│   │   └── useIsMobile.ts        # Responsive detection
│   ├── pages/            # 7 page components
│   │   ├── TripViewPage.tsx      # Main planning view
│   │   ├── DashboardPage.tsx     # Trip list
│   │   └── LandingPage.tsx       # Auth/onboarding
│   ├── stores/           # Legacy Zustand stores
│   ├── styles/           # Global styles and Tailwind
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main routing logic
│   └── main.tsx          # React entry point
├── convex/               # Backend functions
│   ├── schema.ts         # Database schema (28 tables)
│   ├── claude.ts         # Claude AI with tools
│   ├── http.ts           # HTTP router for /chat
│   ├── trips.ts          # Trip CRUD operations
│   ├── weather.ts        # Weather API integration
│   ├── commutes.ts       # Distance calculations
│   ├── destinationContexts.ts  # AI-generated country context
│   └── auth.config.ts    # Authentication setup
├── Configuration
│   ├── vercel.json       # Vercel deployment config
│   ├── tailwind.config.js # Custom color themes
│   ├── CLAUDE.md         # Development philosophy
│   ├── PRD.md            # Product requirements
│   └── .env.example      # Environment template
└── package.json
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18.3, TypeScript 5.5, Vite 5.3
- **Styling:** Tailwind CSS 3.4, Framer Motion 11.3
- **Maps:** @vis.gl/react-google-maps 1.7
- **Routing:** Google Maps Distance Matrix API
- **Drag & Drop:** @dnd-kit (core + sortable)
- **State:** Jotai 2.10 (atoms), Zustand (legacy)
- **Analytics:** PostHog 1.306 (optional)

### Backend
- **Database:** Convex 1.31 (real-time, serverless)
- **Auth:** @convex-dev/auth 0.0.90
- **AI:** Anthropic Claude API (via Convex HTTP actions)

### Development
- **Linting:** ESLint 9.39 (strict, zero-warnings)
- **Type Checking:** TypeScript strict mode

## 🎨 Key Patterns

### State Management
- **Jotai atoms** for UI state (primary approach)
- **Convex queries/mutations** for persistent data
- **Local React state** for component-level UI

### Map Markers (Unique Silhouettes)
| Category | Icon | Color |
|----------|------|-------|
| home-base | House | Pink (#EC4899) |
| toddler-friendly | Heart | Light Pink (#F472B6) |
| attraction | Camera | Green (#10B981) |
| shopping | Shopping bag | Purple (#8B5CF6) |
| restaurant | Plate | Amber (#F59E0B) |
| nature | Tree | Lime (#22C55E) |
| temple | Pagoda | Red (#EF4444) |
| playground | Swing | Cyan (#06B6D4) |
| medical | Cross | Dark Red (#DC2626) |
| ai-suggested | Pin + sparkle | Violet (#A855F7) |

### Glassmorphic Design
```tsx
bg-white/95 backdrop-blur-xl border border-slate-200/50
```

### Plan A/B System
- **Plan A:** Primary itinerary (solid red route #FF1744)
- **Plan B:** Backup/rainy day alternative (dashed sky-blue route #00B0FF)
- Auto-suggests Plan B when energy is low, toddler is tired/fussy, or weather is poor

### Energy-Based Theme System

| Energy Level | Theme Colors | Suggested Mode |
|--------------|--------------|----------------|
| High | Vibrant sunset/ocean | Plan A |
| Medium | Balanced colors | Plan A |
| Low | Calm slate/blue | Plan B |

The UI dynamically shifts colors based on user energy, toddler mood, and health status with smooth 500ms transitions.

### Responsive Design
- **Desktop:** Floating panels with drag positioning
- **Mobile:** FAB navigation, safe area insets, bottom sheets

## 📖 Documentation

- [PRD.md](./PRD.md) - Full product requirements
- [CLAUDE.md](./CLAUDE.md) - Development philosophy and workflow
- [.env.example](./.env.example) - Environment configuration template

## 🔧 Available Scripts

```bash
npm run dev          # Start Vite dev server (http://localhost:3000)
npm run build        # Production build to dist/
npm run lint         # Run ESLint (zero-warnings enforced)
npm run lint:fix     # Auto-fix ESLint issues
npm run type-check   # TypeScript compilation check
npx convex dev       # Start Convex backend locally
npx convex deploy    # Deploy Convex to cloud
```

## 🗄️ Database Schema

Convex provides 30+ tables including:
- **Auth:** users, authSessions, authAccounts
- **Trips:** trips, tripMembers, locations
- **Planning:** dayPlans, tripScheduleItems, activities
- **Weather:** weatherCache, weatherAlerts
- **Context:** destinationContexts (AI-generated country info cache)
- **Collaboration:** comments, notifications

## 🌐 Deployment

### Vercel (Frontend)
```bash
# Connect to Vercel
npx vercel

# Deploy to production
npx vercel --prod
```

### Convex (Backend)
```bash
# Deploy backend
npx convex deploy

# Set environment variables in Convex dashboard
ANTHROPIC_API_KEY=sk-ant-...
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes with descriptive messages
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Branch Naming Convention
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

## 📄 License

MIT License - feel free to use this for your own family trips!

## 🙏 Acknowledgments

- [Google Maps](https://developers.google.com/maps) for mapping and routing
- [Anthropic](https://www.anthropic.com/) for Claude AI
- [Convex](https://www.convex.dev/) for real-time backend
- Travel planning communities for location research

---

**Safe travels! 🛫✨**
