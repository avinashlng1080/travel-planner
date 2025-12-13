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
5. Be concise but helpful`;
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
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
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
