import { useState } from 'react';
import { useDataStore, defaultPersona } from '../store/data';
import { PersonaEditor } from '../components/PersonaEditor';
import { Sidebar } from '../components/Sidebar';

const C = { bg: '#FFF5F8', card: '#fff', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentBg: '#FCE4EC', hover: '#FFF0F5' };

export function PersonaPage() {
  const personas = useDataStore(s => s.personas); const providers = useDataStore(s => s.providers);
  const selId = useDataStore(s => s.selectedPersonaId); const select = useDataStore(s => s.selectPersona);
  const del = useDataStore(s => s.deletePersona); const upd = useDataStore(s => s.updatePersona);
  const add = useDataStore(s => s.addPersona);
  const editP = useDataStore(s => s.editingPersona); const openE = useDataStore(s => s.openPersonaEditor);
  const closeE = useDataStore(s => s.closePersonaEditor);
  const [search, setSearch] = useState('');

  const filtered = personas.filter(p => !search || p.name.includes(search));
  const selected = personas.find(p => p.id === selId);

  return (
    <>
      <Sidebar onAdd={() => { const d = defaultPersona(); if (providers[0]) { d.providerId = providers[0].id; d.model = providers[0].models[0]?.id || ''; } openE({ ...d, id: '' } as any); }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>🎭 人设通讯录</h2>
            <input style={{ background: C.hover, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: C.text, outline: 'none', width: 160 }} placeholder="🔍 搜索..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => { const d = defaultPersona(); if (providers[0]) { d.providerId = providers[0].id; d.model = providers[0].models[0]?.id || ''; } openE({ ...d, id: '' } as any); }} style={{ background: C.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ 添加角色</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', gap: 24 }}>
          {/* List */}
          <div style={{ width: 280, flexShrink: 0 }}>
            {filtered.length === 0 && <div style={{ textAlign: 'center', color: C.text3, padding: 40, fontSize: 13 }}>{search ? '无匹配结果' : '还没有角色'}</div>}
            {filtered.map(p => {
              const prov = providers.find(pr => pr.id === p.providerId);
              return (
                <div key={p.id} onClick={() => select(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: p.id === selId ? C.accentBg : 'transparent', border: p.id === selId ? `1px solid ${C.accent}44` : '1px solid transparent', transition: 'all .1s' }}>
                  <span style={{ fontSize: 22 }}>{p.avatar || '🤖'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name || '未命名'}</div>
                    <div style={{ fontSize: 10, color: C.text2 }}>{prov?.name || '未绑定'} · {p.model || '未配置'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          <div style={{ flex: 1 }}>
            {selected ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 40 }}>{selected.avatar || '🤖'}</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: C.text2 }}>
                      {providers.find(pr => pr.id === selected.providerId)?.name || '未绑定'} · {selected.model} · temp {selected.temperature}
                    </div>
                  </div>
                </div>
                <div style={{ background: C.hover, borderRadius: 8, padding: '14px 16px', fontSize: 12, color: C.text2, lineHeight: 1.7, marginBottom: 20, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{selected.systemPrompt || '(未设置人设提示词)'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: C.text2, marginBottom: 20 }}>
                  <div>🌡️ Temperature: {selected.temperature}</div><div>📝 Max Tokens: {selected.maxTokens}</div>
                  <div>😊 表情包: {selected.emojiEnabled ? `开启 (${selected.emojiProbability}%)` : '关闭'}</div>
                  <div>🧠 记忆: {selected.memoryEnabled ? `开启 (${selected.memoryTriggerRounds}轮/${selected.maxMemories}条)` : '关闭'}</div>
                  <div>📢 主动消息: {selected.proactiveEnabled ? `开启 (${selected.proactiveMinHours}-${selected.proactiveMaxHours}h)` : '关闭'}</div>
                  <div>🌍 世界观: {selected.worldId ? (useDataStore.getState().worlds.find(w=>w.id===selected.worldId)?.name||'未知') : '无'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => select(selected.id)} style={{ ...b, background: C.accent, color: '#fff', border: 'none' }}>{selId === selected.id ? '✓ 当前角色' : '设为当前'}</button>
                  <button onClick={() => openE(selected)} style={b}>✎ 编辑</button>
                  <button onClick={() => { if (confirm(`删除「${selected.name}」？`)) del(selected.id); }} style={{ ...b, color: '#E53935' }}>🗑 删除</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: C.text3, padding: 60 }}>👈 从左侧选择一个角色查看详情</div>
            )}
          </div>
        </div>
      </div>
      {editP !== undefined && <PersonaEditor persona={editP} onSave={d => { if (editP?.id) upd(editP.id, d); else add(d); closeE(); }} onCancel={closeE} />}
    </>
  );
}
const b: React.CSSProperties = { background: '#FFF0F5', border: '1px solid #F0D8E0', borderRadius: 6, color: '#4A2C3A', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 };
