import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Users,
  Share2,
  Crown,
  Edit,
  Eye,
  MessageSquare,
  MapPin,
  Clock,
  ChevronRight,
  Plus,
  Pencil,
  Upload,
  Globe,
  Map,
  List,
} from 'lucide-react';
import { GlassPanel, GlassButton, GlassBadge } from '../components/ui/GlassPanel';
import { AIChatWidget } from '../components/Layout/AIChatWidget';
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay';
import { EditTripModal } from '../components/trips/EditTripModal';
import { AddActivityModal } from '../components/trips/AddActivityModal';
import { ImportItineraryModal } from '../components/trips/ImportItineraryModal';
import { ActivityDetailPanel } from '../components/trips/ActivityDetailPanel';
import { RightDetailPanel } from '../components/Layout/RightDetailPanel';
import { FullScreenMap } from '../components/Map/FullScreenMap';
import { useOnboardingStore } from '../stores/onboardingStore';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { getTimezoneAbbr, TIMEZONE_DISPLAY_NAMES } from '../utils/timezone';
import type { Location } from '../data/tripData';

interface TripViewPageProps {
  tripId: Id<'trips'>;
  onBack: () => void;
}

export function TripViewPage({ tripId, onBack }: TripViewPageProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<Id<'tripPlans'> | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<Id<'tripScheduleItems'> | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialText, setImportInitialText] = useState('');

  // Onboarding state
  const { status: onboardingStatus, startOnboarding } = useOnboardingStore();

  // Mutations
  const deleteScheduleItem = useMutation(api.tripScheduleItems.deleteScheduleItem);

  // Fetch trip details with members and plans
  const tripData = useQuery(api.trips.getTripWithDetails, { tripId });

  // Fetch trip locations for map view
  const tripLocations = useQuery(api.tripLocations.getLocations, { tripId });

  // Fetch selected activity details
  const selectedActivity = selectedActivityId
    ? scheduleItems?.find((item) => item._id === selectedActivityId)
    : null;

  // Fetch location for selected activity
  const activityLocation = useQuery(
    api.tripLocations.getLocation,
    selectedActivity?.locationId ? { locationId: selectedActivity.locationId } : 'skip'
  );

  // Trigger onboarding when trip data loads for the first time
  useEffect(() => {
    if (tripData && onboardingStatus === 'pending') {
      // Small delay to let the UI settle before starting the animation
      const timer = setTimeout(() => {
        startOnboarding();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tripData, onboardingStatus, startOnboarding]);

  // Fetch schedule items for selected plan
  const scheduleItems = useQuery(
    api.tripScheduleItems.getScheduleItems,
    selectedPlanId ? { planId: selectedPlanId } : 'skip'
  );

  // Auto-select first plan when data loads
  if (tripData?.plans && tripData.plans.length > 0 && !selectedPlanId) {
    setSelectedPlanId(tripData.plans[0]._id);
  }

  // Loading state
  if (tripData === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sunset-50/30 font-['DM_Sans'] flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sunset-50/30 font-['DM_Sans'] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Trip Not Found</h2>
          <p className="text-slate-600 mb-6">
            This trip doesn't exist or you don't have access to it.
          </p>
          <GlassButton variant="primary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </GlassButton>
        </div>
      </div>
    );
  }

  const { trip, plans, members } = tripData;
  const selectedPlan = plans.find((p) => p._id === selectedPlanId);

  // Transform tripLocations to Location format for map
  const mapLocations: Location[] =
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
    })) || [];

  // Get all categories for filtering
  const visibleCategories = Array.from(
    new Set(mapLocations.map((loc) => loc.category))
  );

  // Format date range
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  };

  // Get user's role from members
  const currentMember = members.find((m) => m.status === 'accepted');
  const userRole = currentMember?.role || 'viewer';

  // Get role badge details
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { icon: Crown, color: 'sunset', label: 'Owner' };
      case 'editor':
        return { icon: Edit, color: 'blue', label: 'Editor' };
      case 'commenter':
        return { icon: MessageSquare, color: 'purple', label: 'Commenter' };
      case 'viewer':
        return { icon: Eye, color: 'slate', label: 'Viewer' };
      default:
        return { icon: Eye, color: 'slate', label: 'Viewer' };
    }
  };

  const roleBadge = getRoleBadge(userRole);
  const RoleIcon = roleBadge.icon;

  // Group schedule items by date
  const scheduleByDate =
    scheduleItems?.reduce(
      (acc, item) => {
        if (!acc[item.dayDate]) {
          acc[item.dayDate] = [];
        }
        acc[item.dayDate].push(item);
        return acc;
      },
      {} as Record<string, typeof scheduleItems>
    ) || {};

  const sortedDates = Object.keys(scheduleByDate).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sunset-50/30 font-['DM_Sans']">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Center: Trip Title */}
            <div className="flex-1 flex items-center justify-center gap-3 mx-4">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                {trip.name}
              </h1>
              {userRole === 'owner' && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-sunset-600 hover:bg-sunset-50 rounded-lg transition-colors"
                  aria-label="Edit trip"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border ${
                  roleBadge.color === 'sunset'
                    ? 'border-sunset-200 text-sunset-700'
                    : roleBadge.color === 'blue'
                      ? 'border-blue-200 text-blue-700'
                      : roleBadge.color === 'purple'
                        ? 'border-purple-200 text-purple-700'
                        : 'border-slate-200 text-slate-700'
                }`}
              >
                <RoleIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{roleBadge.label}</span>
              </div>
            </div>

            {/* Right: Share Button */}
            <GlassButton
              variant="default"
              size="sm"
              onClick={() => {
                console.log('Share trip');
                // TODO: Open share modal
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Share</span>
            </GlassButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Info Card */}
        <GlassPanel className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Date and Description */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </span>
                </div>
                {trip.timezone && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-900" title={TIMEZONE_DISPLAY_NAMES[trip.timezone] || trip.timezone}>
                      {getTimezoneAbbr(trip.timezone)}
                    </span>
                  </div>
                )}
              </div>
              {trip.description && (
                <p className="text-slate-700 text-sm">{trip.description}</p>
              )}
            </div>

            {/* Right: Member Avatars */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <div className="flex -space-x-2">
                {members.slice(0, 3).map((member) => (
                  <div
                    key={member._id}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-sunset-500 to-ocean-600 border-2 border-white flex items-center justify-center"
                    title={member.user?.name || member.user?.email || 'Member'}
                  >
                    {member.user?.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {member.user?.name?.[0]?.toUpperCase() ||
                          member.user?.email?.[0]?.toUpperCase() ||
                          'U'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {members.length > 3 && (
                <span className="text-sm font-medium text-slate-600">
                  +{members.length - 3}
                </span>
              )}
            </div>
          </div>
        </GlassPanel>

        {/* View Mode Toggle */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <motion.button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-white shadow-lg text-sunset-600'
                : 'bg-white/50 hover:bg-white/70 text-slate-600'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
            <span className="text-sm font-medium">List</span>
          </motion.button>
          <motion.button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              viewMode === 'map'
                ? 'bg-white shadow-lg text-sunset-600'
                : 'bg-white/50 hover:bg-white/70 text-slate-600'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Map view"
          >
            <Map className="w-5 h-5" />
            <span className="text-sm font-medium">Map</span>
          </motion.button>
        </div>

        {/* Plan Tabs */}
        {plans.length > 0 ? (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                {plans.map((plan) => (
                  <motion.button
                    key={plan._id}
                    onClick={() => setSelectedPlanId(plan._id)}
                    className={`relative px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                      selectedPlanId === plan._id
                        ? 'bg-white shadow-lg'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: plan.color }}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedPlanId === plan._id
                          ? 'text-slate-900'
                          : 'text-slate-600'
                      }`}
                    >
                      {plan.name}
                    </span>
                    {plan.isDefault && (
                      <GlassBadge color="ocean" className="text-xs">
                        Default
                      </GlassBadge>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Action Buttons */}
              {(userRole === 'owner' || userRole === 'editor') && selectedPlanId && (
                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="default"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Import</span>
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddActivityModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Add Activity</span>
                  </GlassButton>
                </div>
              )}
            </div>

            {/* Plan Description */}
            {selectedPlan?.description && (
              <p className="mt-3 text-sm text-slate-600">{selectedPlan.description}</p>
            )}
          </div>
        ) : (
          <GlassPanel className="p-8 text-center mb-6">
            <p className="text-slate-600">No plans created yet for this trip.</p>
          </GlassPanel>
        )}

        {/* Map View or List View */}
        {viewMode === 'map' ? (
          /* Map View */
          <div className="relative" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
            <FullScreenMap
              locations={mapLocations}
              selectedLocation={selectedLocation}
              visibleCategories={visibleCategories}
              activePlan="A"
              planRoute={[]}
              onLocationSelect={(location) => setSelectedLocation(location)}
            />
          </div>
        ) : (
          /* List View - Schedule Items */
          selectedPlanId && (
            <div className="space-y-6">
              {scheduleItems === undefined ? (
                // Loading schedule items
                <GlassPanel className="p-8 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-slate-600">Loading schedule...</p>
                </GlassPanel>
              ) : sortedDates.length === 0 ? (
                // Empty state
                <GlassPanel className="p-8 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-sunset-500/10 to-ocean-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-sunset-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Activities Yet
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Start planning by adding activities to this plan.
                  </p>
                  {(userRole === 'owner' || userRole === 'editor') && (
                    <GlassButton
                      variant="primary"
                      onClick={() => setIsAddActivityModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Activity
                    </GlassButton>
                  )}
                </GlassPanel>
              ) : (
                // Schedule items grouped by date
                sortedDates.map((date) => (
                  <GlassPanel key={date} className="p-6">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                      <Calendar className="w-5 h-5 text-sunset-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </h3>
                    </div>

                    {/* Schedule Items for this date */}
                    <div className="space-y-3">
                      {scheduleByDate[date]
                        ?.sort((a, b) => a.order - b.order)
                        .map((item, index) => (
                          <motion.div
                            key={item._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-4 p-4 bg-white/50 hover:bg-white/80 rounded-xl transition-colors cursor-pointer group"
                            onClick={() => setSelectedActivityId(item._id)}
                          >
                            {/* Time */}
                            <div className="flex-shrink-0 w-20">
                              <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{item.startTime}</span>
                              </div>
                              {item.endTime && (
                                <div className="text-xs text-slate-400 ml-4.5">
                                  {item.endTime}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 group-hover:text-sunset-700 transition-colors">
                                {item.title}
                              </h4>
                              {item.notes && (
                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                  {item.notes}
                                </p>
                              )}
                              {item.isFlexible && (
                                <GlassBadge color="amber" className="mt-2">
                                  Flexible
                                </GlassBadge>
                              )}
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sunset-600 transition-colors flex-shrink-0" />
                          </motion.div>
                        ))}
                    </div>
                  </GlassPanel>
                ))
              )}
            </div>
          )
        )}
      </main>

      {/* Right Detail Panel - shows when a location is clicked in map view */}
      {selectedLocation && viewMode === 'map' && (
        <RightDetailPanel
          location={selectedLocation}
          days={[]}
          selectedDayId={null}
          onClose={() => setSelectedLocation(null)}
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

      {/* Onboarding Overlay - renders when onboarding is active */}
      <OnboardingOverlay />

      {/* Edit Trip Modal */}
      <EditTripModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        trip={trip}
        onSuccess={() => {
          // Trip data will refresh automatically via Convex reactivity
        }}
      />

      {/* Add Activity Modal */}
      {selectedPlanId && (
        <AddActivityModal
          isOpen={isAddActivityModalOpen}
          onClose={() => setIsAddActivityModalOpen(false)}
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
        onClose={() => setSelectedActivityId(null)}
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
          // TODO: Open edit activity modal
          console.log('Edit activity:', selectedActivityId);
        }}
        onDelete={async () => {
          if (selectedActivityId) {
            await deleteScheduleItem({ itemId: selectedActivityId });
            setSelectedActivityId(null);
          }
        }}
      />
    </div>
  );
}
