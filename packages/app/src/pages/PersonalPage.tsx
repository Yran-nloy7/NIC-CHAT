import { ProviderEditor } from '../components/ProviderEditor';
import { useDataStore } from '../store/data';

export function PersonalPage() {
  const providers = useDataStore((s) => s.providers);
  const addProvider = useDataStore((s) => s.addProvider);
  const updateProvider = useDataStore((s) => s.updateProvider);
  const deleteProvider = useDataStore((s) => s.deleteProvider);
  const editingProvider = useDataStore((s) => s.editingProvider);
  const openProvider = useDataStore((s) => s.openProviderEditor);
  const closeProvider = useDataStore((s) => s.closeProviderEditor);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-auto bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-3.5">
        <h2 className="m-0 text-base font-bold text-slate-900">个人设置</h2>
      </div>

      <div className="max-w-[860px] flex-1 space-y-8 overflow-auto p-6">
        <section>
          <div className="mb-3.5 flex items-start justify-between">
            <div>
              <div className="text-[15px] font-bold text-slate-900">API 网关</div>
              <div className="mt-0.5 text-xs text-slate-500">管理中转站、API Key、模型目录、计费和额度说明。</div>
            </div>
            <button onClick={() => openProvider()} className="btn-primary whitespace-nowrap">+ 添加网关</button>
          </div>

          {providers.length === 0 && (
            <div className="py-10 text-center text-[13px] text-slate-400">还没有 API 网关，点击上方添加。</div>
          )}

          {providers.map((provider) => (
            <div key={provider.id} className="card mb-3 flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{provider.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-500">{provider.endpoint}</div>

                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{provider.preset || 'openai-compatible'}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">鉴权：{provider.authMode || 'bearer'}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">Key: {provider.apiKey ? `${provider.apiKey.slice(0, 10)}...` : '(未设置)'}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{provider.models.length} 个模型</span>
                </div>

                {(provider.billingNote || provider.rateLimitNote) && (
                  <div className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    {provider.billingNote && <div>计费：{provider.billingNote}</div>}
                    {provider.rateLimitNote && <div>额度：{provider.rateLimitNote}</div>}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {provider.models.slice(0, 6).map((model) => (
                    <div key={model.id} className="rounded-lg bg-slate-50 px-2 py-1.5">
                      <div className="truncate text-[11px] font-medium text-slate-700">{model.name || model.id}</div>
                      <div className="truncate text-[10px] text-slate-400">
                        {billingLabel(model.billingType)} / ctx {model.contextWindow || '-'} / out {model.maxOutput || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <button onClick={() => openProvider(provider)} className="btn-ghost">编辑</button>
                <button onClick={() => { if (confirm('确认删除这个 API 网关？')) deleteProvider(provider.id); }} className="btn-ghost text-red-400 hover:text-red-600">删除</button>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-1 text-[15px] font-bold text-slate-900">OpenClaw / 微信通道</div>
          <p className="mb-3.5 text-xs leading-relaxed text-slate-500">
            OpenClaw 不是前端页面直接调用的能力，它需要一个微信侧网关或机器人服务把消息转发到这里的 Webhook。纯前端静态站点不能监听微信消息，也不能长期保存会话。
          </p>
          <div className="card p-[18px]">
            <div className="mb-2 text-xs font-semibold text-slate-800">Webhook URL</div>
            <code className="mb-3.5 block select-all rounded-lg bg-slate-50 px-3.5 py-2.5 font-mono text-[13px] text-accent">
              POST https://your-server.example.com/api/openclaw/chat
            </code>
            <div className="mb-2 text-xs font-semibold text-slate-800">请求格式</div>
            <code className="block whitespace-pre-wrap rounded-lg bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-700">
              {'{"message":"用户消息","personaId":"角色ID","sessionId":"用户标识"}'}
            </code>
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
              现在的 NIC-CHAT 已经预留了 Webhook 文档，但还没有真正接入微信登录、消息回调验签、会话映射和后台常驻任务。所以它可以展示设计思路，不能直接当完整微信机器人使用。
            </div>
          </div>
        </section>

        <div className="border-t border-slate-200 pt-5 text-[11px] leading-relaxed text-slate-400">
          <div>NIC-CHAT Agent Workspace</div>
          <div>本地数据保存在浏览器 localStorage。公开部署前请把 API Key 移到服务端环境变量。</div>
        </div>
      </div>

      {editingProvider !== undefined && (
        <ProviderEditor
          provider={editingProvider}
          onSave={(data) => {
            if (editingProvider?.id) updateProvider(editingProvider.id, data);
            else addProvider(data);
            closeProvider();
          }}
          onCancel={closeProvider}
        />
      )}
    </div>
  );
}

function billingLabel(type?: string) {
  if (type === 'token') return '按量';
  if (type === 'request') return '按次';
  if (type === 'quota') return '额度';
  if (type === 'free') return '免费';
  return '未标注';
}
