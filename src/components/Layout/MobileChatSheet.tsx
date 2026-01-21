import { motion, AnimatePresence } from 'framer-motion';
import { useAtom, useSetAtom } from 'jotai';
import { X, Send, Sparkles, MessageSquare, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { type Id } from '../../../convex/_generated/dataModel';
import { panelsAtom, closePanelAtom } from '../../atoms/floatingPanelAtoms';
import { useAITripPlanner } from '../../hooks/useAITripPlanner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MobileChatSheetProps {
  tripId?: Id<"trips">;
}

// Dynamic questions based on trip context
function getSuggestedQuestions(destination?: string, travelerInfo?: string): string[] {
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
  } else {
    questions.push("Create a full day itinerary");
  }

  return questions.slice(0, 3);
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5
          ${isUser
            ? 'bg-sunset-600 text-white'
            : 'bg-slate-100 text-slate-900'
          }
        `}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isUser ? 'text-white/70' : 'text-slate-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 px-4 py-2.5 bg-slate-100 rounded-2xl w-fit"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`typing-${i}`}
          className="w-2 h-2 bg-slate-400 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

export function MobileChatSheet({ tripId }: MobileChatSheetProps) {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController>();

  const isOpen = panels.mobileChat?.isOpen && !panels.mobileChat?.isMinimized;

  // AI Trip Planner hook
  const {
    isProcessingTools,
    processToolCalls,
    getTripContext,
    getTripLocations,
    tripData,
  } = useAITripPlanner(tripId);

  const loading = isLoading || isProcessingTools;
  const suggestedQuestions = getSuggestedQuestions(tripData?.trip?.destination, tripData?.trip?.travelerInfo);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const tripContext = getTripContext();
      const tripLocations = getTripLocations();

      const convexUrl = import.meta.env.VITE_CONVEX_URL?.replace('.cloud', '.site') || '';
      const response = await fetch(`${convexUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message },
          ],
          tripId: tripId?.toString(),
          tripContext,
          tripLocations,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textBlocks = data.content?.filter((block: any) => block.type === 'text') || [];
        const assistantMessage = textBlocks.map((block: any) => block.text).join('\n\n')
          || 'I couldn\'t process that request. Please try again.';

        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 11),
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (data.content && Array.isArray(data.content)) {
          await processToolCalls(data.content);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Something went wrong. Please try again.';

        const errorMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 11),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      // Ignore abort errors - these are expected when unmounting or starting a new request
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: 'Unable to connect. Please check your internet connection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, tripId, getTripContext, getTripLocations, processToolCalls]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleClose = () => {
    closePanel('mobileChat');
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden bg-white flex flex-col"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0"
            style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900">Travel Assistant</h1>
                <p className="text-xs text-slate-500">Powered by Claude</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sunset-100 to-ocean-100 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-sunset-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  {tripData?.trip?.destination
                    ? `Let's plan your ${tripData.trip.destination} trip!`
                    : 'How can I help?'
                  }
                </h2>
                <p className="text-sm text-slate-600 mb-6 max-w-xs">
                  Ask me anything about your trip and I'll help you discover amazing places.
                </p>
                <div className="space-y-2 w-full max-w-xs">
                  {suggestedQuestions.map((question, i) => (
                    <button
                      key={`suggestion-${i}`}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                      onClick={() => sendMessage(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div
            className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 64px)' }}
          >
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about your trip..."
                rows={1}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500 resize-none max-h-24"
                style={{ minHeight: '48px' }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-sunset-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
