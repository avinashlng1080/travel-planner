import { useMemo, useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';
import { LOCATIONS, DAILY_PLANS, HOME_BASE } from '../data/tripData';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { NavigationDock } from '../components/layout/NavigationDock';
import { RightDetailPanel } from '../components/layout/RightDetailPanel';
import { AIChatWidget } from '../components/layout/AIChatWidget';
import { FullScreenMap } from '../components/map/FullScreenMap';
import {
  TripPlannerPanel,
  ChecklistFloatingPanel,
  FiltersPanel,
} from '../components/floating';

export function TripPlannerApp() {
  const {
    selectedLocation,
    selectedDayId,
    activePlan,
    visibleCategories,
    chatMessages,
    isAILoading,
    dynamicPins,
    selectLocation,
    setActivePlan,
    addChatMessage,
    clearChatMessages,
    setAILoading,
    addDynamicPins,
    clearDynamicPins,
  } = useUIStore();

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
    if (!selectedDayPlan) return [];

    const scheduleItems = activePlan === 'A' ? selectedDayPlan.planA : selectedDayPlan.planB;

    // Start from home base
    const routePoints: Array<{ lat: number; lng: number }> = [
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


  // Handle AI chat
  const handleSendMessage = useCallback(
    async (message: string) => {
      addChatMessage('user', message);
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
          addChatMessage('assistant', assistantMessage);

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
          addChatMessage('assistant', 'Sorry, there was an error processing your request. Please try again.');
        }
      } catch (error) {
        addChatMessage('assistant', 'Sorry, I\'m having trouble connecting. Please check your internet connection.');
      } finally {
        setAILoading(false);
      }
    },
    [chatMessages, addChatMessage, setAILoading, addDynamicPins]
  );

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 font-['DM_Sans']">
      {/* Full Screen Map Background */}
      <FullScreenMap
        locations={LOCATIONS}
        selectedLocation={selectedLocation}
        visibleCategories={visibleCategories}
        activePlan={activePlan}
        planRoute={planRoute}
        dynamicPins={dynamicPins}
        onLocationSelect={selectLocation}
        onDynamicPinSelect={(pin) => {
          // For now, just log - could open a detail panel for dynamic pins
          console.log('Dynamic pin selected:', pin);
        }}
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
      <TripPlannerPanel />
      <ChecklistFloatingPanel />
      <FiltersPanel />

      {/* Right Detail Panel */}
      {selectedLocation && (
        <RightDetailPanel
          location={selectedLocation}
          onClose={() => selectLocation(null)}
          onAddToPlan={(plan) => {
            console.log(`Add ${selectedLocation.name} to Plan ${plan}`);
            // TODO: Implement add to plan
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
    </div>
  );
}
