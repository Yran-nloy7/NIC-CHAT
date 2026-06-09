import { useState, useRef, useEffect } from 'react';
import { useChatStore, type Message, renderContent } from '../store/chat';
import { useDataStore } from '../store/data';
import { Sidebar } from '../components/Sidebar';

const C = { bg: '#FFF5F8', card: '#FFFFFF', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentLight: '#FCE4EC', bubbleUser: '#F48FB1', bubbleUserText: '#FFFFFF', bubbleAi: '#FFFFFF', bubbleAiBorder: '#F0D8E0', inputBg: '#FFF0F5', sendBtn: '#E91E63', thinkingBg: '#FFF0F5', thinkingBorder: '#F48FB1' };

function Bubble({ msg, personaName, personaAvatar }: { msg: Message; personaName: string; personaAvatar: string }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start', animation: 'msgIn .25s ease-out' }}>
      <div style={{ fontSize: 11, color: C.text2, marginBottom: 3, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {isUser ? '你' : <><span>{personaAvatar}</span> {personaName}</>}
        {!isUser && msg.state === 'thinking' && <span style={{ color: '#D29922' }}>思考中...</span>}
        {!isUser && msg.state === 'answering' && <span style={{ color: C.accent }}>回复中...</span>}
      </div>
      <div style={{
        padding: '10px 15px', borderRadius: 14, fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word',
        background: isUser ? C.bubbleUser : C.bubbleAi,
        color: isUser ? C.bubbleUserText : C.text,
        border: isUser ? 'none' : `1px solid ${C.bubbleAiBorder}`,
        borderBottomRightRadius: isUser ? 4 : 14, borderBottomLeftRadius: isUser ? 14 : 4,
        boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,.04)',
      }}>
        {msg.thinking && (
          <div style={{ fontSize: 11, color: C.text2, marginBottom: 8, padding: '6px 10px', background: C.thinkingBg, borderRadius: 6, borderLeft: `2px solid ${C.thinkingBorder}`, maxHeight: 120, overflow: 'auto' }}>{msg.thinking}</div>
        )}
        {isUser ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span> : <div className="md" dangerouslySetInnerHTML={{ __html: msg.content ? renderContent(msg.content) : '' }} />}
        {!isUser && (msg.state === 'thinking' || msg.state === 'answering') && <span className="cursor" />}
      </div>
    </div>
  );
}

export function ChatPage() {
  const [input, setInput] = useState('');
  const messages = useChatStore(s => s.messages);
  const isStreaming = useChatStore(s => s.isStreaming);
  const sendMessage = useChatStore(s => s.sendMessage);
  const clearMessages = useChatStore(s => s.clearMessages);
  const personas = useDataStore(s => s.personas);
  const selectedId = useDataStore(s => s.selectedPersonaId);
  const selectPersona = useDataStore(s => s.selectPersona);
  const openPersonaEditor = useDataStore(s => s.openPersonaEditor);
  const bottomRef = useRef<HTMLDivElement>(null);

  const persona = personas.find(p => p.id === selectedId);
  const personaName = persona?.name || 'AI';
  const personaAvatar = persona?.avatar || '🤖';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming || !persona) return;
    setInput(''); sendMessage(text);
  };
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <Sidebar onSelect={selectPersona} onAdd={() => openPersonaEditor()} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{personaAvatar}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{personaName}</span>
            {persona && <span style={{ fontSize: 11, color: C.text2 }}>{persona.model} · temp {persona.temperature}</span>}
          </div>
          <button onClick={clearMessages} style={{ background: C.accentLight, border: 'none', borderRadius: 6, color: C.accent, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>🗑️ 清空</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: C.text3, marginTop: '15vh' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 14 }}>{persona ? `和 ${personaName} 开始对话` : '从左侧选择一个角色'}</div>
            </div>
          )}
          {messages.map(msg => <Bubble key={msg.id} msg={msg} personaName={personaName} personaAvatar={personaAvatar} />)}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '14px 20px', background: C.card, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea value={input} onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }} onKeyDown={handleKey}
              placeholder={persona ? `和 ${personaName} 说点什么...` : '请先选择角色'} rows={1} disabled={isStreaming || !persona}
              style={{ flex: 1, background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', minHeight: 44 }} />
            <button onClick={handleSend} disabled={isStreaming || !input.trim()}
              style={{ background: input.trim() && !isStreaming ? C.sendBtn : C.accentLight, border: 'none', borderRadius: 10, color: input.trim() && !isStreaming ? '#fff' : C.text3, padding: '0 20px', fontSize: 14, fontWeight: 600, cursor: input.trim() && !isStreaming ? 'pointer' : 'default' }}>发送</button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .cursor{display:inline-block;width:6px;height:14px;background:${C.accent};margin-left:2px;vertical-align:text-bottom;animation:blink .8s infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .md pre{background:#FFF0F5;border:1px solid ${C.border};border-radius:8px;padding:12px;overflow-x:auto;margin:8px 0;font-size:13px}
        .md code{font-family:monospace;font-size:13px;color:${C.accent}}
        .md pre code{color:${C.text}}
        .md blockquote{border-left:3px solid ${C.accent};padding-left:12px;color:${C.text2};margin:8px 0}
        .md ul,.md ol{margin:4px 0;padding-left:20px}
        .md p{margin:4px 0}
        .md table{border-collapse:collapse;width:100%;margin:8px 0}
        .md th,.md td{border:1px solid ${C.border};padding:6px 10px;text-align:left;font-size:13px}
        .md th{background:#FFF0F5}
      `}</style>
    </>
  );
}
