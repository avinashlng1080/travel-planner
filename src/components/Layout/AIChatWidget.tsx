import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2, Maximize2, Send, Trash2, Sparkles } from 'lucide-react';
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
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
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
            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
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
          className="w-2 h-2 bg-cyan-400 rounded-full"
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
  onSendMessage,
  onClearHistory,
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 w-96 bg-white backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        height: isMinimized ? 56 : 500,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Travel Assistant</h3>
            <p className="text-[10px] text-slate-600">Powered by Claude</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClearHistory}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[360px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-pink-400" />
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
                className="flex-1 bg-white backdrop-blur-lg border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none max-h-24"
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
