import { useState, useRef, useEffect } from 'react';
import { useChatStore, type Message, renderMd } from '../store/chat';
import { useDataStore, defaultPersona } from '../store/data';
import { Sidebar } from '../components/Sidebar';
import { PersonaEditor } from '../components/PersonaEditor';

const C = { bg: '#FFF5F8', card: '#fff', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentBg: '#FCE4EC', userBg: '#F48FB1', userText: '#fff', aiBg: '#fff', aiBorder: '#F0D8E0', inputBg: '#FFF0F5', thinkingBg: '#FFF0F5', thinkingBorder: '#F48FB1' };

function Bubble({ msg, name, av }: { msg: Message; name: string; av: string }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start', animation: 'msgIn .25s ease-out' }}>
      <div style={{ fontSize: 11, color: C.text2, marginBottom: 3, padding: '0 4px' }}>{isUser ? '你' : <><span>{av}</span> {name}</>}{!isUser && msg.state === 'thinking' && <span style={{ color: '#D29922' }}> 思考中...</span>}{!isUser && msg.state === 'answering' && <span style={{ color: C.accent }}> 回复中...</span>}</div>
      <div style={{ padding: '10px 15px', borderRadius: 14, fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word', background: isUser ? C.userBg : C.aiBg, color: isUser ? C.userText : C.text, border: isUser ? 'none' : `1px solid ${C.aiBorder}`, borderBottomRightRadius: isUser ? 4 : 14, borderBottomLeftRadius: isUser ? 14 : 4, boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,.04)' }}>
        {msg.thinking && <div style={{ fontSize: 11, color: C.text2, marginBottom: 8, padding: '6px 10px', background: C.thinkingBg, borderRadius: 6, borderLeft: `2px solid ${C.thinkingBorder}`, maxHeight: 120, overflow: 'auto' }}>{msg.thinking}</div>}
        {isUser ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span> : <div className="md" dangerouslySetInnerHTML={{ __html: msg.content ? renderMd(msg.content) : '' }} />}
        {!isUser && (msg.state === 'thinking' || msg.state === 'answering') && <span className="cursor" />}
      </div>
    </div>
  );
}

export function ChatPage() {
  const [input, setInput] = useState('');
  const messages = useChatStore(s => s.messages); const isStreaming = useChatStore(s => s.isStreaming);
  const send = useChatStore(s => s.sendMessage); const clear = useChatStore(s => s.clearMessages);
  const personas = useDataStore(s => s.personas); const selId = useDataStore(s => s.selectedPersonaId);
  const openEdit = useDataStore(s => s.openPersonaEditor); const editP = useDataStore(s => s.editingPersona);
  const closeEdit = useDataStore(s => s.closePersonaEditor); const addP = useDataStore(s => s.addPersona);
  const updP = useDataStore(s => s.updatePersona); const providers = useDataStore(s => s.providers);
  const bottomRef = useRef<HTMLDivElement>(null);

  const p = personas.find(x => x.id === selId);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const hSend = () => { const t = input.trim(); if (!t || isStreaming || !p) return; setInput(''); send(t); };

  return (
    <>
      <Sidebar onAdd={() => { const d = defaultPersona(); if (providers[0]) { d.providerId = providers[0].id; d.model = providers[0].models[0]?.id || ''; } openEdit({ ...d, id: '' } as any); }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20 }}>{p?.avatar || '💬'}</span><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p?.name || '选择一个角色'}</span>{p && <span style={{ fontSize: 11, color: C.text2 }}>{p.model}</span>}</div>
          <button onClick={clear} style={{ background: C.accentBg, border: 'none', borderRadius: 6, color: C.accent, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>🗑️ 清空</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 && <div style={{ textAlign: 'center', color: C.text3, marginTop: '15vh' }}><div style={{ fontSize: 48, marginBottom: 12 }}>💬</div><div style={{ fontSize: 14 }}>{p ? `和 ${p.name} 开始对话` : '左侧选择或创建角色开始'}</div></div>}
          {messages.map(m => <Bubble key={m.id} msg={m} name={p?.name || 'AI'} av={p?.avatar || '🤖'} />)}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '14px 20px', background: C.card, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea value={input} onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hSend(); } }}
              placeholder={p ? `和 ${p.name} 说点什么...` : '请先选择角色'} rows={1} disabled={isStreaming || !p}
              style={{ flex: 1, background: C.inputBg, border: `1px solid ${C.border}`, color: C.text, padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', minHeight: 44 }} />
            <button onClick={hSend} disabled={isStreaming || !input.trim()} style={{ background: input.trim() && !isStreaming ? C.accent : C.accentBg, border: 'none', borderRadius: 10, color: input.trim() && !isStreaming ? '#fff' : C.text3, padding: '0 20px', fontSize: 14, fontWeight: 600, cursor: input.trim() && !isStreaming ? 'pointer' : 'default' }}>发送</button>
          </div>
        </div>
      </div>
      {editP !== undefined && <PersonaEditor persona={editP} onSave={d => { if (editP?.id) updP(editP.id, d); else addP(d); closeEdit(); }} onCancel={closeEdit} />}
      <style>{`@keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .cursor{display:inline-block;width:6px;height:14px;background:${C.accent};margin-left:2px;vertical-align:text-bottom;animation:blink .8s infinite} @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} .md pre{background:#FFF0F5;border:1px solid ${C.border};border-radius:8px;padding:12px;overflow-x:auto;margin:8px 0} .md code{color:${C.accent}} .md pre code{color:${C.text}} .md blockquote{border-left:3px solid ${C.accent};padding-left:12px;color:${C.text2};margin:8px 0} .md ul,.md ol{margin:4px 0;padding-left:20px} .md p{margin:4px 0} .md table{border-collapse:collapse;width:100%} .md th,.md td{border:1px solid ${C.border};padding:6px 10px;text-align:left;font-size:13px} .md th{background:#FFF0F5}`}</style>
    </>
  );
}
