import { useDataStore } from '../store/data';
import { ProviderEditor } from '../components/ProviderEditor';

const C = { bg: '#FFF5F8', card: '#FFFFFF', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentLight: '#FCE4EC', hover: '#FFF0F5', codeBg: '#FFF0F5' };

export function SettingsPage() {
  const providers = useDataStore(s => s.providers);
  const addProvider = useDataStore(s => s.addProvider);
  const updateProvider = useDataStore(s => s.updateProvider);
  const deleteProvider = useDataStore(s => s.deleteProvider);
  const editingProvider = useDataStore(s => s.editingProvider);
  const openProviderEditor = useDataStore(s => s.openProviderEditor);
  const closeProviderEditor = useDataStore(s => s.closeProviderEditor);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto', background: C.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>⚙️ 配置</h2>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 750 }}>
        {/* API Providers */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>🔌 API 供应商</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>管理你的 AI API 端点，支持任何 OpenAI 兼容接口</div>
            </div>
            <button onClick={() => openProviderEditor()} style={{ background: C.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>+ 添加</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {providers.map(p => (
              <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.text2, marginTop: 2, fontFamily: 'monospace' }}>{p.endpoint}</div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>Key: {p.apiKey ? p.apiKey.slice(0, 14) + '...' : '(未设置)'} · {p.models.length} 个模型</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openProviderEditor(p)} style={iconBtn}>✎</button>
                  <button onClick={() => { if (confirm('删除？')) deleteProvider(p.id); }} style={{ ...iconBtn, color: '#E53935' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OpenClaw */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔗 OpenClaw 微信对接</div>
          <p style={{ fontSize: 12, color: C.text2, marginBottom: 14, lineHeight: 1.6 }}>将 OpenClaw Gateway 的 Agent Webhook 指向此服务器的端点，即可通过微信与 AI 角色对话。</p>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Webhook URL</div>
            <code style={{ display: 'block', background: C.codeBg, padding: '10px 14px', borderRadius: 8, color: C.accent, fontSize: 13, fontFamily: 'monospace', userSelect: 'all', marginBottom: 14 }}>
              POST http://&lt;服务器IP&gt;:3001/api/openclaw/chat
            </code>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>请求格式 (JSON)</div>
            <code style={{ display: 'block', background: C.codeBg, padding: '10px 14px', borderRadius: 8, color: C.text, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {`{"message":"微信消息","personaId":"sumuyu","sessionId":"wx_xxx"}`}
            </code>
            <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.8 }}>
              <div>• <b>personaId</b>：角色 ID（在角色管理页可见）</div>
              <div>• <b>sessionId</b>：微信用户标识，用于多轮对话上下文</div>
              <div>• 响应格式：SSE 流式返回</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, fontSize: 11, color: C.text3, lineHeight: 1.8 }}>
          <div>AI Chat v1.0 · Vite + React + TypeScript</div>
          <div>API 代理：Express + https.request pipe</div>
          <div>数据存储：浏览器 localStorage</div>
        </div>
      </div>

      {editingProvider !== undefined && (
        <ProviderEditor provider={editingProvider}
          onSave={data => { if (editingProvider?.id) updateProvider(editingProvider.id, data); else addProvider(data); closeProviderEditor(); }}
          onCancel={closeProviderEditor} />
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = { background: '#FFF0F5', border: '1px solid #F0D8E0', borderRadius: 5, color: '#4A2C3A', padding: '5px 12px', cursor: 'pointer', fontSize: 13 };
