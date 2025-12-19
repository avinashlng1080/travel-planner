import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { useAtom } from 'jotai';
import { selectedDayIdAtom } from '../atoms/uiAtoms';
import { useGoogleRouting } from './useGoogleRouting';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface DayRouteResult {
  route: RoutePoint[];
  distance?: number;
  duration?: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook that fetches route for the selected day only
 *
 * Features:
 * - Uses selectedDayIdAtom from Jotai to track selected day
 * - Fetches schedule items and locations for the selected day
 * - Filters by selected day and active plan (A or B)
 * - Calls existing useRouting hook to get real road routes from OpenRouteService
 * - Returns route coordinates, distance, duration, loading state
 *
 * @param tripId - Trip ID to fetch locations from
 * @param planId - Plan ID to fetch schedule items from
 * @param activePlan - Active plan ('A' or 'B')
 * @returns Day route with metrics and loading state
 */
export function useDayRoute(
  tripId: Id<'trips'> | null,
  planId: Id<'tripPlans'> | null,
  _activePlan: 'A' | 'B'  // Prefixed with _ to indicate intentionally unused (reserved for future use)
): DayRouteResult {
  const [selectedDayId] = useAtom(selectedDayIdAtom);

  // Fetch trip locations
  const tripLocations = useQuery(
    api.tripLocations.getLocations,
    tripId ? { tripId } : 'skip'
  );

  // Fetch schedule items for selected plan
  const scheduleItems = useQuery(
    api.tripScheduleItems.getScheduleItems,
    planId ? { planId } : 'skip'
  );

  // Build waypoints for selected day - memoized to prevent infinite re-renders
  const waypoints = useMemo<RoutePoint[]>(() => {
    const points: RoutePoint[] = [];

    if (selectedDayId && scheduleItems && tripLocations) {
      // Filter schedule items by selected day
      const dayScheduleItems = scheduleItems.filter(
        (item) => item.dayDate === selectedDayId
      );

      // Sort by order (or start time if order is the same)
      const sortedItems = dayScheduleItems.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.startTime.localeCompare(b.startTime);
      });

      // Extract waypoints from locations
      for (const item of sortedItems) {
        if (item.locationId) {
          const location = tripLocations.find((loc) => loc._id === item.locationId);
          if (location) {
            const lat = location.customLat || location.baseLocation?.lat;
            const lng = location.customLng || location.baseLocation?.lng;
            if (lat && lng) {
              points.push({ lat, lng });
            }
          }
        }
      }
    }

    return points;
  }, [selectedDayId, scheduleItems, tripLocations]);

  // Fetch real road route using Google Directions API
  const {
    coordinates,
    distance,
    duration,
    isLoading,
    error,
  } = useGoogleRouting(waypoints, waypoints.length >= 2);

  return {
    route: coordinates,
    distance,
    duration,
    isLoading,
    error,
  };
}
