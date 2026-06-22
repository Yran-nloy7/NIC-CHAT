import { useState } from 'react';
import { useDataStore } from '../store/data';
import { WorldEditor } from '../components/WorldEditor';

export function ExpansionPage() {
  const worlds = useDataStore(s => s.worlds);
  const personas = useDataStore(s => s.personas);
  const agents = useDataStore(s => s.agents);
  const moments = useDataStore(s => s.moments);
  const selWorldId = useDataStore(s => s.selectedWorldId);
  const selWorld = useDataStore(s => s.selectWorld);
  const addW = useDataStore(s => s.addWorld);
  const updW = useDataStore(s => s.updateWorld);
  const delW = useDataStore(s => s.deleteWorld);
  const addA = useDataStore(s => s.addAgent);
  const updA = useDataStore(s => s.updateAgent);
  const delA = useDataStore(s => s.deleteAgent);
  const addM = useDataStore(s => s.addMoment);
  const likeM = useDataStore(s => s.likeMoment);
  const editW = useDataStore(s => s.editingWorld);
  const openW = useDataStore(s => s.openWorldEditor);
  const closeW = useDataStore(s => s.closeWorldEditor);
  const [newMoment, setNewMoment] = useState('');
  const [generating, setGenerating] = useState(false);

  const world = worlds.find(w => w.id === selWorldId);
  const worldPersonas = personas.filter(p => p.worldId === selWorldId);
  const worldMoments = moments.filter(m => worldPersonas.some(wp => wp.id === m.personaId));

  // ── AI 生成朋友圈 ──
  const handleGenerate = async () => {
    const firstPersona = worldPersonas[0];
    if (!firstPersona) { alert('该世界观下没有角色'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/moments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: firstPersona.name,
          personaSystemPrompt: firstPersona.systemPrompt,
          recentMessages: [],
        }),
      });
      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content || '';
      let content = rawContent;
      let mood = '😊';
      try {
        const parsed = JSON.parse(rawContent);
        content = parsed.content || rawContent;
        mood = parsed.mood || '😊';
      } catch {}

      addM({
        personaId: firstPersona.id,
        content,
        images: [],
        mood,
        isAuto: true,
      });
    } catch (err) {
      alert('生成失败：' + (err instanceof Error ? err.message : '网络错误'));
    }
    setGenerating(false);
  };

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {/* 左侧：世界观 + Agent */}
      <aside className="w-[240px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        {/* 世界观标题 */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex justify-between items-center">
          <span className="section-label">世界观</span>
          <button onClick={() => openW()} className="bg-accent text-white rounded-md w-6 h-6 text-sm cursor-pointer font-semibold hover:bg-accent-dark transition-colors">+</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {worlds.length === 0 && <div className="p-5 text-center text-slate-400 text-[11px]">暂无世界观<br />点击 + 创建</div>}
          {worlds.map(w => (
            <div
              key={w.id}
              onClick={() => selWorld(w.id)}
              className={`px-3 py-2.5 rounded-lg mb-0.5 cursor-pointer transition-all duration-100 ${
                w.id === selWorldId ? 'bg-accent/10' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: w.coverColor || '#6366F1' }} />
                <span className={`text-[13px] ${w.id === selWorldId ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{w.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 ml-4">{personas.filter(p => p.worldId === w.id).length} 个角色</div>
            </div>
          ))}
        </div>

        {/* Agent 区 */}
        <div className="border-t border-slate-200 p-2.5">
          <div className="flex justify-between items-center mb-2">
            <span className="section-label">Agent</span>
            <button
              onClick={() => addA({ name: '新 Agent', type: 'stdio', command: '', enabled: false })}
              className="bg-accent/10 text-accent rounded w-5 h-5 text-xs cursor-pointer font-semibold hover:bg-accent/20 transition-colors"
            >+</button>
          </div>
          {agents.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 py-1 text-[11px]">
              <input type="checkbox" checked={a.enabled} onChange={e => updA(a.id, { enabled: e.target.checked })} className="accent-accent" />
              <span className={`flex-1 ${a.enabled ? 'text-slate-700' : 'text-slate-400'}`}>{a.name}</span>
              <button onClick={() => delA(a.id)} className="bg-transparent border-none text-slate-400 cursor-pointer text-[10px] hover:text-red-500">✕</button>
            </div>
          ))}
        </div>
      </aside>

      {/* 右侧内容 */}
      <main className="flex-1 overflow-auto p-6 bg-slate-50">
        {!world ? (
          <div className="text-center text-slate-400 py-20">
            <div className="text-5xl mb-3">🌍</div>
            <div className="text-sm">选择或创建一个世界观</div>
            <div className="text-xs mt-1.5">一个世界观可以衍生多个角色</div>
          </div>
        ) : (
          <div className="max-w-[700px]">
            {/* 世界观信息 */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white" style={{ background: world.coverColor || '#6366F1' }}>🌍</div>
              <div>
                <div className="text-lg font-bold text-slate-900">{world.name}</div>
                <div className="text-xs text-slate-500">{world.description || '暂无描述'}</div>
              </div>
              <div className="flex-1" />
              <button onClick={() => openW(world)} className="btn-secondary text-xs">✎ 编辑</button>
              <button onClick={() => { if (confirm('删除？')) delW(world.id); }} className="btn-danger text-xs">🗑</button>
            </div>

            {/* 下属角色 */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-slate-800 mb-2.5">📋 下属角色 ({worldPersonas.length})</div>
              {worldPersonas.length === 0 && <div className="text-slate-400 text-xs">暂无 — 在角色编辑中关联此世界观</div>}
              <div className="flex gap-2.5 flex-wrap">
                {worldPersonas.map(p => (
                  <div key={p.id} className="card px-3.5 py-2.5 flex items-center gap-2 text-[13px]">
                    <span>{p.avatar || '🤖'}</span>
                    <span className="text-slate-900">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 朋友圈 */}
            <div>
              <div className="text-sm font-semibold text-slate-800 mb-2.5">📱 朋友圈</div>

              {/* 发布栏 */}
              <div className="flex gap-2 mb-3.5">
                <input
                  className="input-field flex-1 text-xs"
                  placeholder="发布一条朋友圈..."
                  value={newMoment}
                  onChange={e => setNewMoment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newMoment.trim()) { addM({ personaId: worldPersonas[0]?.id || '', content: newMoment.trim(), images: [], mood: '😊', isAuto: false }); setNewMoment(''); } }}
                />
                <button
                  onClick={() => { if (newMoment.trim() && worldPersonas[0]) { addM({ personaId: worldPersonas[0].id, content: newMoment.trim(), images: [], mood: '😊', isAuto: false }); setNewMoment(''); } }}
                  className="btn-primary text-xs"
                >发布</button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-secondary text-xs whitespace-nowrap"
                >{generating ? '⏳' : '🤖'} AI生成</button>
              </div>

              {worldMoments.length === 0 && <div className="text-slate-400 text-xs py-5 text-center">暂无朋友圈，发布一条或点 AI 生成</div>}

              {worldMoments.map(m => {
                const pp = personas.find(ppp => ppp.id === m.personaId);
                return (
                  <div key={m.id} className="card p-4 mb-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{pp?.avatar || '🤖'}</span>
                      <span className="text-[13px] font-semibold text-slate-800">{pp?.name || '未知'}</span>
                      {m.mood && <span className="text-base">{m.mood}</span>}
                      {m.isAuto && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">AI</span>}
                      <span className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="text-[13px] text-slate-700 leading-relaxed">{m.content}</div>
                    <div className="mt-2 flex items-center gap-1">
                      <button onClick={() => likeM(m.id)} className="btn-ghost text-xs">❤️ {m.likes}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {editW !== undefined && (
        <WorldEditor
          world={editW}
          onSave={d => { if (editW?.id) updW(editW.id, d); else addW(d); closeW(); }}
          onCancel={closeW}
        />
      )}
    </div>
  );
}
