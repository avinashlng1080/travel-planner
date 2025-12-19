import { httpAction } from "./_generated/server";

/**
 * Google Weather API Backend
 *
 * Provides secure server-side access to Google Weather API with:
 * - In-memory caching with TTL
 * - CORS support for browser requests
 * - Error handling with fallback responses
 * - Response normalization
 */

// In-memory cache with TTL
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Cache TTL configuration
const CACHE_TTL = {
  forecast: 60 * 60 * 1000,      // 1 hour - forecasts don't change frequently
  current: 10 * 60 * 1000,       // 10 minutes - current conditions update regularly
  alerts: 5 * 60 * 1000,         // 5 minutes - alerts need to be fresh
};

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

/**
 * Helper to make Google Weather API calls
 */
async function fetchWeatherAPI(
  endpoint: string,
  params: Record<string, string>
): Promise<any> {
  const apiKey = process.env.GOOGLE_WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_WEATHER_API_KEY not configured in Convex dashboard");
  }

  const url = new URL(`https://weather.googleapis.com/v1/${endpoint}`);
  url.searchParams.set("key", apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Weather API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Get or set cached data
 */
function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: unknown, ttl: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * GET /v1/forecast/days:lookup
 * Returns daily weather forecast for a location
 */
export const getDailyForecast = httpAction(async (_ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { lat, lng, days = 7 } = body;

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: lat, lng" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check cache
    const cacheKey = `forecast:${lat}:${lng}:${days}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, cached: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch from Google Weather API
    const data = await fetchWeatherAPI("forecast/days:lookup", {
      "location.latitude": lat.toString(),
      "location.longitude": lng.toString(),
      days: days.toString(),
      unitsSystem: "METRIC",
    });

    // Normalize response to our types
    const normalized = normalizeForecastResponse(data);

    // Cache the result
    setCache(cacheKey, normalized, CACHE_TTL.forecast);

    return new Response(
      JSON.stringify({ data: normalized, cached: false }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Forecast API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: createFallbackForecast(),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

/**
 * GET /v1/currentConditions:lookup
 * Returns current weather conditions for a location
 */
export const getCurrentConditions = httpAction(async (_ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: lat, lng" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check cache
    const cacheKey = `current:${lat}:${lng}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, cached: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch from Google Weather API
    const data = await fetchWeatherAPI("currentConditions:lookup", {
      "location.latitude": lat.toString(),
      "location.longitude": lng.toString(),
      unitsSystem: "METRIC",
    });

    // Normalize response to our types
    const normalized = normalizeCurrentResponse(data);

    // Cache the result
    setCache(cacheKey, normalized, CACHE_TTL.current);

    return new Response(
      JSON.stringify({ data: normalized, cached: false }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Current conditions API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: createFallbackCurrent(),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

/**
 * GET /v1/publicAlerts:lookup
 * Returns weather alerts for a location
 */
export const getWeatherAlerts = httpAction(async (_ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: lat, lng" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check cache
    const cacheKey = `alerts:${lat}:${lng}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, cached: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch from Google Weather API
    const data = await fetchWeatherAPI("publicAlerts:lookup", {
      "location.latitude": lat.toString(),
      "location.longitude": lng.toString(),
    });

    // Normalize response to our types
    const normalized = normalizeAlertsResponse(data);

    // Cache the result
    setCache(cacheKey, normalized, CACHE_TTL.alerts);

    return new Response(
      JSON.stringify({ data: normalized, cached: false }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Weather alerts API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: { alerts: [] },
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

/**
 * Normalize Google Weather API forecast response to our types
 */
function normalizeForecastResponse(data: any): any {
  if (!data?.dailyForecasts) {
    return { daily: [] };
  }

  return {
    daily: data.dailyForecasts.map((day: any) => ({
      date: day.date,
      tempMax: day.temperature?.high?.value || 0,
      tempMin: day.temperature?.low?.value || 0,
      precipitationSum: day.totalPrecipitation?.value || 0,
      precipitationProbability: day.precipitationProbability || 0,
      condition: mapWeatherCode(day.weatherCode),
      weatherCode: day.weatherCode,
      description: day.description || '',
      sunrise: day.sunrise,
      sunset: day.sunset,
    })),
  };
}

/**
 * Normalize Google Weather API current conditions response to our types
 */
function normalizeCurrentResponse(data: any): any {
  if (!data?.current) {
    return createFallbackCurrent();
  }

  const current = data.current;
  return {
    temperature: current.temperature?.value || 0,
    humidity: current.humidity || 0,
    condition: mapWeatherCode(current.weatherCode),
    weatherCode: current.weatherCode,
    precipitation: current.precipitation?.value || 0,
    windSpeed: current.windSpeed?.value || 0,
    description: current.description || '',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Normalize Google Weather API alerts response to our types
 */
function normalizeAlertsResponse(data: any): any {
  if (!data?.alerts) {
    return { alerts: [] };
  }

  return {
    alerts: data.alerts.map((alert: any) => ({
      level: mapAlertSeverity(alert.severity),
      title: alert.headline || 'Weather Alert',
      message: alert.description || '',
      recommendation: alert.instruction || '',
      affectedDays: [alert.effectiveTime],
    })),
  };
}

/**
 * Map Google Weather codes to our weather condition types
 */
function mapWeatherCode(code: number): string {
  // Google Weather API codes (simplified mapping)
  if (code >= 200 && code < 300) return 'storm';
  if (code >= 300 && code < 400) return 'drizzle';
  if (code >= 500 && code < 600) {
    return code >= 502 ? 'heavy-rain' : 'rain';
  }
  if (code >= 600 && code < 700) return 'snow';
  if (code >= 700 && code < 800) return 'fog';
  if (code === 800) return 'clear';
  if (code === 801 || code === 802) return 'partly-cloudy';
  if (code >= 803) return 'cloudy';

  return 'partly-cloudy';
}

/**
 * Map Google alert severity to our risk levels
 */
function mapAlertSeverity(severity: string): string {
  const severityMap: Record<string, string> = {
    'MINOR': 'low',
    'MODERATE': 'moderate',
    'SEVERE': 'high',
    'EXTREME': 'severe',
  };
  return severityMap[severity?.toUpperCase()] || 'moderate';
}

/**
 * Create fallback forecast data when API fails
 */
function createFallbackForecast(): any {
  const now = new Date();
  const daily = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    daily.push({
      date: date.toISOString().split('T')[0],
      tempMax: 32,
      tempMin: 24,
      precipitationSum: 0,
      precipitationProbability: 30,
      condition: 'partly-cloudy',
      weatherCode: 801,
      description: 'Partly cloudy',
      sunrise: '07:00',
      sunset: '19:00',
    });
  }

  return { daily };
}

/**
 * Create fallback current conditions when API fails
 */
function createFallbackCurrent(): any {
  return {
    temperature: 28,
    humidity: 70,
    condition: 'partly-cloudy',
    weatherCode: 801,
    precipitation: 0,
    windSpeed: 10,
    description: 'Partly cloudy',
    updatedAt: new Date().toISOString(),
  };
}
