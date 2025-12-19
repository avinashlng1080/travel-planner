import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

export type TravelMode = 'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING';

export interface Destination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  label?: string; // A, B, C, etc.
}

export interface CommuteResult {
  destinationId: string;
  duration: number; // seconds
  durationText: string;
  distance: number; // meters
  distanceText: string;
  path: google.maps.LatLng[];
  travelMode: TravelMode;
}

interface UseCommutesOptions {
  origin: { lat: number; lng: number } | null;
  destinations: Destination[];
  travelMode: TravelMode;
  enabled?: boolean;
}

interface UseCommutesResult {
  commutes: Map<string, CommuteResult>;
  isLoading: boolean;
  error: string | null;
  activeDestinationId: string | null;
  setActiveDestinationId: (id: string | null) => void;
  refetch: () => void;
}

// Cache for route results
const routeCache = new Map<string, CommuteResult>();

function getCacheKey(
  origin: { lat: number; lng: number },
  dest: Destination,
  mode: TravelMode
): string {
  return `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}-${dest.lat.toFixed(5)},${dest.lng.toFixed(5)}-${mode}`;
}

/**
 * Hook for calculating commute times to multiple destinations
 * Inspired by Google's Commutes and Destinations widget
 */
export function useCommutes({
  origin,
  destinations,
  travelMode,
  enabled = true,
}: UseCommutesOptions): UseCommutesResult {
  // Note: useMap is available if we need map-specific operations in the future
  const routesLib = useMapsLibrary('routes');

  const [commutes, setCommutes] = useState<Map<string, CommuteResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);

  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const pendingRequestsRef = useRef<Set<string>>(new Set());

  // Initialize DirectionsService
  useEffect(() => {
    if (!routesLib) return;
    directionsServiceRef.current = new routesLib.DirectionsService();
  }, [routesLib]);

  // Memoize destinations to prevent unnecessary refetches
  const destinationsKey = useMemo(() => {
    return destinations.map(d => `${d.id}:${d.lat}:${d.lng}`).join('|');
  }, [destinations]);

  const fetchCommutes = useCallback(async () => {
    if (!origin || !directionsServiceRef.current || destinations.length === 0 || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const newCommutes = new Map<string, CommuteResult>();
    const fetchPromises: Promise<void>[] = [];

    for (const dest of destinations) {
      const cacheKey = getCacheKey(origin, dest, travelMode);

      // Check cache first
      if (routeCache.has(cacheKey)) {
        newCommutes.set(dest.id, routeCache.get(cacheKey)!);
        continue;
      }

      // Skip if already pending
      if (pendingRequestsRef.current.has(cacheKey)) {
        continue;
      }

      pendingRequestsRef.current.add(cacheKey);

      const fetchPromise = new Promise<void>((resolve) => {
        directionsServiceRef.current!.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(dest.lat, dest.lng),
            travelMode: google.maps.TravelMode[travelMode],
          },
          (result, status) => {
            pendingRequestsRef.current.delete(cacheKey);

            if (status === google.maps.DirectionsStatus.OK && result) {
              const route = result.routes[0];
              const leg = route.legs[0];

              const commuteResult: CommuteResult = {
                destinationId: dest.id,
                duration: leg.duration?.value || 0,
                durationText: leg.duration?.text || '',
                distance: leg.distance?.value || 0,
                distanceText: leg.distance?.text || '',
                path: route.overview_path || [],
                travelMode,
              };

              // Cache the result
              routeCache.set(cacheKey, commuteResult);
              newCommutes.set(dest.id, commuteResult);
            }

            resolve();
          }
        );
      });

      fetchPromises.push(fetchPromise);
    }

    await Promise.all(fetchPromises);
    setCommutes(newCommutes);
    setIsLoading(false);
  }, [origin, destinationsKey, travelMode, enabled]);

  // Fetch commutes when dependencies change
  useEffect(() => {
    fetchCommutes();
  }, [fetchCommutes]);

  // Set first destination as active by default
  useEffect(() => {
    if (destinations.length > 0 && !activeDestinationId) {
      setActiveDestinationId(destinations[0].id);
    }
  }, [destinations, activeDestinationId]);

  return {
    commutes,
    isLoading,
    error,
    activeDestinationId,
    setActiveDestinationId,
    refetch: fetchCommutes,
  };
}

/**
 * Get travel mode icon
 */
export function getTravelModeIcon(mode: TravelMode): string {
  switch (mode) {
    case 'DRIVING':
      return '🚗';
    case 'TRANSIT':
      return '🚌';
    case 'BICYCLING':
      return '🚴';
    case 'WALKING':
      return '🚶';
    default:
      return '🚗';
  }
}

/**
 * Get travel mode label
 */
export function getTravelModeLabel(mode: TravelMode): string {
  switch (mode) {
    case 'DRIVING':
      return 'Drive';
    case 'TRANSIT':
      return 'Transit';
    case 'BICYCLING':
      return 'Bike';
    case 'WALKING':
      return 'Walk';
    default:
      return 'Drive';
  }
}
