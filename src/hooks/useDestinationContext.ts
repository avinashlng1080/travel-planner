/**
 * useDestinationContext Hook
 *
 * Fetches destination-specific context (emergency numbers, safety tips, etc.)
 * for a trip based on its destination field.
 *
 * Features:
 * - Parses destination string to extract country
 * - Checks cached context in Convex
 * - Triggers AI generation if not cached
 * - Returns loading/error states
 * - Race condition protection for async operations
 */

import { useQuery, useAction } from 'convex/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DestinationContext } from '../types/destinationContext';
import { parseDestinationCountry } from '../utils/timezone';

interface UseDestinationContextResult {
  context: DestinationContext | null;
  isLoading: boolean;
  error: string | null;
  countryCode: string | null;
  countryName: string | null;
  refresh: () => void;
}

/**
 * Internal shared hook for destination context logic.
 * Consolidates common code between useDestinationContext and useDestinationContextByCountry.
 */
function useDestinationContextInternal(
  countryCode: string | null,
  countryName: string | null
): UseDestinationContextResult {
  const [context, setContext] = useState<DestinationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track the current request for race condition protection
  const currentRequestRef = useRef<number>(0);

  // Get cached context by country code
  const cachedContext = useQuery(
    api.destinationContexts.getByCountryCode,
    countryCode ? { countryCode } : "skip"
  );

  // Action to generate context if not cached
  const generateContext = useAction(api.destinationContexts.generateContext);

  // Fetches context with race condition protection
  const fetchContext = useCallback((code: string, name: string): void => {
    const requestId = ++currentRequestRef.current;
    setIsLoading(true);
    setError(null);

    generateContext({ countryCode: code, countryName: name })
      .then((generated) => {
        if (requestId === currentRequestRef.current) {
          setContext(generated as DestinationContext);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (requestId === currentRequestRef.current) {
          console.error('Failed to generate destination context:', err);
          setError(err instanceof Error ? err.message : 'Failed to generate context');
          setIsLoading(false);
        }
      });
  }, [generateContext]);

  // Load context when country code changes
  useEffect(() => {
    // Increment to invalidate any in-flight requests
    ++currentRequestRef.current;

    if (!countryCode || !countryName) {
      setContext(null);
      return;
    }

    // Use cached context if available
    if (cachedContext) {
      setContext(cachedContext as DestinationContext);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Generate new context if cache query returned null (not loading)
    if (cachedContext === null) {
      fetchContext(countryCode, countryName);
    }
  }, [countryCode, countryName, cachedContext, fetchContext]);

  // Manual refresh function
  const refresh = useCallback((): void => {
    if (countryCode && countryName) {
      fetchContext(countryCode, countryName);
    }
  }, [countryCode, countryName, fetchContext]);

  return {
    context,
    isLoading: isLoading || (countryCode !== null && cachedContext === undefined),
    error,
    countryCode,
    countryName,
    refresh,
  };
}

/**
 * Hook to get destination context for a trip.
 *
 * @param tripId - The trip ID to get context for, or null
 * @returns Destination context with loading/error states
 */
export function useDestinationContext(
  tripId: Id<"trips"> | null
): UseDestinationContextResult {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Get the trip data
  const trip = useQuery(
    api.trips.getTrip,
    tripId ? { tripId } : "skip"
  );

  // Parse destination when trip changes
  useEffect(() => {
    if (!trip?.destination) {
      setCountryCode(null);
      setCountryName(null);
      setParseError(null);
      return;
    }

    try {
      const parsed = parseDestinationCountry(trip.destination);
      setCountryCode(parsed.countryCode);
      setCountryName(parsed.country);
      setParseError(null);
    } catch (error) {
      console.error('[useDestinationContext] Failed to parse destination:', trip.destination, error);
      setParseError(`Could not parse destination: "${trip.destination}"`);
      setCountryCode(null);
      setCountryName(null);
    }
  }, [trip?.destination]);

  // Use the shared internal hook
  const result = useDestinationContextInternal(countryCode, countryName);

  // Combine parse error with context error
  return {
    ...result,
    error: parseError || result.error,
  };
}

/**
 * Hook to get destination context by country code directly.
 * Useful when you have the country code but not a trip ID.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param countryName - Full country name (for generation)
 * @returns Destination context with loading/error states
 */
export function useDestinationContextByCountry(
  countryCode: string | null,
  countryName: string | null
): UseDestinationContextResult {
  // Directly use the shared internal hook
  return useDestinationContextInternal(countryCode, countryName);
}
