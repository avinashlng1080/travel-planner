import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { CommuteResult } from '../../hooks/useCommutes';

interface CommutesRoutingLayerProps {
  commutes: Map<string, CommuteResult>;
  activeDestinationId: string | null;
  origin?: { lat: number; lng: number } | null;
}

// Route styling constants (matching Google's Commutes widget)
// Increased contrast for accessibility: stroke weight, opacity, and dashed pattern
const ACTIVE_ROUTE_COLOR = '#4285F4'; // Google blue
const INACTIVE_ROUTE_COLOR = '#9CA3AF'; // Gray
const ACTIVE_ROUTE_WEIGHT = 6;
const INACTIVE_ROUTE_WEIGHT = 2.5;
const ACTIVE_ROUTE_OPACITY = 1.0;
const INACTIVE_ROUTE_OPACITY = 0.35;

/**
 * Renders commute routes with active/inactive styling
 * Active route: Blue, thick, solid
 * Inactive routes: Gray, thin, semi-transparent
 */
export function CommutesRoutingLayer({
  commutes,
  activeDestinationId,
}: CommutesRoutingLayerProps) {
  const map = useMap();
  const polylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());

  useEffect(() => {
    if (!map) return;

    // Update or create polylines for each commute
    commutes.forEach((commute, destId) => {
      const isActive = destId === activeDestinationId;
      const existingPolyline = polylinesRef.current.get(destId);

      const options: google.maps.PolylineOptions = {
        path: commute.path,
        strokeColor: isActive ? ACTIVE_ROUTE_COLOR : INACTIVE_ROUTE_COLOR,
        strokeWeight: isActive ? ACTIVE_ROUTE_WEIGHT : INACTIVE_ROUTE_WEIGHT,
        strokeOpacity: isActive ? ACTIVE_ROUTE_OPACITY : INACTIVE_ROUTE_OPACITY,
        zIndex: isActive ? 100 : 50,
        clickable: true,
        // Add dashed pattern to inactive routes for non-color differentiation
        icons: isActive ? undefined : [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 4,
            },
            offset: '0',
            repeat: '20px',
          },
        ],
      };

      if (existingPolyline) {
        // Update existing polyline
        existingPolyline.setOptions(options);
      } else {
        // Create new polyline
        const polyline = new google.maps.Polyline({
          ...options,
          map,
        });
        polylinesRef.current.set(destId, polyline);
      }
    });

    // Remove polylines for destinations no longer in commutes
    polylinesRef.current.forEach((polyline, destId) => {
      if (!commutes.has(destId)) {
        polyline.setMap(null);
        polylinesRef.current.delete(destId);
      }
    });
  }, [map, commutes, activeDestinationId]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      polylinesRef.current.forEach((polyline) => {
        polyline.setMap(null);
      });
      polylinesRef.current.clear();
    };
  }, []);

  return null; // This component renders imperatively
}

/**
 * Creates origin marker element using safe DOM methods
 */
function createOriginMarkerElement(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '20px';
  container.style.height = '20px';

  const outerCircle = document.createElement('div');
  outerCircle.style.width = '20px';
  outerCircle.style.height = '20px';
  outerCircle.style.background = '#4285F4';
  outerCircle.style.border = '3px solid white';
  outerCircle.style.borderRadius = '50%';
  outerCircle.style.boxShadow = '0 2px 8px rgba(66, 133, 244, 0.5)';

  const innerCircle = document.createElement('div');
  innerCircle.style.position = 'absolute';
  innerCircle.style.top = '50%';
  innerCircle.style.left = '50%';
  innerCircle.style.transform = 'translate(-50%, -50%)';
  innerCircle.style.width = '8px';
  innerCircle.style.height = '8px';
  innerCircle.style.background = 'white';
  innerCircle.style.borderRadius = '50%';

  container.appendChild(outerCircle);
  container.appendChild(innerCircle);

  return container;
}

/**
 * Renders origin marker for commutes view
 */
export function CommuteOriginMarker({
  origin,
}: {
  origin: { lat: number; lng: number; name?: string } | null;
}) {
  const map = useMap();
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map || !origin) return;

    // Create origin marker with custom styling using safe DOM methods
    const markerContent = createOriginMarkerElement();

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: origin.lat, lng: origin.lng },
      content: markerContent,
      title: origin.name || 'Origin',
      zIndex: 100,
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [map, origin]);

  return null;
}
