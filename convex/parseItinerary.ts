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
  return `You are a travel itinerary parser. Your task is to extract structured data from
raw text that users paste from various sources (TripIt, ChatGPT, emails, etc.).

TRIP CONTEXT:
- Trip Name: ${tripContext.name}
- Destination: ${tripContext.destination || 'Not specified'}
- Dates: ${tripContext.startDate} to ${tripContext.endDate}
- Travelers: ${tripContext.travelerInfo || 'Not specified'}

INSTRUCTIONS:

1. EXTRACT LOCATIONS
   - Identify all places mentioned (hotels, restaurants, attractions, etc.)
   - Use web_search to find accurate coordinates for each location
   - Search with specific terms like "[place name] [city] coordinates" or "[place name] [address]"
   - Categorize appropriately: restaurant, attraction, shopping, nature, temple, hotel, transport, medical, playground
   - If address is provided, use it to improve search accuracy

2. EXTRACT SCHEDULE
   - Group activities by day
   - Parse times from various formats:
     - "3:00 PM" → "15:00"
     - "15:00 GMT+8" → "15:00" (strip timezone)
     - "morning" → "09:00"
     - "afternoon" → "14:00"
     - "evening" → "18:00"
     - "night" → "20:00"
   - Infer end times if not provided:
     - Use duration hints if available (e.g., "2 hours")
     - Default to 2 hours for activities
     - Use "Until X:XX" format for explicit end times
   - Handle date formats: "Dec 21", "21 Dec", "2025-12-21", "December 21"

3. HANDLE AMBIGUITY
   - If year not specified, use the trip dates to infer
   - If date unclear, add a warning
   - If location cannot be found, mark confidence as "low"
   - If coordinates seem wrong (e.g., wrong country), add a warning

4. OUTPUT
   Use the parse_itinerary tool to return structured data.
   Include warnings for any issues encountered.
   Include helpful suggestions for improving the itinerary.

EXAMPLE INPUT:
"Sun, 21 Dec 16:30 GMT+8 Aeon Mall - grocery shopping
Jalan Jejaka, Maluri Until 19:00 GMT+8"

EXAMPLE OUTPUT:
- Location: Aeon Mall Maluri (3.1234, 101.7234), category: shopping, confidence: high
- Activity: Dec 21, 16:30-19:00, "Aeon Mall Maluri", notes: "grocery shopping"`;
}

// Define the tools for Claude
function getParserTools() {
  return [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 10,
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
                  enum: ["restaurant", "attraction", "shopping", "nature", "temple", "hotel", "transport", "medical", "playground"],
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
