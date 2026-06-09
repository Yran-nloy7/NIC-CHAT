import { useDataStore } from '../store/data';
import { PersonaEditor } from '../components/PersonaEditor';
import { Sidebar } from '../components/Sidebar';

const C = { bg: '#FFF5F8', card: '#FFFFFF', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentLight: '#FCE4EC', hover: '#FFF0F5', green: '#4CAF50', greenBg: '#E8F5E9' };

export function PersonaPage() {
  const personas = useDataStore(s => s.personas);
  const providers = useDataStore(s => s.providers);
  const selectedId = useDataStore(s => s.selectedPersonaId);
  const selectPersona = useDataStore(s => s.selectPersona);
  const deletePersona = useDataStore(s => s.deletePersona);
  const updatePersona = useDataStore(s => s.updatePersona);
  const addPersona = useDataStore(s => s.addPersona);
  const editingPersona = useDataStore(s => s.editingPersona);
  const openPersonaEditor = useDataStore(s => s.openPersonaEditor);
  const closePersonaEditor = useDataStore(s => s.closePersonaEditor);

  return (
    <>
      <Sidebar onSelect={selectPersona} onAdd={() => openPersonaEditor()} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>🎭 角色管理</h2>
          <button onClick={() => openPersonaEditor()} style={{ background: C.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ 添加角色</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {personas.length === 0 && (
            <div style={{ textAlign: 'center', color: C.text3, marginTop: 80 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
              <p>还没有角色，点击上方按钮创建</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {personas.map(p => {
              const provider = providers.find(pr => pr.id === p.providerId);
              const isSelected = p.id === selectedId;
              return (
                <div key={p.id} style={{ background: isSelected ? C.accentLight : C.card, border: isSelected ? `2px solid ${C.accent}` : `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, transition: 'all .15s', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{p.avatar || '🤖'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.text2 }}>{provider?.name || '?'} · {p.model}</div>
                    </div>
                    {isSelected && <span style={{ background: C.accent, color: '#fff', fontSize: 10, padding: '3px 10px', borderRadius: 10, fontWeight: 600 }}>当前</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 18, fontSize: 12, color: C.text2 }}>
                    <span>🌡️ Temperature: {p.temperature}</span>
                    <span>📝 Max Tokens: {p.maxTokens}</span>
                  </div>
                  <div style={{ background: C.hover, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.text2, maxHeight: 80, overflow: 'hidden', lineHeight: 1.6, position: 'relative' }}>
                    {p.systemPrompt.slice(0, 180)}{p.systemPrompt.length > 180 && '...'}
                    {p.systemPrompt.length > 80 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: `linear-gradient(transparent, ${C.hover})` }} />}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => selectPersona(p.id)} style={{ ...btn, background: isSelected ? C.accent : C.accentLight, color: isSelected ? '#fff' : C.accent, flex: 1, fontWeight: 600 }}>{isSelected ? '✓ 已选中' : '选择'}</button>
                    <button onClick={() => openPersonaEditor(p)} style={btn}>✎ 编辑</button>
                    <button onClick={() => { if (confirm(`删除「${p.name}」？`)) deletePersona(p.id); }} style={{ ...btn, color: '#E53935' }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {editingPersona !== undefined && (
        <PersonaEditor persona={editingPersona} providers={providers}
          onSave={data => { if (editingPersona?.id) updatePersona(editingPersona.id, data); else addPersona(data); closePersonaEditor(); }}
          onCancel={closePersonaEditor} />
      )}
    </>
  );
}

const btn: React.CSSProperties = { background: '#FFF0F5', border: '1px solid #F0D8E0', borderRadius: 6, color: '#4A2C3A', padding: '6px 12px', cursor: 'pointer', fontSize: 12 };
