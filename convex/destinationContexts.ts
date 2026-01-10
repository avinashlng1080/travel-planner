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
      const context = JSON.parse(content);

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
