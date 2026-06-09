import type { MessageState } from '../core/fsm';

const STATE_LABELS: Record<MessageState, string> = {
  idle: '等待中',
  thinking: '🤔 深度思考中...',
  tool_calling: '🔧 调用插件...',
  answering: '💬 生成回答中...',
  completed: '✅ 回答完成',
  error: '❌ 发生错误',
};

const STATE_COLORS: Record<MessageState, string> = {
  idle: 'bg-gray-600',
  thinking: 'bg-yellow-500 animate-pulse',
  tool_calling: 'bg-blue-500 animate-pulse',
  answering: 'bg-green-500 animate-pulse',
  completed: 'bg-emerald-500',
  error: 'bg-red-500',
};

interface Props {
  state: MessageState;
  isStreaming: boolean;
}

export function StatusBar({ state, isStreaming }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 text-sm">
      <span className={`w-2 h-2 rounded-full ${STATE_COLORS[state]}`} />
      <span className="text-gray-300">{STATE_LABELS[state]}</span>
      {isStreaming && state !== 'idle' && (
        <span className="ml-auto text-gray-500 text-xs">流式传输中</span>
      )}
    </div>
  );
}
