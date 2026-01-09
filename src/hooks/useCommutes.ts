import { useState, useEffect, useRef } from 'react';

export type TravelMode = 'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING';

export interface CommuteDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  category?: string;
}

export interface CommuteResult {
  destinationId: string;
  distance?: string;
  duration?: string;
  durationValue?: number; // in seconds
  path?: google.maps.LatLngLiteral[]; // Route geometry for polyline rendering
  isLoading: boolean;
  error: string | null;
}

interface UseCommutesProps {
  origin: { lat: number; lng: number };
  destinations: CommuteDestination[];
  travelMode: TravelMode;
  enabled?: boolean;
}

interface UseCommutesResult {
  results: Map<string, CommuteResult>;
  isLoading: boolean;
  totalDuration?: string;
  totalDurationMinutes?: number;
}

/**
 * Custom hook for calculating commute times using Google Maps Distance Matrix API
 *
 * Features:
 * - Calculates travel time and distance from origin to multiple destinations
 * - Supports different travel modes (driving, transit, bicycling, walking)
 * - Caches results to avoid unnecessary API calls
 * - Provides total duration across all destinations
 *
 * @param origin - Starting point coordinates
 * @param destinations - Array of destination points
 * @param travelMode - Mode of transportation
 * @param enabled - Whether to fetch routes (default: true)
 * @returns Commute results with loading state and metrics
 */
export function useCommutes({
  origin,
  destinations,
  travelMode,
  enabled = true,
}: UseCommutesProps): UseCommutesResult {
  const [results, setResults] = useState<Map<string, CommuteResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Cache to avoid repeated API calls
  const cacheRef = useRef<Map<string, CommuteResult>>(new Map());

  // Generate cache key
  const getCacheKey = (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: TravelMode
  ): string => {
    return `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}|${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}|${mode}`;
  };

  useEffect(() => {
    if (!enabled || destinations.length === 0) {
      setResults(new Map());
      setIsLoading(false);
      return;
    }

    const fetchCommutes = async () => {
      setIsLoading(true);
      const newResults = new Map<string, CommuteResult>();

      // Initialize all destinations with loading state
      destinations.forEach(dest => {
        newResults.set(dest.id, {
          destinationId: dest.id,
          isLoading: true,
          error: null,
        });
      });
      setResults(newResults);

      try {
        // Get API key from environment
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          console.warn('[useCommutes] No Google Maps API key found.');
          console.warn('[useCommutes] Add VITE_GOOGLE_MAPS_API_KEY to your .env file');

          // Set error state for all destinations
          destinations.forEach(dest => {
            newResults.set(dest.id, {
              destinationId: dest.id,
              isLoading: false,
              error: 'Google Maps API key not configured',
            });
          });
          setResults(new Map(newResults));
          setIsLoading(false);
          return;
        }

        // Use Distance Matrix API to calculate all routes at once
        const destinationCoords = destinations
          .map(d => `${d.lat},${d.lng}`)
          .join('|');

        const originCoord = `${origin.lat},${origin.lng}`;

        // Map our travel modes to Google's travel modes
        const googleTravelMode = travelMode === 'BICYCLING' ? 'bicycling' :
                                  travelMode === 'WALKING' ? 'walking' :
                                  travelMode === 'TRANSIT' ? 'transit' :
                                  'driving';

        const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
        url.searchParams.append('origins', originCoord);
        url.searchParams.append('destinations', destinationCoords);
        url.searchParams.append('mode', googleTravelMode);
        url.searchParams.append('key', apiKey);

        // Note: This requires a proxy since we're calling from the browser
        // Google Maps Distance Matrix API doesn't support CORS
        // We'll need to call through a Convex HTTP action
        const response = await fetch('/api/distance-matrix?' + url.searchParams.toString());

        if (!response.ok) {
          throw new Error(`Distance Matrix API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'OK') {
          throw new Error(`Distance Matrix API status: ${data.status}`);
        }

        // Process results
        data.rows[0].elements.forEach((element: any, index: number) => {
          const dest = destinations[index];
          const cacheKey = getCacheKey(origin, dest, travelMode);

          if (element.status === 'OK') {
            const result: CommuteResult = {
              destinationId: dest.id,
              distance: element.distance.text,
              duration: element.duration.text,
              durationValue: element.duration.value,
              isLoading: false,
              error: null,
            };

            cacheRef.current.set(cacheKey, result);
            newResults.set(dest.id, result);
          } else {
            newResults.set(dest.id, {
              destinationId: dest.id,
              isLoading: false,
              error: `Route not found: ${element.status}`,
            });
          }
        });

        setResults(new Map(newResults));
      } catch (err) {
        console.error('[useCommutes] Error:', err);

        // Set error state for all destinations
        destinations.forEach(dest => {
          newResults.set(dest.id, {
            destinationId: dest.id,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to calculate route',
          });
        });
        setResults(new Map(newResults));
      } finally {
        setIsLoading(false);
      }
    };

    // Check cache first
    const allCached = destinations.every(dest => {
      const cacheKey = getCacheKey(origin, dest, travelMode);
      return cacheRef.current.has(cacheKey);
    });

    if (allCached) {
      const cachedResults = new Map<string, CommuteResult>();
      destinations.forEach(dest => {
        const cacheKey = getCacheKey(origin, dest, travelMode);
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          cachedResults.set(dest.id, cached);
        }
      });
      setResults(cachedResults);
      setIsLoading(false);
      return;
    }

    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(fetchCommutes, 300);
    return () => { clearTimeout(timeoutId); };
  }, [origin.lat, origin.lng, destinations, travelMode, enabled]);

  // Calculate total duration
  const totalDurationMinutes = Array.from(results.values())
    .filter(r => r.durationValue !== undefined)
    .reduce((sum, r) => sum + (r.durationValue || 0), 0) / 60;

  const totalDuration = totalDurationMinutes > 0
    ? totalDurationMinutes >= 60
      ? `${Math.floor(totalDurationMinutes / 60)}h ${Math.round(totalDurationMinutes % 60)}m`
      : `${Math.round(totalDurationMinutes)}m`
    : undefined;

  return {
    results,
    isLoading,
    totalDuration,
    totalDurationMinutes,
  };
}
