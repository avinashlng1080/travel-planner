import { useState, useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useSetAtom } from 'jotai';
import {
  MapPin,
  Car,
  Train,
  Bike,
  PersonStanding,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { GlassPanel, GlassCard } from '../ui/GlassPanel';
import { useCommutes, TravelMode, CommuteDestination } from '@/hooks/useCommutes';
import {
  addDestinationModalOpenAtom,
  editDestinationModalOpenAtom,
  editingDestinationIdAtom,
  deleteDestinationDialogOpenAtom,
  deletingDestinationIdAtom,
} from '@/atoms/uiAtoms';

export interface CommutesPanelProps {
  tripId: Id<'trips'>;
  origin: { lat: number; lng: number };
  travelMode: TravelMode;
  onTravelModeChange: (mode: TravelMode) => void;
  onActiveDestinationChange?: (destinationId: string | null) => void;
}

const TRAVEL_MODES: Array<{
  mode: TravelMode;
  icon: typeof Car;
  label: string;
  color: string;
}> = [
  { mode: 'DRIVING', icon: Car, label: 'Drive', color: 'text-blue-600' },
  { mode: 'TRANSIT', icon: Train, label: 'Transit', color: 'text-green-600' },
  { mode: 'BICYCLING', icon: Bike, label: 'Bike', color: 'text-yellow-600' },
  { mode: 'WALKING', icon: PersonStanding, label: 'Walk', color: 'text-purple-600' },
];

export default function CommutesPanel({
  tripId,
  origin,
  travelMode,
  onTravelModeChange,
  onActiveDestinationChange,
}: CommutesPanelProps) {
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);
  const [hoveredDestinationId, setHoveredDestinationId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Jotai atoms for modal state
  const setAddModalOpen = useSetAtom(addDestinationModalOpenAtom);
  const setEditModalOpen = useSetAtom(editDestinationModalOpenAtom);
  const setEditingDestinationId = useSetAtom(editingDestinationIdAtom);
  const setDeleteDialogOpen = useSetAtom(deleteDestinationDialogOpenAtom);
  const setDeletingDestinationId = useSetAtom(deletingDestinationIdAtom);

  // Fetch destinations from Convex
  const convexDestinations = useQuery(api.commuteDestinations.getDestinations, { tripId });

  // Convert Convex destinations to format expected by useCommutes
  const destinations: CommuteDestination[] = (convexDestinations || []).map(dest => ({
    id: dest._id,
    name: dest.name,
    lat: dest.lat,
    lng: dest.lng,
    address: dest.address,
    category: dest.category,
  }));

  // Calculate commute times
  const { results, isLoading: _isLoading, totalDuration, totalDurationMinutes } = useCommutes({
    origin,
    destinations,
    travelMode,
    enabled: destinations.length > 0,
  });

  // Update scroll button visibility
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [destinations]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  // Scroll left/right
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Handle destination click
  const handleDestinationClick = (destinationId: string) => {
    const newActiveId = activeDestinationId === destinationId ? null : destinationId;
    setActiveDestinationId(newActiveId);
    onActiveDestinationChange?.(newActiveId);
  };

  // Handle edit
  const handleEdit = (destinationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDestinationId(destinationId);
    setEditModalOpen(true);
    setOpenMenuId(null);
  };

  // Handle delete
  const handleDelete = (destinationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDestinationId(destinationId);
    setDeleteDialogOpen(true);
    setOpenMenuId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <GlassPanel className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Commute Times</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Calculate travel times from your home base
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="p-2 rounded-lg bg-gradient-to-r from-sunset-500 to-ocean-600 text-white hover:opacity-90 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Add destination"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Travel Mode Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {TRAVEL_MODES.map(({ mode, icon: Icon, label, color }) => {
          const isActive = travelMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onTravelModeChange(mode)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 min-h-[60px]
                ${isActive
                  ? 'bg-sunset-50 border-sunset-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
              aria-label={`${label} mode`}
              aria-pressed={isActive}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-sunset-600' : color}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-sunset-700' : 'text-slate-600'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Destinations List */}
      {destinations.length === 0 ? (
        /* Zero State */
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-base font-semibold text-slate-900 mb-2">No destinations yet</h4>
          <p className="text-sm text-slate-600 mb-6">
            Add your first commute destination to see travel times
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-sunset-500 to-ocean-600 text-white font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
          >
            Add Destination
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg hover:bg-slate-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
          )}

          {/* Right Scroll Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg hover:bg-slate-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {destinations.map(dest => {
              const result = results.get(dest.id);
              const isActive = activeDestinationId === dest.id;
              const isHovered = hoveredDestinationId === dest.id;
              const menuOpen = openMenuId === dest.id;

              return (
                <div
                  key={dest.id}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => setHoveredDestinationId(dest.id)}
                  onMouseLeave={() => setHoveredDestinationId(null)}
                >
                  <GlassCard
                    className={`
                      w-64 p-4 relative
                      ${isActive ? 'ring-2 ring-sunset-500 border-sunset-500' : ''}
                    `}
                    onClick={() => handleDestinationClick(dest.id)}
                    hover={true}
                  >
                    {/* Kebab Menu */}
                    {(isHovered || menuOpen) && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(menuOpen ? null : dest.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                          <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-20 min-w-[140px]">
                            <button
                              onClick={(e) => handleEdit(dest.id, e)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 min-h-[40px]"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDelete(dest.id, e)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 min-h-[40px]"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Destination Info */}
                    <div className="pr-8">
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-sunset-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">
                            {dest.name}
                          </h4>
                          {dest.address && (
                            <p className="text-xs text-slate-500 truncate">{dest.address}</p>
                          )}
                        </div>
                      </div>

                      {/* Commute Info */}
                      {result?.isLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-sunset-500 rounded-full animate-spin" />
                          <span>Calculating...</span>
                        </div>
                      ) : result?.error ? (
                        <p className="text-xs text-red-600">{result.error}</p>
                      ) : result?.duration ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Clock className="w-4 h-4 text-ocean-600" />
                            <span>{result.duration}</span>
                          </div>
                          {result.distance && (
                            <p className="text-xs text-slate-500">{result.distance}</p>
                          )}
                        </div>
                      ) : null}

                      {/* Category Badge */}
                      {dest.category && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                            {dest.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total Summary */}
      {destinations.length > 0 && totalDuration && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Total commute time:</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-ocean-600" />
              <span className="text-lg font-bold text-slate-900">{totalDuration}</span>
            </div>
          </div>
          {totalDurationMinutes && totalDurationMinutes > 0 && (
            <p className="text-xs text-slate-500 text-right mt-1">
              {Math.round(totalDurationMinutes)} minutes total
            </p>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
