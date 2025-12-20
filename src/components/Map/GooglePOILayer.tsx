/**
 * Google POI Layer Component
 *
 * Displays POIs (shopping malls, zoos, museums, parks, attractions)
 * from the database on Google Maps with emoji markers.
 *
 * Features:
 * - Emoji icons: shopping, zoo, museum, park, attraction
 * - InfoWindow popups showing name and category
 * - Opacity 0.6 (subtle, non-intrusive)
 */

import { useState, useCallback } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { POI, POIMapBounds } from '../../types/poi';

// Emoji icons for each POI category
const CATEGORY_EMOJI: Record<string, string> = {
  shopping: '🛍️',
  zoo: '🦁',
  museum: '🏛️',
  park: '🌳',
  attraction: '🎭',
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  shopping: 'Shopping',
  zoo: 'Zoo/Aquarium',
  museum: 'Museum/Gallery',
  park: 'Park/Nature',
  attraction: 'Attraction',
};

interface POIMarkerProps {
  poi: POI;
}

function POIMarker({ poi }: POIMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [showInfo, setShowInfo] = useState(false);
  const emoji = CATEGORY_EMOJI[poi.category] || '📍';

  const handleClick = useCallback(() => {
    setShowInfo(true);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setShowInfo(false);
  }, []);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: poi.lat, lng: poi.lng }}
        onClick={handleClick}
      >
        <div
          style={{
            fontSize: '20px',
            opacity: 0.35,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
            cursor: 'pointer',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          className="poi-marker"
        >
          {emoji}
        </div>
      </AdvancedMarker>

      {showInfo && marker && (
        <InfoWindow anchor={marker} onCloseClick={handleCloseInfo}>
          <div style={{ minWidth: '180px', padding: '4px' }}>
            <div
              style={{
                fontSize: '20px',
                marginBottom: '4px',
                textAlign: 'center',
              }}
            >
              {emoji}
            </div>
            <div
              style={{
                fontWeight: '600',
                fontSize: '14px',
                marginBottom: '4px',
                color: '#1e293b',
              }}
            >
              {poi.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                textTransform: 'capitalize',
              }}
            >
              {CATEGORY_NAMES[poi.category] || poi.category}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface GooglePOILayerProps {
  bounds: POIMapBounds | null;
  categories?: string[];
  visible?: boolean;
}

export function GooglePOILayer({ bounds, categories, visible = true }: GooglePOILayerProps) {
  // Query POIs within current viewport
  const pois = useQuery(
    api.pois.getPOIsByViewport,
    bounds
      ? {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
          categories,
        }
      : 'skip'
  );

  if (!visible || !pois || pois.length === 0) {
    return null;
  }

  return (
    <>
      {pois.map((poi: POI) => (
        <POIMarker key={poi._id} poi={poi} />
      ))}
    </>
  );
}
