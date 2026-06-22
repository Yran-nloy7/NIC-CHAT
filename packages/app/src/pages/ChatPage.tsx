import { useState, useRef, useEffect } from 'react';
import { useChatStore, type Message, renderMd } from '../store/chat';
import { useDataStore, defaultPersona, SCENARIO_PRESETS } from '../store/data';
import { Sidebar } from '../components/Sidebar';
import { PersonaEditor } from '../components/PersonaEditor';

function Bubble({ msg, name, av }: { msg: Message; name: string; av: string }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex flex-col max-w-[85%] msg-anim ${isUser ? 'items-end self-end' : 'items-start self-start'}`}>
      {/* 发送者标签 */}
      <div className="text-[11px] text-slate-500 mb-[3px] px-1">
        {isUser ? '你' : <><span>{av}</span> {name}</>}
        {!isUser && msg.state === 'thinking' && <span className="text-amber-600 ml-1">思考中...</span>}
        {!isUser && msg.state === 'answering' && <span className="text-accent ml-1">回复中...</span>}
      </div>

      {/* 气泡 */}
      <div className={`px-[15px] py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
        isUser
          ? 'bg-accent text-white rounded-br-[4px]'
          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-[4px] shadow-sm'
      }`}>
        {msg.thinking && (
          <div className="text-[11px] text-slate-500 mb-2 p-2 bg-slate-50 rounded-md border-l-2 border-accent max-h-[120px] overflow-auto">
            {msg.thinking}
          </div>
        )}
        {isUser
          ? <span className="whitespace-pre-wrap">{msg.content}</span>
          : <div className="md-render" dangerouslySetInnerHTML={{ __html: msg.content ? renderMd(msg.content) : '' }} />
        }
        {!isUser && (msg.state === 'thinking' || msg.state === 'answering') && <span className="cursor" />}
      </div>
    </div>
  );
}

export function ChatPage() {
  const [input, setInput] = useState('');
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);

  const messages = useChatStore(s => s.messages);
  const isStreaming = useChatStore(s => s.isStreaming);
  const send = useChatStore(s => s.sendMessage);
  const clear = useChatStore(s => s.clearMessages);

  const personas = useDataStore(s => s.personas);
  const selId = useDataStore(s => s.selectedPersonaId);
  const openEdit = useDataStore(s => s.openPersonaEditor);
  const editP = useDataStore(s => s.editingPersona);
  const closeEdit = useDataStore(s => s.closePersonaEditor);
  const addP = useDataStore(s => s.addPersona);
  const updP = useDataStore(s => s.updatePersona);
  const providers = useDataStore(s => s.providers);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const p = personas.find(x => x.id === selId);
  const scenario = SCENARIO_PRESETS.find(s => s.id === activeScenario);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Close scenario popover when clicking outside
  useEffect(() => {
    if (!showScenarios) return;
    const h = () => setShowScenarios(false);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [showScenarios]);

  const hSend = () => {
    const t = input.trim();
    if (!t || isStreaming || !p) return;
    setInput('');
    // Build system prompt addon from active scenario
    const addon = scenario ? scenario.systemPromptAddon : undefined;
    send(t, addon);
  };

  return (
    <>
      <Sidebar onAdd={() => {
        const d = defaultPersona();
        if (providers[0]) { d.providerId = providers[0].id; d.model = providers[0].models[0]?.id || ''; }
        openEdit({ ...d, id: '' } as any);
      }} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{p?.avatar || '💬'}</span>
            <span className="text-sm font-semibold text-slate-900">{p?.name || '选择一个角色'}</span>
            {p && <span className="text-[11px] text-slate-400">{p.model}</span>}
            {scenario && (
              <span className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                {scenario.icon} {scenario.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 情景预设按钮 */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowScenarios(!showScenarios); }}
                className={`btn-ghost text-xs flex items-center gap-1 ${activeScenario ? 'text-accent' : ''}`}
              >
                🎬 情景预设
              </button>
              {showScenarios && (
                <div
                  className="absolute right-0 top-full mt-1 w-[420px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 grid grid-cols-2 gap-2 max-h-[360px] overflow-auto"
                  onClick={e => e.stopPropagation()}
                >
                  {SCENARIO_PRESETS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setActiveScenario(activeScenario === s.id ? null : s.id); setShowScenarios(false); }}
                      className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        activeScenario === s.id
                          ? 'border-accent bg-accent/5'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{s.icon}</span>
                        <span className="text-[13px] font-semibold text-slate-800">{s.name}</span>
                        {activeScenario === s.id && <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full ml-auto">激活</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">{s.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={clear} className="btn-ghost text-xs">🗑️ 清空</button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3.5">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-[15vh]">
              <div className="text-5xl mb-3">💬</div>
              <div className="text-sm">{p ? `和 ${p.name} 开始对话` : '左侧选择或创建角色开始'}</div>
            </div>
          )}
          {messages.map(m => <Bubble key={m.id} msg={m} name={p?.name || 'AI'} av={p?.avatar || '🤖'} />)}
          <div ref={bottomRef} />
        </div>

        {/* 输入区 */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hSend(); } }}
              placeholder={p ? `和 ${p.name} 说点什么...` : '请先选择角色'}
              rows={1}
              disabled={isStreaming || !p}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 px-3.5 py-2.5 rounded-xl text-sm font-[inherit] resize-none outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[44px] placeholder:text-slate-400"
            />
            <button
              onClick={hSend}
              disabled={isStreaming || !input.trim()}
              className={`rounded-xl px-5 text-sm font-semibold transition-all duration-150 ${
                input.trim() && !isStreaming
                  ? 'bg-accent text-white cursor-pointer hover:bg-accent-dark active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-default'
              }`}
            >发送</button>
          </div>
        </div>
      </div>

      {editP !== undefined && (
        <PersonaEditor
          persona={editP}
          onSave={d => { if (editP?.id) updP(editP.id, d); else addP(d); closeEdit(); }}
          onCancel={closeEdit}
        />
      )}
    </>
  );
}
