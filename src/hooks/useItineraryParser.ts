import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import {
  ParsedItinerary,
  ParsedLocation,
  ParsedActivity,
  TripContext,
  ParserStep,
  ImportResult,
} from '@/types/itinerary';

/**
 * Hook for managing the itinerary parsing flow.
 *
 * Handles:
 * - Parsing raw text via Claude AI
 * - Editing parsed data before import
 * - Importing to Convex database
 * - Undo functionality
 */

export interface UseItineraryParserReturn {
  // State
  step: ParserStep;
  rawText: string;
  parsedData: ParsedItinerary | null;
  error: string | null;
  isParsing: boolean;
  isImporting: boolean;

  // Actions
  setRawText: (text: string) => void;
  parse: (tripId: string, tripContext: TripContext) => Promise<void>;

  // Edit functions
  updateLocation: (id: string, updates: Partial<ParsedLocation>) => void;
  deleteLocation: (id: string) => void;
  updateActivity: (dayIndex: number, activityId: string, updates: Partial<ParsedActivity>) => void;
  deleteActivity: (dayIndex: number, activityId: string) => void;

  // Import
  confirmImport: (tripId: Id<'trips'>, planId: Id<'tripPlans'>) => Promise<void>;
  undo: () => Promise<void>;
  reset: () => void;
}

export function useItineraryParser(): UseItineraryParserReturn {
  const [step, setStep] = useState<ParserStep>('input');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Convex mutations
  const addLocations = useMutation(api.tripLocations.addAISuggestedLocations);
  const createItinerary = useMutation(api.tripScheduleItems.createAIItinerary);
  const deleteLocations = useMutation(api.tripLocations.removeMultipleLocations);
  const deleteScheduleItems = useMutation(api.tripScheduleItems.deleteMultipleScheduleItems);

  /**
   * Parse raw itinerary text.
   * Uses local parser first (fast, no AI), falls back to Claude if needed.
   */
  const parse = useCallback(async (tripId: string, tripContext: TripContext) => {
    if (!rawText.trim()) {
      setError('Please paste your itinerary text');
      return;
    }

    if (rawText.length < 50) {
      setError("This doesn't look like a full itinerary. Please paste more text.");
      return;
    }

    setIsParsing(true);
    setError(null);
    setStep('parsing');

    try {
      const convexUrl = import.meta.env.VITE_CONVEX_URL;
      const siteUrl = convexUrl.replace('.cloud', '.site');

      // Try local parser first (faster, no rate limits)
      let response = await fetch(`${siteUrl}/parseItineraryLocal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, tripId, tripContext }),
      });

      let data = await response.json();

      // If local parser failed, try Claude parser as fallback
      if (!data.success && data.error?.includes('Could not parse')) {
        console.log('Local parser failed, trying Claude...');
        response = await fetch(`${siteUrl}/parseItinerary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText, tripId, tripContext }),
        });
        data = await response.json();
      }

      if (!data.success) {
        setError(data.error || 'Failed to parse itinerary. Please try again.');
        setStep('input');
        return;
      }

      setParsedData(data.parsed);
      setStep('preview');
    } catch (err) {
      console.error('Parse error:', err);
      setError('Network error. Please check your connection and try again.');
      setStep('input');
    } finally {
      setIsParsing(false);
    }
  }, [rawText]);

  /**
   * Update a parsed location.
   */
  const updateLocation = useCallback((id: string, updates: Partial<ParsedLocation>) => {
    setParsedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        locations: prev.locations.map((loc) =>
          loc.id === id ? { ...loc, ...updates } : loc
        ),
      };
    });
  }, []);

  /**
   * Delete a parsed location.
   */
  const deleteLocation = useCallback((id: string) => {
    setParsedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        locations: prev.locations.filter((loc) => loc.id !== id),
        // Also remove activities that reference this location
        days: prev.days.map((day) => ({
          ...day,
          activities: day.activities.filter((act) => act.locationId !== id),
        })),
      };
    });
  }, []);

  /**
   * Update a parsed activity.
   */
  const updateActivity = useCallback(
    (dayIndex: number, activityId: string, updates: Partial<ParsedActivity>) => {
      setParsedData((prev) => {
        if (!prev) return prev;
        const newDays = [...prev.days];
        if (newDays[dayIndex]) {
          newDays[dayIndex] = {
            ...newDays[dayIndex],
            activities: newDays[dayIndex].activities.map((act) =>
              act.id === activityId ? { ...act, ...updates } : act
            ),
          };
        }
        return { ...prev, days: newDays };
      });
    },
    []
  );

  /**
   * Delete a parsed activity.
   */
  const deleteActivity = useCallback((dayIndex: number, activityId: string) => {
    setParsedData((prev) => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      if (newDays[dayIndex]) {
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          activities: newDays[dayIndex].activities.filter(
            (act) => act.id !== activityId
          ),
        };
      }
      // Remove empty days
      return {
        ...prev,
        days: newDays.filter((day) => day.activities.length > 0),
      };
    });
  }, []);

  /**
   * Confirm and execute the import.
   */
  const confirmImport = useCallback(
    async (tripId: Id<'trips'>, planId: Id<'tripPlans'>) => {
      if (!parsedData) {
        setError('No data to import');
        return;
      }

      setIsImporting(true);
      setStep('importing');
      setError(null);

      try {
        // 1. Create locations first
        const locationIds = await addLocations({
          tripId,
          locations: parsedData.locations.map((loc) => ({
            name: loc.name,
            lat: loc.lat,
            lng: loc.lng,
            category: loc.category,
            description: loc.description,
            aiReason: `Parsed from itinerary (${loc.confidence} confidence)`,
          })),
        });

        // 2. Create schedule items
        const scheduleItemIds = await createItinerary({
          tripId,
          planId,
          days: parsedData.days.map((day) => ({
            date: day.date,
            title: day.title,
            activities: day.activities.map((act) => ({
              locationName: act.locationName,
              startTime: act.startTime,
              endTime: act.endTime,
              notes: act.notes,
              isFlexible: act.isFlexible,
            })),
          })),
        });

        // Store result for undo
        setImportResult({
          locationIds: locationIds.map(String),
          scheduleItemIds: scheduleItemIds.map(String),
        });

        setStep('complete');
      } catch (err) {
        console.error('Import error:', err);
        setError('Failed to import. Please try again.');
        setStep('preview');
      } finally {
        setIsImporting(false);
      }
    },
    [parsedData, addLocations, createItinerary]
  );

  /**
   * Undo the last import.
   */
  const undo = useCallback(async () => {
    if (!importResult) return;

    try {
      // Delete schedule items first (they may reference locations)
      if (importResult.scheduleItemIds.length > 0) {
        await deleteScheduleItems({
          itemIds: importResult.scheduleItemIds as Id<'tripScheduleItems'>[],
        });
      }

      // Delete locations
      if (importResult.locationIds.length > 0) {
        await deleteLocations({
          locationIds: importResult.locationIds as Id<'tripLocations'>[],
        });
      }

      // Reset state
      setImportResult(null);
      setStep('input');
    } catch (err) {
      console.error('Undo error:', err);
      setError('Failed to undo import. Some items may have been removed.');
    }
  }, [importResult, deleteScheduleItems, deleteLocations]);

  /**
   * Reset to initial state.
   */
  const reset = useCallback(() => {
    setStep('input');
    setRawText('');
    setParsedData(null);
    setError(null);
    setIsParsing(false);
    setIsImporting(false);
    setImportResult(null);
  }, []);

  return {
    step,
    rawText,
    parsedData,
    error,
    isParsing,
    isImporting,
    setRawText,
    parse,
    updateLocation,
    deleteLocation,
    updateActivity,
    deleteActivity,
    confirmImport,
    undo,
    reset,
  };
}
