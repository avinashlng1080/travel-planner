import { httpAction } from "./_generated/server";
import { LOCATIONS, DAILY_PLANS, SAFETY_INFO, WEATHER_INFO, TODDLER_SCHEDULE } from "../src/data/tripData";

// Build the system prompt with trip context
function buildSystemPrompt(): string {
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

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// HTTP action for Claude API - keeps API key server-side
export const chat = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const { messages } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const systemPrompt = buildSystemPrompt();

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
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        // Enable web search and map pin suggestion tools
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 3,
            // Localize results for Malaysia
            user_location: {
              type: "approximate",
              city: "Kuala Lumpur",
              region: "Kuala Lumpur",
              country: "MY",
              timezone: "Asia/Kuala_Lumpur"
            }
          },
          {
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
                      name: {
                        type: "string",
                        description: "Name of the place"
                      },
                      lat: {
                        type: "number",
                        description: "Latitude coordinate"
                      },
                      lng: {
                        type: "number",
                        description: "Longitude coordinate"
                      },
                      category: {
                        type: "string",
                        enum: ["restaurant", "attraction", "shopping", "nature", "playground", "temple", "medical", "toddler-friendly"],
                        description: "Category of the location"
                      },
                      description: {
                        type: "string",
                        description: "Brief description of the place"
                      },
                      reason: {
                        type: "string",
                        description: "Why you're recommending this place"
                      }
                    },
                    required: ["name", "lat", "lng"]
                  }
                }
              },
              required: ["pins"]
            }
          }
        ],
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
