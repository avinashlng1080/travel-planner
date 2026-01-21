import { useQuery, useMutation } from 'convex/react';
import { useAtom, useSetAtom } from 'jotai';
import { MapPin, Navigation } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { api } from '../../convex/_generated/api';
import { openPanelAtom } from '../atoms/floatingPanelAtoms';
import { statusAtom, startOnboardingAtom } from '../atoms/onboardingAtoms';
import {
  focusedActivityAtom,
  addDestinationModalOpenAtom,
  editDestinationModalOpenAtom,
  editingDestinationIdAtom,
  deleteDestinationDialogOpenAtom,
  deletingDestinationIdAtom,
  travelModeAtom,
  commutesPanelOpenAtom,
  activeCommuteDestinationAtom,
} from '../atoms/uiAtoms';
import { TripPlannerPanel, ChecklistFloatingPanel, FiltersPanel, CollaborationPanel, WeatherFloatingPanel } from '../components/floating';
import { AIChatWidget } from '../components/Layout/AIChatWidget';
import { FloatingHeader } from '../components/Layout/FloatingHeader';
import { MobileChatSheet } from '../components/Layout/MobileChatSheet';
import { MobileMoreMenu } from '../components/Layout/MobileMoreMenu';
import { MobileNavBar } from '../components/Layout/MobileNavBar';
import { NavigationDock } from '../components/Layout/NavigationDock';
import { RightDetailPanel } from '../components/Layout/RightDetailPanel';
import { AddPlaceFAB } from '../components/Map/AddPlaceFAB';
import { GoogleFullScreenMap } from '../components/Map/GoogleFullScreenMap';
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay';
import { ActivityDetailPanel } from '../components/trips/ActivityDetailPanel';
import { AddActivityModal } from '../components/trips/AddActivityModal';
import AddDestinationModal from '../components/trips/AddDestinationModal';
import CommutesPanel from '../components/trips/CommutesPanel';
import DeleteDestinationDialog from '../components/trips/DeleteDestinationDialog';
import { EditActivityModal } from '../components/trips/EditActivityModal';
import EditDestinationModal from '../components/trips/EditDestinationModal';
import { EditTripModal } from '../components/trips/EditTripModal';
import { ImportItineraryModal } from '../components/trips/ImportItineraryModal';
import { FAB } from '../components/ui/FAB';
import { WeatherIndicator } from '../components/weather';
import { useCommutes, type CommuteDestination } from '../hooks/useCommutes';



import type { Id } from '../../convex/_generated/dataModel';
import type { Location } from '../data/tripData';

interface TripViewPageProps {
  tripId: Id<'trips'>;
  onBack: () => void;
}

export function TripViewPage({ tripId, onBack }: TripViewPageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<Id<'tripPlans'> | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<Id<'tripScheduleItems'> | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialText, setImportInitialText] = useState('');
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState(false);
  const [hasOpenedPanel, setHasOpenedPanel] = useState(false);
  const [activePlan, setActivePlan] = useState<'A' | 'B'>('A');

  // Onboarding state
  const [onboardingStatus] = useAtom(statusAtom);
  const startOnboarding = useSetAtom(startOnboardingAtom);

  // Floating panel state
  const openPanel = useSetAtom(openPanelAtom);

  // Commutes panel state
  const [travelMode, setTravelMode] = useAtom(travelModeAtom);
  const [commutesPanelOpen, setCommutesPanelOpen] = useAtom(commutesPanelOpenAtom);
  const [activeCommuteDestination, setActiveCommuteDestination] = useAtom(activeCommuteDestinationAtom);

  // Map sync state
  const setFocusedActivity = useSetAtom(focusedActivityAtom);

  // Commute destination modal state
  const [addDestinationModalOpen, setAddDestinationModalOpen] = useAtom(addDestinationModalOpenAtom);
  const [editDestinationModalOpen, setEditDestinationModalOpen] = useAtom(editDestinationModalOpenAtom);
  const [editingDestinationId, setEditingDestinationId] = useAtom(editingDestinationIdAtom);
  const [deleteDestinationDialogOpen, setDeleteDestinationDialogOpen] = useAtom(deleteDestinationDialogOpenAtom);
  const [deletingDestinationId, setDeletingDestinationId] = useAtom(deletingDestinationIdAtom);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Place instruction state
  const [showAddPlaceInstruction, setShowAddPlaceInstruction] = useState(false);
  const addPlaceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (addPlaceTimerRef.current) {
        clearTimeout(addPlaceTimerRef.current);
      }
    };
  }, []);

  // Handler for showing Add Place instruction (with proper cleanup)
  const handleShowAddPlaceInstruction = useCallback(() => {
    // Clear existing timer
    if (addPlaceTimerRef.current) {
      clearTimeout(addPlaceTimerRef.current);
    }

    setShowAddPlaceInstruction(true);
    addPlaceTimerRef.current = setTimeout(() => {
      setShowAddPlaceInstruction(false);
      addPlaceTimerRef.current = null;
    }, 5000);
  }, []);

  // Mutations
  const deleteScheduleItem = useMutation(api.tripScheduleItems.deleteScheduleItem);
  const deleteDestination = useMutation(api.commuteDestinations.deleteDestination);

  // Fetch trip details with members and plans
  const tripData = useQuery(api.trips.getTripWithDetails, { tripId });

  // Fetch trip locations for map view
  const tripLocations = useQuery(api.tripLocations.getLocations, { tripId });

  // Fetch schedule items for selected plan
  const scheduleItems = useQuery(
    api.tripScheduleItems.getScheduleItems,
    selectedPlanId ? { planId: selectedPlanId } : 'skip'
  );

  // Fetch selected activity details
  const selectedActivity = selectedActivityId
    ? scheduleItems?.find((item) => item._id === selectedActivityId)
    : null;

  // Find location for selected activity from already-fetched locations
  const activityLocation = selectedActivity?.locationId
    ? tripLocations?.find((loc) => loc._id === selectedActivity.locationId)
    : null;

  // Fetch commute destinations for the trip
  const commuteDestinations = useQuery(api.commuteDestinations.getDestinations, { tripId });

  // Get the destination being edited
  const editingDestination = editingDestinationId && commuteDestinations
    ? commuteDestinations.find((dest) => dest._id === editingDestinationId)
    : null;

  // Get the destination being deleted
  const deletingDestination = deletingDestinationId && commuteDestinations
    ? commuteDestinations.find((dest) => dest._id === deletingDestinationId)
    : null;

  // Trigger onboarding when trip data loads for the first time
  useEffect(() => {
    if (tripData && onboardingStatus === 'pending') {
      // Small delay to let the UI settle before starting the animation
      const timer = setTimeout(() => {
        startOnboarding();
      }, 500);
      return () => { clearTimeout(timer); };
    }
  }, [tripData, onboardingStatus, startOnboarding]);

  // Auto-open TripPlannerPanel when trip loads (PostHog-style UX)
  useEffect(() => {
    if (tripData && !hasOpenedPanel) {
      const timer = setTimeout(() => {
        openPanel('tripPlanner');
        setHasOpenedPanel(true);
      }, 800); // Open after onboarding animation
      return () => { clearTimeout(timer); };
    }
  }, [tripData, hasOpenedPanel, openPanel]);

  // Auto-select first plan when data loads
  useEffect(() => {
    if (tripData?.plans && tripData.plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(tripData.plans[0]._id);
    }
  }, [tripData, selectedPlanId]);

  // Transform tripLocations to Location format for map (must be before early returns - hooks rule)
  const mapLocations: Location[] = useMemo(() => {
    if (!tripLocations) {return [];}
    return tripLocations.map((loc) => ({
      id: loc._id,
      name: loc.customName || loc.baseLocation?.name || 'Unknown Location',
      lat: loc.customLat || loc.baseLocation?.lat || 0,
      lng: loc.customLng || loc.baseLocation?.lng || 0,
      category: (loc.customCategory || loc.baseLocation?.category || 'attraction') as Location['category'],
      description: loc.customDescription || loc.baseLocation?.description || '',
      city: loc.baseLocation?.city || 'Malaysia',
      toddlerRating: loc.baseLocation?.toddlerRating || 3,
      isIndoor: loc.baseLocation?.isIndoor || false,
      bestTimeToVisit: loc.baseLocation?.bestTimeToVisit || [],
      estimatedDuration: loc.baseLocation?.estimatedDuration || 'Varies',
      grabEstimate: loc.baseLocation?.grabEstimate || 'Check Grab app',
      distanceFromBase: loc.baseLocation?.distanceFromBase || 'N/A',
      drivingTime: loc.baseLocation?.drivingTime || 'N/A',
      warnings: loc.baseLocation?.warnings || [],
      tips: loc.baseLocation?.tips || [],
      whatToBring: loc.baseLocation?.whatToBring || [],
      whatNotToBring: loc.baseLocation?.whatNotToBring || [],
      bookingRequired: loc.baseLocation?.bookingRequired || false,
      openingHours: loc.baseLocation?.openingHours || 'Check locally',
      planIds: [],
      address: loc.baseLocation?.address,
      entranceFee: loc.baseLocation?.entranceFee,
      dressCode: loc.baseLocation?.dressCode,
    }));
  }, [tripLocations]);

  // Get all categories for filtering
  const visibleCategories = useMemo(() => {
    return Array.from(new Set(mapLocations.map((loc) => loc.category)));
  }, [mapLocations]);

  // Derive commute origin from trip data (use first location with 'home-base' category or first location)
  const commuteOrigin = useMemo(() => {
    const homeBase = mapLocations.find((loc) => loc.category === 'home-base');
    if (homeBase) {
      return { lat: homeBase.lat, lng: homeBase.lng };
    }
    // Fallback to first location or trip coordinates if available
    if (mapLocations.length > 0) {
      return { lat: mapLocations[0].lat, lng: mapLocations[0].lng };
    }
    // Default fallback (Kuala Lumpur city center)
    return { lat: 3.1390, lng: 101.6869 };
  }, [mapLocations]);

  // Filter out origin location from commute destinations to avoid showing "0 mins" commute to self
  const commuteDestinationsWithoutOrigin = useMemo(() => {
    if (!commuteDestinations) {return [];}
    // Remove any destination that's the same as origin (within small tolerance)
    return commuteDestinations.filter((dest) => {
      const latDiff = Math.abs(dest.lat - commuteOrigin.lat);
      const lngDiff = Math.abs(dest.lng - commuteOrigin.lng);
      return latDiff > 0.0001 || lngDiff > 0.0001; // ~10 meters tolerance
    });
  }, [commuteDestinations, commuteOrigin]);

  // Transform Convex destinations to CommuteDestination format for useCommutes hook
  const commuteDestinationsForHook: CommuteDestination[] = useMemo(() => {
    return commuteDestinationsWithoutOrigin.map((dest) => ({
      id: dest._id,
      name: dest.name,
      lat: dest.lat,
      lng: dest.lng,
      address: dest.address,
      category: dest.category,
    }));
  }, [commuteDestinationsWithoutOrigin]);

  // Calculate commute times for map display
  const { results: commuteResults } = useCommutes({
    origin: commuteOrigin,
    destinations: commuteDestinationsForHook,
    travelMode,
    enabled: commutesPanelOpen && commuteDestinationsForHook.length > 0,
  });

  // Loading state
  if (tripData === undefined) {
    return (
      <div className="h-screen overflow-hidden bg-white font-['DM_Sans'] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  // Error state - trip not found
  if (!tripData) {
    return (
      <div className="h-screen overflow-hidden bg-white font-['DM_Sans'] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Trip Not Found</h2>
          <p className="text-slate-600 mb-6">
            This trip doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  const { trip, members } = tripData;

  // Calculate current day and total days for FloatingHeader
  const currentDay = Math.floor((Date.now() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Get user's role from members (needed for ActivityDetailPanel)
  const currentMember = members.find((m) => m.status === 'accepted');
  const userRole = currentMember?.role || 'viewer';

  // Handler for deleting a destination
  const handleDeleteDestination = async () => {
    if (!deletingDestinationId) {return;}

    setIsDeleting(true);
    try {
      await deleteDestination({ destinationId: deletingDestinationId as Id<'commuteDestinations'> });
      // Close dialog and reset state
      setDeleteDestinationDialogOpen(false);
      setDeletingDestinationId(null);
    } catch (error) {
      console.error('Failed to delete destination:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 font-['DM_Sans']">
      {/* Full Screen Map Background */}
      <GoogleFullScreenMap
        locations={mapLocations}
        selectedLocation={selectedLocation}
        visibleCategories={visibleCategories}
        activePlan={activePlan}
        planRoute={[]}
        tripId={tripId}
        selectedPlanId={selectedPlanId}
        commutes={commuteResults}
        activeCommuteDestinationId={commutesPanelOpen ? activeCommuteDestination : null}
        defaultCenter={trip.homeBase ? { lat: trip.homeBase.lat, lng: trip.homeBase.lng } : undefined}
        onLocationSelect={(location) => { setSelectedLocation(location); }}
      />

      {/* Floating Header */}
      <FloatingHeader
        currentDay={currentDay}
        totalDays={totalDays}
        activePlan={activePlan}
        onPlanChange={setActivePlan}
        tripName={trip.name}
        onBack={onBack}
      />

      {/* Navigation Dock */}
      <NavigationDock
        onImportClick={() => { setIsImportModalOpen(true); }}
      />

      {/* Floating Panels */}
      <ChecklistFloatingPanel />
      <FiltersPanel />
      <CollaborationPanel
        tripId={tripId}
        tripName={trip.name}
        userRole={userRole}
      />
      <TripPlannerPanel
        tripId={tripId}
        selectedPlanId={selectedPlanId}
        onActivityClick={(activityId) => {
          setSelectedActivityId(activityId as Id<'tripScheduleItems'>);
          // Find activity and sync map to its location
          const activity = scheduleItems?.find(item => item._id === activityId);
          if (activity?.locationId) {
            const location = tripLocations?.find(loc => loc._id === activity.locationId);
            if (location) {
              setFocusedActivity({
                activityId,
                locationId: activity.locationId as string,
                lat: location.customLat || location.baseLocation?.lat || 0,
                lng: location.customLng || location.baseLocation?.lng || 0,
              });
            }
          }
        }}
      />
      <WeatherFloatingPanel />

      {/* Weather Indicator - floating badge on map */}
      <WeatherIndicator />

      {/* Right Detail Panel - shows when a location is clicked */}
      {selectedLocation && (
        <RightDetailPanel
          location={selectedLocation}
          days={[]}
          selectedDayId={null}
          onClose={() => { setSelectedLocation(null); }}
          onAddToPlan={(plan, details) => {
            console.log(`Add ${selectedLocation.name} to Plan ${plan}`, details);
            // TODO: Persist to database/state
            setSelectedLocation(null);
          }}
        />
      )}

      {/* AI Chat Widget */}
      <AIChatWidget
        tripId={tripId}
        onOpenImport={(initialText) => {
          setImportInitialText(initialText);
          setIsImportModalOpen(true);
        }}
      />

      {/* Commutes Panel Toggle Button */}
      {commuteDestinationsWithoutOrigin.length > 0 && (
        <button
          onClick={() => { setCommutesPanelOpen(!commutesPanelOpen); }}
          className={`fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2 ${
            commutesPanelOpen
              ? 'bg-ocean-600 text-white hover:bg-ocean-700'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
          aria-label={commutesPanelOpen ? 'Hide commute times' : 'Show commute times'}
          aria-expanded={commutesPanelOpen}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-sm font-medium">
            {commutesPanelOpen ? 'Hide Commutes' : `${commuteDestinationsWithoutOrigin.length} Destinations`}
          </span>
        </button>
      )}

      {/* Commutes Panel */}
      {commutesPanelOpen && commuteDestinationsWithoutOrigin.length > 0 && (
        <div className="fixed bottom-32 sm:bottom-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[600px] max-w-full z-30">
          <CommutesPanel
            tripId={tripId}
            origin={commuteOrigin}
            travelMode={travelMode}
            onTravelModeChange={setTravelMode}
            onActiveDestinationChange={setActiveCommuteDestination}
          />
        </div>
      )}

      {/* Mobile Navigation Bar */}
      <MobileNavBar
        onChatClick={() => openPanel('mobileChat')}
      />

      {/* Mobile More Menu */}
      <MobileMoreMenu />

      {/* Mobile Chat Sheet */}
      <MobileChatSheet tripId={tripId} />

      {/* Mobile FAB */}
      <FAB onAddPlace={handleShowAddPlaceInstruction} />

      {/* Desktop Add Place FAB */}
      <AddPlaceFAB
        onClick={handleShowAddPlaceInstruction}
        isActive={showAddPlaceInstruction}
      />

      {/* Add Place Instruction Overlay */}
      {showAddPlaceInstruction && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300"
          role="alert"
          aria-live="polite"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Click anywhere on the map</p>
              <p className="text-xs text-slate-500">to add a new location to your trip</p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Overlay - renders when onboarding is active */}
      <OnboardingOverlay />

      {/* Edit Trip Modal */}
      <EditTripModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); }}
        trip={trip}
        onSuccess={() => {
          // Trip data will refresh automatically via Convex reactivity
        }}
      />

      {/* Add Activity Modal */}
      {selectedPlanId && (
        <AddActivityModal
          isOpen={isAddActivityModalOpen}
          onClose={() => { setIsAddActivityModalOpen(false); }}
          tripId={tripId}
          planId={selectedPlanId}
          onSuccess={() => {
            // Schedule items will refresh automatically via Convex reactivity
          }}
        />
      )}

      {/* Import Itinerary Modal */}
      {selectedPlanId && (
        <ImportItineraryModal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportInitialText('');
          }}
          tripId={tripId}
          planId={selectedPlanId}
          initialText={importInitialText}
          onSuccess={() => {
            // Data will refresh automatically via Convex reactivity
            setImportInitialText('');
          }}
        />
      )}

      {/* Activity Detail Panel */}
      <ActivityDetailPanel
        isOpen={!!selectedActivityId}
        onClose={() => { setSelectedActivityId(null); }}
        activity={selectedActivity || null}
        location={
          activityLocation
            ? {
                name: activityLocation.customName || activityLocation.baseLocation?.name || 'Unknown',
                lat: activityLocation.customLat || activityLocation.baseLocation?.lat || 0,
                lng: activityLocation.customLng || activityLocation.baseLocation?.lng || 0,
                category: activityLocation.customCategory || activityLocation.baseLocation?.category,
              }
            : undefined
        }
        userRole={userRole}
        onEdit={() => {
          setIsEditActivityModalOpen(true);
        }}
        onDelete={async () => {
          if (selectedActivityId) {
            await deleteScheduleItem({ itemId: selectedActivityId });
            setSelectedActivityId(null);
          }
        }}
      />

      {/* Edit Activity Modal */}
      {selectedPlanId && selectedActivity && (
        <EditActivityModal
          isOpen={isEditActivityModalOpen}
          onClose={() => { setIsEditActivityModalOpen(false); }}
          activity={selectedActivity}
          tripId={tripId}
          planId={selectedPlanId}
          onSuccess={() => {
            // Data will refresh automatically via Convex reactivity
            setIsEditActivityModalOpen(false);
          }}
        />
      )}

      {/* Add Destination Modal */}
      <AddDestinationModal
        isOpen={addDestinationModalOpen}
        onClose={() => { setAddDestinationModalOpen(false); }}
        tripId={tripId}
        onSuccess={() => {
          // Destinations will refresh automatically via Convex reactivity
          setAddDestinationModalOpen(false);
        }}
      />

      {/* Edit Destination Modal */}
      {editingDestination && (
        <EditDestinationModal
          isOpen={editDestinationModalOpen}
          onClose={() => {
            setEditDestinationModalOpen(false);
            setEditingDestinationId(null);
          }}
          tripId={tripId}
          destination={editingDestination}
          onSuccess={() => {
            // Destinations will refresh automatically via Convex reactivity
            setEditDestinationModalOpen(false);
            setEditingDestinationId(null);
          }}
        />
      )}

      {/* Delete Destination Dialog */}
      <DeleteDestinationDialog
        isOpen={deleteDestinationDialogOpen}
        onClose={() => {
          setDeleteDestinationDialogOpen(false);
          setDeletingDestinationId(null);
        }}
        destinationName={deletingDestination?.name || 'this destination'}
        onConfirm={handleDeleteDestination}
        isDeleting={isDeleting}
      />
    </div>
  );
}
