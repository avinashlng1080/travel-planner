# 🌴 Malaysia Family Travel Planner

An AI-powered travel planning application for families visiting Malaysia with toddlers. Features interactive maps, drag-and-drop itinerary planning, and intelligent recommendations via Claude AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)

## ✨ Features

- 🗺️ **Interactive Map** - OpenStreetMap with category-colored markers
- 🤖 **AI Assistant** - Claude-powered travel advice
- 📅 **Plan A/B Per Day** - Main itinerary + rainy day alternatives
- 👶 **Toddler-Focused** - Ratings, nap time blocking, safety warnings
- 🔄 **Drag & Drop** - Reorder activities easily
- 📍 **25+ Locations** - Pre-loaded with tips, warnings, and details
- 🌐 **Offline Support** - Works without internet (Convex)
- 👨‍👩‍👧 **Shareable** - Real-time sync with family members

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Anthropic API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/travel-planner.git
cd travel-planner

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your Anthropic API key to .env
# VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
travel-planner/
├── src/
│   ├── components/       # React components
│   │   ├── Map/         # Map-related components
│   │   ├── Location/    # Location detail components
│   │   ├── Itinerary/   # Day planning components
│   │   ├── Chat/        # AI chat components
│   │   ├── Filters/     # Filter components
│   │   ├── Safety/      # Safety info components
│   │   └── Layout/      # Layout components
│   ├── data/            # Trip data
│   │   └── tripData.ts  # All locations, plans, safety info
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and API
│   ├── stores/          # Zustand state management
│   ├── styles/          # Global styles
│   └── types/           # TypeScript types
├── convex/              # Convex backend (optional)
├── PRD.md               # Product Requirements Document
├── CLAUDE_CODE_INSTRUCTIONS.md  # Implementation guide
└── package.json
```

## 🗓️ Trip Details

This app is pre-configured for a family trip:

- **Dates:** December 21, 2025 - January 6, 2026
- **Base:** M Vertica Residence, Cheras, Kuala Lumpur
- **Travelers:** Parents + 19-month-old toddler

### Itinerary Highlights

| Date | Activity |
|------|----------|
| Dec 21 | Arrival, KLCC Park |
| Dec 22 | Batu Caves (7am start!) |
| Dec 23 | Genting Highlands |
| Dec 24 | Christmas Eve - Shopping |
| Dec 25 | Aquaria KLCC |
| Dec 26-29 | Cameron Highlands |
| Dec 31 | New Year's Eve at KLCC |
| Jan 3 | Putrajaya |
| Jan 4 | Sunway Pyramid |
| Jan 6 | Departure |

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion
- **Maps:** React-Leaflet + OpenStreetMap
- **Drag & Drop:** @dnd-kit
- **State:** Zustand
- **AI:** Anthropic Claude API
- **Backend:** Convex (optional)

## 📖 Documentation

- [PRD.md](./PRD.md) - Full product requirements
- [CLAUDE_CODE_INSTRUCTIONS.md](./CLAUDE_CODE_INSTRUCTIONS.md) - Implementation guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this for your own family trips!

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for free map tiles
- [Anthropic](https://www.anthropic.com/) for Claude AI
- [Leaflet](https://leafletjs.com/) for map library
- Malaysia tourism blogs for location research

---

**Safe travels! 🛫🇲🇾**
# travel-planner
