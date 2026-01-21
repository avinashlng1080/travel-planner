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

  // Load context when country code changes
  useEffect(() => {
    // Increment request ID to invalidate any in-flight requests
    const requestId = ++currentRequestRef.current;

    if (!countryCode || !countryName) {
      setContext(null);
      return;
    }

    // If we have cached context, use it
    if (cachedContext !== undefined && cachedContext !== null) {
      setContext(cachedContext as DestinationContext);
      setIsLoading(false);
      setError(null);
      return;
    }

    // If cache query returned null (not loading), generate new context
    if (cachedContext === null) {
      setIsLoading(true);
      setError(null);

      generateContext({ countryCode, countryName })
        .then((generated) => {
          // Only update state if this is still the current request
          if (requestId === currentRequestRef.current) {
            setContext(generated as DestinationContext);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          // Only update state if this is still the current request
          if (requestId === currentRequestRef.current) {
            console.error('Failed to generate destination context:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate context');
            setIsLoading(false);
          }
        });
    }

    // Cleanup: invalidate this request on unmount or dependency change
    return () => {
      // No need to explicitly cancel - the requestId check handles it
    };
  }, [countryCode, countryName, cachedContext, generateContext]);

  // Manual refresh function with race condition protection
  const refresh = useCallback(() => {
    if (!countryCode || !countryName) {
      return;
    }

    // Increment request ID to invalidate any in-flight requests
    const requestId = ++currentRequestRef.current;

    setIsLoading(true);
    setError(null);

    generateContext({ countryCode, countryName })
      .then((generated) => {
        // Only update state if this is still the current request
        if (requestId === currentRequestRef.current) {
          setContext(generated as DestinationContext);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        // Only update state if this is still the current request
        if (requestId === currentRequestRef.current) {
          console.error('Failed to refresh destination context:', err);
          setError(err instanceof Error ? err.message : 'Failed to refresh context');
          setIsLoading(false);
        }
      });
  }, [countryCode, countryName, generateContext]);

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
