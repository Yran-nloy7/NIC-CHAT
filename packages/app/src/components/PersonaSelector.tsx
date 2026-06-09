import { useDataStore } from '../store/data';

export function PersonaSelector() {
  const personas = useDataStore(s => s.personas);
  const selectedId = useDataStore(s => s.selectedPersonaId);
  const selectPersona = useDataStore(s => s.selectPersona);
  const selected = personas.find(p => p.id === selectedId);

  return (
    <select
      value={selectedId || ''}
      onChange={e => selectPersona(e.target.value || null)}
      style={selectStyle}
    >
      {personas.length === 0 && (
        <option value="">无角色 — 请在设置中添加</option>
      )}
      {personas.map(p => (
        <option key={p.id} value={p.id}>
          {p.avatar} {p.name}
        </option>
      ))}
    </select>
  );
}

const selectStyle: React.CSSProperties = {
  background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9',
  padding: '5px 10px', borderRadius: 6, fontSize: 13, outline: 'none',
  cursor: 'pointer', minWidth: 120,
};
