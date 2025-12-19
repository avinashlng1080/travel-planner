/**
 * Google Full Screen Map Component
 *
 * Main map component using Google Maps API via @vis.gl/react-google-maps.
 * Replaces the Leaflet-based FullScreenMap with identical functionality.
 *
 * Features:
 * - Custom SVG markers with unique silhouettes per category
 * - Plan A/B indicator rings on markers
 * - Real road routing via Google Directions API
 * - Day-specific route visualization
 * - POI layer with emoji markers
 * - Auto-focus on selection
 * - Dynamic AI-suggested pins
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Map, AdvancedMarker, useMap, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import type { Location } from '../../data/tripData';
import type { DynamicPin } from '../../atoms/uiAtoms';
import type { POIMapBounds } from '../../types/poi';
import type { Id } from '../../../convex/_generated/dataModel';
import { GoogleRoutingLayer } from './GoogleRoutingLayer';
import { GoogleDayRouteLayer } from './GoogleDayRouteLayer';
import { GooglePOILayer } from './GooglePOILayer';
import {
  CATEGORY_COLORS,
  PLAN_A_COLOR,
  PLAN_B_COLOR,
  MARKER_ANIMATION_STYLES,
  type PlanIndicator,
} from './markerUtils';

// Map controller for auto-focusing on selected location
interface MapControllerProps {
  selectedLocation: Location | null;
}

function MapController({ selectedLocation }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && map) {
      map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      map.setZoom(14);
    }
  }, [selectedLocation, map]);

  return null;
}

// Map bounds controller for fitting route waypoints
interface MapBoundsControllerProps {
  planRoute: Array<{ lat: number; lng: number }>;
  selectedLocation: Location | null;
}

function MapBoundsController({ planRoute, selectedLocation }: MapBoundsControllerProps) {
  const map = useMap();

  useEffect(() => {
    // Don't auto-fit if a location is selected (MapController handles that)
    if (selectedLocation || planRoute.length === 0 || !map) {
      return;
    }

    // For a single point, pan to it with default zoom
    if (planRoute.length === 1) {
      map.panTo({ lat: planRoute[0].lat, lng: planRoute[0].lng });
      map.setZoom(13);
      return;
    }

    // For multiple points, fit bounds with padding
    const bounds = new google.maps.LatLngBounds();
    planRoute.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
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
  onPinsFocused,
}: DynamicPinBoundsControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!newlyAddedPins || newlyAddedPins.length === 0 || !map) return;

    // For a single pin, pan to it at zoom 14
    if (newlyAddedPins.length === 1) {
      map.panTo({ lat: newlyAddedPins[0].lat, lng: newlyAddedPins[0].lng });
      map.setZoom(14);
    } else {
      // For multiple pins, fit bounds to show all
      const bounds = new google.maps.LatLngBounds();
      newlyAddedPins.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
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

// Map bounds tracker for POI loading
interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: POIMapBounds) => void;
}

function MapBoundsTracker({ onBoundsChange }: MapBoundsTrackerProps) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const updateBounds = () => {
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChange({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        });
      }
    };

    // Set initial bounds
    if (!initializedRef.current) {
      // Small delay to ensure map is fully loaded
      const timer = setTimeout(() => {
        updateBounds();
        initializedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map, onBoundsChange]);

  return null;
}

// Plan indicator ring SVG component
function PlanRing({ planIndicator }: { planIndicator: PlanIndicator }) {
  const ringRadius = 22;
  const ringStrokeWidth = 3;

  if (planIndicator === 'A') {
    return (
      <circle
        cx="20"
        cy="22"
        r={ringRadius}
        fill="none"
        stroke={PLAN_A_COLOR}
        strokeWidth={ringStrokeWidth}
      />
    );
  }

  if (planIndicator === 'B') {
    return (
      <circle
        cx="20"
        cy="22"
        r={ringRadius}
        fill="none"
        stroke={PLAN_B_COLOR}
        strokeWidth={ringStrokeWidth}
      />
    );
  }

  if (planIndicator === 'both') {
    return (
      <>
        <path
          d={`M20 ${22 - ringRadius} A${ringRadius} ${ringRadius} 0 0 1 20 ${22 + ringRadius}`}
          fill="none"
          stroke={PLAN_A_COLOR}
          strokeWidth={ringStrokeWidth}
        />
        <path
          d={`M20 ${22 + ringRadius} A${ringRadius} ${ringRadius} 0 0 1 20 ${22 - ringRadius}`}
          fill="none"
          stroke={PLAN_B_COLOR}
          strokeWidth={ringStrokeWidth}
        />
      </>
    );
  }

  return null;
}

// Category marker SVG components
function HomeBaseMarker({ color, planIndicator }: { color: string; planIndicator: PlanIndicator }) {
  return (
    <>
      <PlanRing planIndicator={planIndicator} />
      <path d="M20 2 L38 18 L38 42 L2 42 L2 18 Z" fill={color} stroke="white" strokeWidth="2" />
      <rect x="15" y="26" width="10" height="16" fill="white" opacity="0.3" />
      <polygon points="20,2 2,18 38,18" fill={color} stroke="white" strokeWidth="2" />
      <rect x="24" y="20" width="6" height="6" fill="white" opacity="0.4" />
    </>
  );
}

function ToddlerFriendlyMarker({ color }: { color: string }) {
  return (
    <>
      <path
        d="M20 38 C20 38 4 26 4 14 C4 8 9 4 15 4 C18 4 20 6 20 6 C20 6 22 4 25 4 C31 4 36 8 36 14 C36 26 20 38 20 38Z"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="20" cy="18" r="6" fill="white" opacity="0.4" />
      <circle cx="20" cy="16" r="3" fill="white" opacity="0.6" />
    </>
  );
}

function AttractionMarker({ color }: { color: string }) {
  return (
    <>
      <path d="M6 12 L14 12 L17 8 L23 8 L26 12 L34 12 L34 36 L6 36 Z" fill={color} stroke="white" strokeWidth="2" />
      <circle cx="20" cy="24" r="8" fill="white" opacity="0.3" stroke="white" strokeWidth="1" />
      <circle cx="20" cy="24" r="5" fill="white" opacity="0.5" />
      <rect x="28" y="14" width="4" height="3" rx="1" fill="white" opacity="0.4" />
    </>
  );
}

function ShoppingMarker({ color }: { color: string }) {
  return (
    <>
      <path d="M8 14 L32 14 L34 42 L6 42 Z" fill={color} stroke="white" strokeWidth="2" />
      <path d="M14 14 L14 10 C14 6 16 4 20 4 C24 4 26 6 26 10 L26 14" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="20" cy="28" rx="6" ry="8" fill="white" opacity="0.2" />
    </>
  );
}

function RestaurantMarker({ color }: { color: string }) {
  return (
    <>
      <ellipse cx="20" cy="24" rx="16" ry="16" fill={color} stroke="white" strokeWidth="2" />
      <ellipse cx="20" cy="24" rx="10" ry="10" fill="white" opacity="0.2" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="white" opacity="0.8" />
      <rect x="12" y="4" width="2" height="16" rx="1" fill="white" opacity="0.8" />
      <path d="M28 4 L28 12 C28 15 30 16 30 16 L30 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M32 4 L32 10 L28 10" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

function NatureMarker({ color }: { color: string }) {
  return (
    <>
      <path d="M20 2 L32 18 L26 18 L34 30 L6 30 L14 18 L8 18 Z" fill={color} stroke="white" strokeWidth="2" />
      <rect x="17" y="30" width="6" height="12" fill="#8B4513" stroke="white" strokeWidth="1" />
      <circle cx="14" cy="14" r="3" fill="white" opacity="0.3" />
      <circle cx="26" cy="20" r="2" fill="white" opacity="0.3" />
    </>
  );
}

function TempleMarker({ color }: { color: string }) {
  return (
    <>
      <path d="M20 2 L28 10 L12 10 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <path d="M8 10 L32 10 L30 18 L10 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <path d="M6 18 L34 18 L31 28 L9 28 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <path d="M4 28 L36 28 L34 42 L6 42 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <rect x="17" y="32" width="6" height="10" fill="white" opacity="0.4" />
      <circle cx="20" cy="6" r="2" fill="#FFD700" />
    </>
  );
}

function PlaygroundMarker({ color }: { color: string }) {
  return (
    <>
      <path d="M4 42 L12 4 L28 4 L36 42" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <rect x="10" y="4" width="20" height="4" rx="2" fill={color} stroke="white" strokeWidth="1" />
      <line x1="16" y1="8" x2="16" y2="28" stroke={color} strokeWidth="3" />
      <line x1="24" y1="8" x2="24" y2="28" stroke={color} strokeWidth="3" />
      <rect x="12" y="26" width="8" height="4" rx="2" fill={color} stroke="white" strokeWidth="1" />
      <rect x="20" y="26" width="8" height="4" rx="2" fill={color} stroke="white" strokeWidth="1" />
      <circle cx="16" cy="22" r="4" fill="white" opacity="0.5" />
      <circle cx="24" cy="22" r="4" fill="white" opacity="0.5" />
      <path d="M2 42 L38 42" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function MedicalMarker({ color }: { color: string }) {
  return (
    <>
      <rect x="4" y="4" width="32" height="38" rx="4" fill={color} stroke="white" strokeWidth="2" />
      <rect x="16" y="10" width="8" height="26" rx="1" fill="white" />
      <rect x="10" y="18" width="20" height="8" rx="1" fill="white" />
    </>
  );
}

function AvoidMarker({ color }: { color: string }) {
  return (
    <>
      <circle cx="20" cy="22" r="18" fill={color} stroke="white" strokeWidth="2" />
      <line x1="8" y1="34" x2="32" y2="10" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <circle cx="20" cy="22" r="10" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
    </>
  );
}

// Get marker content based on category
function getCategoryMarkerContent(category: string, color: string, planIndicator: PlanIndicator) {
  switch (category) {
    case 'home-base':
      return <HomeBaseMarker color={color} planIndicator={planIndicator} />;
    case 'toddler-friendly':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <ToddlerFriendlyMarker color={color} />
        </>
      );
    case 'attraction':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <AttractionMarker color={color} />
        </>
      );
    case 'shopping':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <ShoppingMarker color={color} />
        </>
      );
    case 'restaurant':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <RestaurantMarker color={color} />
        </>
      );
    case 'nature':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <NatureMarker color={color} />
        </>
      );
    case 'temple':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <TempleMarker color={color} />
        </>
      );
    case 'playground':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <PlaygroundMarker color={color} />
        </>
      );
    case 'medical':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <MedicalMarker color={color} />
        </>
      );
    case 'avoid':
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <AvoidMarker color={color} />
        </>
      );
    default:
      return (
        <>
          <PlanRing planIndicator={planIndicator} />
          <AttractionMarker color={color} />
        </>
      );
  }
}

// Location marker component using React SVG
interface LocationMarkerProps {
  location: Location;
  isSelected: boolean;
  planIndicator: PlanIndicator;
  onClick: () => void;
}

function LocationMarker({ location, isSelected, planIndicator, onClick }: LocationMarkerProps) {
  const size = isSelected ? 48 : 40;
  const color = CATEGORY_COLORS[location.category] || '#64748b';

  return (
    <AdvancedMarker
      position={{ lat: location.lat, lng: location.lng }}
      onClick={onClick}
      zIndex={isSelected ? 100 : 10}
    >
      <div
        style={{
          cursor: 'pointer',
          transform: 'translateY(-50%)',
          filter: isSelected
            ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          animation: isSelected ? 'pulse 1s ease-in-out infinite' : undefined,
        }}
      >
        <svg width={size} height={size} viewBox="0 0 40 44">
          {getCategoryMarkerContent(location.category, color, planIndicator)}
        </svg>
      </div>
    </AdvancedMarker>
  );
}

// Dynamic pin marker component using React SVG
interface DynamicPinMarkerProps {
  pin: DynamicPin;
  onClick: () => void;
}

function DynamicPinMarker({ pin, onClick }: DynamicPinMarkerProps) {
  const size = 40;

  return (
    <AdvancedMarker
      position={{ lat: pin.lat, lng: pin.lng }}
      onClick={onClick}
      zIndex={50}
    >
      <div
        style={{
          cursor: 'pointer',
          transform: 'translateY(-50%)',
          filter: 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.4))',
          position: 'relative',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 40 44">
          <defs>
            <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
          <path
            d="M20 2 C10 2 4 10 4 18 C4 30 20 42 20 42 C20 42 36 30 36 18 C36 10 30 2 20 2Z"
            fill="url(#aiGradient)"
            stroke="white"
            strokeWidth="2"
          />
          <circle cx="20" cy="18" r="6" fill="white" opacity="0.4" />
          <circle cx="20" cy="18" r="3" fill="white" opacity="0.7" />
        </svg>
        {/* Sparkle badge */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '18px',
            height: '18px',
            background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
            borderRadius: '50%',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(251, 191, 36, 0.5)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
          </svg>
        </div>
      </div>
    </AdvancedMarker>
  );
}

interface GoogleFullScreenMapProps {
  locations: Location[];
  selectedLocation: Location | null;
  visibleCategories: string[];
  activePlan: 'A' | 'B';
  planRoute: Array<{ lat: number; lng: number }>;
  dynamicPins?: DynamicPin[];
  newlyAddedPins?: DynamicPin[] | null;
  planALocationIds?: string[];
  planBLocationIds?: string[];
  tripId?: Id<'trips'> | null;
  selectedPlanId?: Id<'tripPlans'> | null;
  onLocationSelect: (location: Location) => void;
  onDynamicPinSelect?: (pin: DynamicPin) => void;
  onNewPinsFocused?: () => void;
}

export function GoogleFullScreenMap({
  locations,
  selectedLocation,
  visibleCategories,
  activePlan,
  planRoute,
  dynamicPins = [],
  newlyAddedPins = null,
  planALocationIds = [],
  planBLocationIds = [],
  tripId = null,
  selectedPlanId = null,
  onLocationSelect,
  onDynamicPinSelect,
  onNewPinsFocused,
}: GoogleFullScreenMapProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_ID;

  const filteredLocations = locations.filter(loc =>
    visibleCategories.includes(loc.category)
  );

  const routeColor = activePlan === 'A' ? '#10B981' : '#6366F1';
  const routeDashArray = activePlan === 'B' ? '10, 10' : undefined;

  // Track map bounds for POI loading
  const [mapBounds, setMapBounds] = useState<POIMapBounds>({
    north: 6.5,
    south: 1.0,
    east: 120.0,
    west: 99.0,
  });

  const handleBoundsChange = useCallback((bounds: POIMapBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleCameraChanged = useCallback((ev: MapCameraChangedEvent) => {
    const bounds = ev.map.getBounds();
    if (bounds) {
      setMapBounds({
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng(),
      });
    }
  }, []);

  // Warn if mapId is missing (required for AdvancedMarkers)
  useEffect(() => {
    if (!mapId && import.meta.env.DEV) {
      console.warn(
        '[GoogleFullScreenMap] VITE_GOOGLE_MAPS_ID is not set. ' +
        'Custom markers require a Map ID. See: https://console.cloud.google.com/google/maps-apis/studio/maps'
      );
    }
  }, [mapId]);

  return (
    <div className="fixed inset-0 z-0">
      <style>{MARKER_ANIMATION_STYLES}</style>

      <Map
        defaultCenter={{ lat: 3.1089, lng: 101.7279 }}
        defaultZoom={13}
        mapId={mapId}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={true}
        mapTypeControlOptions={{
          position: google.maps.ControlPosition?.TOP_RIGHT,
          style: google.maps.MapTypeControlStyle?.DROPDOWN_MENU,
        }}
        fullscreenControl={false}
        streetViewControl={false}
        style={{ width: '100%', height: '100%' }}
        onCameraChanged={handleCameraChanged}
      >
        {/* Map Controllers */}
        <MapController selectedLocation={selectedLocation} />
        <MapBoundsController planRoute={planRoute} selectedLocation={selectedLocation} />
        <MapBoundsTracker onBoundsChange={handleBoundsChange} />

        {newlyAddedPins && newlyAddedPins.length > 0 && onDynamicPinSelect && onNewPinsFocused && (
          <DynamicPinBoundsController
            newlyAddedPins={newlyAddedPins}
            onFirstPinSelect={onDynamicPinSelect}
            onPinsFocused={onNewPinsFocused}
          />
        )}

        {/* Real Road Routing Layer */}
        <GoogleRoutingLayer
          waypoints={planRoute}
          color={routeColor}
          dashArray={routeDashArray}
          weight={4}
          opacity={0.8}
          enabled={planRoute.length > 1}
        />

        {/* Day-by-Day Route Visualization */}
        <GoogleDayRouteLayer
          tripId={tripId}
          planId={selectedPlanId}
          activePlan={activePlan}
        />

        {/* POI Layer */}
        <GooglePOILayer bounds={mapBounds} visible={true} />

        {/* Location Markers */}
        {filteredLocations.map(location => {
          const isSelected = selectedLocation?.id === location.id;
          const inPlanA = planALocationIds.includes(location.id);
          const inPlanB = planBLocationIds.includes(location.id);

          let planIndicator: PlanIndicator = null;
          if (inPlanA && inPlanB) {
            planIndicator = 'both';
          } else if (inPlanA) {
            planIndicator = 'A';
          } else if (inPlanB) {
            planIndicator = 'B';
          }

          return (
            <LocationMarker
              key={location.id}
              location={location}
              isSelected={isSelected}
              planIndicator={planIndicator}
              onClick={() => onLocationSelect(location)}
            />
          );
        })}

        {/* Dynamic AI-Suggested Pins */}
        {dynamicPins.map(pin => (
          <DynamicPinMarker
            key={pin.id}
            pin={pin}
            onClick={() => onDynamicPinSelect?.(pin)}
          />
        ))}
      </Map>
    </div>
  );
}
