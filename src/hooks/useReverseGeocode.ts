import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ReverseGeocodeResult {
  name: string;
  address: string;
  placeId?: string;
}

export interface UseReverseGeocodeResult {
  isLoading: boolean;
  error: string | null;
  reverseGeocode: (lat: number, lng: number) => Promise<ReverseGeocodeResult | null>;
}

/**
 * Custom hook for reverse geocoding coordinates to place names
 * Uses @vis.gl/react-google-maps pattern with useMapsLibrary
 *
 * Features:
 * - Caching to reduce API calls
 * - Error handling
 * - Type-safe interfaces
 */
export function useReverseGeocode(): UseReverseGeocodeResult {
  const geocodingLibrary = useMapsLibrary('geocoding');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache to reduce API calls (key: "lat,lng")
  const cacheRef = useRef<Map<string, ReverseGeocodeResult>>(new Map());

  // Track active request for race condition prevention
  const activeRequestRef = useRef<{ lat: number; lng: number } | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize Geocoder service
  const geocoder = useMemo(() => {
    if (!geocodingLibrary) return null;
    return new geocodingLibrary.Geocoder();
  }, [geocodingLibrary]);

  /**
   * Reverse geocode coordinates to get place name and address
   */
  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
      // Validate coordinates
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError('Invalid coordinates');
        return null;
      }

      // Check cache first
      const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        return cached;
      }

      if (!geocoder) {
        setError('Geocoding service not initialized');
        return null;
      }

      // Mark this as the active request (for race condition prevention)
      activeRequestRef.current = { lat, lng };

      if (!isMountedRef.current) return null;

      setIsLoading(true);
      setError(null);

      return new Promise((resolve) => {
        geocoder.geocode(
          { location: { lat, lng } },
          (
            results: google.maps.GeocoderResult[] | null,
            status: google.maps.GeocoderStatus
          ) => {
            // Check if this is still the active request and component is mounted
            const isStaleRequest =
              !isMountedRef.current ||
              activeRequestRef.current?.lat !== lat ||
              activeRequestRef.current?.lng !== lng;

            if (isStaleRequest) {
              resolve(null);
              return;
            }

            setIsLoading(false);

            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
              const firstResult = results[0];

              // Extract a meaningful name from address components
              // Priority: establishment > premise > route > neighborhood > locality
              let name = '';
              const addressComponents = firstResult.address_components;

              for (const component of addressComponents) {
                if (component.types.includes('establishment') ||
                    component.types.includes('point_of_interest')) {
                  name = component.long_name;
                  break;
                }
                if (component.types.includes('premise') && !name) {
                  name = component.long_name;
                }
                if (component.types.includes('route') && !name) {
                  name = component.long_name;
                }
                if (component.types.includes('neighborhood') && !name) {
                  name = component.long_name;
                }
                if (component.types.includes('sublocality') && !name) {
                  name = component.long_name;
                }
              }

              // Fallback to first address component or formatted address
              if (!name) {
                name = addressComponents[0]?.long_name ||
                       firstResult.formatted_address?.split(',')[0] ||
                       'Unknown Location';
              }

              const result: ReverseGeocodeResult = {
                name,
                address: firstResult.formatted_address || '',
                placeId: firstResult.place_id,
              };

              // Cache the result
              cacheRef.current.set(cacheKey, result);

              resolve(result);
            } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
              setError('No address found for this location');
              resolve(null);
            } else {
              setError(`Geocoding failed: ${status}`);
              resolve(null);
            }
          }
        );
      });
    },
    [geocoder]
  );

  return {
    isLoading,
    error,
    reverseGeocode,
  };
}
