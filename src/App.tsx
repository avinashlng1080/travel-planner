import { useMemo, useCallback } from 'react';
import { useConvexAuth } from 'convex/react';
import { useUIStore } from './stores/uiStore';
import { LOCATIONS, DAILY_PLANS, TRAVEL_PLANS } from './data/tripData';
import { FloatingHeader } from './components/layout/FloatingHeader';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightDetailPanel } from './components/layout/RightDetailPanel';
import { BottomItineraryBar } from './components/layout/BottomItineraryBar';
import { AIChatWidget } from './components/layout/AIChatWidget';
import { FullScreenMap } from './components/map/FullScreenMap';

function App() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const {
    selectedLocation,
    selectedDayId,
    activePlan,
    activeSection,
    visibleCategories,
    chatMessages,
    isAILoading,
    selectLocation,
    selectDay,
    setActivePlan,
    setActiveSection,
    toggleCategory,
    addChatMessage,
    clearChatMessages,
    setAILoading,
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

  // Build route for current plan
  const planRoute = useMemo(() => {
    if (!selectedDayPlan) return [];

    const scheduleItems = activePlan === 'A' ? selectedDayPlan.planA : selectedDayPlan.planB;

    return scheduleItems
      .filter((item) => !item.isNapTime)
      .map((item) => {
        const location = LOCATIONS.find((l) => l.id === item.locationId);
        return location ? { lat: location.lat, lng: location.lng } : null;
      })
      .filter((p): p is { lat: number; lng: number } => p !== null);
  }, [selectedDayPlan, activePlan]);

  // Prepare schedule items with location names for BottomItineraryBar
  const prepareScheduleItems = useCallback(
    (items: typeof selectedDayPlan.planA) => {
      return items.map((item) => {
        const location = LOCATIONS.find((l) => l.id === item.locationId);
        return {
          ...item,
          locationName: location?.name || 'Unknown Location',
        };
      });
    },
    []
  );

  // Categories for filter
  const categories = useMemo(() => {
    return [
      { id: 'home-base', name: 'Home Base', color: '#EC4899' },
      { id: 'toddler-friendly', name: 'Toddler Friendly', color: '#F472B6' },
      { id: 'attraction', name: 'Attraction', color: '#10B981' },
      { id: 'shopping', name: 'Shopping', color: '#8B5CF6' },
      { id: 'restaurant', name: 'Restaurant', color: '#F59E0B' },
      { id: 'nature', name: 'Nature', color: '#22C55E' },
      { id: 'temple', name: 'Temple', color: '#EF4444' },
      { id: 'playground', name: 'Playground', color: '#06B6D4' },
      { id: 'medical', name: 'Medical', color: '#DC2626' },
      { id: 'avoid', name: 'Avoid', color: '#64748b' },
    ].map((cat) => ({
      ...cat,
      visible: visibleCategories.includes(cat.id),
    }));
  }, [visibleCategories]);

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
        } else {
          addChatMessage('assistant', 'Sorry, there was an error processing your request. Please try again.');
        }
      } catch (error) {
        addChatMessage('assistant', 'Sorry, I\'m having trouble connecting. Please check your internet connection.');
      } finally {
        setAILoading(false);
      }
    },
    [chatMessages, addChatMessage, setAILoading]
  );

  const handleLocationClick = useCallback(
    (locationId: string) => {
      const location = LOCATIONS.find((l) => l.id === locationId);
      if (location) {
        selectLocation(location);
      }
    },
    [selectLocation]
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
        onLocationSelect={selectLocation}
      />

      {/* Floating Header */}
      <FloatingHeader
        currentDay={currentDay}
        totalDays={totalDays}
        activePlan={activePlan}
        onPlanChange={setActivePlan}
      />

      {/* Left Sidebar */}
      <LeftSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        dayPlans={DAILY_PLANS.map((d) => ({
          id: d.id,
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          title: d.title,
        }))}
        selectedDayId={selectedDayPlan?.id}
        onDaySelect={selectDay}
        todayId={todayId}
        categories={categories}
        onCategoryToggle={toggleCategory}
        alertCount={2}
      />

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

      {/* Bottom Itinerary Bar */}
      {selectedDayPlan && (
        <BottomItineraryBar
          date={selectedDayPlan.date}
          dayOfWeek={selectedDayPlan.dayOfWeek}
          title={selectedDayPlan.title}
          planA={prepareScheduleItems(selectedDayPlan.planA)}
          planB={prepareScheduleItems(selectedDayPlan.planB)}
          activePlan={activePlan}
          weatherConsideration={selectedDayPlan.weatherConsideration}
          onLocationClick={handleLocationClick}
        />
      )}

      {/* AI Chat Widget */}
      <AIChatWidget
        messages={chatMessages}
        isLoading={isAILoading}
        onSendMessage={handleSendMessage}
        onClearHistory={clearChatMessages}
      />
    </div>
  );
}

export default App;
