import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Minus,
  Minimize2,
  Square,
  Send,
  Trash2,
  Sparkles,
  MapPin,
} from 'lucide-react';
// GlassButton not currently used - can be re-imported if needed
import { useAITripPlanner } from '../../hooks/useAITripPlanner';
import { UndoToast, useToasts } from '../ui/UndoToast';
import { usePasteDetection } from '../../hooks/usePasteDetection';
import { ImportSuggestionBanner } from '../trips/ImportSuggestionBanner';
import { Id } from '../../../convex/_generated/dataModel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  // Legacy props for Malaysia trip mode
  messages?: ChatMessage[];
  isLoading?: boolean;
  dynamicPinsCount?: number;
  onSendMessage?: (message: string) => void;
  onClearHistory?: () => void;
  onClearDynamicPins?: () => void;
  // New props for user-created trips
  tripId?: Id<'trips'>;
  // Import itinerary callback
  onOpenImport?: (initialText: string) => void;
}

// Default questions for legacy Malaysia trip
const LEGACY_SUGGESTED_QUESTIONS = [
  'What should I bring to Batu Caves?',
  'Best time to visit KLCC Park with a toddler?',
  'Indoor activities for rainy days?',
  'Where can I find good nursing rooms?',
];

// Dynamic questions for user-created trips
function getDynamicSuggestedQuestions(destination?: string, travelerInfo?: string): string[] {
  const questions: string[] = [];

  if (destination) {
    questions.push(`What are the must-see attractions in ${destination}?`);
    questions.push(`Find me the best restaurants in ${destination}`);
  } else {
    questions.push('What are some must-see attractions?');
    questions.push('Find me the best restaurants');
  }

  if (
    travelerInfo?.toLowerCase().includes('toddler') ||
    travelerInfo?.toLowerCase().includes('kid') ||
    travelerInfo?.toLowerCase().includes('child')
  ) {
    questions.push('What are kid-friendly activities?');
    questions.push('Where can I find playgrounds nearby?');
  } else {
    questions.push('Create a full day itinerary');
    questions.push('What local experiences should I try?');
  }

  return questions.slice(0, 4);
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
          ${
            isUser
              ? 'bg-gradient-to-br from-sunset-500 via-sunset-600 to-ocean-600 text-white shadow-sunset-500/20'
              : 'bg-white border border-slate-200 text-slate-900 shadow-slate-200/50'
          }
        `}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
        <p className={`text-[10px] mt-1.5 font-medium ${isUser ? 'opacity-70' : 'opacity-50'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`typing-dot-${i}`}
          className="w-2.5 h-2.5 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-full shadow-sm"
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}

export function AIChatWidget({
  // Legacy props
  messages: legacyMessages,
  isLoading: legacyIsLoading,
  dynamicPinsCount = 0,
  onSendMessage: legacyOnSendMessage,
  onClearHistory: legacyOnClearHistory,
  onClearDynamicPins,
  // Trip mode props
  tripId,
  onOpenImport,
}: AIChatWidgetProps) {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Paste detection for itinerary import
  const { pastedText, characterCount, isPasteDetected, clearPaste, handlePaste } =
    usePasteDetection();

  // Trip-specific state (when tripId is provided)
  const [tripMessages, setTripMessages] = useState<ChatMessage[]>([]);
  const [tripIsLoading, setTripIsLoading] = useState(false);

  // AI Trip Planner hook (only active when tripId provided)
  const {
    isProcessingTools,
    processToolCalls,
    getTripContext,
    getTripLocations,
    lastToolResults,
    clearResults,
    tripData,
  } = useAITripPlanner(tripId);

  // Toast management
  const { toasts, addToast, dismissToast } = useToasts();

  // Determine which mode we're in
  const isTripMode = !!tripId;
  const messages = isTripMode ? tripMessages : legacyMessages || [];
  const isLoading = isTripMode ? tripIsLoading || isProcessingTools : legacyIsLoading || false;

  // Get suggested questions based on mode
  const suggestedQuestions = isTripMode
    ? getDynamicSuggestedQuestions(tripData?.trip?.destination, tripData?.trip?.travelerInfo)
    : LEGACY_SUGGESTED_QUESTIONS;

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Show toasts when tool results come in
  useEffect(() => {
    if (lastToolResults.length > 0) {
      lastToolResults.forEach((result) => {
        addToast({
          message: result.message,
          type: result.success ? 'success' : 'error',
          undoAction: result.undoAction,
          duration: 5000,
        });
      });
      clearResults();
    }
  }, [lastToolResults, addToast, clearResults]);

  // Calculate dimensions
  const PADDING = 16;
  const isMobile = windowSize.width < 768;
  const NAV_DOCK_WIDTH = isMobile ? 0 : 56;
  const HEADER_HEIGHT = 56;
  const MOBILE_NAV_HEIGHT = isMobile ? 64 : 0; // Height of mobile nav bar

  const normalSize = { width: isMobile ? windowSize.width - 32 : 384, height: 500 };
  const maximizedSize = {
    width: windowSize.width - NAV_DOCK_WIDTH - PADDING * 2,
    height: windowSize.height - HEADER_HEIGHT - MOBILE_NAV_HEIGHT - PADDING * 2,
  };

  const currentWidth = isMaximized ? maximizedSize.width : normalSize.width;
  const currentHeight = isMinimized ? 56 : isMaximized ? maximizedSize.height : normalSize.height;
  const messagesHeight = isMaximized ? maximizedSize.height - 180 : 320;

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (isMinimized) setIsMinimized(false);
  };

  // Trip mode: send message and process response with tools
  const sendTripMessage = useCallback(
    async (message: string) => {
      const userMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setTripMessages((prev) => [...prev, userMsg]);
      setTripIsLoading(true);

      try {
        // Get trip context for Claude
        const tripContext = getTripContext();
        const tripLocations = getTripLocations();

        // Call Convex HTTP action
        const convexUrl = import.meta.env.VITE_CONVEX_URL?.replace('.cloud', '.site') || '';
        const response = await fetch(`${convexUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...tripMessages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: message },
            ],
            tripId: tripId?.toString(),
            tripContext,
            tripLocations,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          // Extract text from response
          const textBlocks = data.content?.filter((block: any) => block.type === 'text') || [];
          const assistantMessage =
            textBlocks.map((block: any) => block.text).join('\n\n') ||
            "Sorry, I couldn't process that request.";

          const assistantMsg: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date(),
          };
          setTripMessages((prev) => [...prev, assistantMsg]);

          // Process tool calls (add locations, create itinerary)
          if (data.content && Array.isArray(data.content)) {
            await processToolCalls(data.content);
          }
        } else {
          const errorMsg: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            role: 'assistant',
            content: 'Sorry, there was an error processing your request. Please try again.',
            timestamp: new Date(),
          };
          setTripMessages((prev) => [...prev, errorMsg]);
        }
      } catch {
        const errorMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting. Please check your internet connection.",
          timestamp: new Date(),
        };
        setTripMessages((prev) => [...prev, errorMsg]);
      } finally {
        setTripIsLoading(false);
      }
    },
    [tripMessages, tripId, getTripContext, getTripLocations, processToolCalls]
  );

  // Unified send message handler
  const handleSendMessage = useCallback(
    (message: string) => {
      if (isTripMode) {
        sendTripMessage(message);
      } else if (legacyOnSendMessage) {
        legacyOnSendMessage(message);
      }
    },
    [isTripMode, sendTripMessage, legacyOnSendMessage]
  );

  // Unified clear history handler
  const handleClearHistory = useCallback(() => {
    if (isTripMode) {
      setTripMessages([]);
    } else if (legacyOnClearHistory) {
      legacyOnClearHistory();
    }
  }, [isTripMode, legacyOnClearHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      handleSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        className={`fixed z-50 w-16 h-16 bg-gradient-to-br from-sunset-500 via-sunset-600 to-ocean-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-sunset-500/40 ${
          isMobile ? 'right-4 bottom-20' : 'right-6 bottom-6'
        }`}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 20px 40px -12px rgba(236, 72, 153, 0.4)',
            '0 25px 50px -12px rgba(236, 72, 153, 0.5)',
            '0 20px 40px -12px rgba(236, 72, 153, 0.4)',
          ],
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        aria-label="Open AI Travel Assistant"
      >
        <Sparkles className="w-7 h-7 text-white" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="fixed z-50 bg-white/98 backdrop-blur-2xl border-2 border-slate-200/60 rounded-2xl shadow-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        width: currentWidth,
        height: currentHeight,
        right: isMaximized ? PADDING : isMobile ? 16 : 24,
        bottom: isMaximized ? PADDING + MOBILE_NAV_HEIGHT : isMobile ? 80 : 24,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-sunset-50 via-white to-ocean-50 border-b border-slate-200/80 cursor-pointer select-none backdrop-blur-sm"
        onDoubleClick={toggleMaximize}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-9 h-9 bg-gradient-to-br from-sunset-500 via-sunset-600 to-ocean-600 rounded-xl flex items-center justify-center shadow-lg shadow-sunset-500/30"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Travel Assistant</h3>
            <p className="text-[10px] text-slate-500 font-medium">
              {isMaximized
                ? 'Double-click to restore'
                : 'Powered by Claude • Double-click to maximize'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {dynamicPinsCount > 0 && (
            <motion.button
              onClick={onClearDynamicPins}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sunset-700 bg-sunset-50 hover:bg-sunset-100 rounded-lg transition-all"
              title="Clear AI-suggested pins"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-semibold">{dynamicPinsCount}</span>
              <X className="w-3 h-3" />
            </motion.button>
          )}
          <motion.button
            onClick={handleClearHistory}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Clear history"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => {
              if (isMaximized) setIsMaximized(false);
              setIsMinimized(!isMinimized);
            }}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Minimize"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Minus className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={toggleMaximize}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </motion.button>
          <motion.button
            onClick={() => {
              setIsOpen(false);
              setIsMaximized(false);
            }}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Close"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            className="overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
            style={{ height: messagesHeight }}
          >
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-10 px-4"
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-sunset-100 via-sunset-50 to-ocean-100 rounded-2xl flex items-center justify-center shadow-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <MessageSquare
                    className="w-10 h-10 text-gradient bg-gradient-to-br from-sunset-600 to-ocean-600"
                    style={
                      {
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      } as any
                    }
                  />
                </motion.div>
                <h4 className="text-slate-900 font-bold text-base mb-2">
                  {isTripMode ? `Let's plan your trip!` : 'How can I help?'}
                </h4>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-sm mx-auto">
                  {isTripMode
                    ? tripData?.trip?.destination
                      ? `I'll help you discover amazing places in ${tripData.trip.destination}. Ask me anything!`
                      : "Tell me about your trip and I'll suggest places to visit!"
                    : 'Ask me anything about your Malaysia trip!'}
                </p>
                <div className="space-y-2.5">
                  {suggestedQuestions.map((question, i) => (
                    <motion.button
                      key={`suggested-${i}-${question.slice(0, 20)}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 bg-gradient-to-r from-white to-slate-50 hover:from-sunset-50 hover:to-ocean-50 rounded-xl transition-all border border-slate-200 hover:border-sunset-300 shadow-sm hover:shadow-md group"
                      onClick={() => handleSendMessage(question)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="group-hover:text-slate-900 transition-colors">
                        {question}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-5 border-t border-slate-200/80 bg-gradient-to-b from-transparent to-slate-50/50"
          >
            {/* Import Suggestion Banner */}
            <AnimatePresence>
              {isPasteDetected && tripId && onOpenImport && (
                <ImportSuggestionBanner
                  characterCount={characterCount}
                  onImport={() => {
                    if (pastedText) {
                      onOpenImport(pastedText);
                      clearPaste();
                      setInput('');
                    }
                  }}
                  onSendAsMessage={() => {
                    // Just dismiss the banner - text is already in input
                    clearPaste();
                  }}
                  onDismiss={clearPaste}
                />
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2.5">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Ask about your trip..."
                  rows={1}
                  className="w-full bg-white/80 backdrop-blur-lg border-2 border-slate-200 hover:border-slate-300 focus:border-sunset-400 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sunset-500/10 resize-none max-h-24 transition-all shadow-sm"
                  style={{ minHeight: '48px' }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-sunset-500 via-sunset-600 to-ocean-600 text-white shadow-lg shadow-sunset-500/30 hover:shadow-xl hover:shadow-sunset-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-2.5 text-center">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-semibold">
                Enter
              </kbd>{' '}
              to send,{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-semibold">
                Shift+Enter
              </kbd>{' '}
              for new line
            </p>
          </form>
        </>
      )}

      {/* Undo Toast for AI actions */}
      <UndoToast toasts={toasts} onDismiss={dismissToast} />
    </motion.div>
  );
}
