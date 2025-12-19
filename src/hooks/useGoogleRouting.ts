/**
 * Google Routing Hook
 *
 * Fetches real road routes using Google Directions API.
 * Replaces OpenRouteService with Google's routing service.
 *
 * Features:
 * - Same interface as useRouting.ts for drop-in replacement
 * - In-memory caching to prevent duplicate API calls
 * - Graceful fallback to straight lines if API fails
 * - Returns distance and duration metrics
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface RoutingResult {
  coordinates: RoutePoint[];
  isLoading: boolean;
  error: string | null;
  useFallback: boolean;
  distance?: number; // in kilometers
  duration?: number; // in minutes
}

interface CacheEntry {
  coordinates: RoutePoint[];
  distance?: number;
  duration?: number;
}

/**
 * Custom hook for fetching real road routes using Google Directions API
 *
 * @param waypoints - Array of waypoints to route through
 * @param enabled - Whether to fetch routes (default: true)
 * @returns Routing result with coordinates, loading state, error, and metrics
 */
export function useGoogleRouting(waypoints: RoutePoint[], enabled = true): RoutingResult {
  const [coordinates, setCoordinates] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  // Load the routes library
  const routesLibrary = useMapsLibrary('routes');

  // Cache to avoid repeated API calls for the same route
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Track if component is mounted
  const mountedRef = useRef(true);

  // Generate cache key from waypoints (same format as useRouting.ts)
  const getCacheKey = useCallback((points: RoutePoint[]): string => {
    return points.map(p => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

    // Wait for routes library to load
    if (!routesLibrary) {
      setIsLoading(true);
      return;
    }

    // Fetch route from Google Directions API
    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);
      setUseFallback(false);

      try {
        const directionsService = new routesLibrary.DirectionsService();

        // Convert waypoints to Google format
        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        const waypointsMiddle = waypoints.slice(1, -1).map(p => ({
          location: { lat: p.lat, lng: p.lng },
          stopover: true,
        }));

        const request: google.maps.DirectionsRequest = {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          waypoints: waypointsMiddle,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false, // Keep original order
        };

        directionsService.route(request, (response, status) => {
          if (!mountedRef.current) return;

          if (status === 'OK' && response?.routes[0]) {
            const route = response.routes[0];

            // Extract path from overview_path
            const path: RoutePoint[] = route.overview_path.map(p => ({
              lat: p.lat(),
              lng: p.lng(),
            }));

            // Sum up all leg distances/durations
            let totalDistance = 0;
            let totalDuration = 0;
            route.legs.forEach(leg => {
              totalDistance += leg.distance?.value || 0;
              totalDuration += leg.duration?.value || 0;
            });

            const routeData: CacheEntry = {
              coordinates: path,
              distance: totalDistance / 1000, // meters to km
              duration: totalDuration / 60, // seconds to minutes
            };

            // Cache the result
            cacheRef.current.set(cacheKey, routeData);

            setCoordinates(routeData.coordinates);
            setDistance(routeData.distance);
            setDuration(routeData.duration);
            setIsLoading(false);

            if (import.meta.env.DEV) {
              console.log(
                `[useGoogleRouting] Route: ${routeData.distance?.toFixed(1)}km, ${routeData.duration?.toFixed(0)}min`
              );
            }
          } else {
            console.error('[useGoogleRouting] Directions failed:', status);
            setError(`Directions failed: ${status}`);
            setUseFallback(true);

            // Fallback to straight lines
            setCoordinates(waypoints);
            setDistance(undefined);
            setDuration(undefined);
            setIsLoading(false);
          }
        });
      } catch (err) {
        if (!mountedRef.current) return;

        console.error('[useGoogleRouting] Error:', err);
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
  }, [waypoints, enabled, routesLibrary, getCacheKey]);

  return {
    coordinates,
    isLoading,
    error,
    useFallback,
    distance,
    duration,
  };
}
