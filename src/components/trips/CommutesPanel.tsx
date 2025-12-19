import { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bus, Bike, PersonStanding, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { TravelMode, Destination, CommuteResult } from '../../hooks/useCommutes';

interface CommutesPanelProps {
  origin: { lat: number; lng: number; name?: string } | null;
  destinations: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    category?: string;
  }>;
  travelMode: TravelMode;
  onTravelModeChange: (mode: TravelMode) => void;
  onActiveDestinationChange?: (destId: string | null) => void;
  commutes: Map<string, CommuteResult>;
  isLoading: boolean;
  className?: string;
}

const TRAVEL_MODES: { mode: TravelMode; icon: typeof Car; label: string }[] = [
  { mode: 'DRIVING', icon: Car, label: 'Drive' },
  { mode: 'TRANSIT', icon: Bus, label: 'Transit' },
  { mode: 'BICYCLING', icon: Bike, label: 'Bike' },
  { mode: 'WALKING', icon: PersonStanding, label: 'Walk' },
];

// Generate labels A-Z
function getDestinationLabel(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

// Category colors for card accents
const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#F59E0B',
  attraction: '#10B981',
  shopping: '#8B5CF6',
  nature: '#22C55E',
  temple: '#EF4444',
  hotel: '#3B82F6',
  transport: '#64748B',
  medical: '#DC2626',
  playground: '#06B6D4',
  'home-base': '#EC4899',
  'toddler-friendly': '#F472B6',
};

export function CommutesPanel({
  origin,
  destinations,
  travelMode,
  onTravelModeChange,
  onActiveDestinationChange,
  commutes,
  isLoading,
  className = '',
}: CommutesPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);

  // Convert to Destination format with labels
  const labeledDestinations: Destination[] = useMemo(() => {
    return destinations.map((d, index) => ({
      id: d.id,
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      label: getDestinationLabel(index),
    }));
  }, [destinations]);

  // Set first destination as active by default
  useEffect(() => {
    if (destinations.length > 0 && !activeDestinationId) {
      setActiveDestinationId(destinations[0].id);
    }
  }, [destinations, activeDestinationId]);

  // Notify parent of active destination changes
  useEffect(() => {
    onActiveDestinationChange?.(activeDestinationId);
  }, [activeDestinationId, onActiveDestinationChange]);

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (!origin || destinations.length === 0) {
    return null;
  }

  return (
    <GlassPanel className={`p-0 overflow-hidden ${className}`}>
      {/* Header with travel mode selector */}
      <div className="px-4 py-3 border-b border-slate-200/50 bg-white/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sunset-600" />
            <span className="text-sm font-medium text-slate-900">
              From: {origin.name || 'Current Location'}
            </span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-3 h-3 border-2 border-sunset-500 border-t-transparent rounded-full animate-spin" />
              Calculating...
            </div>
          )}
        </div>

        {/* Travel Mode Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {TRAVEL_MODES.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onTravelModeChange(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2 ${
                travelMode === mode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              aria-pressed={travelMode === mode}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Destination Cards - Horizontal Scroll */}
      <div className="relative">
        {/* Scroll buttons */}
        {destinations.length > 3 && (
          <>
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 shadow-md rounded-full text-slate-600 hover:text-slate-900 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 shadow-md rounded-full text-slate-600 hover:text-slate-900 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 p-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <AnimatePresence mode="popLayout">
            {labeledDestinations.map((dest, index) => {
              const commute = commutes.get(dest.id);
              const isActive = activeDestinationId === dest.id;
              const originalDest = destinations[index];
              const accentColor = CATEGORY_COLORS[originalDest.category || ''] || '#64748B';

              return (
                <motion.button
                  key={dest.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setActiveDestinationId(dest.id)}
                  className={`flex-shrink-0 w-40 p-3 rounded-xl text-left transition-all focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2 ${
                    isActive
                      ? 'bg-ocean-50 border-2 border-ocean-400 shadow-lg shadow-ocean-500/20'
                      : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                  aria-pressed={isActive}
                >
                  {/* Label badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      {dest.label}
                    </div>
                    {isActive && (
                      <div className="px-2 py-0.5 bg-ocean-500 text-white text-xs rounded-full">
                        Active
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h4 className="text-sm font-medium text-slate-900 truncate mb-2">
                    {dest.name}
                  </h4>

                  {/* Commute info */}
                  {commute ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <span className="text-sm font-semibold">
                          {commute.durationText}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {commute.distanceText}
                      </div>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading...</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      No route data
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Total summary */}
      {commutes.size > 0 && (
        <div className="px-4 py-3 border-t border-slate-200/50 bg-slate-50/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
            </span>
            <TotalCommuteSummary commutes={commutes} />
          </div>
        </div>
      )}
    </GlassPanel>
  );
}

// Helper component for total commute summary
function TotalCommuteSummary({ commutes }: { commutes: Map<string, CommuteResult> }) {
  const totals = useMemo(() => {
    let totalDuration = 0;
    let totalDistance = 0;

    commutes.forEach((c) => {
      totalDuration += c.duration;
      totalDistance += c.distance;
    });

    // Format duration
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Format distance
    const km = totalDistance / 1000;
    const distanceText = km >= 1 ? `${km.toFixed(1)} km` : `${totalDistance} m`;

    return { durationText, distanceText };
  }, [commutes]);

  return (
    <div className="flex items-center gap-3 text-slate-700">
      <span className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        <span className="font-medium">{totals.durationText}</span>
        <span className="text-slate-400">total</span>
      </span>
      <span className="text-slate-300">|</span>
      <span className="font-medium">{totals.distanceText}</span>
    </div>
  );
}
