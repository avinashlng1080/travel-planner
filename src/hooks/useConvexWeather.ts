import { useState, useEffect, useCallback, useRef } from 'react';
import { useConvex } from 'convex/react';
import type {
  ProcessedCurrentWeather,
  ProcessedDailyForecast,
  FlashFloodAlert,
  WeatherCondition,
  FlashFloodRiskLevel,
} from '../types/weather';

interface WeatherLocation {
  lat: number;
  lng: number;
  name?: string;
}

interface GoogleWeatherCurrentResponse {
  data?: {
    temperature: number;
    humidity: number;
    condition: string;
    weatherCode: number;
    precipitation: number;
    windSpeed: number;
    description: string;
    updatedAt: string;
  };
  cached?: boolean;
  error?: string;
  fallback?: any;
}

interface GoogleWeatherForecastResponse {
  data?: {
    daily: Array<{
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
    }>;
  };
  cached?: boolean;
  error?: string;
  fallback?: any;
}

/**
 * Hook to fetch weather data from Convex backend (Google Weather API)
 * Replaces direct Open-Meteo API calls with server-side integration
 */
export function useConvexWeather(initialLocation?: WeatherLocation) {
  const convex = useConvex();

  // Default to Kuala Lumpur for Malaysia trips
  const DEFAULT_LOCATION: WeatherLocation = {
    lat: 3.1390,
    lng: 101.6869,
    name: 'Kuala Lumpur',
  };

  const [location, setLocation] = useState<WeatherLocation>(
    initialLocation || DEFAULT_LOCATION
  );

  const [current, setCurrent] = useState<ProcessedCurrentWeather | null>(null);
  const [daily, setDaily] = useState<ProcessedDailyForecast[]>([]);
  const [flashFloodAlert, setFlashFloodAlert] = useState<FlashFloodAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight requests to prevent duplicates
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchLocationRef = useRef<string>('');

  /**
   * Fetch weather data from Convex backend
   */
  const fetchWeatherData = useCallback(
    async (loc: WeatherLocation) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Check if we already fetched for this location
      const locationKey = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
      if (locationKey === lastFetchLocationRef.current && !isLoading) {
        return; // Skip duplicate fetch
      }

      lastFetchLocationRef.current = locationKey;
      setIsLoading(true);
      setError(null);

      try {
        // Fetch forecast and current conditions in parallel
        const [forecastResponse, currentResponse] = await Promise.all([
          convex.fetch('/weather/getDailyForecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: loc.lat, lng: loc.lng, days: 7 }),
          }),
          convex.fetch('/weather/getCurrentConditions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: loc.lat, lng: loc.lng }),
          }),
        ]);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Parse responses
        const forecastData: GoogleWeatherForecastResponse = await forecastResponse.json();
        const currentData: GoogleWeatherCurrentResponse = await currentResponse.json();

        // Handle forecast data
        if (forecastData.data?.daily) {
          const processedDaily: ProcessedDailyForecast[] = forecastData.data.daily.map((day) => {
            const flashFloodRisk = calculateFlashFloodRisk(
              day.precipitationProbability,
              day.precipitationSum
            );

            return {
              date: day.date,
              tempMax: day.tempMax,
              tempMin: day.tempMin,
              precipitationSum: day.precipitationSum,
              precipitationProbability: day.precipitationProbability,
              condition: day.condition as WeatherCondition,
              weatherCode: day.weatherCode,
              description: day.description,
              flashFloodRisk,
              sunrise: day.sunrise,
              sunset: day.sunset,
            };
          });

          setDaily(processedDaily);

          // Check for flash flood alerts
          const highRiskDays = processedDaily.filter(
            (d) => d.flashFloodRisk === 'high' || d.flashFloodRisk === 'severe'
          );

          if (highRiskDays.length > 0) {
            const severity = highRiskDays.some((d) => d.flashFloodRisk === 'severe')
              ? 'severe'
              : 'high';

            setFlashFloodAlert({
              level: severity,
              title: 'Flash Flood Warning',
              message: `Heavy rainfall expected. Flash flood risk is ${severity} for the next ${highRiskDays.length} day(s).`,
              recommendation:
                'Avoid low-lying areas and monitor local weather updates. Consider indoor activities.',
              planBSuggestion: 'Switch to Plan B indoor activities (museums, shopping malls).',
              affectedDays: highRiskDays.map((d) =>
                new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              ),
            });
          } else {
            setFlashFloodAlert(null);
          }
        } else if (forecastData.fallback) {
          // Use fallback data
          setDaily(processFallbackForecast(forecastData.fallback));
        }

        // Handle current conditions
        if (currentData.data) {
          const processedCurrent: ProcessedCurrentWeather = {
            temperature: currentData.data.temperature,
            humidity: currentData.data.humidity,
            condition: currentData.data.condition as WeatherCondition,
            weatherCode: currentData.data.weatherCode,
            precipitation: currentData.data.precipitation,
            windSpeed: currentData.data.windSpeed,
            description: currentData.data.description,
            updatedAt: new Date(currentData.data.updatedAt),
          };

          setCurrent(processedCurrent);
        } else if (currentData.fallback) {
          // Use fallback data
          setCurrent(processFallbackCurrent(currentData.fallback));
        }

        setError(null);
      } catch (err) {
        if (abortController.signal.aborted) {
          return; // Ignore aborted requests
        }

        console.error('Weather fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');

        // Set fallback data
        setDaily(createFallbackForecast());
        setCurrent(createFallbackCurrent());
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [convex, isLoading]
  );

  // Fetch weather when location changes
  useEffect(() => {
    fetchWeatherData(location);

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [location.lat, location.lng, fetchWeatherData]);

  return {
    current,
    daily,
    flashFloodAlert,
    isLoading,
    error,
    location,
    setLocation,
    refetch: () => fetchWeatherData(location),
  };
}

/**
 * Calculate flash flood risk based on precipitation
 */
function calculateFlashFloodRisk(
  precipitationProbability: number,
  precipitationSum: number
): FlashFloodRiskLevel {
  // Malaysia monsoon season: high rainfall = high risk
  if (precipitationProbability > 80 && precipitationSum > 50) {
    return 'severe';
  }
  if (precipitationProbability > 60 && precipitationSum > 30) {
    return 'high';
  }
  if (precipitationProbability > 40 && precipitationSum > 15) {
    return 'moderate';
  }
  return 'low';
}

/**
 * Process fallback forecast from backend
 */
function processFallbackForecast(fallback: any): ProcessedDailyForecast[] {
  if (!fallback?.daily) return createFallbackForecast();

  return fallback.daily.map((day: any) => ({
    date: day.date,
    tempMax: day.tempMax || 32,
    tempMin: day.tempMin || 24,
    precipitationSum: day.precipitationSum || 0,
    precipitationProbability: day.precipitationProbability || 30,
    condition: (day.condition || 'partly-cloudy') as WeatherCondition,
    weatherCode: day.weatherCode || 801,
    description: day.description || 'Partly cloudy',
    flashFloodRisk: (day.flashFloodRisk || 'low') as FlashFloodRiskLevel,
    sunrise: day.sunrise,
    sunset: day.sunset,
  }));
}

/**
 * Process fallback current conditions from backend
 */
function processFallbackCurrent(fallback: any): ProcessedCurrentWeather {
  return {
    temperature: fallback?.temperature || 28,
    humidity: fallback?.humidity || 70,
    condition: (fallback?.condition || 'partly-cloudy') as WeatherCondition,
    weatherCode: fallback?.weatherCode || 801,
    precipitation: fallback?.precipitation || 0,
    windSpeed: fallback?.windSpeed || 10,
    description: fallback?.description || 'Partly cloudy',
    updatedAt: new Date(),
  };
}

/**
 * Create fallback forecast when API fails
 */
function createFallbackForecast(): ProcessedDailyForecast[] {
  const now = new Date();
  const daily: ProcessedDailyForecast[] = [];

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
      flashFloodRisk: 'low',
      sunrise: '07:00',
      sunset: '19:00',
    });
  }

  return daily;
}

/**
 * Create fallback current conditions when API fails
 */
function createFallbackCurrent(): ProcessedCurrentWeather {
  return {
    temperature: 28,
    humidity: 70,
    condition: 'partly-cloudy',
    weatherCode: 801,
    precipitation: 0,
    windSpeed: 10,
    description: 'Partly cloudy',
    updatedAt: new Date(),
  };
}
