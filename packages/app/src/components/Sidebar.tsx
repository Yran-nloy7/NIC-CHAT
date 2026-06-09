import { useDataStore, type Persona } from '../store/data';

interface Props { onSelect: (id: string) => void; onAdd: () => void; }

const C = { bg: '#FFFFFF', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentBg: '#FCE4EC', hover: '#FFF0F5', selectedBg: '#FCE4EC', selectedBorder: '#F48FB1' };

export function Sidebar({ onSelect, onAdd }: Props) {
  const personas = useDataStore(s => s.personas);
  const selectedId = useDataStore(s => s.selectedPersonaId);

  return (
    <div style={{ width: 220, flexShrink: 0, background: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 1 }}>角色</span>
        <button onClick={onAdd} style={{ background: C.accent, border: 'none', borderRadius: 6, color: '#fff', width: 26, height: 26, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 600 }}>+</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {personas.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: C.text3, fontSize: 12 }}>
            暂无角色<br />
            <span style={{ color: C.accent, cursor: 'pointer' }} onClick={onAdd}>+ 创建</span>
          </div>
        )}
        {personas.map(p => {
          const sel = p.id === selectedId;
          return (
            <div key={p.id} onClick={() => onSelect(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 3, cursor: 'pointer',
              background: sel ? C.selectedBg : 'transparent',
              border: sel ? `1px solid ${C.selectedBorder}` : '1px solid transparent',
              transition: 'all .1s',
            }}>
              <span style={{ fontSize: 20 }}>{p.avatar || '🤖'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: C.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.model}</div>
              </div>
              {sel && <span style={{ fontSize: 8, color: C.accent }}>●</span>}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.text3, textAlign: 'center' }}>{personas.length} 个角色</div>
    </div>
  );
}
