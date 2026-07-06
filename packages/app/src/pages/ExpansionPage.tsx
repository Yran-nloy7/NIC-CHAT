import { useState } from 'react';
import { WorldEditor } from '../components/WorldEditor';
import { useDataStore } from '../store/data';

export function ExpansionPage() {
  const worlds = useDataStore((s) => s.worlds);
  const personas = useDataStore((s) => s.personas);
  const agents = useDataStore((s) => s.agents);
  const moments = useDataStore((s) => s.moments);
  const selectedWorldId = useDataStore((s) => s.selectedWorldId);
  const selectWorld = useDataStore((s) => s.selectWorld);
  const addWorld = useDataStore((s) => s.addWorld);
  const updateWorld = useDataStore((s) => s.updateWorld);
  const deleteWorld = useDataStore((s) => s.deleteWorld);
  const addAgent = useDataStore((s) => s.addAgent);
  const updateAgent = useDataStore((s) => s.updateAgent);
  const deleteAgent = useDataStore((s) => s.deleteAgent);
  const addMoment = useDataStore((s) => s.addMoment);
  const likeMoment = useDataStore((s) => s.likeMoment);
  const editingWorld = useDataStore((s) => s.editingWorld);
  const openWorld = useDataStore((s) => s.openWorldEditor);
  const closeWorld = useDataStore((s) => s.closeWorldEditor);
  const [newMoment, setNewMoment] = useState('');

  const world = worlds.find((item) => item.id === selectedWorldId);
  const worldPersonas = personas.filter((item) => item.worldId === selectedWorldId);
  const worldMoments = moments.filter((moment) => worldPersonas.some((persona) => persona.id === moment.personaId));

  const publishMoment = () => {
    const content = newMoment.trim();
    const persona = worldPersonas[0];
    if (!content || !persona) return;
    addMoment({ personaId: persona.id, content, images: [], mood: 'normal', isAuto: false });
    setNewMoment('');
  };

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      <aside className="flex w-[240px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
          <span className="section-label">世界观</span>
          <button onClick={() => openWorld()} className="h-6 w-6 cursor-pointer rounded bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-dark">+</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {worlds.length === 0 && <div className="p-5 text-center text-[11px] text-slate-400">暂无世界观<br />点击 + 创建</div>}
          {worlds.map((item) => (
            <div
              key={item.id}
              onClick={() => selectWorld(item.id)}
              className={`mb-0.5 cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-100 ${item.id === selectedWorldId ? 'bg-accent/10' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.coverColor || '#6366F1' }} />
                <span className={`text-[13px] ${item.id === selectedWorldId ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{item.name}</span>
              </div>
              <div className="ml-4 mt-0.5 text-[10px] text-slate-400">{personas.filter((persona) => persona.worldId === item.id).length} 个角色</div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="section-label">MCP 工具</span>
            <button
              onClick={() => addAgent({ name: 'web_search', type: 'stdio', command: '', enabled: false })}
              className="h-5 w-5 cursor-pointer rounded bg-accent/10 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              +
            </button>
          </div>
          {agents.length === 0 && <div className="px-1 pb-2 text-[11px] text-slate-400">暂无工具</div>}
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-1.5 py-1 text-[11px]">
              <input type="checkbox" checked={agent.enabled} onChange={(event) => updateAgent(agent.id, { enabled: event.target.checked })} className="accent-accent" />
              <span className={`flex-1 ${agent.enabled ? 'text-slate-700' : 'text-slate-400'}`}>{agent.name}</span>
              <button onClick={() => deleteAgent(agent.id)} className="cursor-pointer border-none bg-transparent text-[10px] text-slate-400 hover:text-red-500">删除</button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50 p-6">
        {!world ? (
          <div className="py-20 text-center text-slate-400">
            <div className="mb-3 text-4xl font-bold text-accent">World</div>
            <div className="text-sm">选择或创建一个世界观</div>
            <div className="mt-1.5 text-xs">世界观可以绑定多个角色，并沉淀关系、记忆和动态。</div>
          </div>
        ) : (
          <div className="max-w-[760px]">
            <div className="mb-5 flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-bold text-white" style={{ background: world.coverColor || '#6366F1' }}>W</div>
              <div>
                <div className="text-lg font-bold text-slate-900">{world.name}</div>
                <div className="text-xs text-slate-500">{world.description || '暂无描述'}</div>
              </div>
              <div className="flex-1" />
              <button onClick={() => openWorld(world)} className="btn-secondary text-xs">编辑</button>
              <button onClick={() => { if (confirm('确认删除这个世界观？')) deleteWorld(world.id); }} className="btn-danger text-xs">删除</button>
            </div>

            {world.lore && (
              <div className="card mb-6 whitespace-pre-wrap p-4 text-xs leading-relaxed text-slate-600">{world.lore}</div>
            )}

            <div className="mb-6">
              <div className="mb-2.5 text-sm font-semibold text-slate-800">下属角色 ({worldPersonas.length})</div>
              {worldPersonas.length === 0 && <div className="text-xs text-slate-400">暂无，在角色编辑中关联此世界观。</div>}
              <div className="flex flex-wrap gap-2.5">
                {worldPersonas.map((persona) => (
                  <div key={persona.id} className="card flex items-center gap-2 px-3.5 py-2.5 text-[13px]">
                    <span className="font-bold text-accent">{persona.avatar || 'AI'}</span>
                    <span className="text-slate-900">{persona.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2.5 text-sm font-semibold text-slate-800">动态墙</div>
              <div className="mb-3.5 flex gap-2">
                <input
                  className="input-field flex-1 text-xs"
                  placeholder="发布一条角色动态..."
                  value={newMoment}
                  onChange={(event) => setNewMoment(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') publishMoment(); }}
                />
                <button onClick={publishMoment} className="btn-primary text-xs">发布</button>
              </div>

              {worldMoments.length === 0 && <div className="py-5 text-center text-xs text-slate-400">暂无动态</div>}
              {worldMoments.map((moment) => {
                const persona = personas.find((item) => item.id === moment.personaId);
                return (
                  <div key={moment.id} className="card mb-2.5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-bold text-accent">{persona?.avatar || 'AI'}</span>
                      <span className="text-[13px] font-semibold text-slate-800">{persona?.name || '未知角色'}</span>
                      {moment.isAuto && <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">AI</span>}
                      <span className="text-[10px] text-slate-400">{new Date(moment.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="text-[13px] leading-relaxed text-slate-700">{moment.content}</div>
                    <div className="mt-2 flex items-center gap-1">
                      <button onClick={() => likeMoment(moment.id)} className="btn-ghost text-xs">喜欢 {moment.likes}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {editingWorld !== undefined && (
        <WorldEditor
          world={editingWorld}
          onSave={(data) => {
            if (editingWorld?.id) updateWorld(editingWorld.id, data);
            else addWorld(data);
            closeWorld();
          }}
          onCancel={closeWorld}
        />
      )}
    </div>
  );
}
