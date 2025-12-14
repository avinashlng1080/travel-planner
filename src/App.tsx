import { useState } from 'react';
import { useConvexAuth } from 'convex/react';
import { LandingPage } from './pages/LandingPage';
import { TripPlannerApp } from './pages/TripPlannerApp';
import { DashboardPage } from './pages/DashboardPage';
import { TripViewPage } from './pages/TripViewPage';
import { LoadingScreen } from './components/ui/LoadingScreen';
import type { Id } from '../convex/_generated/dataModel';

type AppView = 'dashboard' | 'trip' | 'legacy-planner';

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<Id<'trips'> | null>(null);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Authenticated views
  if (currentView === 'trip' && selectedTripId) {
    return (
      <TripViewPage
        tripId={selectedTripId}
        onBack={() => {
          setCurrentView('dashboard');
          setSelectedTripId(null);
        }}
      />
    );
  }

  if (currentView === 'legacy-planner') {
    return <TripPlannerApp onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <DashboardPage
      onOpenTrip={(tripId) => {
        setSelectedTripId(tripId);
        setCurrentView('trip');
      }}
    />
  );
}

export default App;
