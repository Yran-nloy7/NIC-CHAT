import { useState, useRef, useEffect } from 'react';
import { useChatStore, type Message, renderContent } from '../store/chat';
import { useDataStore } from '../store/data';
import { PersonaSelector } from './PersonaSelector';
import { SettingsModal } from './SettingsModal';

/* ── Message Bubble ── */
function Bubble({ msg, personaName, personaAvatar }: {
  msg: Message; personaName: string; personaAvatar: string;
}) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start',
      animation: 'msgIn .25s ease-out',
    }}>
      {/* Sender label */}
      <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 3, padding: '0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {isUser ? (
          '你'
        ) : (
          <>
            <span>{personaAvatar}</span> {personaName}
            {msg.state === 'thinking' && <span style={{ color: '#d29922', marginLeft: 4 }}>思考中...</span>}
            {msg.state === 'answering' && <span style={{ color: '#58a6ff', marginLeft: 4 }}>回复中...</span>}
          </>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        padding: '10px 15px', borderRadius: 14, fontSize: 14, lineHeight: 1.65,
        wordBreak: 'break-word',
        background: isUser ? '#238636' : '#21262d',
        color: isUser ? '#fff' : '#c9d1d9',
        border: isUser ? 'none' : '1px solid #30363d',
        borderBottomRightRadius: isUser ? 4 : 14,
        borderBottomLeftRadius: isUser ? 14 : 4,
        minWidth: 40,
      }}>
        {/* Thinking block */}
        {msg.thinking && (
          <div style={{
            fontSize: 11, color: '#8b949e', marginBottom: 8,
            padding: '6px 10px', background: '#1c2128', borderRadius: 6,
            borderLeft: '2px solid #d29922', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto',
          }}>
            {msg.thinking}
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
        ) : (
          <div
            className="md-content"
            dangerouslySetInnerHTML={{ __html: msg.content ? renderContent(msg.content) : '' }}
          />
        )}

        {/* Cursor */}
        {!isUser && (msg.state === 'thinking' || msg.state === 'answering') && (
          <span className="blink-cursor" />
        )}
      </div>
    </div>
  );
}

/* ── Main Chat View ── */
export function ChatView() {
  const [input, setInput] = useState('');
  const messages = useChatStore(s => s.messages);
  const isStreaming = useChatStore(s => s.isStreaming);
  const sendMessage = useChatStore(s => s.sendMessage);
  const clearMessages = useChatStore(s => s.clearMessages);
  const personas = useDataStore(s => s.personas);
  const selectedId = useDataStore(s => s.selectedPersonaId);
  const toggleSettings = useDataStore(s => s.toggleSettings);
  const bottomRef = useRef<HTMLDivElement>(null);

  const persona = personas.find(p => p.id === selectedId);
  const personaName = persona?.name || 'AI';
  const personaAvatar = persona?.avatar || '🤖';
  const hasPersonas = personas.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#0d1117', color: '#c9d1d9',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif",
    }}>
      {/* Settings Modal */}
      <SettingsModal />

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 18px', background: '#161b22',
        borderBottom: '1px solid #30363d', flexShrink: 0,
      }}>
        <h1 style={{
          fontSize: 15, fontWeight: 700,
          background: 'linear-gradient(135deg, #58a6ff, #bc8cff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginRight: 6, whiteSpace: 'nowrap',
        }}>
          AI Chat
        </h1>

        {/* Persona selector */}
        <PersonaSelector />

        <div style={{ flex: 1 }} />

        {/* Settings button */}
        <button onClick={toggleSettings} title="设置" style={headerBtn}>
          ⚙️ 设置
        </button>
        <button onClick={clearMessages} title="清空对话" style={headerBtn}>
          🗑️
        </button>
      </header>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#484f58', marginTop: '18vh' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            {hasPersonas ? (
              <>
                <div style={{ fontSize: 15, marginBottom: 6 }}>选择角色，开始对话</div>
                <div style={{ fontSize: 12, color: '#30363d' }}>
                  当前角色：{personaAvatar} {personaName}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, marginBottom: 6 }}>欢迎使用 AI Chat</div>
                <div style={{ fontSize: 12, color: '#484f58' }}>
                  点击右上角 ⚙️ 设置 → 添加 API 供应商和 AI 角色
                </div>
              </>
            )}
          </div>
        )}

        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} personaName={personaName} personaAvatar={personaAvatar} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <footer style={{
        padding: '14px 18px', background: '#161b22',
        borderTop: '1px solid #30363d', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8,
          maxWidth: 860, margin: '0 auto', width: '100%',
        }}>
          <textarea
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKey}
            placeholder={hasPersonas
              ? `和 ${personaName} 说点什么... (Enter 发送)`
              : '请先在设置中添加角色...'}
            rows={1}
            disabled={isStreaming || !hasPersonas}
            style={{
              flex: 1, background: '#21262d', border: '1px solid #30363d',
              color: '#c9d1d9', padding: '10px 14px', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', resize: 'none',
              outline: 'none', minHeight: 44,
            }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            style={{
              background: input.trim() && !isStreaming ? '#238636' : '#21262d',
              border: input.trim() && !isStreaming ? '1px solid #2ea043' : '1px solid #30363d',
              borderRadius: 10, color: input.trim() && !isStreaming ? '#fff' : '#484f58',
              padding: '0 20px', fontSize: 14, fontWeight: 500, cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              transition: 'all .15s',
            }}
          >
            发送
          </button>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .blink-cursor { display: inline-block; width: 6px; height: 14px; background: #58a6ff; margin-left: 2px; vertical-align: text-bottom; animation: blink .8s infinite; }
        @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
        .md-content pre { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 12px; overflow-x: auto; margin: 8px 0; font-size: 13px; }
        .md-content code { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 13px; color: #d2a8ff; }
        .md-content pre code { color: #c9d1d9; }
        .md-content h1,.md-content h2,.md-content h3 { margin: 8px 0 4px; color: #c9d1d9; }
        .md-content blockquote { border-left: 3px solid #58a6ff; padding-left: 12px; color: #8b949e; margin: 8px 0; }
        .md-content ul,.md-content ol { margin: 4px 0; padding-left: 20px; }
        .md-content p { margin: 4px 0; }
        .md-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        .md-content th,.md-content td { border: 1px solid #30363d; padding: 6px 10px; text-align: left; font-size: 13px; }
        .md-content th { background: #1c2128; }
      `}</style>
    </div>
  );
}

const headerBtn: React.CSSProperties = {
  background: '#21262d', border: '1px solid #30363d', borderRadius: 6,
  color: '#c9d1d9', padding: '5px 10px', fontSize: 12, cursor: 'pointer',
};
