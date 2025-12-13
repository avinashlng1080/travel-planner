import { useTripStore } from './stores/tripStore';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MapView from './components/Map/MapView';
import LocationDetail from './components/Location/LocationDetail';
import { AIChat } from './components/Chat/AIChat';

function App() {
  const { chatOpen, selectedLocation } = useTripStore();

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white font-['DM_Sans']">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 relative">
          <MapView />
        </main>

        {selectedLocation && (
          <aside className="hidden lg:block w-96 bg-slate-900 border-l border-slate-700 overflow-y-auto">
            <LocationDetail />
          </aside>
        )}
      </div>

      {chatOpen && <AIChat />}
    </div>
  );
}

export default App;
