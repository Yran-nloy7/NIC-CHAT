import { useDataStore } from '../store/data';
import { PersonaEditor } from './PersonaEditor';
import { ProviderEditor } from './ProviderEditor';

export function SettingsModal() {
  const store = useDataStore();
  const open = store.settingsOpen;

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={() => store.toggleSettings()}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#c9d1d9' }}>⚙️ 设置</h2>
          <button onClick={() => store.toggleSettings()} style={closeBtn}>✕</button>
        </div>

        <div style={{ overflow: 'auto', flex: 1, padding: '16px 18px' }}>

          {/* ── API 供应商 ── */}
          <Section title="API 供应商" onAdd={() => store.openProviderEditor(null)} />
          {store.providers.map(p => (
            <Card
              key={p.id}
              title={`🔌 ${p.name}`}
              subtitle={`${p.endpoint}  ·  ${p.models.length} 个模型`}
              onEdit={() => store.openProviderEditor(p)}
              onDelete={() => store.deleteProvider(p.id)}
            />
          ))}

          <div style={{ height: 20 }} />

          {/* ── 角色管理 ── */}
          <Section title="角色管理" onAdd={() => store.openPersonaEditor(null)} />
          {store.personas.map(p => {
            const provider = store.providers.find(pr => pr.id === p.providerId);
            return (
              <Card
                key={p.id}
                title={`${p.avatar || '🤖'} ${p.name}`}
                subtitle={`${provider?.name || '?'}  ·  ${p.model}  ·  温度:${p.temperature}  ·  ${p.maxTokens} tokens`}
                onEdit={() => store.openPersonaEditor(p)}
                onDelete={() => store.deletePersona(p.id)}
              />
            );
          })}

          <div style={{ height: 20 }} />

          {/* ── OpenClaw 微信 ── */}
          <div style={{
            background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 14,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#c9d1d9', marginBottom: 6 }}>
              🔗 OpenClaw 微信对接
            </div>
            <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.8 }}>
              将 OpenClaw Gateway 的 Webhook 指向：<br />
              <code style={{
                background: '#1c2128', padding: '4px 8px', borderRadius: 4,
                color: '#58a6ff', fontSize: 12, userSelect: 'all',
              }}>
                POST http://你的IP:3001/api/openclaw/chat
              </code>
              <br /><br />
              请求格式：<br />
              <code style={{ background: '#1c2128', padding: '4px 8px', borderRadius: 4, color: '#8b949e', fontSize: 11 }}>
                {'{"message":"微信消息","personaId":"sumuyu","sessionId":"wx_xxx"}'}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Editor popup */}
      {store.editingPersona !== undefined && (
        <PersonaEditor
          persona={store.editingPersona}
          providers={store.providers}
          onSave={(data) => {
            if (store.editingPersona?.id) {
              store.updatePersona(store.editingPersona.id, data);
            } else {
              store.addPersona(data);
            }
            store.closePersonaEditor();
          }}
          onCancel={store.closePersonaEditor}
        />
      )}

      {/* Provider Editor popup */}
      {store.editingProvider !== undefined && (
        <ProviderEditor
          provider={store.editingProvider}
          onSave={(data) => {
            if (store.editingProvider?.id) {
              store.updateProvider(store.editingProvider.id, data);
            } else {
              store.addProvider(data);
            }
            store.closeProviderEditor();
          }}
          onCancel={store.closeProviderEditor}
        />
      )}
    </div>
  );
}

function Section({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#c9d1d9' }}>{title}</span>
      <button onClick={onAdd} style={{
        background: '#21262d', border: '1px solid #30363d', borderRadius: 6,
        color: '#58a6ff', padding: '4px 10px', cursor: 'pointer', fontSize: 12,
      }}>
        + 添加
      </button>
    </div>
  );
}

function Card({ title, subtitle, onEdit, onDelete }: {
  title: string; subtitle: string; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div style={{
      background: '#0d1117', border: '1px solid #30363d', borderRadius: 8,
      padding: '10px 12px', marginBottom: 8,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={onEdit} style={iconBtn}>✎</button>
        <button onClick={onDelete} style={{ ...iconBtn, color: '#f85149' }}>✕</button>
      </div>
    </div>
  );
}

/* Styles */
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 50,
  background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  paddingTop: '5vh',
};
const panelStyle: React.CSSProperties = {
  background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
  width: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 8px 40px rgba(0,0,0,.5)',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 18px', borderBottom: '1px solid #30363d', flexShrink: 0,
};
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer',
};
const iconBtn: React.CSSProperties = {
  background: '#21262d', border: '1px solid #30363d', borderRadius: 4,
  color: '#8b949e', padding: '3px 8px', cursor: 'pointer', fontSize: 13,
};
