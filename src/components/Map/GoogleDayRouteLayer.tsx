/**
 * Google Day Route Layer Component
 *
 * Renders route for the selected day only using Google Maps.
 * Plan A: solid green line, Plan B: dashed blue line.
 */

import { GoogleRoutingLayer } from './GoogleRoutingLayer';
import { useDayRoute } from '../../hooks/useDayRoute';

import type { Id } from '../../../convex/_generated/dataModel';

interface GoogleDayRouteLayerProps {
  tripId: Id<'trips'> | null;
  planId: Id<'tripPlans'> | null;
  activePlan: 'A' | 'B';
}

/**
 * DayRouteLayer component that renders polyline for selected day's route
 *
 * Features:
 * - Uses useDayRoute hook to fetch route for selected day only
 * - Renders polyline with Plan A/B styling via GoogleRoutingLayer
 * - Plan A: solid green (#10B981)
 * - Plan B: dashed blue (#3B82F6)
 * - Only renders when there are 2+ waypoints for selected day
 */
export function GoogleDayRouteLayer({ tripId, planId, activePlan }: GoogleDayRouteLayerProps) {
  const { route, isLoading } = useDayRoute(tripId, planId, activePlan);

  // Don't render if loading or not enough waypoints
  if (isLoading || route.length < 2) {
    return null;
  }

  // Plan A: solid red, Plan B: dashed sky blue
  const routeColor = activePlan === 'A' ? '#FF1744' : '#00B0FF';
  const routeDashArray = activePlan === 'B' ? '10, 10' : undefined;

  return (
    <GoogleRoutingLayer
      waypoints={route}
      color={routeColor}
      dashArray={routeDashArray}
      weight={4}
      opacity={0.8}
      enabled
    />
  );
}
