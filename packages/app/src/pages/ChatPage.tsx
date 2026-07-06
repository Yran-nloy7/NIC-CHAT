import { useEffect, useRef, useState } from 'react';
import { PersonaEditor } from '../components/PersonaEditor';
import { Sidebar } from '../components/Sidebar';
import { type Message, renderMd, useChatStore } from '../store/chat';
import { SCENARIO_PRESETS, defaultPersona, useDataStore } from '../store/data';

function Bubble({ msg, name, avatar }: { msg: Message; name: string; avatar: string }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`msg-anim flex max-w-[85%] flex-col ${isUser ? 'items-end self-end' : 'items-start self-start'}`}>
      <div className="mb-[3px] px-1 text-[11px] text-slate-500">
        {isUser ? '你' : <><span className="font-semibold text-accent">{avatar}</span> {name}</>}
        {!isUser && msg.state === 'thinking' && <span className="ml-1 text-amber-600">思考中...</span>}
        {!isUser && msg.state === 'answering' && <span className="ml-1 text-accent">回复中...</span>}
        {!isUser && msg.state === 'error' && <span className="ml-1 text-red-500">出错</span>}
      </div>

      <div className={`rounded-2xl px-[15px] py-2.5 text-sm leading-relaxed shadow-sm break-words ${
        isUser
          ? 'rounded-br-[4px] bg-accent text-white'
          : msg.state === 'error'
            ? 'rounded-bl-[4px] border border-red-200 bg-red-50 text-red-700'
            : 'rounded-bl-[4px] border border-slate-200 bg-white text-slate-900'
      }`}>
        {msg.thinking && (
          <div className="mb-2 max-h-[120px] overflow-auto rounded-md border-l-2 border-accent bg-slate-50 p-2 text-[11px] text-slate-500">
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

  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const send = useChatStore((s) => s.sendMessage);
  const stop = useChatStore((s) => s.stopStreaming);
  const retry = useChatStore((s) => s.retryLast);
  const clear = useChatStore((s) => s.clearMessages);

  const personas = useDataStore((s) => s.personas);
  const selectedId = useDataStore((s) => s.selectedPersonaId);
  const openEdit = useDataStore((s) => s.openPersonaEditor);
  const editingPersona = useDataStore((s) => s.editingPersona);
  const closeEdit = useDataStore((s) => s.closePersonaEditor);
  const addPersona = useDataStore((s) => s.addPersona);
  const updatePersona = useDataStore((s) => s.updatePersona);
  const providers = useDataStore((s) => s.providers);

  const bottomRef = useRef<HTMLDivElement>(null);
  const persona = personas.find((item) => item.id === selectedId);
  const scenario = SCENARIO_PRESETS.find((item) => item.id === activeScenario);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showScenarios) return;
    const close = () => setShowScenarios(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showScenarios]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming || !persona) return;
    setInput('');
    send(text, scenario?.systemPromptAddon);
  };

  const createPersona = () => {
    const draft = defaultPersona();
    if (providers[0]) {
      draft.providerId = providers[0].id;
      draft.model = providers[0].models[0]?.id || '';
    }
    openEdit({ ...draft, id: '' });
  };

  return (
    <>
      <Sidebar onAdd={createPersona} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-accent">{persona?.avatar || 'AI'}</span>
            <span className="text-sm font-semibold text-slate-900">{persona?.name || '选择一个角色 Agent'}</span>
            {persona && <span className="text-[11px] text-slate-400">{persona.model}</span>}
            {scenario && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                {scenario.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setShowScenarios(!showScenarios);
                }}
                className={`btn-ghost flex items-center gap-1 text-xs ${activeScenario ? 'text-accent' : ''}`}
              >
                场景预设
              </button>
              {showScenarios && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 grid max-h-[360px] w-[420px] grid-cols-2 gap-2 overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  {SCENARIO_PRESETS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveScenario(activeScenario === item.id ? null : item.id);
                        setShowScenarios(false);
                      }}
                      className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                        activeScenario === item.id
                          ? 'border-accent bg-accent/5'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-accent">{item.icon}</span>
                        <span className="text-[13px] font-semibold text-slate-800">{item.name}</span>
                      </div>
                      <div className="text-[11px] leading-snug text-slate-500">{item.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={retry} className="btn-ghost text-xs">重试</button>
            <button onClick={clear} className="btn-ghost text-xs">清空</button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-6">
          {messages.length === 0 && (
            <div className="mt-[15vh] text-center text-slate-400">
              <div className="mb-3 text-4xl font-bold text-accent">NIC</div>
              <div className="text-sm">{persona ? `和 ${persona.name} 开始对话` : '左侧选择或创建角色开始'}</div>
            </div>
          )}
          {messages.map((message) => (
            <Bubble key={message.id} msg={message} name={persona?.name || 'AI'} avatar={persona?.avatar || 'AI'} />
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3.5">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                const el = event.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder={persona ? `和 ${persona.name} 说点什么...` : '请先选择角色'}
              rows={1}
              disabled={isStreaming || !persona}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {isStreaming ? (
              <button onClick={stop} className="rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-all active:scale-95">
                停止
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !persona}
                className={`rounded-xl px-5 text-sm font-semibold transition-all duration-150 ${
                  input.trim() && persona
                    ? 'cursor-pointer bg-accent text-white hover:bg-accent-dark active:scale-95'
                    : 'cursor-default bg-slate-100 text-slate-400'
                }`}
              >
                发送
              </button>
            )}
          </div>
        </div>
      </div>

      {editingPersona !== undefined && (
        <PersonaEditor
          persona={editingPersona}
          onSave={(data) => {
            if (editingPersona?.id) updatePersona(editingPersona.id, data);
            else addPersona(data);
            closeEdit();
          }}
          onCancel={closeEdit}
        />
      )}
    </>
  );
}
