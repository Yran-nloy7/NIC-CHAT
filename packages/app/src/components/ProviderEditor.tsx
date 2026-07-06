import { useState } from 'react';
import type { Provider, ProviderModel } from '../store/data';

interface Props {
  provider: Provider | null;
  onSave: (data: Omit<Provider, 'id'>) => void;
  onCancel: () => void;
}

const PRESETS: Array<{ key: Provider['preset']; name: string; endpoint: string; note: string }> = [
  { key: 'openai-compatible', name: 'OpenAI 兼容', endpoint: 'https://api.openai.com/v1', note: '适合大多数中转站' },
  { key: 'pawapi', name: 'PawAPI', endpoint: 'https://paw.v1chat.cc/v1', note: '可填入自己的 PawAPI Key' },
  { key: 'deepseek', name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1', note: 'DeepSeek 官方或兼容站' },
  { key: 'ollama', name: 'Ollama', endpoint: 'http://localhost:11434', note: '本地模型，无需 API Key' },
  { key: 'custom', name: '自定义', endpoint: '', note: '任意兼容接口' },
];

const DEFAULT_MODELS = [
  'deepseek-v4-pro | DeepSeek V4 Pro | quota |  |  |  | 1000000 | 384000 | tool_use | 大上下文，适合长文和 Agent',
  'gpt-4o | GPT-4o | token | $5/1M | $15/1M |  | 128000 | 16384 | vision,tool_use | 通用多模态',
  'claude-sonnet-4-6 | Claude Sonnet 4.6 | token |  |  |  | 1000000 | 64000 | vision,tool_use | 长文本和推理',
  'ollama/qwen2.5 | Qwen2.5 Local | free |  |  |  | 32000 | 8192 | local | 本地模型',
].join('\n');

export function ProviderEditor({ provider, onSave, onCancel }: Props) {
  const [name, setName] = useState(provider?.name || '');
  const [endpoint, setEndpoint] = useState(provider?.endpoint || '');
  const [apiKey, setApiKey] = useState(provider?.apiKey || '');
  const [preset, setPreset] = useState<Provider['preset']>(provider?.preset || 'openai-compatible');
  const [authMode, setAuthMode] = useState<Provider['authMode']>(provider?.authMode || 'bearer');
  const [timeout, setTimeoutValue] = useState(provider?.timeout || 120000);
  const [billingNote, setBillingNote] = useState(provider?.billingNote || '');
  const [rateLimitNote, setRateLimitNote] = useState(provider?.rateLimitNote || '');
  const [modelsText, setModelsText] = useState(formatModels(provider?.models || parseModels(DEFAULT_MODELS)));
  const [showKey, setShowKey] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [message, setMessage] = useState('');

  const models = parseModels(modelsText);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 backdrop-blur" onClick={onCancel}>
      <div className="max-h-[90vh] w-[860px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="m-0 text-[15px] font-bold text-slate-900">{provider ? '编辑 API 网关' : '添加 API 网关'}</h3>
            <div className="mt-0.5 text-[11px] text-slate-400">连接中转站后，在这里维护可用模型、能力和计费方式。</div>
          </div>
          <button onClick={onCancel} className="cursor-pointer border-none bg-transparent text-lg text-slate-400 transition-colors hover:text-slate-600">x</button>
        </div>

        <div className="grid grid-cols-[1fr_1.15fr] gap-5 p-5">
          <section className="space-y-3">
            <div>
              <label className="field-label">网关类型</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setPreset(item.key);
                      setAuthMode(item.key === 'ollama' ? 'none' : 'bearer');
                      if (item.endpoint) setEndpoint(item.endpoint);
                      if (!name) setName(item.name);
                    }}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                      preset === item.key ? 'border-accent bg-accent/5 text-accent' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold">{item.name}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">{item.note}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">名称</label>
              <input className="input-field w-full" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如 PawAPI / 公司中转站 / 本地 Ollama" />
            </div>

            <div>
              <label className="field-label">Endpoint</label>
              <input className="input-field w-full font-mono text-xs" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://api.example.com/v1" />
            </div>

            <div>
              <label className="field-label">鉴权方式</label>
              <select className="input-field w-full" value={authMode} onChange={(event) => setAuthMode(event.target.value as Provider['authMode'])}>
                <option value="bearer">Bearer Token</option>
                <option value="none">无需鉴权</option>
              </select>
            </div>

            {authMode === 'bearer' && (
              <div>
                <label className="field-label">API Key</label>
                <div className="flex gap-1.5">
                  <input className="input-field flex-1" type={showKey ? 'text' : 'password'} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." />
                  <button onClick={() => setShowKey(!showKey)} className="btn-secondary px-2.5 text-xs">{showKey ? '隐藏' : '显示'}</button>
                </div>
                <p className="m-0 mt-1 text-[11px] leading-relaxed text-slate-400">求职项目演示可以本地保存；公开部署建议改为后端环境变量。</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="field-label">超时时间 ms</label>
                <input className="input-field w-full" type="number" min={1000} step={1000} value={timeout} onChange={(event) => setTimeoutValue(parseInt(event.target.value) || 120000)} />
              </div>
              <div>
                <label className="field-label">模型数量</label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{models.length}</div>
              </div>
            </div>

            <div>
              <label className="field-label">计费说明</label>
              <textarea className="input-field min-h-[64px] w-full text-xs" value={billingNote} onChange={(event) => setBillingNote(event.target.value)} placeholder="例如：部分模型按 token 计费，部分模型按次数或套餐额度扣除。" />
            </div>

            <div>
              <label className="field-label">限流/额度说明</label>
              <textarea className="input-field min-h-[64px] w-full text-xs" value={rateLimitNote} onChange={(event) => setRateLimitNote(event.target.value)} placeholder="例如：高阶模型每日 50 次，普通模型按量。" />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="field-label">模型目录</label>
                <div className="text-[10px] text-slate-400">格式：ID | 名称 | 计费 | 输入价 | 输出价 | 单次价 | 上下文 | 输出上限 | 能力 | 备注</div>
              </div>
              <button onClick={loadRemoteModels} disabled={loadingModels || !endpoint} className="btn-secondary text-xs">
                {loadingModels ? '读取中...' : '从 /v1/models 读取'}
              </button>
            </div>
            <textarea
              className="input-field min-h-[260px] w-full font-mono text-[11px]"
              value={modelsText}
              onChange={(event) => setModelsText(event.target.value)}
              rows={12}
            />
            {message && <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">{message}</div>}

            <div className="max-h-[220px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
              {models.map((model) => (
                <div key={model.id} className="mb-2 rounded-lg bg-white p-3 shadow-sm last:mb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{model.name || model.id}</div>
                      <div className="truncate font-mono text-[10px] text-slate-400">{model.id}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">{billingLabel(model.billingType)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                    <div>上下文：{model.contextWindow || '-'}</div>
                    <div>输出：{model.maxOutput || '-'}</div>
                    <div>能力：{model.capabilities?.join(', ') || '-'}</div>
                    <div>输入：{model.inputPrice || '-'}</div>
                    <div>输出价：{model.outputPrice || '-'}</div>
                    <div>单次：{model.requestPrice || '-'}</div>
                  </div>
                  {model.note && <div className="mt-1 text-[10px] text-slate-400">{model.note}</div>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onCancel} className="btn-secondary">取消</button>
          <button onClick={handleSave} className="btn-primary">保存网关</button>
        </div>
      </div>
    </div>
  );

  async function loadRemoteModels() {
    setLoadingModels(true);
    setMessage('');
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, apiKey, authMode }),
      });
      const data = await res.json();
      const remoteModels = Array.isArray(data.models) ? data.models : [];
      if (!remoteModels.length) {
        setMessage('没有读取到模型列表。很多中转站不会返回计费信息，可以手动维护。');
        return;
      }
      const existing = new Map(parseModels(modelsText).map((item) => [item.id, item]));
      for (const item of remoteModels) {
        if (!existing.has(item.id)) {
          existing.set(item.id, {
            id: item.id,
            name: item.name || item.id,
            billingType: 'unknown',
            enabled: true,
            capabilities: [],
          });
        }
      }
      setModelsText(formatModels([...existing.values()]));
      setMessage(`已读取 ${remoteModels.length} 个模型。计费、上下文和能力信息可继续手动补充。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '读取模型失败。');
    } finally {
      setLoadingModels(false);
    }
  }

  function handleSave() {
    if (!name.trim() || !endpoint.trim()) return;
    onSave({
      name: name.trim(),
      endpoint: endpoint.trim(),
      apiKey: apiKey.trim(),
      preset,
      authMode,
      models,
      customHeaders: provider?.customHeaders || [],
      timeout,
      billingNote,
      rateLimitNote,
    });
  }
}

function parseModels(text: string): ProviderModel[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, name, billingType, inputPrice, outputPrice, requestPrice, contextWindow, maxOutput, capabilities, note] = line.split('|').map((part) => part.trim());
      return {
        id,
        name: name || id,
        billingType: normalizeBillingType(billingType),
        inputPrice,
        outputPrice,
        requestPrice,
        contextWindow: toNumber(contextWindow),
        maxOutput: toNumber(maxOutput),
        capabilities: capabilities ? capabilities.split(',').map((item) => item.trim()).filter(Boolean) : [],
        note,
        enabled: true,
      };
    });
}

function formatModels(models: ProviderModel[]): string {
  return models.map((model) => [
    model.id,
    model.name || model.id,
    model.billingType || 'unknown',
    model.inputPrice || '',
    model.outputPrice || '',
    model.requestPrice || '',
    model.contextWindow || '',
    model.maxOutput || '',
    model.capabilities?.join(',') || '',
    model.note || model.quotaNote || '',
  ].join(' | ')).join('\n');
}

function normalizeBillingType(value?: string): ProviderModel['billingType'] {
  if (value === 'token' || value === 'request' || value === 'quota' || value === 'free') return value;
  return 'unknown';
}

function toNumber(value?: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function billingLabel(type?: ProviderModel['billingType']) {
  const labels = {
    token: '按量',
    request: '按次',
    quota: '额度',
    free: '免费',
    unknown: '未标注',
  };
  return labels[type || 'unknown'];
}
