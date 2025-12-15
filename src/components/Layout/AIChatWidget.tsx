import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minus, Minimize2, Square, Send, Trash2, Sparkles, MapPin, Loader2 } from 'lucide-react';
import { GlassButton } from '../ui/GlassPanel';
import { useAITripPlanner } from '../../hooks/useAITripPlanner';
import { UndoToast, useToasts } from '../ui/UndoToast';
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
  tripId?: Id<"trips">;
}

// Default questions for legacy Malaysia trip
const LEGACY_SUGGESTED_QUESTIONS = [
  "What should I bring to Batu Caves?",
  "Best time to visit KLCC Park with a toddler?",
  "Indoor activities for rainy days?",
  "Where can I find good nursing rooms?",
];

// Dynamic questions for user-created trips
function getDynamicSuggestedQuestions(destination?: string, travelerInfo?: string): string[] {
  const questions: string[] = [];

  if (destination) {
    questions.push(`What are the must-see attractions in ${destination}?`);
    questions.push(`Find me the best restaurants in ${destination}`);
  } else {
    questions.push("What are some must-see attractions?");
    questions.push("Find me the best restaurants");
  }

  if (travelerInfo?.toLowerCase().includes('toddler') || travelerInfo?.toLowerCase().includes('kid') || travelerInfo?.toLowerCase().includes('child')) {
    questions.push("What are kid-friendly activities?");
    questions.push("Where can I find playgrounds nearby?");
  } else {
    questions.push("Create a full day itinerary");
    questions.push("What local experiences should I try?");
  }

  return questions.slice(0, 4);
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-gradient-to-r from-sunset-500 to-ocean-600 text-white'
            : 'bg-slate-100 text-slate-900'
          }
        `}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className="text-[10px] mt-1 opacity-60">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-slate-100 rounded-2xl w-fit">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-ocean-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
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
}: AIChatWidgetProps) {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

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
  const messages = isTripMode ? tripMessages : (legacyMessages || []);
  const isLoading = isTripMode ? (tripIsLoading || isProcessingTools) : (legacyIsLoading || false);

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
    width: windowSize.width - NAV_DOCK_WIDTH - (PADDING * 2),
    height: windowSize.height - HEADER_HEIGHT - MOBILE_NAV_HEIGHT - (PADDING * 2),
  };

  const currentWidth = isMaximized ? maximizedSize.width : normalSize.width;
  const currentHeight = isMinimized ? 56 : (isMaximized ? maximizedSize.height : normalSize.height);
  const messagesHeight = isMaximized ? maximizedSize.height - 180 : 360;

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (isMinimized) setIsMinimized(false);
  };

  // Trip mode: send message and process response with tools
  const sendTripMessage = useCallback(async (message: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setTripMessages(prev => [...prev, userMsg]);
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
        const assistantMessage = textBlocks.map((block: any) => block.text).join('\n\n')
          || 'Sorry, I couldn\'t process that request.';

        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date(),
        };
        setTripMessages(prev => [...prev, assistantMsg]);

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
        setTripMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please check your internet connection.',
        timestamp: new Date(),
      };
      setTripMessages(prev => [...prev, errorMsg]);
    } finally {
      setTripIsLoading(false);
    }
  }, [tripMessages, tripId, getTripContext, getTripLocations, processToolCalls]);

  // Unified send message handler
  const handleSendMessage = useCallback((message: string) => {
    if (isTripMode) {
      sendTripMessage(message);
    } else if (legacyOnSendMessage) {
      legacyOnSendMessage(message);
    }
  }, [isTripMode, sendTripMessage, legacyOnSendMessage]);

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
        className={`fixed right-4 z-50 w-14 h-14 bg-gradient-to-r from-sunset-500 to-ocean-600 rounded-full flex items-center justify-center shadow-lg shadow-glow-sunset ${
          isMobile ? 'bottom-20' : 'bottom-4'
        }`}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Travel Assistant"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="fixed z-50 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        width: currentWidth,
        height: currentHeight,
        right: isMaximized ? PADDING : 16,
        bottom: isMaximized ? PADDING + MOBILE_NAV_HEIGHT : (isMobile ? 80 : 16),
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sunset-500/10 to-ocean-600/10 border-b border-slate-200 cursor-pointer select-none"
        onDoubleClick={toggleMaximize}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-sunset-500 to-ocean-600 rounded-full flex items-center justify-center shadow-glow-sunset">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Travel Assistant</h3>
            <p className="text-[10px] text-slate-600">
              {isMaximized ? 'Double-click to restore' : 'Powered by Claude • Double-click to maximize'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dynamicPinsCount > 0 && (
            <button
              onClick={onClearDynamicPins}
              className="flex items-center gap-1 px-2 py-1 text-xs text-sunset-600 hover:text-sunset-800 hover:bg-sunset-50 rounded-lg transition-colors"
              title="Clear AI-suggested pins"
            >
              <MapPin className="w-3 h-3" />
              <span>{dynamicPinsCount}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (isMaximized) setIsMaximized(false);
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMaximized(false);
            }}
            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            className="overflow-y-auto p-4 space-y-4"
            style={{ height: messagesHeight }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-sunset-500/20 to-ocean-600/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-sunset-500" />
                </div>
                <h4 className="text-slate-900 font-medium mb-2">
                  {isTripMode ? `Let's plan your trip!` : 'How can I help?'}
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  {isTripMode
                    ? tripData?.trip?.destination
                      ? `I'll help you discover amazing places in ${tripData.trip.destination}. Ask me anything!`
                      : 'Tell me about your trip and I\'ll suggest places to visit!'
                    : 'Ask me anything about your Malaysia trip!'
                  }
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      onClick={() => handleSendMessage(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your trip..."
                rows={1}
                className="flex-1 bg-white backdrop-blur-lg border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 resize-none max-h-24"
                style={{ minHeight: '44px' }}
              />
              <GlassButton
                type="submit"
                variant="primary"
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 flex items-center justify-center !p-0"
              >
                <Send className="w-5 h-5" />
              </GlassButton>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </>
      )}

      {/* Undo Toast for AI actions */}
      <UndoToast toasts={toasts} onDismiss={dismissToast} />
    </motion.div>
  );
}
