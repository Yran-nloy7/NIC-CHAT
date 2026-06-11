import { useState } from 'react';
import { useDataStore } from '../store/data';
import { WorldEditor } from '../components/WorldEditor';

const C = { bg: '#FFF5F8', card: '#fff', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentBg: '#FCE4EC', hover: '#FFF0F5', green: '#4CAF50', greenBg: '#E8F5E9' };

export function ExpansionPage() {
  const worlds = useDataStore(s => s.worlds); const personas = useDataStore(s => s.personas);
  const agents = useDataStore(s => s.agents); const moments = useDataStore(s => s.moments);
  const selWorldId = useDataStore(s => s.selectedWorldId); const selWorld = useDataStore(s => s.selectWorld);
  const addW = useDataStore(s => s.addWorld); const updW = useDataStore(s => s.updateWorld); const delW = useDataStore(s => s.deleteWorld);
  const addA = useDataStore(s => s.addAgent); const updA = useDataStore(s => s.updateAgent); const delA = useDataStore(s => s.deleteAgent);
  const addM = useDataStore(s => s.addMoment); const editW = useDataStore(s => s.editingWorld);
  const openW = useDataStore(s => s.openWorldEditor); const closeW = useDataStore(s => s.closeWorldEditor);
  const [newMoment, setNewMoment] = useState('');

  const world = worlds.find(w => w.id === selWorldId);
  const worldPersonas = personas.filter(p => p.worldId === selWorldId);
  const worldMoments = moments.filter(m => worldPersonas.some(wp => wp.id === m.personaId));

  return (
    <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
      {/* Left: World list + Agent list */}
      <div style={{ width: 240, flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 1 }}>世界观</span>
          <button onClick={() => openW()} style={{ background: C.accent, border: 'none', borderRadius: 6, color: '#fff', width: 24, height: 24, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>+</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {worlds.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: C.text3, fontSize: 11 }}>暂无世界观<br />点击 + 创建</div>}
          {worlds.map(w => (
            <div key={w.id} onClick={() => selWorld(w.id)} style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', background: w.id === selWorldId ? C.accentBg : 'transparent', transition: 'all .1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.coverColor || C.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: w.id === selWorldId ? 600 : 400, color: C.text }}>{w.name}</span>
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2, marginLeft: 16 }}>{personas.filter(p => p.worldId === w.id).length} 个角色</div>
            </div>
          ))}
        </div>

        {/* MCP Agents section */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 1 }}>Agent</span>
            <button onClick={() => addA({ name: '新 Agent', type: 'stdio', command: '', enabled: false })} style={{ background: C.accentBg, border: 'none', borderRadius: 4, color: C.accent, width: 20, height: 20, fontSize: 12, cursor: 'pointer' }}>+</button>
          </div>
          {agents.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 11 }}>
              <input type="checkbox" checked={a.enabled} onChange={e => updA(a.id, { enabled: e.target.checked })} style={{ accentColor: C.accent }} />
              <span style={{ flex: 1, color: a.enabled ? C.text : C.text3 }}>{a.name}</span>
              <button onClick={() => delA(a.id)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 10 }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: C.bg }}>
        {!world ? (
          <div style={{ textAlign: 'center', color: C.text3, padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌍</div>
            <div style={{ fontSize: 14 }}>选择或创建一个世界观</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>一个世界观可以衍生多个角色</div>
          </div>
        ) : (
          <div style={{ maxWidth: 700 }}>
            {/* World info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: world.coverColor || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff' }}>🌍</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{world.name}</div>
                <div style={{ fontSize: 12, color: C.text2 }}>{world.description || '暂无描述'}</div>
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={() => openW(world)} style={btn}>✎ 编辑</button>
              <button onClick={() => { if (confirm('删除？')) delW(world.id); }} style={{ ...btn, color: '#E53935' }}>🗑</button>
            </div>

            {/* Characters in this world */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>📋 下属角色 ({worldPersonas.length})</div>
              {worldPersonas.length === 0 && <div style={{ color: C.text3, fontSize: 12 }}>暂无 — 在角色编辑中关联此世界观</div>}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {worldPersonas.map(p => (
                  <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span>{p.avatar || '🤖'}</span><span style={{ color: C.text }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Moments / 朋友圈 */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>📱 朋友圈</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: C.text, outline: 'none' }} placeholder="发布一条朋友圈..." value={newMoment} onChange={e => setNewMoment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newMoment.trim()) { addM({ personaId: worldPersonas[0]?.id || '', content: newMoment.trim(), images: [] }); setNewMoment(''); }}} />
                <button onClick={() => { if (newMoment.trim() && worldPersonas[0]) { addM({ personaId: worldPersonas[0].id, content: newMoment.trim(), images: [] }); setNewMoment(''); }}} style={{ background: C.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>发布</button>
              </div>
              {worldMoments.length === 0 && <div style={{ color: C.text3, fontSize: 12, padding: 20, textAlign: 'center' }}>暂无朋友圈</div>}
              {worldMoments.map(m => {
                const pp = personas.find(ppp => ppp.id === m.personaId);
                return (
                  <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{pp?.avatar || '🤖'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{pp?.name || '未知'}</span>
                      <span style={{ fontSize: 10, color: C.text3 }}>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{m.content}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: C.text3 }}>❤️ {m.likes}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {editW !== undefined && <WorldEditor world={editW} onSave={d => { if (editW?.id) updW(editW.id, d); else addW(d); closeW(); }} onCancel={closeW} />}
    </div>
  );
}
const btn: React.CSSProperties = { background: '#FFF0F5', border: '1px solid #F0D8E0', borderRadius: 6, color: '#4A2C3A', padding: '6px 14px', cursor: 'pointer', fontSize: 12 };
