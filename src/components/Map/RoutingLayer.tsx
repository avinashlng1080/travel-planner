import { useEffect } from 'react';
import { Polyline } from 'react-leaflet';
import { useRouting } from '../../hooks/useRouting';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface RoutingLayerProps {
  waypoints: RoutePoint[];
  color: string;
  dashArray?: string;
  weight?: number;
  opacity?: number;
  enabled?: boolean;
}

/**
 * RoutingLayer component that fetches and displays real road routes using OpenRouteService
 *
 * Features:
 * - Fetches actual driving routes between waypoints using OpenRouteService API
 * - Provides distance and duration metrics for routes
 * - Caches routes to avoid repeated API calls (2,000 requests/day free tier)
 * - Automatically falls back to straight lines if API fails or key is missing
 * - Supports custom styling (color, dash pattern, weight, opacity)
 */
export function RoutingLayer({
  waypoints,
  color,
  dashArray,
  weight = 4,
  opacity = 0.8,
  enabled = true,
}: RoutingLayerProps) {
  const { coordinates, isLoading, error, useFallback, distance, duration } = useRouting(
    waypoints,
    enabled
  );

  // Log routing status for debugging (only in development)
  useEffect(() => {
    if (import.meta.env.DEV && waypoints.length > 1) {
      if (isLoading) {
        console.log('[RoutingLayer] Fetching route for', waypoints.length, 'waypoints');
      } else if (error) {
        console.warn('[RoutingLayer] Routing failed, using fallback:', error);
      } else if (useFallback) {
        console.warn('[RoutingLayer] Using straight line fallback (no API key or API error)');
      } else if (coordinates.length > 0) {
        const distanceStr = distance ? `${distance.toFixed(1)}km` : '';
        const durationStr = duration ? `${duration.toFixed(0)}min` : '';
        const metrics = distanceStr && durationStr ? ` (${distanceStr}, ${durationStr})` : '';
        console.log('[RoutingLayer] Route loaded with', coordinates.length, `points${  metrics}`);
      }
    }
  }, [isLoading, error, useFallback, coordinates.length, waypoints.length, distance, duration]);

  // Don't render if not enabled or not enough waypoints
  if (!enabled || waypoints.length < 2) {
    return null;
  }

  // Don't render while loading (prevents flash of straight line)
  if (isLoading) {
    return null;
  }

  // Render route (either real route or fallback straight line)
  if (coordinates.length > 1) {
    return (
      <Polyline
        positions={coordinates.map((p) => [p.lat, p.lng])}
        color={color}
        weight={weight}
        opacity={opacity}
        dashArray={dashArray}
        // Add subtle animation on hover
        pathOptions={{
          className: useFallback ? 'route-fallback' : 'route-road',
        }}
      />
    );
  }

  return null;
}
