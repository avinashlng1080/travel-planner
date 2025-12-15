import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { LOCATIONS, DAILY_PLANS, SAFETY_INFO, WEATHER_INFO, TODDLER_SCHEDULE } from "../src/data/tripData";

// Types for trip data
interface TripContext {
  name: string;
  destination?: string;
  startDate: string;
  endDate: string;
  travelerInfo?: string;
  interests?: string;
  homeBase?: { name: string; lat: number; lng: number };
}

interface TripLocation {
  name: string;
  category?: string;
  description?: string;
  lat?: number;
  lng?: number;
}

// Build LEGACY system prompt for hardcoded Malaysia trip
function buildLegacySystemPrompt(): string {
  const locationSummary = LOCATIONS.map(
    (loc) =>
      `- ${loc.name} (${loc.category}): ${loc.description}. Toddler rating: ${loc.toddlerRating}/5. ${loc.isIndoor ? "Indoor" : "Outdoor"}.`
  ).join("\n");

  const daySummary = DAILY_PLANS.map(
    (day) =>
      `- ${day.date} (${day.dayOfWeek}): ${day.title}. Weather: ${day.weatherConsideration}.`
  ).join("\n");

  return `You are a helpful travel assistant for a family trip to Malaysia (Dec 21, 2025 - Jan 6, 2026).

TRIP CONTEXT:
- Travelers: 2 adults + 1 toddler (19 months old)
- Base: M Vertica Residence, Cheras, Kuala Lumpur
- Duration: 17 nights

TODDLER SCHEDULE:
- Wake: ${TODDLER_SCHEDULE.wakeTime}
- Morning nap: ${TODDLER_SCHEDULE.morningNap.start} (${TODDLER_SCHEDULE.morningNap.duration} min)
- Afternoon nap: ${TODDLER_SCHEDULE.afternoonNap.start} (${TODDLER_SCHEDULE.afternoonNap.duration} min)
- Bedtime: ${TODDLER_SCHEDULE.bedtime}
- Can sleep in stroller: ${TODDLER_SCHEDULE.canSleepInStroller ? "Yes" : "No"}

LOCATIONS:
${locationSummary}

DAILY PLANS:
${daySummary}

WEATHER (Dec-Jan):
- KL: ${WEATHER_INFO.klWeather.temperature}, ${WEATHER_INFO.klWeather.rainfall}
- Cameron Highlands: ${WEATHER_INFO.cameronWeather.temperature} (much cooler!)

SAFETY:
- Emergency: Police/Ambulance 999
- ${SAFETY_INFO.healthTips.join(". ")}

IMPORTANT RULES:
1. Always consider the toddler's nap schedule when suggesting activities
2. Recommend Plan B (indoor alternatives) when relevant
3. Warn about specific location requirements (baby carrier vs stroller, dress codes)
4. Mention Grab costs when suggesting transportation
5. Be concise but helpful

WEB SEARCH:
You have access to web search for real-time information. Use it when users ask about:
- Current weather forecasts
- Latest opening hours or prices
- Recent reviews or recommendations
- Current events in Malaysia
- Travel advisories or updates
- Any information that may have changed recently

When you search the web, always cite your sources.

ADDING MAP PINS:
You can suggest locations to add to the map using the suggest_map_pins tool. Use this when:
- The user asks about specific places to visit
- You recommend restaurants, attractions, or activities
- The user wants to discover new places near a location
- You search for and find specific places with addresses

When suggesting pins, provide:
- name: The place name
- lat/lng: Coordinates (search the web if unsure)
- category: One of restaurant, attraction, shopping, nature, playground, temple, medical
- description: Brief description
- reason: Why you're suggesting it

Always use suggest_map_pins when you have specific place recommendations with coordinates.`;
}

// Build DYNAMIC system prompt for user-created trips
function buildDynamicSystemPrompt(trip: TripContext, locations: TripLocation[]): string {
  // Calculate trip duration
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Format existing locations
  const locationSummary = locations.length > 0
    ? locations.map(loc => `- ${loc.name}${loc.category ? ` (${loc.category})` : ''}${loc.description ? `: ${loc.description}` : ''}`).join("\n")
    : "No locations added yet.";

  return `You are an expert travel planner helping plan a trip${trip.destination ? ` to ${trip.destination}` : ''}.

## Trip Details
- **Trip Name**: ${trip.name}
- **Destination**: ${trip.destination || 'Not specified'}
- **Dates**: ${trip.startDate} to ${trip.endDate} (${dayCount} days)
- **Travelers**: ${trip.travelerInfo || 'Not specified'}
- **Interests**: ${trip.interests || 'General sightseeing'}
- **Home Base**: ${trip.homeBase?.name || 'Not set'}

## Current Locations (${locations.length})
${locationSummary}

## Your Capabilities

You have powerful tools to help plan this trip:

### 1. ADD LOCATIONS TO MAP
Use the \`add_trip_locations\` tool to add places to the trip map. Use this when:
- User asks for place recommendations
- You find interesting places through web search
- User describes places they want to visit

Always search the web first to get accurate coordinates!

### 2. CREATE ITINERARIES
Use the \`create_itinerary\` tool to generate day-by-day schedules. Use this when:
- User asks to create an itinerary
- User pastes an existing trip plan to import
- User wants a full day planned out

### 3. WEB SEARCH
Use web search for real-time information:
- Current opening hours and prices
- Recent reviews and recommendations
- Coordinates for specific places
- Weather forecasts
- Local events

## Guidelines

1. **Be proactive**: When users describe their trip, immediately suggest relevant places using your tools
2. **Use web search**: Always search for coordinates before adding locations
3. **Consider logistics**: Group nearby places together, account for travel time
4. **Toddler considerations**: If travelers include children, prioritize family-friendly options
5. **Plan B alternatives**: Suggest indoor options for rainy weather
6. **Be conversational**: Explain your suggestions, don't just list places

## When User Pastes an Itinerary

If the user pastes text that looks like an existing itinerary:
1. Parse out the locations and dates
2. Search for coordinates for each place
3. Use \`add_trip_locations\` to add all places to the map
4. Use \`create_itinerary\` to create the schedule

Example input: "Day 1: Eiffel Tower in the morning, lunch at Café de Flore, afternoon at Louvre"
→ Search for each place, add to map, create schedule with appropriate times.`;
}

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Define the tools for Claude
function getTools(tripId?: string) {
  const baseTools: any[] = [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 5,
    },
  ];

  // Legacy tool for Malaysia trip (backward compatibility)
  if (!tripId) {
    baseTools.push({
      name: "suggest_map_pins",
      description: "Suggest locations to add as pins on the user's travel map. Use this whenever recommending specific places to visit.",
      input_schema: {
        type: "object",
        properties: {
          pins: {
            type: "array",
            description: "Array of location pins to add to the map",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Name of the place" },
                lat: { type: "number", description: "Latitude coordinate" },
                lng: { type: "number", description: "Longitude coordinate" },
                category: {
                  type: "string",
                  enum: ["restaurant", "attraction", "shopping", "nature", "playground", "temple", "medical", "toddler-friendly"],
                  description: "Category of the location"
                },
                description: { type: "string", description: "Brief description of the place" },
                reason: { type: "string", description: "Why you're recommending this place" }
              },
              required: ["name", "lat", "lng"]
            }
          }
        },
        required: ["pins"]
      }
    });
  } else {
    // New tools for user-created trips
    baseTools.push({
      name: "add_trip_locations",
      description: "Add locations to the user's trip map. Use this when suggesting places to visit. ALWAYS search the web first to get accurate coordinates.",
      input_schema: {
        type: "object",
        properties: {
          locations: {
            type: "array",
            description: "Array of locations to add to the trip",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Name of the place" },
                lat: { type: "number", description: "Latitude coordinate (required - search web if unknown)" },
                lng: { type: "number", description: "Longitude coordinate (required - search web if unknown)" },
                category: {
                  type: "string",
                  enum: ["restaurant", "attraction", "shopping", "nature", "playground", "temple", "museum", "hotel", "transport", "medical", "toddler-friendly"],
                  description: "Category of the location"
                },
                description: { type: "string", description: "Brief description of the place" },
                toddlerRating: { type: "number", description: "1-5 rating for toddler-friendliness (optional)" },
                estimatedDuration: { type: "string", description: "How long to spend here, e.g., '2 hours'" },
                tips: { type: "array", items: { type: "string" }, description: "Tips for visiting" },
                aiReason: { type: "string", description: "Why you're recommending this place" }
              },
              required: ["name", "lat", "lng"]
            }
          }
        },
        required: ["locations"]
      }
    });

    baseTools.push({
      name: "create_itinerary",
      description: "Create a day-by-day itinerary with scheduled activities. Use this when the user asks for an itinerary or pastes an existing trip plan to import.",
      input_schema: {
        type: "object",
        properties: {
          days: {
            type: "array",
            description: "Array of days with scheduled activities",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "Date in YYYY-MM-DD format" },
                title: { type: "string", description: "Theme for the day, e.g., 'Temple & Gardens Day'" },
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      locationName: { type: "string", description: "Name of the place (must match a location added to the trip)" },
                      startTime: { type: "string", description: "Start time in HH:MM format (24-hour)" },
                      endTime: { type: "string", description: "End time in HH:MM format (24-hour)" },
                      notes: { type: "string", description: "Notes for this activity" },
                      isFlexible: { type: "boolean", description: "Whether timing is flexible" }
                    },
                    required: ["locationName", "startTime", "endTime"]
                  }
                }
              },
              required: ["date", "activities"]
            }
          },
          planName: { type: "string", description: "Which plan to add to (e.g., 'Plan A'). Defaults to Plan A." }
        },
        required: ["days"]
      }
    });
  }

  return baseTools;
}

// HTTP action for Claude API - keeps API key server-side
export const chat = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const body = await request.json();
  const { messages, tripId } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Build system prompt - dynamic if tripId provided, legacy otherwise
  let systemPrompt: string;

  if (tripId) {
    try {
      // Fetch trip data using internal query
      // Note: We can't use ctx.runQuery directly in httpAction, so we'll parse from request
      // The frontend should include trip context in the request
      const tripContext = body.tripContext as TripContext | undefined;
      const tripLocations = body.tripLocations as TripLocation[] | undefined;

      if (tripContext) {
        systemPrompt = buildDynamicSystemPrompt(tripContext, tripLocations || []);
      } else {
        // Fallback to legacy if no context provided
        systemPrompt = buildLegacySystemPrompt();
      }
    } catch (error) {
      // Fallback to legacy prompt on error
      systemPrompt = buildLegacySystemPrompt();
    }
  } else {
    systemPrompt = buildLegacySystemPrompt();
  }

  const tools = getTools(tripId);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `Claude API error: ${error}` }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Network error: ${error}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});
