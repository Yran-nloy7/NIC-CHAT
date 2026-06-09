import type { Message } from '../store/chat';
import { Markdown } from './Markdown';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-1' : ''}`}>
        {/* Avatar row */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isUser ? 'bg-blue-600' : 'bg-purple-600'
          }`}>
            {isUser ? 'U' : 'AI'}
          </div>
          <span className="text-xs text-gray-500">
            {isUser ? '你' : 'AI 助手'}
            {message.state !== 'completed' && message.state !== 'idle' && (
              <span className="ml-1 text-gray-600">· {message.state}</span>
            )}
          </span>
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <>
              {/* Thinking indicator */}
              {message.thinking && message.state === 'thinking' && (
                <p className="text-xs text-gray-400 italic mb-2 border-l-2 border-yellow-500 pl-2">
                  {message.thinking}
                </p>
              )}

              {/* Tool call badge */}
              {message.toolCall && (
                <div className="mb-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-900/50 border border-blue-700 rounded text-xs text-blue-300">
                  🔧 {message.toolCall.name}
                </div>
              )}

              {/* Tool result */}
              {message.toolResult && (
                <div className="mb-2 text-xs text-gray-400 bg-gray-900 rounded p-2">
                  结果: {String(message.toolResult)}
                </div>
              )}

              {/* Main content — Markdown */}
              <Markdown content={message.content} />

              {/* Streaming cursor */}
              {message.state !== 'completed' && message.state !== 'idle' && message.content.length > 0 && (
                <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5 align-middle" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
