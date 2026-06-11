import { useDataStore } from '../store/data';
import { ProviderEditor } from '../components/ProviderEditor';

const C = { bg: '#FFF5F8', card: '#fff', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#C0A0B0', accent: '#E91E63', accentBg: '#FCE4EC', codeBg: '#FFF0F5' };

export function PersonalPage() {
  const providers = useDataStore(s => s.providers);
  const addP = useDataStore(s => s.addProvider); const updP = useDataStore(s => s.updateProvider);
  const delP = useDataStore(s => s.deleteProvider);
  const editP = useDataStore(s => s.editingProvider); const openP = useDataStore(s => s.openProviderEditor);
  const closeP = useDataStore(s => s.closeProviderEditor);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto', background: C.bg }}>
      <div style={{ padding: '14px 24px', background: C.card, borderBottom: `1px solid ${C.border}` }}><h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>👤 个人设置</h2></div>
      <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 750 }}>

        {/* API Providers */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>🔌 API 供应商</div><div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>管理 AI API 端点，支持任何 OpenAI 兼容接口</div></div>
            <button onClick={() => openP()} style={{ background: C.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>+ 添加</button>
          </div>
          {providers.length === 0 && <div style={{ textAlign: 'center', color: C.text3, padding: 40, fontSize: 13 }}>还没有供应商，点击上方添加</div>}
          {providers.map(p => (
            <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div><div style={{ fontSize: 11, color: C.text2, fontFamily: 'monospace', marginTop: 2 }}>{p.endpoint}</div><div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>Key: {p.apiKey ? p.apiKey.slice(0, 14) + '...' : '(未设置)'} · {p.models.length} 个模型</div></div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openP(p)} style={btn}>✎</button>
                <button onClick={() => { if (confirm('删除？')) delP(p.id); }} style={{ ...btn, color: '#E53935' }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* OpenClaw */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔗 OpenClaw 微信对接</div>
          <p style={{ fontSize: 12, color: C.text2, marginBottom: 14, lineHeight: 1.6 }}>将 OpenClaw Gateway 的 Agent Webhook 指向部署服务器的端点。</p>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Webhook URL</div>
            <code style={{ display: 'block', background: C.codeBg, padding: '10px 14px', borderRadius: 8, color: C.accent, fontSize: 13, fontFamily: 'monospace', userSelect: 'all', marginBottom: 14 }}>POST https://&lt;你的服务器&gt;/api/openclaw/chat</code>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>请求格式</div>
            <code style={{ display: 'block', background: C.codeBg, padding: '10px 14px', borderRadius: 8, color: C.text, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{`{"message":"微信消息","personaId":"角色ID","sessionId":"用户标识"}`}</code>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, fontSize: 11, color: C.text3, lineHeight: 1.8 }}><div>NIC-CHAT v2.0</div><div>数据存储在浏览器本地，不上传服务器</div></div>
      </div>
      {editP !== undefined && <ProviderEditor provider={editP} onSave={d => { if (editP?.id) updP(editP.id, d); else addP(d); closeP(); }} onCancel={closeP} />}
    </div>
  );
}
const btn: React.CSSProperties = { background: '#FFF0F5', border: '1px solid #F0D8E0', borderRadius: 5, color: '#4A2C3A', padding: '5px 12px', cursor: 'pointer', fontSize: 13 };
