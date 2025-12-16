import { Polyline, Popup } from 'react-leaflet';
import { useDayRoute } from '../../hooks/useDayRoute';
import type { Id } from '../../../convex/_generated/dataModel';

interface DayRouteLayerProps {
  tripId: Id<'trips'> | null;
  planId: Id<'tripPlans'> | null;
  activePlan: 'A' | 'B';
}

/**
 * DayRouteLayer component that renders polyline for selected day's route
 *
 * Features:
 * - Uses useDayRoute hook to fetch route for selected day only
 * - Renders polyline with Plan A/B styling
 * - Plan A: solid green (#10B981)
 * - Plan B: dashed blue (#3B82F6)
 * - Shows popup with distance and duration metrics
 * - Only renders when there are 2+ waypoints for selected day
 *
 * Design Philosophy:
 * - Show route only for selected day (not all days)
 * - Leverages existing OpenRouteService integration
 * - Plan A/B styling already defined in design system
 */
export function DayRouteLayer({ tripId, planId, activePlan }: DayRouteLayerProps) {
  const { route, distance, duration, isLoading } = useDayRoute(tripId, planId, activePlan);

  // Don't render if loading or not enough waypoints
  if (isLoading || route.length < 2) {
    return null;
  }

  // Plan A: solid green, Plan B: dashed blue
  const routeColor = activePlan === 'A' ? '#10B981' : '#3B82F6';
  const routeDashArray = activePlan === 'B' ? '10, 10' : undefined;

  // Format metrics for popup
  const distanceStr = distance ? `${distance.toFixed(1)} km` : '';
  const durationStr = duration ? `${Math.round(duration)} min` : '';
  const metricsText = distanceStr && durationStr
    ? `Distance: ${distanceStr}\nDuration: ${durationStr}`
    : '';

  return (
    <Polyline
      positions={route.map((p) => [p.lat, p.lng])}
      color={routeColor}
      weight={4}
      opacity={0.8}
      dashArray={routeDashArray}
      pathOptions={{
        className: `day-route-${activePlan.toLowerCase()}`,
      }}
    >
      {metricsText && (
        <Popup>
          <div className="text-sm">
            <div className="font-semibold mb-1">Plan {activePlan} Route</div>
            <div className="whitespace-pre-line text-slate-600">{metricsText}</div>
          </div>
        </Popup>
      )}
    </Polyline>
  );
}
