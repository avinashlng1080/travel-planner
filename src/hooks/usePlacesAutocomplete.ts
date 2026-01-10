import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
}

export interface UsePlacesAutocompleteOptions {
  debounceMs?: number;
  types?: string[];
  bounds?: google.maps.LatLngBoundsLiteral;
  componentRestrictions?: { country: string | string[] };
}

export interface UsePlacesAutocompleteResult {
  predictions: PlacePrediction[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails | null>;
  clearPredictions: () => void;
}

/**
 * Custom hook for Google Places Autocomplete
 * Uses @vis.gl/react-google-maps pattern with useMapsLibrary
 *
 * Features:
 * - Debounced search to reduce API calls
 * - Prediction caching
 * - Session token management for billing optimization
 * - Type-safe interfaces
 */
export function usePlacesAutocomplete(
  options: UsePlacesAutocompleteOptions = {}
): UsePlacesAutocompleteResult {
  const {
    debounceMs = 300,
    types,
    bounds,
    componentRestrictions,
  } = options;

  // Load the places library using the @vis.gl/react-google-maps pattern
  const placesLibrary = useMapsLibrary('places');

  // State management
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache to reduce API calls
  const cacheRef = useRef<Map<string, PlacePrediction[]>>(new Map());

  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Session token for billing optimization
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialize AutocompleteService and PlacesService
  const autocompleteService = useMemo(() => {
    if (!placesLibrary) {return null;}
    return new placesLibrary.AutocompleteService();
  }, [placesLibrary]);

  const placesService = useMemo(() => {
    if (!placesLibrary) {return null;}
    // PlacesService requires a map or div element
    // We create a temporary div for this purpose
    const div = document.createElement('div');
    return new placesLibrary.PlacesService(div);
  }, [placesLibrary]);

  // Create a new session token when the library loads
  useEffect(() => {
    if (!placesLibrary) {return;}
    sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
  }, [placesLibrary]);

  /**
   * Search for places with debouncing
   */
  const search = useCallback((query: string) => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Handle empty query
    if (!query.trim()) {
      setPredictions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = cacheRef.current.get(query);
    if (cached) {
      setPredictions(cached);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce the API call
    debounceTimerRef.current = setTimeout(() => {
      if (!autocompleteService || !sessionTokenRef.current) {
        setError('Places service not initialized');
        setIsLoading(false);
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        sessionToken: sessionTokenRef.current,
      };

      // Add optional parameters
      if (types && types.length > 0) {
        request.types = types;
      }
      if (bounds) {
        request.bounds = bounds;
      }
      if (componentRestrictions) {
        request.componentRestrictions = componentRestrictions;
      }

      autocompleteService.getPlacePredictions(
        request,
        (
          results: google.maps.places.AutocompletePrediction[] | null,
          status: google.maps.places.PlacesServiceStatus
        ) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const formattedPredictions: PlacePrediction[] = results.map((prediction) => ({
              placeId: prediction.place_id,
              description: prediction.description,
              mainText: prediction.structured_formatting.main_text,
              secondaryText: prediction.structured_formatting.secondary_text || '',
            }));

            // Cache the results
            cacheRef.current.set(query, formattedPredictions);
            setPredictions(formattedPredictions);
            setError(null);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPredictions([]);
            setError(null);
          } else {
            setPredictions([]);
            setError(`Places API error: ${status}`);
          }
          setIsLoading(false);
        }
      );
    }, debounceMs);
  }, [autocompleteService, debounceMs, types, bounds, componentRestrictions]);

  /**
   * Get detailed place information including lat/lng
   */
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<PlaceDetails | null> => {
      if (!placesService) {
        setError('Places service not initialized');
        return null;
      }

      return new Promise((resolve) => {
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId,
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
          sessionToken: sessionTokenRef.current || undefined,
        };

        placesService.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            // Validate that geometry exists - without it, we can't place the location on the map
            if (!place.geometry?.location) {
              console.error('[usePlacesAutocomplete] Place has no geometry:', place.place_id);
              setError('Selected place has no location data');
              resolve(null);
              return;
            }

            const details: PlaceDetails = {
              placeId: place.place_id!,
              name: place.name || '',
              address: place.formatted_address || '',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              types: place.types || [],
            };

            // Create a new session token after place selection
            if (placesLibrary) {
              sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
            }

            resolve(details);
          } else {
            setError(`Failed to get place details: ${status}`);
            resolve(null);
          }
        });
      });
    },
    [placesService, placesLibrary]
  );

  /**
   * Clear predictions and cache
   */
  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    predictions,
    isLoading,
    error,
    search,
    getPlaceDetails,
    clearPredictions,
  };
}
