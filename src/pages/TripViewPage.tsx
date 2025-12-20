import { useQuery, useMutation } from 'convex/react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { MapPin, Navigation } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

import { api } from '../../convex/_generated/api';
import { openPanelAtom } from '../atoms/floatingPanelAtoms';
import { statusAtom, startOnboardingAtom } from '../atoms/onboardingAtoms';
import { travelModeAtom, commutesPanelOpenAtom, activeCommuteDestinationAtom, selectedDayIdAtom, focusedActivityAtom } from '../atoms/uiAtoms';
import { TripPlannerPanel, ChecklistFloatingPanel, FiltersPanel, CollaborationPanel, WeatherFloatingPanel, SettingsPanel } from '../components/floating';
import { homeBaseAtom } from '../components/Floating/SettingsPanel';
import { AIChatWidget } from '../components/Layout/AIChatWidget';
import { FloatingHeader } from '../components/Layout/FloatingHeader';
import { MobileNavBar } from '../components/Layout/MobileNavBar';
import { NavigationDock } from '../components/Layout/NavigationDock';
import { RightDetailPanel } from '../components/Layout/RightDetailPanel';
import { GoogleFullScreenMap } from '../components/Map/GoogleFullScreenMap';
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay';
import { ActivityDetailPanel } from '../components/trips/ActivityDetailPanel';
import { AddActivityModal } from '../components/trips/AddActivityModal';
import { CommutesPanel } from '../components/trips/CommutesPanel';
import { EditActivityModal } from '../components/trips/EditActivityModal';
import { EditTripModal } from '../components/trips/EditTripModal';
import { ImportItineraryModal } from '../components/trips/ImportItineraryModal';
import { FAB } from '../components/ui/FAB';
import { WeatherIndicator } from '../components/weather';
import { useCommutes } from '../hooks/useCommutes';

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

  // Get configured home base
  const homeBase = useAtomValue(homeBaseAtom);

  // Commutes panel state
  const [travelMode, setTravelMode] = useAtom(travelModeAtom);
  const [commutesPanelOpen, setCommutesPanelOpen] = useAtom(commutesPanelOpenAtom);
  const [activeCommuteDestination, setActiveCommuteDestination] = useAtom(activeCommuteDestinationAtom);
  const [selectedDayId] = useAtom(selectedDayIdAtom);

  // Map sync state
  const setFocusedActivity = useSetAtom(focusedActivityAtom);

  // Mutations
  const deleteScheduleItem = useMutation(api.tripScheduleItems.deleteScheduleItem);

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

  // Transform tripLocations to Location format for map (MUST be before early returns)
  const mapLocations: Location[] = useMemo(() =>
    tripLocations?.map((loc) => ({
      id: loc._id,
      name: loc.customName || loc.baseLocation?.name || 'Unknown Location',
      lat: loc.customLat || loc.baseLocation?.lat || 0,
      lng: loc.customLng || loc.baseLocation?.lng || 0,
      category: (loc.customCategory || loc.baseLocation?.category || 'attraction') as any,
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
    })) || [], [tripLocations]);

  // Get all categories for filtering (MUST be before early returns)
  const visibleCategories = useMemo(() =>
    Array.from(new Set(mapLocations.map((loc) => loc.category))),
    [mapLocations]
  );

  // Compute commute destinations from scheduled items for the selected day (MUST be before early returns)
  const commuteDestinations = useMemo(() => {
    if (!scheduleItems || !tripLocations) {return [];}

    // Filter by selected day if there is one
    const dayItems = selectedDayId
      ? scheduleItems.filter((item) => item.dayDate === selectedDayId)
      : scheduleItems;

    // Sort by order/time
    const sortedItems = [...dayItems].sort((a, b) => {
      if (a.order !== b.order) {return a.order - b.order;}
      return a.startTime.localeCompare(b.startTime);
    });

    // Map to destination format
    return sortedItems
      .filter((item) => item.locationId)
      .map((item) => {
        const loc = tripLocations.find((l) => l._id === item.locationId);
        if (!loc) {return null;}

        return {
          id: item._id,
          name: loc.customName || loc.baseLocation?.name || item.title,
          lat: loc.customLat || loc.baseLocation?.lat || 0,
          lng: loc.customLng || loc.baseLocation?.lng || 0,
          category: loc.customCategory || loc.baseLocation?.category,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null && d.lat !== 0);
  }, [scheduleItems, tripLocations, selectedDayId]);

  // Get origin point (first location or home base) (MUST be before early returns)
  const commuteOrigin = useMemo(() => {
    // Use first scheduled location as origin, or trip's first location
    if (commuteDestinations.length > 0) {
      const firstDest = commuteDestinations[0];
      return {
        lat: firstDest.lat,
        lng: firstDest.lng,
        name: firstDest.name,
      };
    }
    // Fallback to first trip location
    if (mapLocations.length > 0) {
      const homeBase = mapLocations.find((loc) => loc.category === 'home-base');
      if (homeBase) {
        return { lat: homeBase.lat, lng: homeBase.lng, name: homeBase.name };
      }
      return { lat: mapLocations[0].lat, lng: mapLocations[0].lng, name: mapLocations[0].name };
    }
    return null;
  }, [commuteDestinations, mapLocations]);

  // Destinations for commute (excluding origin) (MUST be before early returns)
  const commuteDestinationsWithoutOrigin = useMemo(() => {
    if (commuteDestinations.length <= 1) {return [];}
    return commuteDestinations.slice(1);
  }, [commuteDestinations]);

  // Build route for current plan - starting from configurable home base (MUST be before early returns)
  const planRoute = useMemo(() => {
    if (!scheduleItems || !tripLocations) {return [];}

    // Filter by selected day if there is one
    const dayItems = selectedDayId
      ? scheduleItems.filter((item) => item.dayDate === selectedDayId)
      : scheduleItems;

    // Sort by order/time
    const sortedItems = [...dayItems].sort((a, b) => {
      if (a.order !== b.order) {return a.order - b.order;}
      return a.startTime.localeCompare(b.startTime);
    });

    // Use configured home base from settings
    const homePoint = {
      lat: homeBase.lat,
      lng: homeBase.lng,
    };

    // Start from home base
    const routePoints: { lat: number; lng: number }[] = [homePoint];

    // Add all scheduled locations (filter out nap times and items without locations)
    sortedItems
      .filter((item) => item.locationId && !item.title.toLowerCase().includes('nap'))
      .forEach((item) => {
        const location = tripLocations.find((l) => l._id === item.locationId);
        if (location) {
          routePoints.push({
            lat: location.customLat || location.baseLocation?.lat || 0,
            lng: location.customLng || location.baseLocation?.lng || 0,
          });
        }
      });

    // Return to home base at the end (only if we have intermediate points)
    if (routePoints.length > 1) {
      routePoints.push(homePoint);
    }

    return routePoints;
  }, [scheduleItems, tripLocations, selectedDayId, homeBase]);

  // Fetch commute data with Google Directions API (MUST be before early returns)
  const { commutes, isLoading: isCommutesLoading } = useCommutes({
    origin: commuteOrigin,
    destinations: commuteDestinationsWithoutOrigin.map((d, index) => ({
      ...d,
      label: String.fromCharCode(65 + index), // A, B, C, etc.
    })),
    travelMode,
    enabled: commutesPanelOpen && commuteDestinationsWithoutOrigin.length > 0,
  });

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
  const currentDay = tripData ? Math.floor((Date.now() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
  const totalDays = tripData ? Math.floor((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;

  // Get user's role from members (needed for ActivityDetailPanel)
  const currentMember = members.find((m) => m.status === 'accepted');
  const userRole = currentMember?.role || 'viewer';

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 font-['DM_Sans']">
      {/* Full Screen Map Background */}
      <GoogleFullScreenMap
        locations={mapLocations}
        selectedLocation={selectedLocation}
        visibleCategories={visibleCategories}
        activePlan={activePlan}
        planRoute={planRoute}
        tripId={tripId}
        selectedPlanId={selectedPlanId}
        commutes={commutes}
        activeCommuteDestinationId={commutesPanelOpen ? activeCommuteDestination : null}
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
      <SettingsPanel />

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
            origin={commuteOrigin}
            destinations={commuteDestinationsWithoutOrigin}
            travelMode={travelMode}
            onTravelModeChange={setTravelMode}
            onActiveDestinationChange={setActiveCommuteDestination}
            commutes={commutes}
            isLoading={isCommutesLoading}
          />
        </div>
      )}

      {/* Mobile Navigation Bar */}
      <MobileNavBar />

      {/* Floating Action Button - mobile only */}
      <FAB />

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
    </div>
  );
}
