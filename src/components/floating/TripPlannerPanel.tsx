import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { Map, ChevronLeft, ChevronRight, MapPin, Lightbulb, AlertTriangle, Sun, Cloud, Clock, Info, Zap, Columns, Moon, ArrowRight, type LucideIcon } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

import { api } from '../../../convex/_generated/api';
import { panelsAtom } from '../../atoms/floatingPanelAtoms';
import { selectedDayIdAtom } from '../../atoms/uiAtoms';
import { useEnergyTheme } from '../../hooks/useEnergyTheme';
import { useWeather } from '../../hooks/useWeather';
import { sortScheduleItems } from '../../utils/sortScheduleItems';
import { DayPlan } from '../Itinerary/DayPlan';
import { PlanBuilder } from '../Itinerary/PlanBuilder';
import SafetyPanel from '../Safety/SafetyPanel';
import { GlassBadge } from '../ui/GlassPanel';
import { ResponsivePanelWrapper } from '../ui/ResponsivePanelWrapper';
import { WeatherBadge } from '../weather';

import type { Id } from '../../../convex/_generated/dataModel';
import type { DayPlan as DayPlanType, ScheduleItem as ScheduleItemType } from '../../data/tripData';

type TabId = 'itinerary' | 'builder' | 'suggestions' | 'alerts';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { id: 'itinerary', label: 'Itinerary', icon: MapPin },
  { id: 'builder', label: 'Plan Builder', icon: Columns },
  { id: 'suggestions', label: 'Tips', icon: Lightbulb },
  { id: 'alerts', label: 'Safety', icon: AlertTriangle },
];

interface Suggestion {
  id: string;
  type: 'weather' | 'time' | 'nearby' | 'tip';
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; locationId?: string };
}

interface TripPlannerPanelProps {
  tripId: Id<'trips'>;
  selectedPlanId: Id<'tripPlans'> | null;
  onActivityClick?: (activityId: string) => void;
}

export function TripPlannerPanel({ tripId, selectedPlanId, onActivityClick }: TripPlannerPanelProps) {
  const [panels] = useAtom(panelsAtom);
  const [selectedDayId, selectDay] = useAtom(selectedDayIdAtom);
  const [activeTab, setActiveTab] = useState<TabId>('itinerary');

  // Get energy theme for visual styling
  const energyTheme = useEnergyTheme();

  // Get weather data
  const { daily: weatherForecast } = useWeather();

  // Fetch data from Convex
  const scheduleItems = useQuery(
    api.tripScheduleItems.getScheduleItems,
    selectedPlanId ? { planId: selectedPlanId } : 'skip'
  );

  const tripLocations = useQuery(api.tripLocations.getLocations, { tripId });

  // Get mutation for reordering
  const reorderScheduleItems = useMutation(api.tripScheduleItems.reorderScheduleItems);

  const panelState = panels?.tripPlanner;

  // Don't render if panel state not initialized
  if (!panelState) {
    return null;
  }

  // Transform tripLocations to Location format for child components
  const locations = useMemo(() => {
    if (!tripLocations) {return [];}

    return tripLocations.map((loc) => ({
      id: loc._id,
      name: loc.customName || loc.baseLocation?.name || 'Unknown Location',
      lat: loc.customLat || loc.baseLocation?.lat || 0,
      lng: loc.customLng || loc.baseLocation?.lng || 0,
      category: (loc.customCategory || loc.baseLocation?.category || 'attraction') as any,
      description: loc.customDescription || loc.baseLocation?.description || '',
      city: loc.baseLocation?.city || '',
      toddlerRating: loc.toddlerRating || loc.baseLocation?.toddlerRating || 3,
      isIndoor: loc.baseLocation?.isIndoor || false,
      bestTimeToVisit: loc.baseLocation?.bestTimeToVisit || [],
      estimatedDuration: loc.estimatedDuration || loc.baseLocation?.estimatedDuration || 'Varies',
      grabEstimate: loc.baseLocation?.grabEstimate || 'Check Grab app',
      distanceFromBase: loc.baseLocation?.distanceFromBase || 'Unknown',
      drivingTime: loc.baseLocation?.drivingTime || 'Unknown',
      warnings: loc.baseLocation?.warnings || [],
      tips: loc.tips || loc.baseLocation?.tips || [],
      dressCode: loc.baseLocation?.dressCode,
      whatToBring: loc.baseLocation?.whatToBring || [],
      whatNotToBring: loc.baseLocation?.whatNotToBring || [],
      feedingTimes: loc.baseLocation?.feedingTimes,
      bookingRequired: loc.baseLocation?.bookingRequired || false,
      bookingUrl: loc.baseLocation?.bookingUrl,
      entranceFee: loc.baseLocation?.entranceFee,
      openingHours: loc.baseLocation?.openingHours || 'Not specified',
      planIds: [],
    }));
  }, [tripLocations]);

  // Group schedule items by dayDate to create "virtual" day plans
  const dailyPlans = useMemo<DayPlanType[]>(() => {
    if (!scheduleItems || !tripLocations) {return [];}

    // Group items by dayDate
    const groupedByDate = scheduleItems.reduce<Record<string, typeof scheduleItems>>((acc, item) => {
      const date = item.dayDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});

    // Convert to DayPlan format
    const result = Object.entries(groupedByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, items]) => {
        const dayDate = new Date(date);
        const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Transform items to ScheduleItemType format
        const scheduleItemsForDay: ScheduleItemType[] = sortScheduleItems(
          items.map((item) => ({
            id: item._id,
            locationId: item.locationId || '',
            startTime: item.startTime,
            endTime: item.endTime,
            notes: item.notes,
            isFlexible: item.isFlexible,
            order: item.order,
          }))
        );

        const dayPlan = {
          id: date,
          date,
          dayOfWeek,
          title: `Day ${Object.keys(groupedByDate).indexOf(date) + 1}`,
          planA: scheduleItemsForDay,
          planB: [],
          notes: [],
          weatherConsideration: 'mixed' as const,
        };

        return dayPlan;
      });

    return result;
  }, [scheduleItems, tripLocations]);

  // Auto-select first day if none selected
  useEffect(() => {
    if (dailyPlans.length > 0 && !selectedDayId) {
      selectDay(dailyPlans[0].id);
    }
  }, [dailyPlans, selectedDayId, selectDay]);

  // Find current day index
  const currentDayIndex = useMemo(() => {
    if (!selectedDayId) {return 0;}
    const index = dailyPlans.findIndex((p) => p.id === selectedDayId);
    return index >= 0 ? index : 0;
  }, [selectedDayId, dailyPlans]);

  const selectedDayPlan = dailyPlans[currentDayIndex];

  // Check if today
  const isToday = useMemo(() => {
    if (!selectedDayPlan) {return false;}
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(selectedDayPlan.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate.getTime() === today.getTime();
  }, [selectedDayPlan]);

  // Get weather forecast for the selected day
  const selectedDayWeather = useMemo(() => {
    if (!selectedDayPlan || !weatherForecast.length) {return null;}
    return weatherForecast.find((f) => f.date === selectedDayPlan.date) || null;
  }, [selectedDayPlan, weatherForecast]);

  // Navigation handlers
  const goToPrevDay = () => {
    if (currentDayIndex > 0) {
      selectDay(dailyPlans[currentDayIndex - 1].id);
    }
  };

  const goToNextDay = () => {
    if (currentDayIndex < dailyPlans.length - 1) {
      selectDay(dailyPlans[currentDayIndex + 1].id);
    }
  };

  // Itinerary handlers
  const handleReorder = async (_plan: 'A' | 'B', itemIds: string[]) => {
    if (!selectedPlanId || !selectedDayPlan) {return;}

    try {
      await reorderScheduleItems({
        planId: selectedPlanId,
        dayDate: selectedDayPlan.date,
        itemIds: itemIds as Id<'tripScheduleItems'>[],
      });
    } catch (error) {
      console.error('Failed to reorder schedule items:', error);
    }
  };

  // Generate suggestions
  const suggestions = useMemo<Suggestion[]>(() => {
    const result: Suggestion[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Weather-based suggestions
    if (selectedDayPlan) {
      if (selectedDayPlan.weatherConsideration === 'outdoor-heavy') {
        result.push({
          id: 'weather-outdoor',
          type: 'weather',
          icon: Sun,
          title: 'Great day for outdoors!',
          description: 'Bring sunscreen, hats, and plenty of water.',
        });
      } else if (selectedDayPlan.weatherConsideration === 'indoor-heavy') {
        result.push({
          id: 'weather-indoor',
          type: 'weather',
          icon: Cloud,
          title: 'Indoor-friendly day',
          description: 'Perfect for rainy weather or AC breaks.',
        });
      }
    }

    // Time-based suggestions
    if (currentTimeInMinutes >= 570 && currentTimeInMinutes <= 630) {
      result.push({
        id: 'time-morning-nap',
        type: 'time',
        icon: Clock,
        title: 'Morning nap time',
        description: 'Toddler naps around 10 AM for 1 hour.',
      });
    }

    if (currentTimeInMinutes >= 870 && currentTimeInMinutes <= 930) {
      result.push({
        id: 'time-afternoon-nap',
        type: 'time',
        icon: Clock,
        title: 'Afternoon nap time',
        description: 'Quick 30-min nap around 3 PM.',
      });
    }

    if (currentHour >= 5 && currentHour < 8) {
      result.push({
        id: 'time-early',
        type: 'time',
        icon: Sun,
        title: 'Perfect for outdoor activities!',
        description: 'Early morning = cooler, fewer crowds.',
      });
    }

    if (currentHour >= 18 && currentHour < 20) {
      result.push({
        id: 'time-evening',
        type: 'time',
        icon: MapPin,
        title: 'Evening stroll time',
        description: 'Great for parks and waterfront areas!',
      });
    }

    // Tips
    const tips: Suggestion[] = [
      { id: 'tip-hydration', type: 'tip', icon: Info, title: 'Stay hydrated!', description: 'Carry water bottles, especially in warm climates.' },
      { id: 'tip-rideshare', type: 'tip', icon: Info, title: 'Use local rideshare', description: 'Check local apps for safe, reliable transport.' },
      { id: 'tip-photos', type: 'tip', icon: Info, title: 'Charge devices', description: 'Keep phones charged for maps & photos!' },
      { id: 'tip-carrier', type: 'tip', icon: Info, title: 'Baby carrier', description: 'Great for crowded attractions & nature trails.' },
    ];

    if (result.length < 4) {
      const remaining = tips.slice(0, 4 - result.length);
      result.push(...remaining);
    }

    return result;
  }, [selectedDayPlan]);

  const getSuggestionColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'weather': return 'from-yellow-500 to-orange-500';
      case 'time': return 'from-blue-500 to-cyan-500';
      case 'nearby': return 'from-green-500 to-emerald-500';
      case 'tip': return 'from-sunset-500 to-ocean-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  // Get theme-specific energy icon
  const EnergyIcon = energyTheme.icon === 'zap' ? Zap : energyTheme.icon === 'moon' ? Moon : Sun;

  return (
    <ResponsivePanelWrapper
      panelId="tripPlanner"
      title="Trip Planner"
      icon={Map}
      defaultSize={{ width: 420, height: 580 }}
      className={`transition-all duration-500 ${
        energyTheme.level === 'low'
          ? 'ring-2 ring-blue-200/50'
          : energyTheme.level === 'high'
          ? 'ring-2 ring-sunset-200/50'
          : ''
      }`}
    >
      <div className={`flex flex-col h-full transition-colors duration-500 ${
        energyTheme.level === 'low'
          ? 'bg-gradient-to-b from-blue-50/30 to-slate-50/30'
          : energyTheme.level === 'high'
          ? 'bg-gradient-to-b from-sunset-50/20 to-ocean-50/10'
          : ''
      }`}>
        {/* Plan B Mode Banner */}
        <AnimatePresence>
          {energyTheme.suggestPlanB && energyTheme.message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-blue-50 via-blue-100/50 to-slate-50 border-b border-blue-200/50 px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Moon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-blue-800">Plan B Mode</span>
                    <ArrowRight className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600 truncate">{energyTheme.message}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day Navigator */}
        <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors duration-500 ${
          energyTheme.level === 'low'
            ? 'bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200/50'
            : energyTheme.level === 'high'
            ? 'bg-gradient-to-r from-sunset-50 to-ocean-50 border-sunset-200/50'
            : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200/50'
        }`}>
          <button
            onClick={goToPrevDay}
            disabled={currentDayIndex === 0}
            className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          <div className="text-center flex-1 px-2">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-slate-500">
                {selectedDayPlan?.dayOfWeek}
              </span>
              {selectedDayWeather && (
                <WeatherBadge forecast={selectedDayWeather} />
              )}
              {isToday && (
                <GlassBadge color="sunset" className="text-xs px-1.5 py-0">
                  TODAY
                </GlassBadge>
              )}
              {/* Energy level badge */}
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[10px] font-medium transition-all duration-500 ${
                energyTheme.level === 'low'
                  ? 'bg-blue-100 text-blue-700'
                  : energyTheme.level === 'high'
                  ? 'bg-sunset-100 text-sunset-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <EnergyIcon className="w-2.5 h-2.5" />
                {energyTheme.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {selectedDayPlan?.title || 'Select a day'}
            </h3>
            <p className="text-xs md:text-[10px] text-slate-500">
              {selectedDayPlan
                ? new Date(selectedDayPlan.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : ''}{' '}
              • Day {currentDayIndex + 1} of {dailyPlans.length}
            </p>
          </div>

          <button
            onClick={goToNextDay}
            disabled={currentDayIndex === dailyPlans.length - 1}
            className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex overflow-x-auto scrollbar-hide border-b transition-colors duration-500 ${
          energyTheme.level === 'low'
            ? 'border-blue-200/50'
            : energyTheme.level === 'high'
            ? 'border-sunset-200/50'
            : 'border-slate-200/50'
        }`}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); }}
              className={`
                flex-1 md:flex-auto flex items-center justify-center gap-1.5 px-3 py-3 min-h-[44px]
                text-xs font-medium transition-all duration-200 whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? energyTheme.level === 'low'
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                      : energyTheme.level === 'high'
                      ? 'text-sunset-600 border-b-2 border-sunset-500 bg-sunset-50'
                      : 'text-sunset-600 border-b-2 border-sunset-500 bg-sunset-50/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Itinerary Tab */}
          {activeTab === 'itinerary' && (
            <div className="p-4">
              {selectedDayPlan ? (
                <DayPlan
                  dayPlan={selectedDayPlan}
                  locations={locations}
                  onReorder={handleReorder}
                  onActivityClick={onActivityClick}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-600">No day selected</p>
                </div>
              )}
            </div>
          )}

          {/* Plan Builder Tab */}
          {activeTab === 'builder' && (
            <div className="p-4 h-full">
              {selectedDayPlan ? (
                <div className="h-full">
                  <div className="mb-3 text-center">
                    <p className="text-xs text-slate-500">
                      Drag activities between Plan A and Plan B to create your custom itinerary
                    </p>
                  </div>
                  <PlanBuilder
                    dayPlan={selectedDayPlan}
                    locations={locations}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Columns className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-600">Select a day to build your plan</p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="p-4 space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-start gap-3 p-3 bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 rounded-xl"
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${getSuggestionColor(
                      suggestion.type
                    )} rounded-lg flex items-center justify-center shadow-sm`}
                  >
                    <suggestion.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 mb-0.5">
                      {suggestion.title}
                    </h4>
                    <p className="text-sm md:text-xs text-slate-600 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alerts/Safety Tab */}
          {activeTab === 'alerts' && <SafetyPanel />}
        </div>
      </div>
    </ResponsivePanelWrapper>
  );
}
