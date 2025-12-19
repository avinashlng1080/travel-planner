import { useState } from 'react';
import { useConvexAuth } from 'convex/react';
import { LandingPage } from './pages/LandingPage';
import { TripPlannerApp } from './pages/TripPlannerApp';
import { DashboardPage } from './pages/DashboardPage';
import { TripViewPage } from './pages/TripViewPage';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { GoogleMapsProvider } from './components/Map/GoogleMapsProvider';
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

  // Authenticated views - wrapped with GoogleMapsProvider for map access
  return (
    <GoogleMapsProvider>
      {currentView === 'trip' && selectedTripId ? (
        <TripViewPage
          tripId={selectedTripId}
          onBack={() => {
            setCurrentView('dashboard');
            setSelectedTripId(null);
          }}
        />
      ) : currentView === 'legacy-planner' ? (
        <TripPlannerApp onBack={() => setCurrentView('dashboard')} />
      ) : (
        <DashboardPage
          onOpenTrip={(tripId) => {
            setSelectedTripId(tripId);
            setCurrentView('trip');
          }}
        />
      )}
    </GoogleMapsProvider>
  );
}

export default App;
