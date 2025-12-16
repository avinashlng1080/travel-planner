import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Check, ChevronDown, FileText } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { GlassPanel } from '../ui/GlassPanel';
import { useItineraryParser } from '@/hooks/useItineraryParser';
import { ImportPreviewPanel } from './ImportPreviewPanel';

export interface ImportItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: Id<'trips'>;
  planId: Id<'tripPlans'>;
  initialText?: string;
  onSuccess?: () => void;
}

// Format examples for the help dropdown
const FORMAT_EXAMPLES = [
  {
    name: 'TripIt Format',
    example: `Sun, 21 Dec 15:00 GMT+8 Check In M Vertica Access 1
555, Jln Cheras, Taman Pertama, 55100 Cheras, Selangor, Malaysia

Sun, 21 Dec 16:30 GMT+8 Aeon Mall - Some grocery shopping
Jalan Jejaka, Maluri, 55100 Kuala Lumpur Until 19:00 GMT+8`,
  },
  {
    name: 'ChatGPT Format',
    example: `Day 1 (Dec 21):
- 3:00 PM: Check in at M Vertica Residence
- 4:30 PM - 7:00 PM: Grocery shopping at Aeon Mall Maluri

Day 2 (Dec 22):
- 7:00 AM - 10:00 AM: Visit Batu Caves (famous Hindu temple)
- 11:00 AM: Lunch at Farm Cafe near Batu Caves`,
  },
  {
    name: 'Plain Text',
    example: `December 21 - Arrive KL, check in apartment, evening at KLCC
December 22 - Morning Batu Caves, afternoon Zoo Negara
December 23 - Day trip to Genting Highlands`,
  },
];

export function ImportItineraryModal({
  isOpen,
  onClose,
  tripId,
  planId,
  initialText = '',
  onSuccess,
}: ImportItineraryModalProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get trip data for context
  const trip = useQuery(api.trips.getTrip, { tripId });

  // Parser hook
  const parser = useItineraryParser();

  // Initialize with initial text if provided
  useEffect(() => {
    if (initialText && isOpen) {
      parser.setRawText(initialText);
    }
  }, [initialText, isOpen]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && parser.step === 'input') {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, parser.step]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !parser.isParsing && !parser.isImporting) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, parser.isParsing, parser.isImporting]);

  // Clear undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeout) clearTimeout(undoTimeout);
    };
  }, [undoTimeout]);

  const handleClose = () => {
    if (!parser.isParsing && !parser.isImporting) {
      onClose();
      // Reset after animation
      setTimeout(() => {
        parser.reset();
        setShowExamples(false);
      }, 200);
    }
  };

  const handleParse = async () => {
    if (!trip) return;

    await parser.parse(tripId, {
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelerInfo: trip.travelerInfo,
    });
  };

  const handleImport = async () => {
    await parser.confirmImport(tripId, planId);

    // Set up auto-close after success
    const timeout = setTimeout(() => {
      onSuccess?.();
      handleClose();
    }, 5000);
    setUndoTimeout(timeout);
  };

  const handleUndo = async () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    await parser.undo();
  };

  // Keyboard shortcut for parse (Cmd/Ctrl + Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (parser.rawText.length >= 50 && parser.step === 'input') {
        handleParse();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-itinerary-title"
          >
            <GlassPanel
              className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
              initial={false}
              animate={false}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                disabled={parser.isParsing || parser.isImporting}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h2 id="import-itinerary-title" className="text-xl font-semibold text-slate-900">
                  Import Itinerary
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Paste your itinerary from TripIt, ChatGPT, or any text format
                </p>
              </div>

              {/* Content based on step */}
              {parser.step === 'input' && (
                <div className="space-y-4">
                  {/* Textarea */}
                  <div>
                    <textarea
                      ref={textareaRef}
                      value={parser.rawText}
                      onChange={(e) => parser.setRawText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Paste your itinerary here...

Example:
Sun, 21 Dec 16:30 GMT+8 Aeon Mall - grocery shopping
Jalan Jejaka, Maluri Until 19:00 GMT+8

Mon, 22 Dec 07:00 GMT+8 Batu Caves
Gombak, 68100 Batu Caves, Selangor Until 10:00 GMT+8"
                      className="w-full min-h-[200px] bg-white/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 resize-none font-mono text-sm"
                      disabled={parser.isParsing}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">
                        {parser.rawText.length} characters
                        {parser.rawText.length < 50 && parser.rawText.length > 0 && (
                          <span className="text-amber-600 ml-2">
                            (minimum 50 characters)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400">
                        Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to parse
                      </span>
                    </div>
                  </div>

                  {/* Format Examples Dropdown */}
                  <div>
                    <button
                      onClick={() => setShowExamples(!showExamples)}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <FileText className="w-4 h-4" />
                      Format examples
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showExamples ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showExamples && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-3">
                            {FORMAT_EXAMPLES.map((format) => (
                              <div key={format.name} className="bg-slate-50 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">
                                  {format.name}
                                </h4>
                                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                                  {format.example}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Error */}
                  {parser.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {parser.error}
                    </div>
                  )}

                  {/* Parse Button */}
                  <button
                    onClick={handleParse}
                    disabled={parser.rawText.length < 50 || parser.isParsing}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-sunset-500 to-ocean-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[48px]"
                  >
                    Parse Itinerary
                  </button>
                </div>
              )}

              {parser.step === 'parsing' && (
                <div className="py-12 text-center">
                  <Loader2 className="w-12 h-12 text-sunset-500 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900">
                    Analyzing your itinerary...
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Claude is parsing locations and times
                  </p>
                </div>
              )}

              {parser.step === 'preview' && parser.parsedData && (
                <div className="space-y-6">
                  <ImportPreviewPanel
                    data={parser.parsedData}
                    onUpdateLocation={parser.updateLocation}
                    onDeleteLocation={parser.deleteLocation}
                    onUpdateActivity={parser.updateActivity}
                    onDeleteActivity={parser.deleteActivity}
                  />

                  {/* Error */}
                  {parser.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {parser.error}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => parser.reset()}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={
                        parser.isImporting ||
                        !parser.parsedData?.locations.length ||
                        !parser.parsedData?.days.some((d) => d.activities.length > 0)
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-sunset-500 to-ocean-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Import to Plan A
                    </button>
                  </div>
                </div>
              )}

              {parser.step === 'importing' && (
                <div className="py-12 text-center">
                  <Loader2 className="w-12 h-12 text-ocean-500 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900">
                    Importing to your trip...
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Creating locations and schedule items
                  </p>
                </div>
              )}

              {parser.step === 'complete' && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-900">
                    Successfully imported!
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {parser.parsedData?.locations.length || 0} locations and{' '}
                    {parser.parsedData?.days.reduce(
                      (sum, day) => sum + day.activities.length,
                      0
                    ) || 0}{' '}
                    activities added to Plan A
                  </p>

                  <div className="mt-6 flex gap-3 justify-center">
                    <button
                      onClick={handleUndo}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Undo Import
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-sunset-500 to-ocean-600 text-white font-medium hover:opacity-90 transition-opacity"
                    >
                      Done
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-4">
                    Auto-closing in 5 seconds...
                  </p>
                </div>
              )}
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
