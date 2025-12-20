/**
 * Example integration of TripViewPage with DashboardPage
 *
 * This shows how to navigate between the dashboard and trip view pages.
 */

import { useState } from 'react';

import { DashboardPage } from './DashboardPage';
import { TripViewPage } from './TripViewPage';

import type { Id } from '../../convex/_generated/dataModel';

type View = 'dashboard' | 'trip-view';

export function TripViewExample() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<Id<'trips'> | null>(null);

  const handleOpenTrip = (tripId: Id<'trips'>) => {
    setSelectedTripId(tripId);
    setCurrentView('trip-view');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedTripId(null);
  };

  if (currentView === 'trip-view' && selectedTripId) {
    return <TripViewPage tripId={selectedTripId} onBack={handleBackToDashboard} />;
  }

  return <DashboardPage onOpenTrip={handleOpenTrip} />;
}

/**
 * Alternative: Using React Router
 *
 * In your router setup:
 *
 * ```tsx
 * import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
 * import { DashboardPage } from './pages/DashboardPage';
 * import { TripViewPage } from './pages/TripViewPage';
 *
 * function TripViewRoute() {
 *   const { tripId } = useParams<{ tripId: string }>();
 *   const navigate = useNavigate();
 *
 *   if (!tripId) {
 *     navigate('/dashboard');
 *     return null;
 *   }
 *
 *   return (
 *     <TripViewPage
 *       tripId={tripId as Id<'trips'>}
 *       onBack={() => navigate('/dashboard')}
 *     />
 *   );
 * }
 *
 * export function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         <Route path="/dashboard" element={<DashboardPage />} />
 *         <Route path="/trips/:tripId" element={<TripViewRoute />} />
 *         <Route path="/" element={<Navigate to="/dashboard" replace />} />
 *       </Routes>
 *     </BrowserRouter>
 *   );
 * }
 * ```
 */
