import { query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Destination Contexts - AI-generated location-specific info for any destination.
 *
 * This enables the travel planner to work with ANY destination by:
 * 1. Checking if we have cached context for a country
 * 2. If not, generating it via Claude AI
 * 3. Caching it for future use
 */

/** Expected structure for destination context */
interface DestinationContextSchema {
  country: { name: string; code: string; timezone: string };
  emergency: { police: string; ambulance: string; fire: string };
  safety: { healthTips: string[]; culturalEtiquette: string[] };
  weather: { climate: string; packingTips: string[] };
  currency: { code: string; symbol: string };
}

/**
 * Runtime validation for destination context structure.
 * Ensures AI-generated JSON matches expected schema before persisting.
 */
function validateDestinationContext(data: unknown): DestinationContextSchema {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid context: expected an object');
  }

  const ctx = data as Record<string, unknown>;

  // Validate country
  if (!ctx.country || typeof ctx.country !== 'object') {
    throw new Error('Invalid context: missing or invalid country field');
  }
  const country = ctx.country as Record<string, unknown>;
  if (typeof country.name !== 'string' || typeof country.code !== 'string' || typeof country.timezone !== 'string') {
    throw new Error('Invalid context: country must have name, code, and timezone strings');
  }

  // Validate emergency
  if (!ctx.emergency || typeof ctx.emergency !== 'object') {
    throw new Error('Invalid context: missing or invalid emergency field');
  }
  const emergency = ctx.emergency as Record<string, unknown>;
  if (typeof emergency.police !== 'string' || typeof emergency.ambulance !== 'string' || typeof emergency.fire !== 'string') {
    throw new Error('Invalid context: emergency must have police, ambulance, and fire strings');
  }

  // Validate safety
  if (!ctx.safety || typeof ctx.safety !== 'object') {
    throw new Error('Invalid context: missing or invalid safety field');
  }
  const safety = ctx.safety as Record<string, unknown>;
  if (!Array.isArray(safety.healthTips) || !Array.isArray(safety.culturalEtiquette)) {
    throw new Error('Invalid context: safety must have healthTips and culturalEtiquette arrays');
  }
  if (!safety.healthTips.every((tip: unknown) => typeof tip === 'string') ||
      !safety.culturalEtiquette.every((tip: unknown) => typeof tip === 'string')) {
    throw new Error('Invalid context: safety tips must be string arrays');
  }

  // Validate weather
  if (!ctx.weather || typeof ctx.weather !== 'object') {
    throw new Error('Invalid context: missing or invalid weather field');
  }
  const weather = ctx.weather as Record<string, unknown>;
  if (typeof weather.climate !== 'string' || !Array.isArray(weather.packingTips)) {
    throw new Error('Invalid context: weather must have climate string and packingTips array');
  }
  if (!weather.packingTips.every((tip: unknown) => typeof tip === 'string')) {
    throw new Error('Invalid context: packingTips must be a string array');
  }

  // Validate currency
  if (!ctx.currency || typeof ctx.currency !== 'object') {
    throw new Error('Invalid context: missing or invalid currency field');
  }
  const currency = ctx.currency as Record<string, unknown>;
  if (typeof currency.code !== 'string' || typeof currency.symbol !== 'string') {
    throw new Error('Invalid context: currency must have code and symbol strings');
  }

  return data as DestinationContextSchema;
}

/**
 * Get cached destination context by country code.
 * Returns null if not found or expired.
 */
export const getByCountryCode = query({
  args: { countryCode: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("destinationContexts")
      .withIndex("by_countryCode", (q) => q.eq("countryCode", args.countryCode.toUpperCase()))
      .first();

    if (!existing) {
      return null;
    }

    // Context doesn't expire - country info rarely changes
    return existing.context;
  },
});

/**
 * Internal mutation to save generated context.
 */
export const saveContext = internalMutation({
  args: {
    countryCode: v.string(),
    context: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("destinationContexts")
      .withIndex("by_countryCode", (q) => q.eq("countryCode", args.countryCode.toUpperCase()))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        context: args.context,
        generatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new
    return await ctx.db.insert("destinationContexts", {
      countryCode: args.countryCode.toUpperCase(),
      context: args.context,
      generatedAt: Date.now(),
    });
  },
});

/**
 * Generate destination context using Claude AI.
 * This action calls the Anthropic API to generate country-specific info.
 */
export const generateContext = action({
  args: {
    countryCode: v.string(),
    countryName: v.string(),
  },
  handler: async (ctx, args): Promise<{
    country: { name: string; code: string; timezone: string };
    emergency: { police: string; ambulance: string; fire: string };
    safety: { healthTips: string[]; culturalEtiquette: string[] };
    weather: { climate: string; packingTips: string[] };
    currency: { code: string; symbol: string };
  }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const prompt = `Generate travel information for ${args.countryName} (country code: ${args.countryCode}).

Return a JSON object with this exact structure (no markdown, just JSON):
{
  "country": {
    "name": "Full country name",
    "code": "ISO 2-letter code",
    "timezone": "IANA timezone (e.g., Asia/Tokyo)"
  },
  "emergency": {
    "police": "Emergency police number",
    "ambulance": "Emergency ambulance number",
    "fire": "Emergency fire number"
  },
  "safety": {
    "healthTips": ["4-5 health/medical tips for travelers"],
    "culturalEtiquette": ["4-5 cultural etiquette tips"]
  },
  "weather": {
    "climate": "Brief climate description",
    "packingTips": ["4-5 packing recommendations"]
  },
  "currency": {
    "code": "ISO currency code (e.g., JPY)",
    "symbol": "Currency symbol (e.g., ¥)"
  }
}

Be accurate and practical. Focus on information travelers actually need.`;

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
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text;

      if (!content) {
        throw new Error("No content in API response");
      }

      // Parse the JSON response
      const rawContext = JSON.parse(content);

      // Validate the response structure before saving
      const context = validateDestinationContext(rawContext);

      // Save to database
      await ctx.runMutation(internal.destinationContexts.saveContext, {
        countryCode: args.countryCode,
        context,
      });

      return context;
    } catch (error) {
      console.error("Failed to generate destination context:", error);
      throw error;
    }
  },
});

// Note: The getOrGenerate pattern was removed to avoid circular type inference issues.
// Frontend should:
// 1. Query getByCountryCode to check cache
// 2. If null, call generateContext action to create and cache it
