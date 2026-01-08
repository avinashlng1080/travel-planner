import { useConvexAuth } from 'convex/react';
import { useState, useEffect } from 'react';

import { GoogleMapsProvider } from './components/Map/GoogleMapsProvider';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { DashboardPage } from './pages/DashboardPage';
import { JoinTripPage } from './pages/JoinTripPage';
import { LandingPage } from './pages/LandingPage';
import { TripPlannerApp } from './pages/TripPlannerApp';
import { TripViewPage } from './pages/TripViewPage';

import type { Id } from '../convex/_generated/dataModel';

type AppView = 'dashboard' | 'trip' | 'legacy-planner' | 'join';

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<Id<'trips'> | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Parse URL for join tokens
  useEffect(() => {
    const path = window.location.pathname;
    const joinMatch = /^\/join\/([a-f0-9]+)$/.exec(path);
    if (joinMatch) {
      setJoinToken(joinMatch[1]);
      setCurrentView('join');
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Join trip flow (not wrapped in GoogleMapsProvider as it doesn't need maps)
  if (currentView === 'join' && joinToken) {
    return (
      <JoinTripPage
        token={joinToken}
        onSuccess={(tripId) => {
          setSelectedTripId(tripId);
          setCurrentView('trip');
          setJoinToken(null);
          window.history.replaceState({}, '', '/');
        }}
        onCancel={() => {
          setCurrentView('dashboard');
          setJoinToken(null);
          window.history.replaceState({}, '', '/');
        }}
      />
    );
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
        <TripPlannerApp onBack={() => { setCurrentView('dashboard'); }} />
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
