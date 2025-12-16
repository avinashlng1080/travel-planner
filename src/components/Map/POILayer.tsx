/**
 * POI Layer Component
 *
 * Displays POIs (shopping malls, zoos, museums, parks, attractions)
 * from OpenStreetMap on the map with emoji markers.
 *
 * Features:
 * - Emoji icons: 🛍️ (shopping), 🦁 (zoo), 🏛️ (museum), 🌳 (park), 🎭 (attraction)
 * - Opacity 0.6 (subtle, non-intrusive)
 * - Popups showing name and category
 */

import { Marker, Popup } from 'react-leaflet';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import L from 'leaflet';
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

/**
 * Create a custom Leaflet icon with emoji
 */
function createPOIIcon(category: string): L.DivIcon {
  const emoji = CATEGORY_EMOJI[category] || '📍';

  return L.divIcon({
    html: `
      <div style="
        font-size: 24px;
        text-align: center;
        line-height: 1;
        opacity: 0.6;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        transition: opacity 0.2s, transform 0.2s;
      "
      class="poi-marker"
      >
        ${emoji}
      </div>
    `,
    className: 'custom-poi-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

interface POILayerProps {
  bounds: POIMapBounds | null;
  categories?: string[];
  visible?: boolean;
}

export function POILayer({ bounds, categories, visible = true }: POILayerProps) {
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
      <style>
        {`
          .custom-poi-marker {
            background: transparent !important;
            border: none !important;
          }
          .poi-marker:hover {
            opacity: 1 !important;
            transform: scale(1.2);
          }
          .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .leaflet-popup-content {
            margin: 12px 16px;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .leaflet-popup-tip {
            background: rgba(255, 255, 255, 0.98);
          }
        `}
      </style>

      {pois.map((poi: POI) => (
        <Marker
          key={poi._id}
          position={[poi.lat, poi.lng]}
          icon={createPOIIcon(poi.category)}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <div
                style={{
                  fontSize: '20px',
                  marginBottom: '4px',
                  textAlign: 'center',
                }}
              >
                {CATEGORY_EMOJI[poi.category] || '📍'}
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
          </Popup>
        </Marker>
      ))}
    </>
  );
}
