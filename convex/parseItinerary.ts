import { httpAction } from "./_generated/server";

/**
 * HTTP action to parse raw itinerary text using Claude AI.
 *
 * This endpoint:
 * 1. Accepts raw text from TripIt, ChatGPT, emails, or plain text
 * 2. Sends to Claude with a specialized parsing prompt
 * 3. Uses web search to find accurate coordinates
 * 4. Returns structured JSON (no database writes)
 */

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Generate a simple UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Build the system prompt for itinerary parsing
function buildParserSystemPrompt(tripContext: {
  name: string;
  destination?: string;
  startDate: string;
  endDate: string;
  travelerInfo?: string;
}): string {
  return `You are a specialized travel itinerary parser with expertise in TripIt exports. Your task is to extract ALL activities from raw text with high accuracy, including flights, logistics, rest days, and multi-location entries.

TRIP CONTEXT:
- Trip Name: ${tripContext.name}
- Destination: ${tripContext.destination || 'Not specified'}
- Dates: ${tripContext.startDate} to ${tripContext.endDate}
- Travelers: ${tripContext.travelerInfo || 'Not specified'}

ACTIVITY TYPES TO EXTRACT:

1. FLIGHTS
   - Patterns: "Flight to [City]", "Depart [Airport Code]", "Arrive [Airport Code]"
   - Extract: airline name, flight number, departure/arrival times, airport codes
   - Duration: Calculate from departure to arrival time (handle timezone differences)
   - Category: "flight"
   - Airport Code Mapping: Use web_search to map codes to coordinates
     * MRU → Sir Seewoosagur Ramgoolam International Airport, Mauritius (-20.4302, 57.6836)
     * KUL → Kuala Lumpur International Airport, Malaysia (2.7456, 101.7072)
     * SIN → Singapore Changi Airport (1.3644, 103.9915)
   - Example: "Sun, 21 Dec 23:05 MRU Depart Air Mauritius MK647" → Flight departing from Mauritius
   - Handle overnight flights: If arrival is next day, add "+1" to endTime

2. CHECK-IN/CHECK-OUT (LOGISTICS)
   - Patterns: "Check in", "Check out", "Pick up rental car", "Drop off rental car"
   - Duration: 15 minutes (these are quick logistics activities)
   - Category: "logistics"
   - Example: "Tue, 23 Dec 14:00 Check in at Holiday Inn" → 14:00-14:15 check-in activity
   - Extract hotel/location name from context

3. REST/FLEXIBLE DAYS
   - Patterns: "Rest Day", "Free time", "Flexible", "No activities scheduled"
   - Duration: Full day flexible time (09:00-20:00)
   - Category: "flexible"
   - Create a generic "Flexible Time" location
   - Example: "Wed, 24 Dec Rest Day" → 09:00-20:00 flexible activity
   - Add warning: "Rest day assumed 09:00-20:00 flexible time"

4. MULTI-LOCATION ACTIVITIES
   - Patterns: Multiple locations mentioned in one entry (e.g., "Aeon Mall then Sunway Pyramid")
   - Strategy: Split into separate activities if:
     * Connected by "then", "afterwards", "followed by"
     * Time allows (at least 2 hours per location)
   - If splitting, distribute time proportionally
   - Example: "10:00-16:00 Aeon Mall then Sunway Pyramid" →
     * 10:00-13:00 Aeon Mall
     * 13:00-16:00 Sunway Pyramid
   - Add warning: "Multi-location entry split into X activities"

5. REGULAR ACTIVITIES
   - Shopping, dining, attractions, nature, temples, etc.
   - Use existing categorization logic
   - Apply smart duration inference (see below)

DURATION INFERENCE (Smart defaults by activity type):
- Flights: Use actual departure → arrival time
- Check-in/Check-out: 15 minutes
- Rest days: 09:00-20:00 (full day)
- Breakfast: 1 hour
- Lunch/Dinner: 1.5 hours
- Shopping malls: 2-3 hours
- Museums: 2-3 hours
- Theme parks/Zoos: 4-6 hours
- Nature parks/Hiking: 3-5 hours
- Temples/Religious sites: 1-2 hours
- Playgrounds (with toddler): 1-2 hours
- Medical appointments: 1 hour
- Default fallback: 2 hours

If explicit end time or duration given, use that instead.

TIME PARSING:
- Parse from various formats:
  * "3:00 PM" → "15:00"
  * "15:00 GMT+8" → "15:00" (strip timezone)
  * "morning" → "09:00"
  * "afternoon" → "14:00"
  * "evening" → "18:00"
  * "night" → "20:00"
- Handle "Until X:XX" format for explicit end times
- Date formats: "Dec 21", "21 Dec", "2025-12-21", "December 21", "Sun, 21 Dec"

COORDINATE PRECISION (AGGRESSIVE SEARCHING):
For EVERY location, use web_search tool up to 10 times if needed:
1. First search: "[Location Name] [City] GPS coordinates"
2. If ambiguous: "[Location Name] [Full Address] coordinates"
3. For airports: "[Airport Code] airport coordinates"
4. For hotels: "[Hotel Name] [City] exact location"
5. For shopping malls: "[Mall Name] [City] latitude longitude"
6. Verify country matches destination (e.g., Malaysia for this trip)
7. If multiple results, choose the one in the correct city/country

Confidence levels:
- "high": Exact match with verified coordinates (e.g., from official website, Google Maps)
- "medium": City-level or approximate location (e.g., city center when specific address unknown)
- "low": Guessed or unclear (e.g., generic "shopping" without specific place)

WARNINGS TO GENERATE:
- "Flight details incomplete - please verify airline and flight number"
- "Location '[Name]' has low confidence coordinates - please verify"
- "Multi-location entry '[Original Text]' split into X activities"
- "Rest day on [Date] assumed 09:00-20:00 flexible time"
- "Could not find coordinates for '[Location]' - marked as low confidence"
- "Duration for '[Activity]' estimated at X hours - please adjust if needed"
- "Airport code '[Code]' not recognized - please verify"
- "Overnight activity detected - spans from [Date 1] to [Date 2]"

SUGGESTIONS TO GENERATE:
- "Consider adding buffer time between activities for travel"
- "Activity at [Location] may need more time (typical visit: X hours)"
- "Consider toddler-friendly timing (avoid late evenings)"
- "Flight arrival at [Time] - factor in immigration and baggage claim"
- "Multiple activities in different areas - consider traffic time"

CATEGORIZATION:
Use these categories appropriately:
- flight: Airport-related (departures, arrivals)
- logistics: Check-ins, check-outs, car rentals, transfers
- flexible: Rest days, free time, unscheduled time
- restaurant: Dining, cafes, food courts
- attraction: Tourist sites, landmarks, entertainment venues
- shopping: Malls, markets, stores
- nature: Parks, gardens, hiking trails, beaches
- temple: Religious sites, mosques, churches
- hotel: Accommodations
- playground: Play areas, kids' zones
- medical: Clinics, hospitals, pharmacies

OUTPUT FORMAT:
Use the parse_itinerary tool to return structured data.
Include ALL extracted locations with coordinates.
Include ALL activities grouped by day.
Include comprehensive warnings for any issues.
Include helpful suggestions for improving the itinerary.

EXAMPLE INPUT (TripIt style):
"Sun, 21 Dec 23:05 MRU Depart Air Mauritius MK647
Mon, 22 Dec 06:20 KUL Arrive
Mon, 22 Dec 14:00 Check in Holiday Inn Kuala Lumpur
Wed, 24 Dec Rest Day
Thu, 25 Dec 10:00 Sunway Lagoon Theme Park Until 18:00"

EXAMPLE OUTPUT:
- Locations:
  * Sir Seewoosagur Ramgoolam International Airport (-20.4302, 57.6836), category: flight, confidence: high
  * Kuala Lumpur International Airport (2.7456, 101.7072), category: flight, confidence: high
  * Holiday Inn Kuala Lumpur (3.1412, 101.6865), category: hotel, confidence: high
  * Flexible Time (3.1390, 101.6869), category: flexible, confidence: medium
  * Sunway Lagoon Theme Park (3.0674, 101.6066), category: attraction, confidence: high
- Activities:
  * Dec 21: 23:05-06:20+1 "Sir Seewoosagur Ramgoolam International Airport" (Flight MK647)
  * Dec 22: 06:20-06:20 "Kuala Lumpur International Airport" (Arrival), 14:00-14:15 "Holiday Inn Kuala Lumpur" (Check in)
  * Dec 24: 09:00-20:00 "Flexible Time" (Rest Day)
  * Dec 25: 10:00-18:00 "Sunway Lagoon Theme Park"
- Warnings: ["Rest day on 2025-12-24 assumed 09:00-20:00 flexible time"]
- Suggestions: ["Flight arrival at 06:20 - consider rest time before check-in at 14:00"]`;
}

// Define the tools for Claude
function getParserTools() {
  return [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 20,
    },
    {
      name: "parse_itinerary",
      description: "Return the parsed itinerary data with locations and schedule. Use this tool to output your final parsing results.",
      input_schema: {
        type: "object",
        properties: {
          locations: {
            type: "array",
            description: "All locations extracted from the itinerary",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Name of the place" },
                lat: { type: "number", description: "Latitude coordinate" },
                lng: { type: "number", description: "Longitude coordinate" },
                category: {
                  type: "string",
                  enum: ["restaurant", "attraction", "shopping", "nature", "temple", "hotel", "transport", "medical", "playground", "flight", "logistics", "flexible"],
                  description: "Category of the location"
                },
                description: { type: "string", description: "Brief description of the place" },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Confidence in the parsed data (high if coordinates verified, low if uncertain)"
                },
                originalText: { type: "string", description: "The original text that was parsed" }
              },
              required: ["name", "lat", "lng", "category", "confidence", "originalText"]
            }
          },
          days: {
            type: "array",
            description: "Days with scheduled activities",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "Date in YYYY-MM-DD format" },
                title: { type: "string", description: "Theme for the day (optional)" },
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      locationName: { type: "string", description: "Name of the place (must match a location)" },
                      startTime: { type: "string", description: "Start time in HH:MM format (24-hour)" },
                      endTime: { type: "string", description: "End time in HH:MM format (24-hour)" },
                      notes: { type: "string", description: "Notes for this activity" },
                      isFlexible: { type: "boolean", description: "Whether timing is flexible" },
                      originalText: { type: "string", description: "The original text that was parsed" }
                    },
                    required: ["locationName", "startTime", "endTime", "originalText"]
                  }
                }
              },
              required: ["date", "activities"]
            }
          },
          warnings: {
            type: "array",
            items: { type: "string" },
            description: "Any warnings about parsing issues"
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "Suggestions for improving the itinerary"
          }
        },
        required: ["locations", "days", "warnings", "suggestions"]
      }
    }
  ];
}

export const parseItinerary = httpAction(async (_ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { rawText, tripContext } = body;

    // Validate input
    if (!rawText || typeof rawText !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Please paste your itinerary text" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (rawText.length < 50) {
      return new Response(
        JSON.stringify({ success: false, error: "This doesn't look like a full itinerary. Please paste more text." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const systemPrompt = buildParserSystemPrompt(tripContext || {
      name: 'Trip',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });

    const tools = getParserTools();

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Please parse this itinerary and extract all locations with coordinates and the daily schedule:\n\n${rawText}`
          }
        ],
        tools,
        tool_choice: { type: "auto" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Claude API error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const data = await response.json();

    // Process the response - look for tool use
    let parsedResult = null;

    for (const content of data.content || []) {
      if (content.type === 'tool_use' && content.name === 'parse_itinerary') {
        parsedResult = content.input;
        break;
      }
    }

    // If Claude didn't use the tool, try to extract from text response
    if (!parsedResult) {
      // Return an error if parsing failed
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not parse the itinerary. Please check the format and try again."
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Add IDs to parsed items
    const locations = (parsedResult.locations || []).map((loc: any) => ({
      ...loc,
      id: generateId(),
    }));

    // Create a map of location names to IDs
    const locationNameToId: Record<string, string> = {};
    for (const loc of locations) {
      locationNameToId[loc.name.toLowerCase()] = loc.id;
    }

    const days = (parsedResult.days || []).map((day: any) => ({
      ...day,
      activities: (day.activities || []).map((activity: any) => {
        // Find the location ID by matching name
        const locationId = locationNameToId[activity.locationName?.toLowerCase()] || '';
        return {
          ...activity,
          id: generateId(),
          locationId,
          isFlexible: activity.isFlexible ?? true,
        };
      }),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        parsed: {
          locations,
          days,
          warnings: parsedResult.warnings || [],
          suggestions: parsedResult.suggestions || [],
        },
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Parse itinerary error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred while parsing. Please try again." }),
      { status: 500, headers: corsHeaders }
    );
  }
});
