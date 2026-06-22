import { useDataStore } from '../store/data';
import { ProviderEditor } from '../components/ProviderEditor';

export function PersonalPage() {
  const providers = useDataStore(s => s.providers);
  const addP = useDataStore(s => s.addProvider);
  const updP = useDataStore(s => s.updateProvider);
  const delP = useDataStore(s => s.deleteProvider);
  const editP = useDataStore(s => s.editingProvider);
  const openP = useDataStore(s => s.openProviderEditor);
  const closeP = useDataStore(s => s.closeProviderEditor);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto bg-slate-50">
      {/* 标题栏 */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-900 m-0">👤 个人设置</h2>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-[750px] space-y-8">
        {/* API 供应商 */}
        <section>
          <div className="flex justify-between items-start mb-3.5">
            <div>
              <div className="text-[15px] font-bold text-slate-900">🔌 API 供应商</div>
              <div className="text-xs text-slate-500 mt-0.5">管理 AI API 端点，支持任何 OpenAI 兼容接口</div>
            </div>
            <button onClick={() => openP()} className="btn-primary whitespace-nowrap">+ 添加</button>
          </div>

          {providers.length === 0 && (
            <div className="text-center text-slate-400 py-10 text-[13px]">还没有供应商，点击上方添加</div>
          )}

          {providers.map(p => (
            <div key={p.id} className="card p-4 flex justify-between items-center mb-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{p.endpoint}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Key: {p.apiKey ? p.apiKey.slice(0, 14) + '...' : '(未设置)'} · {p.models.length} 个模型
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openP(p)} className="btn-ghost">✎</button>
                <button onClick={() => { if (confirm('删除？')) delP(p.id); }} className="btn-ghost text-red-400 hover:text-red-600">✕</button>
              </div>
            </div>
          ))}
        </section>

        {/* OpenClaw */}
        <section>
          <div className="text-[15px] font-bold text-slate-900 mb-1">🔗 OpenClaw 微信对接</div>
          <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">将 OpenClaw Gateway 的 Agent Webhook 指向部署服务器的端点。</p>
          <div className="card p-[18px]">
            <div className="text-xs font-semibold text-slate-800 mb-2">Webhook URL</div>
            <code className="block bg-slate-50 px-3.5 py-2.5 rounded-lg text-accent text-[13px] font-mono select-all mb-3.5">
              POST https://&lt;你的服务器&gt;/api/openclaw/chat
            </code>
            <div className="text-xs font-semibold text-slate-800 mb-2">请求格式</div>
            <code className="block bg-slate-50 px-3.5 py-2.5 rounded-lg text-slate-700 text-xs font-mono whitespace-pre-wrap">
              {'{"message":"微信消息","personaId":"角色ID","sessionId":"用户标识"}'}
            </code>
          </div>
        </section>

        {/* 页脚 */}
        <div className="border-t border-slate-200 pt-5 text-[11px] text-slate-400 leading-relaxed">
          <div>NIC-CHAT v2.0</div>
          <div>数据存储在浏览器本地，不上传服务器</div>
        </div>
      </div>

      {editP !== undefined && (
        <ProviderEditor
          provider={editP}
          onSave={d => { if (editP?.id) updP(editP.id, d); else addP(d); closeP(); }}
          onCancel={closeP}
        />
      )}
    </div>
  );
}
