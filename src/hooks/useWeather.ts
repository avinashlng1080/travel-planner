/**
 * useWeather Hook
 *
 * Fetches weather data from Open-Meteo API (free, no API key required)
 * Features:
 * - In-memory caching to avoid duplicate API calls
 * - Auto-refresh every 15 minutes
 * - Debounced location changes
 * - Flash flood risk calculation for Malaysia
 */

import { useAtom, useAtomValue } from 'jotai';
import { useState, useEffect, useRef, useCallback } from 'react';

import {
  weatherLocationAtom,
  weatherAutoRefreshAtom,
  lastWeatherDataAtom,
} from '../atoms/weatherAtoms';
import {
  getWeatherCondition,
  getWeatherDescription,
  calculateFlashFloodRisk,
  generateFlashFloodAlert,
  getDayOfWeek,
} from '../utils/weatherUtils';

import type {
  OpenMeteoResponse,
  ProcessedCurrentWeather,
  ProcessedDailyForecast,
  FlashFloodAlert,
  UseWeatherResult,
  WeatherLocation,
} from '../types/weather';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache validity
const DEBOUNCE_DELAY = 300; // 300ms debounce for location changes

interface CacheEntry {
  data: {
    current: ProcessedCurrentWeather;
    daily: ProcessedDailyForecast[];
    flashFloodAlert: FlashFloodAlert | null;
  };
  timestamp: number;
}

/**
 * Custom hook for fetching weather data from Open-Meteo
 *
 * @param enabled - Whether to fetch weather (default: true)
 * @returns Weather state with current conditions, forecast, and flash flood alerts
 */
export function useWeather(enabled = true): UseWeatherResult {
  const [location, setLocationAtom] = useAtom(weatherLocationAtom);
  const autoRefresh = useAtomValue(weatherAutoRefreshAtom);
  const [, setLastWeatherData] = useAtom(lastWeatherDataAtom);

  const [current, setCurrent] = useState<ProcessedCurrentWeather | null>(null);
  const [daily, setDaily] = useState<ProcessedDailyForecast[]>([]);
  const [flashFloodAlert, setFlashFloodAlert] = useState<FlashFloodAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Cache for API responses
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Generate cache key from coordinates
  const getCacheKey = (lat: number, lng: number): string => {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  };

  // Check if cache entry is still valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_TTL;
  };

  // Process API response into internal format
  const processWeatherData = (
    data: OpenMeteoResponse
  ): {
    current: ProcessedCurrentWeather;
    daily: ProcessedDailyForecast[];
    flashFloodAlert: FlashFloodAlert | null;
  } => {
    // Process current weather
    const currentWeather: ProcessedCurrentWeather = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      condition: getWeatherCondition(data.current.weather_code),
      weatherCode: data.current.weather_code,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      description: getWeatherDescription(data.current.weather_code),
      updatedAt: new Date(),
    };

    // Process daily forecast
    const dailyForecast: ProcessedDailyForecast[] = data.daily.time.map(
      (date, index) => {
        const precipSum = data.daily.precipitation_sum[index];
        const precipProb = data.daily.precipitation_probability_max[index];
        const weatherCode = data.daily.weather_code[index];

        return {
          date,
          dayOfWeek: getDayOfWeek(date),
          tempMax: data.daily.temperature_2m_max[index],
          tempMin: data.daily.temperature_2m_min[index],
          precipitationSum: precipSum,
          precipitationProbability: precipProb,
          condition: getWeatherCondition(weatherCode),
          weatherCode,
          flashFloodRisk: calculateFlashFloodRisk(precipSum, precipProb, weatherCode),
          sunrise: data.daily.sunrise[index],
          sunset: data.daily.sunset[index],
        };
      }
    );

    // Generate flash flood alert
    const alert = generateFlashFloodAlert(dailyForecast);

    return {
      current: currentWeather,
      daily: dailyForecast,
      flashFloodAlert: alert,
    };
  };

  // Fetch weather data from API
  const fetchWeather = useCallback(
    async (lat: number, lng: number, forceRefresh: boolean = false) => {
      const cacheKey = getCacheKey(lat, lng);

      // Check cache first (unless forcing refresh)
      if (!forceRefresh && cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!;
        if (isCacheValid(cached.timestamp)) {
          setCurrent(cached.data.current);
          setDaily(cached.data.daily);
          setFlashFloodAlert(cached.data.flashFloodAlert);
          setLastFetch(new Date(cached.timestamp));
          setIsLoading(false);
          setError(null);
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        // Build API URL with parameters
        const params = new URLSearchParams({
          latitude: lat.toString(),
          longitude: lng.toString(),
          current:
            'temperature_2m,relative_humidity_2m,weather_code,precipitation,rain,showers,wind_speed_10m',
          hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,rain,showers',
          daily:
            'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset',
          timezone: 'Asia/Kuala_Lumpur',
          forecast_days: '7',
        });

        const response = await fetch(`${OPEN_METEO_URL}?${params}`);

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }

        const data: OpenMeteoResponse = await response.json();
        const processed = processWeatherData(data);

        // Update cache
        cacheRef.current.set(cacheKey, {
          data: processed,
          timestamp: Date.now(),
        });

        // Update state
        setCurrent(processed.current);
        setDaily(processed.daily);
        setFlashFloodAlert(processed.flashFloodAlert);
        setLastFetch(new Date());
        setIsLoading(false);

        // Update global last weather data atom
        setLastWeatherData({
          current: processed.current,
          daily: processed.daily,
          flashFloodAlert: processed.flashFloodAlert,
          isLoading: false,
          error: null,
          lastFetch: new Date(),
          location: { lat, lng, name: location.name },
        });

        if (import.meta.env.DEV) {
          console.log('[useWeather] Fetched weather data:', {
            temp: processed.current.temperature,
            condition: processed.current.condition,
            flashFloodRisk: processed.flashFloodAlert?.level ?? 'low',
          });
        }
      } catch (err) {
        console.error('[useWeather] Error fetching weather:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [location.name, setLastWeatherData]
  );

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchWeather(location.lat, location.lng, true);
  }, [fetchWeather, location.lat, location.lng]);

  // Set location function
  const setLocation = useCallback(
    (newLocation: WeatherLocation) => {
      setLocationAtom(newLocation);
    },
    [setLocationAtom]
  );

  // Initial fetch and location change handling (debounced)
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchWeather(location.lat, location.lng);
    }, DEBOUNCE_DELAY);

    return () => { clearTimeout(timeoutId); };
  }, [enabled, location.lat, location.lng, fetchWeather]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || !autoRefresh) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchWeather(location.lat, location.lng, true);
    }, REFRESH_INTERVAL);

    return () => { clearInterval(intervalId); };
  }, [enabled, autoRefresh, location.lat, location.lng, fetchWeather]);

  return {
    current,
    daily,
    flashFloodAlert,
    isLoading,
    error,
    lastFetch,
    location,
    refresh,
    setLocation,
  };
}
