import { useConvexAuth } from 'convex/react';
import { LandingPage } from './pages/LandingPage';
import { TripPlannerApp } from './pages/TripPlannerApp';
import { LoadingScreen } from './components/ui/LoadingScreen';

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <TripPlannerApp /> : <LandingPage />;
}

export default App;
