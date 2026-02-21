import { X, Send, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { ChatMessage } from './ChatMessage';
import { useAIChat } from '../../hooks/useAIChat';

export function AIChat() {
  const { messages, loading, sendMessage, clearHistory } = useAIChat();
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) {return;}
    const messageText = input;
    setInput('');
    await sendMessage(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as any);
    }
  };

  const suggestedQuestions = [
    "What should we pack for our trip?",
    "What are some kid-friendly activities nearby?",
    "Best family restaurants in the area?",
    "What's the best way to get around?",
  ];

  return (
    <div
      className="fixed bottom-0 right-0 md:right-4 md:bottom-4 w-full md:w-96 bg-white rounded-t-lg md:rounded-lg shadow-2xl border border-slate-200 flex flex-col z-50 transition-all duration-300"
      style={{ height: isExpanded ? '500px' : '60px', maxHeight: '80vh' }}
    >
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-sunset-500 to-ocean-600 rounded-t-lg cursor-pointer"
        onClick={() => { setIsExpanded(!isExpanded); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isExpanded ? 'Collapse AI chat' : 'Expand AI chat'}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            AI
          </div>
          <div>
            <h3 className="font-semibold text-white">Travel AI Assistant</h3>
            <p className="text-xs text-white/80">Powered by Claude</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Clear all chat history?')) {clearHistory();}
              }}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          )}
          <button className="p-2 hover:bg-white/10 rounded transition-colors">
            <X className={`w-5 h-5 text-white transition-transform ${isExpanded ? '' : 'rotate-45'}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-white space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">Hello!</div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">
                  Welcome to Travel AI
                </h4>
                <p className="text-sm text-slate-600 mb-6">
                  Ask me anything about your family trip!
                </p>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-3">
                    Try asking:
                  </p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => { setInput(question); }}
                      className="block w-full text-left p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-900 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-ocean-500 flex items-center justify-center text-sm">
                      AI
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="p-4 bg-slate-100 border-t border-slate-200 rounded-b-lg">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); }}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your trip..."
                className="flex-1 bg-white text-slate-900 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sunset-500 placeholder-slate-500 min-h-[44px] max-h-32"
                rows={1}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-sunset-500 to-ocean-600 hover:from-sunset-600 hover:to-ocean-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg px-4 py-3 font-medium transition-all disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
