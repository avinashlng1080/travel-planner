import { useState, useEffect, useRef } from 'react';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface OpenRouteServiceResponse {
  features?: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
    };
    properties: {
      summary: {
        distance: number;
        duration: number;
      };
    };
  }>;
  error?: {
    message: string;
  };
}

interface RoutingResult {
  coordinates: RoutePoint[];
  isLoading: boolean;
  error: string | null;
  useFallback: boolean;
  distance?: number; // in kilometers
  duration?: number; // in minutes
}

const ORS_API_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

/**
 * Custom hook for fetching real road routes using OpenRouteService API
 *
 * Features:
 * - Free tier: 2,000 requests/day (perfect for travel planning)
 * - More accurate routing data than OSRM in many regions
 * - Provides distance and duration metrics
 * - Graceful fallback to straight lines if API fails or key is missing
 *
 * @param waypoints - Array of waypoints to route through
 * @param enabled - Whether to fetch routes (default: true)
 * @returns Routing result with coordinates, loading state, error, and metrics
 */
export function useRouting(waypoints: RoutePoint[], enabled = true): RoutingResult {
  const [coordinates, setCoordinates] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  // Cache to avoid repeated API calls for the same route
  const cacheRef = useRef<
    Map<string, { coordinates: RoutePoint[]; distance?: number; duration?: number }>
  >(new Map());

  // Generate cache key from waypoints
  const getCacheKey = (points: RoutePoint[]): string => {
    return points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  };

  useEffect(() => {
    // Reset state if disabled or not enough waypoints
    if (!enabled || waypoints.length < 2) {
      setCoordinates([]);
      setIsLoading(false);
      setError(null);
      setUseFallback(false);
      setDistance(undefined);
      setDuration(undefined);
      return;
    }

    const cacheKey = getCacheKey(waypoints);

    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setCoordinates(cached.coordinates);
      setDistance(cached.distance);
      setDuration(cached.duration);
      setIsLoading(false);
      setError(null);
      setUseFallback(false);
      return;
    }

    // Fetch route from OpenRouteService
    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);
      setUseFallback(false);

      try {
        // Get API key from environment
        const apiKey = import.meta.env.VITE_ORS_API_KEY;

        // If no API key, use fallback immediately
        if (!apiKey) {
          console.warn(
            '[useRouting] No OpenRouteService API key found. Using straight line fallback.'
          );
          console.warn('[useRouting] Get a free API key at https://openrouteservice.org/');
          setUseFallback(true);
          setCoordinates(waypoints);
          setIsLoading(false);
          return;
        }

        // Build request body with coordinates in [lng, lat] format
        const coordinates = waypoints.map((p) => [p.lng, p.lat]);

        const response = await fetch(ORS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiKey,
            Accept:
              'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          },
          body: JSON.stringify({
            coordinates,
            format: 'geojson',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `OpenRouteService API error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const data: OpenRouteServiceResponse = await response.json();

        if (data.error) {
          throw new Error(data.error.message || 'No route found');
        }

        if (!data.features || data.features.length === 0) {
          throw new Error('No route found');
        }

        // Extract route geometry - ORS returns [lng, lat], we need {lat, lng}
        const route = data.features[0];
        const routeCoordinates: RoutePoint[] = route.geometry.coordinates.map(([lng, lat]) => ({
          lat,
          lng,
        }));

        // Extract distance and duration from summary
        const summary = route.properties.summary;
        const routeDistance = summary.distance / 1000; // Convert meters to km
        const routeDuration = summary.duration / 60; // Convert seconds to minutes

        // Cache the result
        cacheRef.current.set(cacheKey, {
          coordinates: routeCoordinates,
          distance: routeDistance,
          duration: routeDuration,
        });

        setCoordinates(routeCoordinates);
        setDistance(routeDistance);
        setDuration(routeDuration);
        setIsLoading(false);

        if (import.meta.env.DEV) {
          console.log(
            `[useRouting] Route: ${routeDistance.toFixed(1)}km, ${routeDuration.toFixed(0)}min`
          );
        }
      } catch (err) {
        console.error('[useRouting] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch route');
        setUseFallback(true);

        // Fallback to straight lines
        setCoordinates(waypoints);
        setDistance(undefined);
        setDuration(undefined);
        setIsLoading(false);
      }
    };

    // Debounce to avoid too many API calls when waypoints change rapidly
    const timeoutId = setTimeout(fetchRoute, 300);
    return () => clearTimeout(timeoutId);
  }, [waypoints, enabled]);

  return {
    coordinates,
    isLoading,
    error,
    useFallback,
    distance,
    duration,
  };
}
