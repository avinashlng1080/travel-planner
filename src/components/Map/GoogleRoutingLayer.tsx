/**
 * Google Routing Layer Component
 *
 * Renders route polylines on Google Maps using the Directions API.
 * Supports solid and dashed lines for Plan A/B visualization.
 */

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useGoogleRouting } from '../../hooks/useGoogleRouting';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface GoogleRoutingLayerProps {
  waypoints: RoutePoint[];
  color: string;
  dashArray?: string; // e.g., '10, 10' for dashed lines
  weight?: number;
  opacity?: number;
  enabled?: boolean;
}

export function GoogleRoutingLayer({
  waypoints,
  color,
  dashArray,
  weight = 4,
  opacity = 0.8,
  enabled = true,
}: GoogleRoutingLayerProps) {
  const map = useMap();
  const { coordinates, isLoading } = useGoogleRouting(waypoints, enabled);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || isLoading || coordinates.length < 2) {
      // Clean up existing polyline when not rendering
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const isDashed = !!dashArray;

    // For dashed lines, we use a symbol-based approach
    const lineSymbol = isDashed
      ? {
          path: 'M 0,-1 0,1',
          strokeOpacity: opacity,
          scale: weight,
        }
      : null;

    const icons = isDashed && lineSymbol
      ? [
          {
            icon: lineSymbol,
            offset: '0',
            repeat: '20px',
          },
        ]
      : [];

    const path = coordinates.map(p => ({ lat: p.lat, lng: p.lng }));

    if (polylineRef.current) {
      // Update existing polyline
      polylineRef.current.setPath(path);
      polylineRef.current.setOptions({
        strokeColor: color,
        strokeOpacity: isDashed ? 0 : opacity,
        strokeWeight: weight,
        icons,
      });
    } else {
      // Create new polyline
      polylineRef.current = new google.maps.Polyline({
        path,
        strokeColor: color,
        strokeOpacity: isDashed ? 0 : opacity,
        strokeWeight: weight,
        icons,
        map,
      });
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, coordinates, color, dashArray, weight, opacity, isLoading]);

  // This component doesn't render anything - it manages the polyline imperatively
  return null;
}
