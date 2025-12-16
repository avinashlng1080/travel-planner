import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../../data/tripData';
import type { DynamicPin } from '../../atoms/uiAtoms';
import { RoutingLayer } from './RoutingLayer';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Tropical Sunset palette for map markers - softer colors for eye comfort
const CATEGORY_COLORS: Record<string, string> = {
  'home-base': '#F97316',       // Sunset coral - warm home (kept)
  'toddler-friendly': '#F9A8D4', // Softer pink - gentle, friendly
  attraction: '#14B8A6',         // Softer teal - adventure
  shopping: '#FBBF24',           // Warmer gold - luxury
  restaurant: '#F97316',         // Softer orange - warmth
  nature: '#34D399',             // Softer emerald - natural
  temple: '#EF4444',             // Softer red - sacred, traditional
  playground: '#38BDF8',         // Softer sky - playful
  medical: '#EF4444',            // Softer red - universal
  avoid: '#94A3B8',              // Lighter slate - muted
  'ai-suggested': '#F97316',     // Sunset coral for AI (kept)
};

// Plan indicator type
type PlanIndicator = 'A' | 'B' | 'both' | null;

// Unique silhouette marker SVGs for each category
// Each marker has a distinctive shape that's recognizable at a glance
function createCategoryMarkerSVG(category: string, size: number, isSelected: boolean, planIndicator: PlanIndicator = null): string {
  const shadow = isSelected ? 'filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));' : 'filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));';
  const pulse = isSelected ? 'animation: pulse 1s ease-in-out infinite;' : '';
  const color = CATEGORY_COLORS[category] || '#64748b';

  // Plan ring colors
  const planAColor = '#10B981'; // Green
  const planBColor = '#6366F1'; // Indigo
  const ringStrokeWidth = 3;
  const ringRadius = 22; // Outer ring radius (size is 40, so center is at 20)

  // Create plan indicator ring
  let planRing = '';
  if (planIndicator === 'A') {
    // Green ring for Plan A
    planRing = `<circle cx="20" cy="22" r="${ringRadius}" fill="none" stroke="${planAColor}" stroke-width="${ringStrokeWidth}"/>`;
  } else if (planIndicator === 'B') {
    // Blue ring for Plan B
    planRing = `<circle cx="20" cy="22" r="${ringRadius}" fill="none" stroke="${planBColor}" stroke-width="${ringStrokeWidth}"/>`;
  } else if (planIndicator === 'both') {
    // Split ring - half green, half blue
    planRing = `
      <path d="M20 ${22 - ringRadius} A${ringRadius} ${ringRadius} 0 0 1 20 ${22 + ringRadius}"
            fill="none" stroke="${planAColor}" stroke-width="${ringStrokeWidth}"/>
      <path d="M20 ${22 + ringRadius} A${ringRadius} ${ringRadius} 0 0 1 20 ${22 - ringRadius}"
            fill="none" stroke="${planBColor}" stroke-width="${ringStrokeWidth}"/>
    `;
  }

  const markers: Record<string, string> = {
    // House silhouette for home base
    'home-base': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        ${planRing}
        <path d="M20 2 L38 18 L38 42 L2 42 L2 18 Z" fill="${color}" stroke="white" stroke-width="2"/>
        <rect x="15" y="26" width="10" height="16" fill="white" opacity="0.3"/>
        <polygon points="20,2 2,18 38,18" fill="${color}" stroke="white" stroke-width="2"/>
        <rect x="24" y="20" width="6" height="6" fill="white" opacity="0.4"/>
      </svg>
    `,

    // Heart with baby for toddler-friendly
    'toddler-friendly': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M20 38 C20 38 4 26 4 14 C4 8 9 4 15 4 C18 4 20 6 20 6 C20 6 22 4 25 4 C31 4 36 8 36 14 C36 26 20 38 20 38Z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="18" r="6" fill="white" opacity="0.4"/>
        <circle cx="20" cy="16" r="3" fill="white" opacity="0.6"/>
      </svg>
    `,

    // Camera/landmark for attractions
    'attraction': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M6 12 L14 12 L17 8 L23 8 L26 12 L34 12 L34 36 L6 36 Z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="24" r="8" fill="white" opacity="0.3" stroke="white" stroke-width="1"/>
        <circle cx="20" cy="24" r="5" fill="white" opacity="0.5"/>
        <rect x="28" y="14" width="4" height="3" rx="1" fill="white" opacity="0.4"/>
      </svg>
    `,

    // Shopping bag silhouette
    'shopping': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M8 14 L32 14 L34 42 L6 42 Z" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M14 14 L14 10 C14 6 16 4 20 4 C24 4 26 6 26 10 L26 14" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="20" cy="28" rx="6" ry="8" fill="white" opacity="0.2"/>
      </svg>
    `,

    // Plate with utensils for restaurants
    'restaurant': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <ellipse cx="20" cy="24" rx="16" ry="16" fill="${color}" stroke="white" stroke-width="2"/>
        <ellipse cx="20" cy="24" rx="10" ry="10" fill="white" opacity="0.2"/>
        <rect x="8" y="4" width="2" height="16" rx="1" fill="white" opacity="0.8"/>
        <rect x="12" y="4" width="2" height="16" rx="1" fill="white" opacity="0.8"/>
        <path d="M28 4 L28 12 C28 15 30 16 30 16 L30 20" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M32 4 L32 10 L28 10" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `,

    // Tree silhouette for nature/parks
    'nature': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M20 2 L32 18 L26 18 L34 30 L6 30 L14 18 L8 18 Z" fill="${color}" stroke="white" stroke-width="2"/>
        <rect x="17" y="30" width="6" height="12" fill="#8B4513" stroke="white" stroke-width="1"/>
        <circle cx="14" cy="14" r="3" fill="white" opacity="0.3"/>
        <circle cx="26" cy="20" r="2" fill="white" opacity="0.3"/>
      </svg>
    `,

    // Pagoda/temple silhouette
    'temple': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M20 2 L28 10 L12 10 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <path d="M8 10 L32 10 L30 18 L10 18 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <path d="M6 18 L34 18 L31 28 L9 28 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <path d="M4 28 L36 28 L34 42 L6 42 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <rect x="17" y="32" width="6" height="10" fill="white" opacity="0.4"/>
        <circle cx="20" cy="6" r="2" fill="#FFD700"/>
      </svg>
    `,

    // Swing/playground silhouette
    'playground': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M4 42 L12 4 L28 4 L36 42" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        <rect x="10" y="4" width="20" height="4" rx="2" fill="${color}" stroke="white" stroke-width="1"/>
        <line x1="16" y1="8" x2="16" y2="28" stroke="${color}" stroke-width="3"/>
        <line x1="24" y1="8" x2="24" y2="28" stroke="${color}" stroke-width="3"/>
        <rect x="12" y="26" width="8" height="4" rx="2" fill="${color}" stroke="white" stroke-width="1"/>
        <rect x="20" y="26" width="8" height="4" rx="2" fill="${color}" stroke="white" stroke-width="1"/>
        <circle cx="16" cy="22" r="4" fill="white" opacity="0.5"/>
        <circle cx="24" cy="22" r="4" fill="white" opacity="0.5"/>
        <path d="M2 42 L38 42" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,

    // Cross/hospital for medical
    'medical': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <rect x="4" y="4" width="32" height="38" rx="4" fill="${color}" stroke="white" stroke-width="2"/>
        <rect x="16" y="10" width="8" height="26" rx="1" fill="white"/>
        <rect x="10" y="18" width="20" height="8" rx="1" fill="white"/>
      </svg>
    `,

    // Warning/avoid symbol
    'avoid': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <circle cx="20" cy="22" r="18" fill="${color}" stroke="white" stroke-width="2"/>
        <line x1="8" y1="34" x2="32" y2="10" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <circle cx="20" cy="22" r="10" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>
      </svg>
    `,
  };

  return markers[category] || markers['attraction'];
}

function createCustomIcon(category: string, isSelected: boolean = false, planIndicator: PlanIndicator = null) {
  const size = isSelected ? 48 : 40;

  return L.divIcon({
    html: createCategoryMarkerSVG(category, size, isSelected, planIndicator),
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Special icon for AI-suggested dynamic pins with sparkle badge
function createDynamicPinIcon(isSelected: boolean = false) {
  const size = isSelected ? 48 : 40;
  const shadow = isSelected ? 'filter: drop-shadow(0 4px 12px rgba(249, 115, 22, 0.6));' : 'filter: drop-shadow(0 2px 8px rgba(249, 115, 22, 0.4));';
  const pulse = isSelected ? 'animation: pulse 1s ease-in-out infinite;' : '';

  return L.divIcon({
    html: `
      <div style="position: relative; ${pulse}">
        <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}">
          <defs>
            <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#F97316"/>
              <stop offset="100%" style="stop-color:#14B8A6"/>
            </linearGradient>
          </defs>
          <path d="M20 2 C10 2 4 10 4 18 C4 30 20 42 20 42 C20 42 36 30 36 18 C36 10 30 2 20 2Z"
                fill="url(#aiGradient)" stroke="white" stroke-width="2"/>
          <circle cx="20" cy="18" r="6" fill="white" opacity="0.4"/>
          <circle cx="20" cy="18" r="3" fill="white" opacity="0.7"/>
        </svg>
        <!-- Sparkle badge -->
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
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

interface MapBoundsControllerProps {
  planRoute: Array<{ lat: number; lng: number }>;
  selectedLocation: Location | null;
}

function MapBoundsController({ planRoute, selectedLocation }: MapBoundsControllerProps) {
  const map = useMap();

  useEffect(() => {
    // Don't auto-fit if a location is selected (MapController handles that)
    if (selectedLocation || planRoute.length === 0) {
      return;
    }

    // For a single point, use flyTo with default zoom instead of fitBounds
    if (planRoute.length === 1) {
      map.flyTo([planRoute[0].lat, planRoute[0].lng], 13, {
        duration: 1,
      });
      return;
    }

    // For multiple points, fit bounds with padding
    const bounds = L.latLngBounds(planRoute.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, {
      padding: [50, 50],
      duration: 1,
      maxZoom: 14,
    });
  }, [planRoute, selectedLocation, map]);

  return null;
}

// Controller for auto-focusing on newly added AI-suggested pins
interface DynamicPinBoundsControllerProps {
  newlyAddedPins: DynamicPin[] | null;
  onFirstPinSelect: (pin: DynamicPin) => void;
  onPinsFocused: () => void;
}

function DynamicPinBoundsController({
  newlyAddedPins,
  onFirstPinSelect,
  onPinsFocused
}: DynamicPinBoundsControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!newlyAddedPins || newlyAddedPins.length === 0) return;

    // For a single pin, fly to it at zoom 14
    if (newlyAddedPins.length === 1) {
      map.flyTo([newlyAddedPins[0].lat, newlyAddedPins[0].lng], 14, {
        duration: 1,
      });
    } else {
      // For multiple pins, fit bounds to show all
      const bounds = L.latLngBounds(newlyAddedPins.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 14,
      });
    }

    // Select first pin after animation completes
    const timer = setTimeout(() => {
      onFirstPinSelect(newlyAddedPins[0]);
      onPinsFocused();
    }, 600);

    return () => clearTimeout(timer);
  }, [newlyAddedPins, map, onFirstPinSelect, onPinsFocused]);

  return null;
}

interface FullScreenMapProps {
  locations: Location[];
  selectedLocation: Location | null;
  visibleCategories: string[];
  activePlan: 'A' | 'B';
  planRoute: Array<{ lat: number; lng: number }>;
  dynamicPins?: DynamicPin[];
  newlyAddedPins?: DynamicPin[] | null; // Pins just added by AI, triggers auto-focus
  planALocationIds?: string[];  // IDs of locations in current day's Plan A
  planBLocationIds?: string[];  // IDs of locations in current day's Plan B
  onLocationSelect: (location: Location) => void;
  onDynamicPinSelect?: (pin: DynamicPin) => void;
  onNewPinsFocused?: () => void; // Called after map focuses on new pins
}

export function FullScreenMap({
  locations,
  selectedLocation,
  visibleCategories,
  activePlan,
  planRoute,
  dynamicPins = [],
  newlyAddedPins = null,
  planALocationIds = [],
  planBLocationIds = [],
  onLocationSelect,
  onDynamicPinSelect,
  onNewPinsFocused,
}: FullScreenMapProps) {
  const filteredLocations = locations.filter((loc) =>
    visibleCategories.includes(loc.category)
  );

  const routeColor = activePlan === 'A' ? '#10B981' : '#6366F1'; // Plan A: solid green, Plan B: indigo
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
          .leaflet-control-layers {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(203, 213, 225, 0.8) !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          }
          .leaflet-control-layers-toggle {
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>') !important;
            background-size: 20px 20px !important;
            background-position: center !important;
            width: 36px !important;
            height: 36px !important;
            border-radius: 8px !important;
          }
          .leaflet-control-layers-expanded {
            padding: 12px !important;
          }
          .leaflet-control-layers-base label {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 6px 8px !important;
            margin: 2px 0 !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            transition: background 0.2s !important;
          }
          .leaflet-control-layers-base label:hover {
            background: rgba(241, 245, 249, 0.8) !important;
          }
          .leaflet-control-layers-selector {
            margin-right: 4px !important;
          }
        `}
      </style>

      <MapContainer
        center={[3.1089, 101.7279]}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Dark Mode">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapController selectedLocation={selectedLocation} />
        <MapBoundsController planRoute={planRoute} selectedLocation={selectedLocation} />
        {newlyAddedPins && newlyAddedPins.length > 0 && onDynamicPinSelect && onNewPinsFocused && (
          <DynamicPinBoundsController
            newlyAddedPins={newlyAddedPins}
            onFirstPinSelect={onDynamicPinSelect}
            onPinsFocused={onNewPinsFocused}
          />
        )}

        {/* Real Road Routing Layer */}
        <RoutingLayer
          waypoints={planRoute}
          color={routeColor}
          dashArray={routeDashArray}
          weight={4}
          opacity={0.8}
          enabled={planRoute.length > 1}
        />

        {/* Location Markers */}
        {filteredLocations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;
          const inPlanA = planALocationIds.includes(location.id);
          const inPlanB = planBLocationIds.includes(location.id);

          // Determine plan indicator
          let planIndicator: PlanIndicator = null;
          if (inPlanA && inPlanB) {
            planIndicator = 'both';
          } else if (inPlanA) {
            planIndicator = 'A';
          } else if (inPlanB) {
            planIndicator = 'B';
          }

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={createCustomIcon(location.category, isSelected, planIndicator)}
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
