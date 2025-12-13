import { ChatMessage as ChatMessageType } from '../../hooks/useAIChat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i} className="block font-semibold">{line.slice(2, -2)}</strong>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex items-start gap-2 my-1">
            <span className="text-cyan-400">-</span>
            <span>{line.slice(2)}</span>
          </div>
        );
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="my-1">{line}</p>;
    });
  };

  return (
    <div className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          isUser
            ? 'bg-pink-500 text-white'
            : 'bg-gradient-to-br from-cyan-500 to-purple-500 text-white'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser ? 'bg-pink-500 text-white ml-auto' : 'bg-slate-100 text-slate-900'
          }`}
        >
          <div className="text-sm leading-relaxed">{renderContent(message.content)}</div>
        </div>

        <div className={`text-xs text-slate-600 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
