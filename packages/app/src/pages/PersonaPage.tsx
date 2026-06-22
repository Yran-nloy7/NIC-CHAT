import { useState, useRef } from 'react';
import { useDataStore, defaultPersona } from '../store/data';
import { PersonaEditor } from '../components/PersonaEditor';
import { Sidebar } from '../components/Sidebar';

export function PersonaPage() {
  const personas = useDataStore(s => s.personas);
  const providers = useDataStore(s => s.providers);
  const selId = useDataStore(s => s.selectedPersonaId);
  const select = useDataStore(s => s.selectPersona);
  const del = useDataStore(s => s.deletePersona);
  const upd = useDataStore(s => s.updatePersona);
  const add = useDataStore(s => s.addPersona);
  const editP = useDataStore(s => s.editingPersona);
  const openE = useDataStore(s => s.openPersonaEditor);
  const closeE = useDataStore(s => s.closePersonaEditor);
  const exportCard = useDataStore(s => s.exportPersonaCard);
  const importCard = useDataStore(s => s.importPersonaCard);
  const memories = useDataStore(s => s.memories);
  const addMemory = useDataStore(s => s.addMemory);
  const deleteMemory = useDataStore(s => s.deleteMemory);
  const [search, setSearch] = useState('');
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = personas.filter(p => !search || p.name.includes(search));
  const selected = personas.find(p => p.id === selId);
  const personaMemories = memories.filter(m => m.personaId === selId).sort((a, b) => b.createdAt - a.createdAt);

  // ── 导出 ──
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

  // ── 导入 ──
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const card = JSON.parse(reader.result as string);
        const newId = importCard(card);
        if (newId) { select(newId); alert('导入成功！'); }
        else alert('导入失败：格式不正确');
      } catch { alert('导入失败：无法解析 JSON'); }
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // ── 总结对话 ──
  const handleSummarize = async () => {
    if (!selected) return;
    setSummarizing(true);
    try {
      // Get messages from chat store and build summary request
      const { useChatStore } = await import('../store/chat');
      const msgs = useChatStore.getState().messages;
      if (msgs.length === 0) { alert('当前没有对话消息可总结'); setSummarizing(false); return; }

      const res = await fetch('/api/memories/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      let summary = '';
      // Try to parse AI response
      const rawContent = data.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(rawContent);
        summary = parsed.summary || rawContent;
      } catch {
        summary = rawContent || '总结生成失败';
      }

      addMemory({
        personaId: selected.id,
        content: summary,
        summary,
        triggerRound: msgs.length,
        conversationRefs: [],
      });
    } catch (err) {
      alert('总结失败：' + (err instanceof Error ? err.message : '网络错误'));
    }
    setSummarizing(false);
  };

  return (
    <>
      <Sidebar onAdd={() => {
        const d = defaultPersona();
        if (providers[0]) { d.providerId = providers[0].id; d.model = providers[0].models[0]?.id || ''; }
        openE({ ...d, id: '' } as any);
      }} />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 m-0">🎭 人设通讯录</h2>
            <input
              className="input-field w-40 text-xs"
              placeholder="🔍 搜索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              const d = defaultPersona();
              if (providers[0]) { d.providerId = providers[0].id; d.model = providers[0].models[0]?.id || ''; }
              openE({ ...d, id: '' } as any);
            }}
            className="btn-primary"
          >+ 添加角色</button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-6 flex gap-6">
          {/* 左侧列表 */}
          <div className="w-[280px] shrink-0">
            {filtered.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-[13px]">
                {search ? '无匹配结果' : '还没有角色'}
              </div>
            )}
            {filtered.map(p => {
              const prov = providers.find(pr => pr.id === p.providerId);
              return (
                <div
                  key={p.id}
                  onClick={() => select(p.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg mb-1 cursor-pointer transition-all duration-100 ${
                    p.id === selId
                      ? 'bg-accent/10 border border-accent/20'
                      : 'bg-transparent border border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[22px]">{p.avatar || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">{p.name || '未命名'}</div>
                    <div className="text-[10px] text-slate-500">{prov?.name || '未绑定'} · {p.model || '未配置'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 右侧详情 */}
          <div className="flex-1">
            {selected ? (
              <div className="card p-6 space-y-5">
                {/* 头像和名称 */}
                <div className="flex items-center gap-3.5">
                  <span className="text-[40px]">{selected.avatar || '🤖'}</span>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{selected.name}</div>
                    <div className="text-xs text-slate-500">
                      {providers.find(pr => pr.id === selected.providerId)?.name || '未绑定'} · {selected.model} · temp {selected.temperature}
                    </div>
                  </div>
                </div>

                {/* 系统提示词 */}
                <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600 leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap">
                  {selected.systemPrompt || '(未设置人设提示词)'}
                </div>

                {/* 属性网格 */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>🌡️ Temperature: {selected.temperature}</div>
                  <div>📝 Max Tokens: {selected.maxTokens}</div>
                  <div>😊 表情包: {selected.emojiEnabled ? `开启 (${selected.emojiProbability}%)` : '关闭'}</div>
                  <div>🧠 记忆: {selected.memoryEnabled ? `开启 (${selected.memoryTriggerRounds}轮/${selected.maxMemories}条)` : '关闭'}</div>
                  <div>📢 主动消息: {selected.proactiveEnabled ? `开启 (${selected.proactiveMinHours}-${selected.proactiveMaxHours}h)` : '关闭'}</div>
                  <div>🌍 世界观: {selected.worldId ? (useDataStore.getState().worlds.find(w => w.id === selected.worldId)?.name || '未知') : '无'}</div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => select(selected.id)} className="btn-primary text-xs">
                    {selId === selected.id ? '✓ 当前角色' : '设为当前'}
                  </button>
                  <button onClick={() => openE(selected)} className="btn-secondary text-xs">✎ 编辑</button>
                  <button onClick={handleExport} className="btn-secondary text-xs">📥 导出卡片</button>
                  <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs">📤 导入</button>
                  <button onClick={() => { if (confirm(`删除「${selected.name}」？`)) del(selected.id); }} className="btn-danger text-xs">🗑 删除</button>
                </div>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

                {/* ── 记忆时间线 ── */}
                <div>
                  <button
                    onClick={() => setMemoryOpen(!memoryOpen)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer hover:text-accent transition-colors w-full text-left"
                  >
                    <span className={`transition-transform ${memoryOpen ? 'rotate-90' : ''}`}>▶</span>
                    <span>🧠 记忆时间线 ({personaMemories.length})</span>
                  </button>

                  {memoryOpen && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="btn-secondary text-xs w-full"
                      >
                        {summarizing ? '⏳ 正在总结...' : '🪄 总结当前对话为记忆'}
                      </button>
                      {personaMemories.length === 0 && (
                        <div className="text-center text-slate-400 text-xs py-4">暂无记忆，开始对话后点击上方按钮总结</div>
                      )}
                      {personaMemories.map(m => (
                        <div key={m.id} className="card p-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-800 leading-relaxed">{m.summary || m.content}</div>
                            <div className="text-[10px] text-slate-400 mt-1.5">
                              第 {m.triggerRound} 轮 · {new Date(m.createdAt).toLocaleString('zh-CN')}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteMemory(m.id)}
                            className="btn-ghost text-red-400 hover:text-red-600 shrink-0"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-16">
                <div className="text-4xl mb-3">👈</div>
                <div className="text-sm">从左侧选择一个角色查看详情</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editP !== undefined && (
        <PersonaEditor
          persona={editP}
          onSave={d => { if (editP?.id) upd(editP.id, d); else add(d); closeE(); }}
          onCancel={closeE}
        />
      )}
    </>
  );
}
