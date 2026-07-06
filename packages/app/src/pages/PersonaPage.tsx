import { useRef, useState } from 'react';
import { PersonaEditor } from '../components/PersonaEditor';
import { Sidebar } from '../components/Sidebar';
import { defaultPersona, useDataStore } from '../store/data';

export function PersonaPage() {
  const personas = useDataStore((s) => s.personas);
  const providers = useDataStore((s) => s.providers);
  const worlds = useDataStore((s) => s.worlds);
  const selectedId = useDataStore((s) => s.selectedPersonaId);
  const select = useDataStore((s) => s.selectPersona);
  const deletePersona = useDataStore((s) => s.deletePersona);
  const updatePersona = useDataStore((s) => s.updatePersona);
  const addPersona = useDataStore((s) => s.addPersona);
  const editingPersona = useDataStore((s) => s.editingPersona);
  const openEditor = useDataStore((s) => s.openPersonaEditor);
  const closeEditor = useDataStore((s) => s.closePersonaEditor);
  const exportCard = useDataStore((s) => s.exportPersonaCard);
  const importCard = useDataStore((s) => s.importPersonaCard);
  const memories = useDataStore((s) => s.memories);
  const addMemory = useDataStore((s) => s.addMemory);
  const deleteMemory = useDataStore((s) => s.deleteMemory);
  const [search, setSearch] = useState('');
  const [memoryOpen, setMemoryOpen] = useState(true);
  const [memoryText, setMemoryText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = personas.filter((item) => !search || item.name.includes(search));
  const selected = personas.find((item) => item.id === selectedId);
  const personaMemories = memories.filter((item) => item.personaId === selectedId).sort((a, b) => b.createdAt - a.createdAt);

  const createPersona = () => {
    const draft = defaultPersona();
    if (providers[0]) {
      draft.providerId = providers[0].id;
      draft.model = providers[0].models[0]?.id || '';
    }
    openEditor({ ...draft, id: '' });
  };

  const handleExport = () => {
    if (!selected) return;
    const card = exportCard(selected.id);
    if (!card) return;
    const blob = new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected.name}-persona-card.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const id = importCard(JSON.parse(reader.result as string));
        if (id) select(id);
      } catch {
        alert('导入失败，请检查 Persona Card 格式。');
      }
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Sidebar onAdd={createPersona} />

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
          <div className="flex items-center gap-3">
            <h2 className="m-0 text-base font-bold text-slate-900">人设通讯录</h2>
            <input className="input-field w-40 text-xs" placeholder="搜索角色..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <button onClick={createPersona} className="btn-primary">+ 添加角色</button>
        </div>

        <div className="flex flex-1 gap-6 overflow-auto p-6">
          <div className="w-[280px] shrink-0">
            {filtered.length === 0 && (
              <div className="py-10 text-center text-[13px] text-slate-400">{search ? '没有匹配结果' : '还没有角色'}</div>
            )}
            {filtered.map((persona) => {
              const provider = providers.find((item) => item.id === persona.providerId);
              return (
                <div
                  key={persona.id}
                  onClick={() => select(persona.id)}
                  className={`mb-1 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-3 transition-all duration-100 ${
                    persona.id === selectedId ? 'border-accent/20 bg-accent/10' : 'border-transparent bg-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-bold text-accent">{persona.avatar || 'AI'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-slate-900">{persona.name || '未命名'}</div>
                    <div className="text-[10px] text-slate-500">{provider?.name || '未绑定'} / {persona.model || '未配置'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1">
            {selected ? (
              <div className="card space-y-5 p-6">
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl font-bold text-accent">{selected.avatar || 'AI'}</span>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{selected.name}</div>
                    <div className="text-xs text-slate-500">
                      {providers.find((item) => item.id === selected.providerId)?.name || '未绑定'} / {selected.model} / temp {selected.temperature}
                    </div>
                  </div>
                </div>

                <div className="max-h-[200px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                  {selected.systemPrompt || '(未设置人设提示词)'}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>记忆：{selected.memoryEnabled ? `${selected.memoryTriggerRounds} 轮触发，最多 ${selected.maxMemories} 条` : '关闭'}</div>
                  <div>主动消息：{selected.proactiveEnabled ? `${selected.proactiveMinHours}-${selected.proactiveMaxHours} 小时` : '关闭'}</div>
                  <div>表情包：{selected.emojiEnabled ? `${selected.emojiProbability}%` : '关闭'}</div>
                  <div>世界观：{selected.worldId ? (worlds.find((item) => item.id === selected.worldId)?.name || '未知') : '无'}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => select(selected.id)} className="btn-primary text-xs">设为当前</button>
                  <button onClick={() => openEditor(selected)} className="btn-secondary text-xs">编辑</button>
                  <button onClick={handleExport} className="btn-secondary text-xs">导出卡片</button>
                  <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs">导入卡片</button>
                  <button onClick={() => { if (confirm(`删除 ${selected.name}？`)) deletePersona(selected.id); }} className="btn-danger text-xs">删除</button>
                </div>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

                <div>
                  <button onClick={() => setMemoryOpen(!memoryOpen)} className="w-full cursor-pointer text-left text-sm font-semibold text-slate-700 transition-colors hover:text-accent">
                    长期记忆 ({personaMemories.length})
                  </button>

                  {memoryOpen && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input className="input-field flex-1 text-xs" placeholder="手动添加一条记忆..." value={memoryText} onChange={(event) => setMemoryText(event.target.value)} />
                        <button
                          className="btn-secondary text-xs"
                          onClick={() => {
                            if (!memoryText.trim() || !selected) return;
                            addMemory({ personaId: selected.id, content: memoryText.trim(), summary: memoryText.trim(), triggerRound: 0, conversationRefs: [] });
                            setMemoryText('');
                          }}
                        >
                          添加
                        </button>
                      </div>
                      {personaMemories.length === 0 && <div className="py-4 text-center text-xs text-slate-400">暂无记忆</div>}
                      {personaMemories.map((memory) => (
                        <div key={memory.id} className="card flex items-start gap-3 p-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm leading-relaxed text-slate-800">{memory.summary || memory.content}</div>
                            <div className="mt-1.5 text-[10px] text-slate-400">{new Date(memory.createdAt).toLocaleString('zh-CN')}</div>
                          </div>
                          <button onClick={() => deleteMemory(memory.id)} className="btn-ghost shrink-0 text-red-400 hover:text-red-600">删除</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <div className="mb-3 text-4xl font-bold text-accent">Persona</div>
                <div className="text-sm">从左侧选择一个角色查看详情</div>
              </div>
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
            closeEditor();
          }}
          onCancel={closeEditor}
        />
      )}
    </>
  );
}
