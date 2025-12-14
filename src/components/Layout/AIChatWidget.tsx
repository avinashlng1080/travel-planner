import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minus, Minimize2, Square, Send, Trash2, Sparkles, MapPin } from 'lucide-react';
import { GlassButton, GlassInput } from '../ui/GlassPanel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  messages: ChatMessage[];
  isLoading: boolean;
  dynamicPinsCount?: number;
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
  onClearDynamicPins?: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What should I bring to Batu Caves?",
  "Best time to visit KLCC Park with a toddler?",
  "Indoor activities for rainy days?",
  "Where can I find good nursing rooms?",
];

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
  messages,
  isLoading,
  dynamicPinsCount = 0,
  onSendMessage,
  onClearHistory,
  onClearDynamicPins,
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
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
            onClick={onClearHistory}
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
                <h4 className="text-slate-900 font-medium mb-2">How can I help?</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Ask me anything about your Malaysia trip!
                </p>
                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map((question, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      onClick={() => onSendMessage(question)}
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
    </motion.div>
  );
}
