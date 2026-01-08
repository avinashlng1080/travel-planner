# AI-Powered Itinerary Import Feature

## Overview

This feature enables users to paste raw itinerary text from TripIt, ChatGPT, email confirmations, or plain text and have Claude AI automatically parse, geocode, and import it into their trip's Plan A with full preview capability.

**Problem Solved**: Users shouldn't need TripIt, Google Maps, Google Search, and several external tools to plan their vacation. Everything should be housed in this app.

---

## User Experience

### Entry Points

1. **Import Itinerary Button** - On TripViewPage, next to "Add Activity"
2. **Smart Chat Detection** - When user pastes >500 characters in chat, show import suggestion

### User Flow

```
1. User clicks "Import Itinerary" or pastes in chat
   |
2. Modal opens with large textarea
   |
3. User pastes raw text (TripIt export, ChatGPT output, etc.)
   |
4. User clicks "Parse Itinerary"
   |
5. Claude AI analyzes text:
   - Extracts locations with addresses
   - Searches web for coordinates
   - Groups activities by day
   - Infers times and durations
   |
6. Preview panel shows:
   - Locations list with map pins
   - Day-by-day schedule
   - Confidence indicators
   - Edit buttons for each item
   |
7. User can edit/delete items before importing
   |
8. User clicks "Import to Plan A"
   |
9. System creates:
   - tripLocations for each place
   - tripScheduleItems for each activity
   |
10. Success toast with undo option
```

---

## Supported Input Formats

### TripIt Export
```
Sun, 21 Dec 15:00 GMT+8 Check In M Vertica Access 1
555, Jln Cheras, Taman Pertama, 55100 Cheras, Selangor, Malaysia

Sun, 21 Dec 16:30 GMT+8 Aeon Mall - Some grocery shopping
Jalan Jejaka, Maluri, 55100 Kuala Lumpur Until 19:00 GMT+8
```

### ChatGPT Output
```
Day 1 (Dec 21):
- 3:00 PM: Check in at M Vertica Residence
- 4:30 PM - 7:00 PM: Grocery shopping at Aeon Mall Maluri

Day 2 (Dec 22):
- 7:00 AM - 10:00 AM: Visit Batu Caves (famous Hindu temple)
- 11:00 AM: Lunch at Farm Cafe near Batu Caves
```

### Plain Text
```
December 21 - Arrive KL, check in apartment, evening at KLCC
December 22 - Morning Batu Caves, afternoon Zoo Negara
December 23 - Day trip to Genting Highlands
```

---

## Technical Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │ ImportItinerary  │      │   AIChatWidget   │                │
│  │     Modal        │      │  (paste detect)  │                │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                         │                           │
│           └─────────┬───────────────┘                           │
│                     │                                            │
│           ┌─────────▼─────────┐                                 │
│           │ useItineraryParser│                                 │
│           │       hook        │                                 │
│           └─────────┬─────────┘                                 │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │ POST /parseItinerary
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Convex)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  parseItinerary  │ HTTP Action                               │
│  │    (claude.ts)   │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   Claude API     │─────▶│    Web Search    │                │
│  │  (Sonnet 4)      │      │  (coordinates)   │                │
│  └────────┬─────────┘      └──────────────────┘                │
│           │                                                      │
│           ▼ Returns parsed JSON (no DB writes)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼ User reviews & confirms
┌─────────────────────────────────────────────────────────────────┐
│                     IMPORT (Mutations)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐    ┌────────────────────────┐      │
│  │ addAISuggestedLocations│    │   createAIItinerary    │      │
│  │  (tripLocations.ts)    │    │ (tripScheduleItems.ts) │      │
│  └───────────┬────────────┘    └───────────┬────────────┘      │
│              │                              │                    │
│              ▼                              ▼                    │
│  ┌────────────────────────┐    ┌────────────────────────┐      │
│  │   tripLocations table  │    │ tripScheduleItems table│      │
│  └────────────────────────┘    └────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
TripViewPage
├── ImportItineraryModal
│   ├── InputStep (textarea + parse button)
│   ├── ParsingStep (loading animation)
│   ├── PreviewStep
│   │   ├── ImportPreviewPanel
│   │   │   ├── LocationsList
│   │   │   │   └── LocationCard (editable)
│   │   │   ├── DaysList
│   │   │   │   └── DaySection (collapsible)
│   │   │   │       └── ActivityCard (editable)
│   │   │   └── WarningsList
│   │   └── ActionButtons (Import / Cancel)
│   └── CompleteStep (success + undo)
│
└── AIChatWidget
    └── ImportSuggestionBanner (appears on large paste)
```

---

## File Structure

### New Files

```
src/
├── components/trips/
│   ├── ImportItineraryModal.tsx      # Main modal component
│   ├── ImportPreviewPanel.tsx        # Preview with edit capability
│   └── ImportSuggestionBanner.tsx    # Chat paste detection UI
├── hooks/
│   ├── useItineraryParser.ts         # State management for parsing
│   └── usePasteDetection.ts          # Detect large paste events
└── types/
    └── itinerary.ts                  # TypeScript interfaces

convex/
└── parseItinerary.ts                 # HTTP action for AI parsing
```

### Modified Files

```
convex/http.ts                        # Add /parseItinerary route
src/pages/TripViewPage.tsx            # Add import button
src/components/Layout/AIChatWidget.tsx # Add paste detection
```

---

## API Specification

### POST /parseItinerary

**Request Body**:
```typescript
{
  rawText: string;              // The pasted itinerary text
  tripId: string;               // Trip ID for context
  tripContext: {
    name: string;
    destination?: string;
    startDate: string;          // YYYY-MM-DD
    endDate: string;            // YYYY-MM-DD
    travelerInfo?: string;
  };
  existingLocations?: Array<{   // Avoid duplicates
    name: string;
    lat: number;
    lng: number;
  }>;
}
```

**Response Body**:
```typescript
{
  success: boolean;
  parsed: {
    locations: Array<{
      id: string;               // Temporary UUID
      name: string;
      lat: number;
      lng: number;
      category: 'restaurant' | 'attraction' | 'shopping' | 'nature' |
                'temple' | 'hotel' | 'transport' | 'medical' | 'playground';
      description?: string;
      confidence: 'high' | 'medium' | 'low';
      originalText: string;     // What was parsed
    }>;
    days: Array<{
      date: string;             // YYYY-MM-DD
      title?: string;           // e.g., "Arrival Day"
      activities: Array<{
        id: string;             // Temporary UUID
        locationId: string;     // References locations[].id
        locationName: string;
        startTime: string;      // HH:MM (24-hour)
        endTime: string;        // HH:MM (24-hour)
        notes?: string;
        isFlexible: boolean;
        originalText: string;
      }>;
    }>;
    warnings: string[];         // Parsing issues
    suggestions: string[];      // AI recommendations
  };
  error?: string;
}
```

---

## Claude System Prompt

```
You are a travel itinerary parser. Your task is to extract structured data from
raw text that users paste from various sources (TripIt, ChatGPT, emails, etc.).

TRIP CONTEXT:
- Trip Name: {tripName}
- Destination: {destination}
- Dates: {startDate} to {endDate}
- Travelers: {travelerInfo}

INSTRUCTIONS:

1. EXTRACT LOCATIONS
   - Identify all places mentioned (hotels, restaurants, attractions, etc.)
   - Use web_search to find accurate coordinates for each location
   - Categorize appropriately: restaurant, attraction, shopping, nature, temple, hotel, transport, medical, playground
   - If address is provided, use it to improve search accuracy

2. EXTRACT SCHEDULE
   - Group activities by day
   - Parse times from various formats:
     - "3:00 PM" → "15:00"
     - "15:00 GMT+8" → "15:00"
     - "morning" → "09:00"
     - "afternoon" → "14:00"
     - "evening" → "18:00"
   - Infer end times if not provided (use duration hints or default 2 hours)
   - Handle "Until X:XX" format for end times

3. HANDLE AMBIGUITY
   - If year not specified, use trip dates
   - If date unclear, add a warning
   - If location cannot be found, mark confidence as "low"

4. OUTPUT
   Use the parse_itinerary tool to return structured data.
   Include warnings for any issues encountered.
   Include suggestions for improving the itinerary.

EXAMPLE INPUT:
"Sun, 21 Dec 16:30 GMT+8 Aeon Mall - grocery shopping
Jalan Jejaka, Maluri Until 19:00 GMT+8"

EXAMPLE OUTPUT:
- Location: Aeon Mall Maluri (3.1234, 101.7234), category: shopping
- Activity: Dec 21, 16:30-19:00, "Aeon Mall Maluri", notes: "grocery shopping"
```

---

## State Management

### useItineraryParser Hook

```typescript
interface ParsedItinerary {
  locations: ParsedLocation[];
  days: ParsedDay[];
  warnings: string[];
  suggestions: string[];
}

interface UseItineraryParserState {
  step: 'input' | 'parsing' | 'preview' | 'importing' | 'complete';
  rawText: string;
  parsedData: ParsedItinerary | null;
  error: string | null;
  importResult: {
    locationIds: string[];
    scheduleItemIds: string[];
  } | null;
}

interface UseItineraryParserReturn {
  // State
  step: Step;
  rawText: string;
  parsedData: ParsedItinerary | null;
  error: string | null;
  isParsing: boolean;
  isImporting: boolean;

  // Actions
  setRawText: (text: string) => void;
  parse: () => Promise<void>;

  // Edit parsed data
  updateLocation: (id: string, updates: Partial<ParsedLocation>) => void;
  deleteLocation: (id: string) => void;
  updateActivity: (dayIndex: number, activityId: string, updates: Partial<ParsedActivity>) => void;
  deleteActivity: (dayIndex: number, activityId: string) => void;

  // Import
  confirmImport: (planId: string) => Promise<void>;
  undo: () => Promise<void>;
  reset: () => void;
}
```

---

## UI Components

### ImportItineraryModal

**Props**:
```typescript
interface ImportItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: Id<"trips">;
  planId: Id<"tripPlans">;
  initialText?: string;        // Pre-filled from chat paste
  onSuccess?: () => void;
}
```

**States**:
1. **Input**: Large textarea, format examples, character counter
2. **Parsing**: AI animation, "Analyzing your itinerary..."
3. **Preview**: Editable locations and schedule
4. **Importing**: Progress bar
5. **Complete**: Success message with undo button

### ImportPreviewPanel

**Props**:
```typescript
interface ImportPreviewPanelProps {
  data: ParsedItinerary;
  onUpdateLocation: (id: string, updates: Partial<ParsedLocation>) => void;
  onDeleteLocation: (id: string) => void;
  onUpdateActivity: (dayIndex: number, activityId: string, updates: Partial<ParsedActivity>) => void;
  onDeleteActivity: (dayIndex: number, activityId: string) => void;
}
```

**Features**:
- Summary stats: "Found X locations, Y activities across Z days"
- Locations section with category badges
- Days section with collapsible day cards
- Each item has edit/delete buttons
- Warnings section (yellow background)
- Suggestions section (blue background)

### ImportSuggestionBanner

**Props**:
```typescript
interface ImportSuggestionBannerProps {
  characterCount: number;
  onImport: () => void;
  onSendAsMessage: () => void;
  onDismiss: () => void;
}
```

**Visual**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 This looks like an itinerary (1,234 chars)              │
│ [Import to Plan A]  [Send as message]              [×]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

| Error | User Message | Recovery |
|-------|--------------|----------|
| Empty input | "Please paste your itinerary text" | Focus textarea |
| Too short (<50 chars) | "This doesn't look like a full itinerary" | Show tips |
| No dates found | "Couldn't detect dates. Please select a date range." | Show date picker |
| No locations found | "Couldn't identify any locations. Try adding more details." | Allow retry |
| Location search failed | "Couldn't find coordinates for X" | Allow manual edit |
| Claude API error | "AI service temporarily unavailable" | Retry button |
| Import mutation failed | "Failed to save X. Please try again." | Retry partial |

---

## Accessibility

- **Keyboard**: Tab through all fields, Escape to close, Enter to submit
- **Screen Reader**: ARIA labels, live regions for status changes
- **Touch**: 44x44px minimum tap targets
- **Focus**: Auto-focus textarea on open, trap focus in modal
- **Motion**: Respect prefers-reduced-motion

---

## Performance Considerations

- Parse request timeout: 60 seconds (Claude web search can be slow)
- Maximum input text: 50,000 characters
- Batch location searches (Claude handles internally)
- Optimistic UI updates during import

---

## Testing Scenarios

### Happy Path
1. Paste TripIt export → Parse → Preview → Import → Verify in Plan A

### Edge Cases
1. Text with no times (only dates)
2. Text with no dates (only activities)
3. Mixed time formats in same text
4. Locations in different countries
5. Duplicate location names
6. Very long itinerary (30+ days)
7. Non-English location names

### Error Cases
1. Empty input
2. Random text (not an itinerary)
3. Network failure during parse
4. Partial import failure

---

## Future Enhancements

1. **Multiple Plan Support**: Import to Plan B or create new plan
2. **Conflict Detection**: Warn about overlapping times
3. **Smart Suggestions**: Add travel time between locations
4. **Format Detection**: Auto-detect source (TripIt vs ChatGPT vs email)
5. **Template Export**: Export plan in TripIt-compatible format
6. **Collaborative Import**: Share import preview with trip members
