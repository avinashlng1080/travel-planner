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
 */

import { useQuery, useAction } from 'convex/react';
import { useState, useEffect, useCallback } from 'react';
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
 * Hook to get destination context for a trip.
 *
 * @param tripId - The trip ID to get context for, or null
 * @returns Destination context with loading/error states
 */
export function useDestinationContext(
  tripId: Id<"trips"> | null
): UseDestinationContextResult {
  const [context, setContext] = useState<DestinationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);

  // Get the trip data
  const trip = useQuery(
    api.trips.getTrip,
    tripId ? { tripId } : "skip"
  );

  // Get cached context by country code
  const cachedContext = useQuery(
    api.destinationContexts.getByCountryCode,
    countryCode ? { countryCode } : "skip"
  );

  // Action to generate context if not cached
  const generateContext = useAction(api.destinationContexts.generateContext);

  // Parse destination when trip changes
  useEffect(() => {
    if (!trip?.destination) {
      setCountryCode(null);
      setCountryName(null);
      setContext(null);
      return;
    }

    try {
      const parsed = parseDestinationCountry(trip.destination);
      setCountryCode(parsed.countryCode);
      setCountryName(parsed.country);
    } catch {
      setError('Could not parse destination');
      setCountryCode(null);
      setCountryName(null);
    }
  }, [trip?.destination]);

  // Load context when country code changes
  useEffect(() => {
    if (!countryCode || !countryName) {
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
          setContext(generated as DestinationContext);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to generate destination context:', err);
          setError(err instanceof Error ? err.message : 'Failed to generate context');
          setIsLoading(false);
        });
    }
  }, [countryCode, countryName, cachedContext, generateContext]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (!countryCode || !countryName) {
      return;
    }

    setIsLoading(true);
    setError(null);

    generateContext({ countryCode, countryName })
      .then((generated) => {
        setContext(generated as DestinationContext);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to refresh destination context:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh context');
        setIsLoading(false);
      });
  }, [countryCode, countryName, generateContext]);

  return {
    context,
    isLoading: isLoading || cachedContext === undefined,
    error,
    countryCode,
    countryName,
    refresh,
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
  const [context, setContext] = useState<DestinationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get cached context
  const cachedContext = useQuery(
    api.destinationContexts.getByCountryCode,
    countryCode ? { countryCode } : "skip"
  );

  // Action to generate context if not cached
  const generateContext = useAction(api.destinationContexts.generateContext);

  // Load context when country code changes
  useEffect(() => {
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
          setContext(generated as DestinationContext);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to generate destination context:', err);
          setError(err instanceof Error ? err.message : 'Failed to generate context');
          setIsLoading(false);
        });
    }
  }, [countryCode, countryName, cachedContext, generateContext]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (!countryCode || !countryName) {
      return;
    }

    setIsLoading(true);
    setError(null);

    generateContext({ countryCode, countryName })
      .then((generated) => {
        setContext(generated as DestinationContext);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to refresh destination context:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh context');
        setIsLoading(false);
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
