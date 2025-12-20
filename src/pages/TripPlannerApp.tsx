import { useAtom, useSetAtom } from 'jotai';
import { useMemo, useCallback } from 'react';

import {
  selectedLocationAtom,
  selectedDayIdAtom,
  activePlanAtom,
  visibleCategoriesAtom,
  chatMessagesAtom,
  isAILoadingAtom,
  dynamicPinsAtom,
  newlyAddedPinsAtom,
  addChatMessageAtom,
  clearChatMessagesAtom,
  addDynamicPinsAtom,
  clearDynamicPinsAtom,
  clearNewlyAddedPinsAtom,
} from '../atoms/uiAtoms';
import {
  ChecklistFloatingPanel,
  FiltersPanel,
} from '../components/floating';
import { AIChatWidget } from '../components/Layout/AIChatWidget';
import { FloatingHeader } from '../components/Layout/FloatingHeader';
import { MobileNavBar } from '../components/Layout/MobileNavBar';
import { NavigationDock } from '../components/Layout/NavigationDock';
import { RightDetailPanel } from '../components/Layout/RightDetailPanel';
import { GoogleFullScreenMap } from '../components/Map/GoogleFullScreenMap';
import { LOCATIONS, DAILY_PLANS, HOME_BASE } from '../data/tripData';

interface TripPlannerAppProps {
  onBack?: () => void;
}

export function TripPlannerApp({ onBack: _onBack }: TripPlannerAppProps = {}) {
  const [selectedLocation, selectLocation] = useAtom(selectedLocationAtom);
  const [selectedDayId] = useAtom(selectedDayIdAtom);
  const [activePlan, setActivePlan] = useAtom(activePlanAtom);
  const [visibleCategories] = useAtom(visibleCategoriesAtom);
  const [chatMessages] = useAtom(chatMessagesAtom);
  const [isAILoading, setAILoading] = useAtom(isAILoadingAtom);
  const [dynamicPins] = useAtom(dynamicPinsAtom);
  const [newlyAddedPins] = useAtom(newlyAddedPinsAtom);
  const addChatMessage = useSetAtom(addChatMessageAtom);
  const clearChatMessages = useSetAtom(clearChatMessagesAtom);
  const addDynamicPins = useSetAtom(addDynamicPinsAtom);
  const clearDynamicPins = useSetAtom(clearDynamicPinsAtom);
  const clearNewlyAddedPins = useSetAtom(clearNewlyAddedPinsAtom);

  // Calculate current day
  const { currentDay, totalDays, todayId } = useMemo(() => {
    const tripStart = new Date('2025-12-21');
    const tripEnd = new Date('2026-01-06');
    const today = new Date();

    const currentDay = Math.floor((today.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.floor((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Find today's plan ID
    const todayStr = today.toISOString().split('T')[0];
    const todayPlan = DAILY_PLANS.find((p) => p.date === todayStr);

    return { currentDay, totalDays, todayId: todayPlan?.id };
  }, []);

  // Get selected day plan
  const selectedDayPlan = useMemo(() => {
    if (!selectedDayId) {
      // Default to today or first day
      const defaultId = todayId || DAILY_PLANS[0]?.id;
      return DAILY_PLANS.find((p) => p.id === defaultId) || DAILY_PLANS[0];
    }
    return DAILY_PLANS.find((p) => p.id === selectedDayId);
  }, [selectedDayId, todayId]);

  // Build route for current plan - starting from home base
  const planRoute = useMemo(() => {
    if (!selectedDayPlan) {return [];}

    const scheduleItems = activePlan === 'A' ? selectedDayPlan.planA : selectedDayPlan.planB;

    // Start from home base
    const routePoints: { lat: number; lng: number }[] = [
      { lat: HOME_BASE.lat, lng: HOME_BASE.lng }
    ];

    // Add all scheduled locations
    scheduleItems
      .filter((item) => !item.isNapTime)
      .forEach((item) => {
        const location = LOCATIONS.find((l) => l.id === item.locationId);
        if (location) {
          routePoints.push({ lat: location.lat, lng: location.lng });
        }
      });

    // Return to home base at the end
    routePoints.push({ lat: HOME_BASE.lat, lng: HOME_BASE.lng });

    return routePoints;
  }, [selectedDayPlan, activePlan]);

  // Extract location IDs for Plan A and Plan B for the selected day
  const { planALocationIds, planBLocationIds } = useMemo(() => {
    if (!selectedDayPlan) {return { planALocationIds: [], planBLocationIds: [] };}

    const planAIds = selectedDayPlan.planA
      .filter((item) => !item.isNapTime)
      .map((item) => item.locationId);

    const planBIds = selectedDayPlan.planB
      .filter((item) => !item.isNapTime)
      .map((item) => item.locationId);

    return { planALocationIds: planAIds, planBLocationIds: planBIds };
  }, [selectedDayPlan]);


  // Handle AI chat
  const handleSendMessage = useCallback(
    async (message: string) => {
      addChatMessage({ role: 'user', content: message });
      setAILoading(true);

      try {
        // Call Convex HTTP action - convert .cloud URL to .site for HTTP endpoints
        const convexUrl = import.meta.env.VITE_CONVEX_URL?.replace('.cloud', '.site') || '';
        const response = await fetch(`${convexUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: message },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Extract text from response - may have multiple content blocks with web search
          const textBlocks = data.content?.filter((block: any) => block.type === 'text') || [];
          const assistantMessage = textBlocks.map((block: any) => block.text).join('\n\n')
            || 'Sorry, I couldn\'t process that request.';
          addChatMessage({ role: 'assistant', content: assistantMessage });

          // Extract map pins from tool_use blocks
          const toolUseBlocks = data.content?.filter((block: any) => block.type === 'tool_use') || [];
          const mapPinTools = toolUseBlocks.filter((block: any) => block.name === 'suggest_map_pins');

          if (mapPinTools.length > 0) {
            const allPins = mapPinTools.flatMap((tool: any) => tool.input?.pins || []);
            if (allPins.length > 0) {
              addDynamicPins(allPins);
            }
          }
        } else {
          addChatMessage({ role: 'assistant', content: 'Sorry, there was an error processing your request. Please try again.' });
        }
      } catch (error) {
        addChatMessage({ role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please check your internet connection.' });
      } finally {
        setAILoading(false);
      }
    },
    [chatMessages, addChatMessage, setAILoading, addDynamicPins]
  );

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 font-['DM_Sans']">
      {/* Full Screen Map Background */}
      <GoogleFullScreenMap
        locations={LOCATIONS}
        selectedLocation={selectedLocation}
        visibleCategories={visibleCategories}
        activePlan={activePlan}
        planRoute={planRoute}
        dynamicPins={dynamicPins}
        newlyAddedPins={newlyAddedPins}
        planALocationIds={planALocationIds}
        planBLocationIds={planBLocationIds}
        onLocationSelect={selectLocation}
        onDynamicPinSelect={(pin) => {
          // Convert DynamicPin to Location-compatible object for detail panel
          selectLocation({
            id: pin.id,
            name: pin.name,
            lat: pin.lat,
            lng: pin.lng,
            category: (pin.category as any) || 'attraction',
            description: pin.description || pin.reason || 'AI-suggested location',
            city: 'Malaysia',
            toddlerRating: 3,
            isIndoor: false,
            bestTimeToVisit: [],
            estimatedDuration: 'Varies',
            grabEstimate: 'Check Grab app',
            distanceFromBase: 'Check map',
            drivingTime: 'Check map',
            warnings: [],
            tips: pin.reason ? [`AI Suggestion: ${pin.reason}`] : [],
            whatToBring: [],
            whatNotToBring: [],
            bookingRequired: false,
            openingHours: 'Check locally',
            planIds: [],
          });
        }}
        onNewPinsFocused={clearNewlyAddedPins}
      />

      {/* Floating Header */}
      <FloatingHeader
        currentDay={currentDay}
        totalDays={totalDays}
        activePlan={activePlan}
        onPlanChange={setActivePlan}
      />

      {/* Navigation Dock - replaces LeftSidebar */}
      <NavigationDock />

      {/* Floating Panels */}
      {/* TripPlannerPanel requires tripId and selectedPlanId - removed for fixture demo */}
      <ChecklistFloatingPanel />
      <FiltersPanel />

      {/* Right Detail Panel */}
      {selectedLocation && (
        <RightDetailPanel
          location={selectedLocation}
          days={DAILY_PLANS}
          selectedDayId={selectedDayPlan?.id || null}
          onClose={() => { selectLocation(null); }}
          onAddToPlan={(plan, details) => {
            console.log(`Add ${selectedLocation.name} to Plan ${plan}`, details);
            // TODO: Persist to database/state
            // For now, just log and close the sidebar
            selectLocation(null);
          }}
        />
      )}

      {/* AI Chat Widget */}
      <AIChatWidget
        messages={chatMessages}
        isLoading={isAILoading}
        dynamicPinsCount={dynamicPins.length}
        onSendMessage={handleSendMessage}
        onClearHistory={clearChatMessages}
        onClearDynamicPins={clearDynamicPins}
      />

      {/* Mobile Navigation Bar */}
      <MobileNavBar />
    </div>
  );
}
