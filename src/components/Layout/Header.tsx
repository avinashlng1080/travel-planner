import { MessageSquare, X } from 'lucide-react';
import { useTripStore } from '../../stores/tripStore';

export default function Header() {
  const { chatOpen, setChatOpen } = useTripStore();

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-['Outfit'] text-white">
            Malaysia Family Trip
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            December 21, 2025 - January 6, 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors ${
              chatOpen
                ? 'bg-slate-700 text-white'
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
            aria-label={chatOpen ? 'Close chat' : 'Open chat'}
          >
            {chatOpen ? (
              <>
                <X size={20} />
                <span className="hidden sm:inline">Close</span>
              </>
            ) : (
              <>
                <MessageSquare size={20} />
                <span className="hidden sm:inline">AI Assistant</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
