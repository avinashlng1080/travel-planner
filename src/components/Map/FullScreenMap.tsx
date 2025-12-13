import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../../data/tripData';
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
};

function createCustomIcon(color: string, isSelected: boolean = false) {
  const size = isSelected ? 40 : 32;
  const innerSize = size * 0.4;

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
        ${isSelected ? 'animation: pulse 1s ease-in-out infinite;' : ''}
      ">
        <div style="
          width: ${innerSize}px;
          height: ${innerSize}px;
          background-color: rgba(255,255,255,0.4);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
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
  onLocationSelect: (location: Location) => void;
}

export function FullScreenMap({
  locations,
  selectedLocation,
  visibleCategories,
  activePlan,
  planRoute,
  onLocationSelect,
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
            background: #0f172a;
          }
          .leaflet-control-attribution {
            background: rgba(15, 23, 42, 0.8) !important;
            color: #94a3b8 !important;
          }
          .leaflet-control-attribution a {
            color: #94a3b8 !important;
          }
          .leaflet-control-zoom {
            border: 1px solid rgba(71, 85, 105, 0.5) !important;
          }
          .leaflet-control-zoom a {
            background: rgba(15, 23, 42, 0.9) !important;
            color: white !important;
            border-color: rgba(71, 85, 105, 0.5) !important;
          }
          .leaflet-control-zoom a:hover {
            background: rgba(30, 41, 59, 0.9) !important;
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
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
          const color = CATEGORY_COLORS[location.category] || '#64748b';

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={createCustomIcon(color, isSelected)}
              eventHandlers={{
                click: () => onLocationSelect(location),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
