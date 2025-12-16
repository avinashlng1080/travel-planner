import { motion } from 'framer-motion';
import { ClipboardList, X, Upload, MessageSquare } from 'lucide-react';

interface ImportSuggestionBannerProps {
  characterCount: number;
  onImport: () => void;
  onSendAsMessage: () => void;
  onDismiss: () => void;
}

/**
 * Banner shown when user pastes a large amount of text (>500 chars) in chat.
 * Offers to import the text as an itinerary or send as a regular message.
 */
export function ImportSuggestionBanner({
  characterCount,
  onImport,
  onSendAsMessage,
  onDismiss,
}: ImportSuggestionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-r from-sunset-50 to-ocean-50 border border-sunset-200 rounded-lg p-3 mb-2"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-sunset-600 flex-shrink-0" />
          <span className="text-sm text-slate-700">
            This looks like an itinerary ({characterCount.toLocaleString()} chars)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sunset-500 to-ocean-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity min-h-[36px]"
            aria-label="Import text as itinerary"
          >
            <Upload className="w-3.5 h-3.5" />
            Import to Plan A
          </button>

          <button
            onClick={onSendAsMessage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors min-h-[36px]"
            aria-label="Send as regular chat message"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Send as message
          </button>

          <button
            onClick={onDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Dismiss suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
