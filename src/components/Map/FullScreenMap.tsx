import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../../data/tripData';
import type { DynamicPin } from '../../stores/uiStore';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CATEGORY_COLORS: Record<string, string> = {
  'home-base': '#EC4899',
  'toddler-friendly': '#F472B6',
  attraction: '#10B981',
  shopping: '#8B5CF6',
  restaurant: '#F59E0B',
  nature: '#22C55E',
  temple: '#EF4444',
  playground: '#06B6D4',
  medical: '#DC2626',
  avoid: '#64748b',
  'ai-suggested': '#A855F7', // Purple for AI suggestions
};

// SVG icons for each category (simplified paths)
const CATEGORY_ICONS: Record<string, string> = {
  'home-base': `<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="white"/>`, // Home
  'toddler-friendly': `<path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 11h-4v-1h4v1zm0-2h-4V9.5h4V11z" fill="white"/>`, // Baby/Lightbulb
  attraction: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>`, // Landmark pin
  shopping: `<path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" fill="white"/>`, // Shopping bag
  restaurant: `<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="white"/>`, // Fork & knife
  nature: `<path d="M17 8V2h-2v1h-1.5C13.22 3 13 3.22 13 3.5V6l-3.72 1.86C9.11 7.95 9 8.11 9 8.28v1.22L6 11v3l3-1.5v1.72c0 .17.11.33.28.42l3 1.5c.14.07.3.08.44.02l.28-.14V19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-3l-1.72-.86c-.17-.08-.28-.25-.28-.42V13l3 1.5v-3l-3-1.5V8.28c0-.17.11-.33.28-.42L17 6V4l-1 .5V4c.55 0 1-.45 1-1s-.45-1-1-1h-1v6h2z" fill="white"/>`, // Tree
  temple: `<path d="M6 20h12v2H6v-2zm6-18L2 8v2h2v8H2v2h20v-2h-2v-8h2V8L12 2zm6 10h-3v4h-2v-4h-2v4H9v-4H6v6h12v-6z" fill="white"/>`, // Temple/building
  playground: `<path d="M17.5 12c.88 0 1.73.09 2.5.26V3H4v9.26c.77-.17 1.62-.26 2.5-.26.86 0 1.68.09 2.5.25V6h6v6.25c.82-.16 1.64-.25 2.5-.25zm-9 1c-2.78 0-4.5 1.84-4.5 4V22h9v-5c0-2.16-1.72-4-4.5-4zm8.5 0c-1.93 0-3.5 1.57-3.5 3.5v5.5h7v-5.5c0-1.93-1.57-3.5-3.5-3.5z" fill="white"/>`, // Play
  medical: `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="white"/>`, // Medical cross
  avoid: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" fill="white"/>`, // No symbol
};

function createCustomIcon(category: string, isSelected: boolean = false) {
  const size = isSelected ? 44 : 36;
  const iconSize = isSelected ? 20 : 16;
  const color = CATEGORY_COLORS[category] || '#64748b';
  const iconPath = CATEGORY_ICONS[category] || CATEGORY_ICONS['attraction'];

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isSelected ? 'animation: pulse 1s ease-in-out infinite;' : ''}
      ">
        <svg
          width="${iconSize}"
          height="${iconSize}"
          viewBox="0 0 24 24"
          style="transform: rotate(45deg);"
        >
          ${iconPath}
        </svg>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Special icon for AI-suggested dynamic pins with sparkle badge
function createDynamicPinIcon(isSelected: boolean = false) {
  const size = isSelected ? 44 : 36;
  const color = CATEGORY_COLORS['ai-suggested'];

  return L.divIcon({
    html: `
      <div style="position: relative;">
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${color}, #EC4899);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 12px rgba(168, 85, 247, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          ${isSelected ? 'animation: pulse 1s ease-in-out infinite;' : ''}
        ">
          <svg
            width="${size * 0.45}"
            height="${size * 0.45}"
            viewBox="0 0 24 24"
            style="transform: rotate(45deg);"
            fill="white"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <!-- Sparkle badge -->
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #FBBF24, #F59E0B);
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(251, 191, 36, 0.5);
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'custom-marker dynamic-pin',
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, size + 4],
    popupAnchor: [0, -(size + 4)],
  });
}

interface MapControllerProps {
  selectedLocation: Location | null;
}

function MapController({ selectedLocation }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 14, {
        duration: 1,
      });
    }
  }, [selectedLocation, map]);

  return null;
}

interface FullScreenMapProps {
  locations: Location[];
  selectedLocation: Location | null;
  visibleCategories: string[];
  activePlan: 'A' | 'B';
  planRoute: Array<{ lat: number; lng: number }>;
  dynamicPins?: DynamicPin[];
  onLocationSelect: (location: Location) => void;
  onDynamicPinSelect?: (pin: DynamicPin) => void;
}

export function FullScreenMap({
  locations,
  selectedLocation,
  visibleCategories,
  activePlan,
  planRoute,
  dynamicPins = [],
  onLocationSelect,
  onDynamicPinSelect,
}: FullScreenMapProps) {
  const filteredLocations = locations.filter((loc) =>
    visibleCategories.includes(loc.category)
  );

  const routeColor = activePlan === 'A' ? '#10B981' : '#3B82F6';
  const routeDashArray = activePlan === 'B' ? '10, 10' : undefined;

  return (
    <div className="fixed inset-0 z-0">
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: rotate(-45deg) scale(1); }
            50% { transform: rotate(-45deg) scale(1.1); }
          }
          .custom-marker {
            background: transparent !important;
            border: none !important;
          }
          .leaflet-container {
            background: #f8fafc;
          }
          .leaflet-control-attribution {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #64748b !important;
          }
          .leaflet-control-attribution a {
            color: #475569 !important;
          }
          .leaflet-control-zoom {
            border: 1px solid rgba(203, 213, 225, 0.8) !important;
          }
          .leaflet-control-zoom a {
            background: rgba(255, 255, 255, 0.95) !important;
            color: #334155 !important;
            border-color: rgba(203, 213, 225, 0.8) !important;
          }
          .leaflet-control-zoom a:hover {
            background: rgba(241, 245, 249, 0.95) !important;
          }
        `}
      </style>
      <MapContainer
        center={[3.1089, 101.7279]}
        zoom={12}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapController selectedLocation={selectedLocation} />

        {/* Route Polyline */}
        {planRoute.length > 1 && (
          <Polyline
            positions={planRoute.map((p) => [p.lat, p.lng])}
            color={routeColor}
            weight={4}
            opacity={0.8}
            dashArray={routeDashArray}
          />
        )}

        {/* Location Markers */}
        {filteredLocations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={createCustomIcon(location.category, isSelected)}
              eventHandlers={{
                click: () => onLocationSelect(location),
              }}
            />
          );
        })}

        {/* Dynamic AI-Suggested Pins */}
        {dynamicPins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createDynamicPinIcon(false)}
            eventHandlers={{
              click: () => onDynamicPinSelect?.(pin),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
