import { httpAction } from "./_generated/server";

/**
 * Google Weather API Backend
 *
 * Provides secure server-side access to Google Weather API with:
 * - In-memory caching with TTL
 * - CORS support for browser requests
 * - Error handling with fallback responses
 * - Response normalization
 * - Request timeout protection
 * - Coordinate validation
 */

// TypeScript interfaces for Google Weather API responses
interface GoogleWeatherTemperature {
  high?: { value?: number };
  low?: { value?: number };
  value?: number;
}

interface GoogleWeatherDailyForecast {
  date: string;
  temperature?: GoogleWeatherTemperature;
  totalPrecipitation?: { value?: number };
  precipitationProbability?: number;
  weatherCode: number;
  description?: string;
  sunrise?: string;
  sunset?: string;
}

interface GoogleWeatherDailyResponse {
  dailyForecasts?: GoogleWeatherDailyForecast[];
}

interface GoogleWeatherCurrentConditions {
  temperature?: { value?: number };
  humidity?: number;
  weatherCode: number;
  description?: string;
  precipitation?: { value?: number };
  windSpeed?: { value?: number };
}

interface GoogleWeatherCurrentResponse {
  current?: GoogleWeatherCurrentConditions;
}

interface GoogleWeatherAlert {
  severity?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  effectiveTime?: string;
}

interface GoogleWeatherAlertsResponse {
  alerts?: GoogleWeatherAlert[];
}

// Normalized response types
interface NormalizedDailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  condition: string;
  weatherCode: number;
  description: string;
  sunrise?: string;
  sunset?: string;
}

interface NormalizedForecastResponse {
  daily: NormalizedDailyForecast[];
}

interface NormalizedCurrentConditions {
  temperature: number;
  humidity: number;
  condition: string;
  weatherCode: number;
  precipitation: number;
  windSpeed: number;
  description: string;
  updatedAt: string;
}

interface NormalizedAlert {
  level: string;
  title: string;
  message: string;
  recommendation: string;
  affectedDays: (string | undefined)[];
}

interface NormalizedAlertsResponse {
  alerts: NormalizedAlert[];
}

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

// Fetch timeout configuration
const FETCH_TIMEOUT_MS = 10000; // 10 seconds

// CORS headers for browser requests
const getAllowedOrigin = (): string => {
  return process.env.SITE_URL || "https://your-domain.convex.site";
};

const getCorsHeaders = () => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(),
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
});

/**
 * Validate geographic coordinates
 */
function validateCoordinates(lat: unknown, lng: unknown): { lat: number; lng: number } {
  // Check if values exist
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    throw new Error("Missing coordinates: lat and lng are required");
  }

  // Convert to numbers
  const latNum = typeof lat === 'number' ? lat : Number(lat);
  const lngNum = typeof lng === 'number' ? lng : Number(lng);

  // Check if conversion was successful
  if (isNaN(latNum) || isNaN(lngNum)) {
    throw new Error("Invalid coordinates: lat and lng must be valid numbers");
  }

  // Validate ranges
  if (latNum < -90 || latNum > 90) {
    throw new Error(`Invalid latitude: ${latNum} (must be between -90 and 90)`);
  }

  if (lngNum < -180 || lngNum > 180) {
    throw new Error(`Invalid longitude: ${lngNum} (must be between -180 and 180)`);
  }

  return { lat: latNum, lng: lngNum };
}

/**
 * Helper to make Google Weather API calls with timeout protection
 */
async function fetchWeatherAPI(
  endpoint: string,
  params: Record<string, string>
): Promise<GoogleWeatherDailyResponse | GoogleWeatherCurrentResponse | GoogleWeatherAlertsResponse> {
  const apiKey = process.env.GOOGLE_WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_WEATHER_API_KEY not configured in Convex dashboard");
  }

  const url = new URL(`https://weather.googleapis.com/v1/${endpoint}`);
  url.searchParams.set("key", apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Weather API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Weather API request timed out after ${FETCH_TIMEOUT_MS}ms`);
    }

    throw error;
  }
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
  const corsHeaders = getCorsHeaders();

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { lat, lng, days = 7 } = body;

    // Validate coordinates
    const coords = validateCoordinates(lat, lng);

    // Check cache
    const cacheKey = `forecast:${coords.lat}:${coords.lng}:${days}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, cached: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch from Google Weather API
    const data = await fetchWeatherAPI("forecast/days:lookup", {
      "location.latitude": coords.lat.toString(),
      "location.longitude": coords.lng.toString(),
      days: days.toString(),
      unitsSystem: "METRIC",
    }) as GoogleWeatherDailyResponse;

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
  const corsHeaders = getCorsHeaders();

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { lat, lng } = body;

    // Validate coordinates
    const coords = validateCoordinates(lat, lng);

    // Check cache
    const cacheKey = `current:${coords.lat}:${coords.lng}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, cached: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch from Google Weather API
    const data = await fetchWeatherAPI("currentConditions:lookup", {
      "location.latitude": coords.lat.toString(),
      "location.longitude": coords.lng.toString(),
      unitsSystem: "METRIC",
    }) as GoogleWeatherCurrentResponse;

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
  const corsHeaders = getCorsHeaders();

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { lat, lng } = body;

    // Validate coordinates
    const coords = validateCoordinates(lat, lng);

    // Check cache
    const cacheKey = `alerts:${coords.lat}:${coords.lng}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, cached: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch from Google Weather API
    const data = await fetchWeatherAPI("publicAlerts:lookup", {
      "location.latitude": coords.lat.toString(),
      "location.longitude": coords.lng.toString(),
    }) as GoogleWeatherAlertsResponse;

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
function normalizeForecastResponse(data: GoogleWeatherDailyResponse): NormalizedForecastResponse {
  if (!data?.dailyForecasts) {
    return { daily: [] };
  }

  return {
    daily: data.dailyForecasts.map((day: GoogleWeatherDailyForecast): NormalizedDailyForecast => ({
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
function normalizeCurrentResponse(data: GoogleWeatherCurrentResponse): NormalizedCurrentConditions {
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
function normalizeAlertsResponse(data: GoogleWeatherAlertsResponse): NormalizedAlertsResponse {
  if (!data?.alerts) {
    return { alerts: [] };
  }

  return {
    alerts: data.alerts.map((alert: GoogleWeatherAlert): NormalizedAlert => ({
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
function mapAlertSeverity(severity?: string): string {
  if (!severity) return 'moderate';

  const severityMap: Record<string, string> = {
    'MINOR': 'low',
    'MODERATE': 'moderate',
    'SEVERE': 'high',
    'EXTREME': 'severe',
  };
  return severityMap[severity.toUpperCase()] || 'moderate';
}

/**
 * Create fallback forecast data when API fails
 */
function createFallbackForecast(): NormalizedForecastResponse {
  const now = new Date();
  const daily: NormalizedDailyForecast[] = [];

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
function createFallbackCurrent(): NormalizedCurrentConditions {
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
