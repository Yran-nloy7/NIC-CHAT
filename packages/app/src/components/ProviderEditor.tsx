import { useState } from 'react';
import type { Provider } from '../store/data';

interface Props {
  provider: Provider | null;
  onSave: (data: Omit<Provider, 'id'>) => void;
  onCancel: () => void;
}

export function ProviderEditor({ provider, onSave, onCancel }: Props) {
  const [name, setName] = useState(provider?.name || '');
  const [endpoint, setEndpoint] = useState(provider?.endpoint || '');
  const [apiKey, setApiKey] = useState(provider?.apiKey || '');
  const [modelsText, setModelsText] = useState(provider?.models.map(m => m.id).join('\n') || '');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] bg-black/35 backdrop-blur flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white border border-slate-200 rounded-2xl w-[480px] max-h-[80vh] overflow-auto shadow-xl" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-200">
          <h3 className="m-0 text-[15px] font-bold text-slate-900">{provider ? '编辑供应商' : '添加供应商'}</h3>
          <button onClick={onCancel} className="bg-transparent border-none text-slate-400 text-lg cursor-pointer hover:text-slate-600 transition-colors">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-2.5">
          <label className="field-label">名称</label>
          <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} placeholder="如: PawAPI, DeepSeek, Ollama" />

          <label className="field-label">Endpoint</label>
          <input className="input-field w-full" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://paw.v1chat.cc/v1" />

          <label className="field-label">API Key</label>
          <div className="flex gap-1.5">
            <input className="input-field flex-1" type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
            <button onClick={() => setShowKey(!showKey)} className="btn-secondary px-2.5 text-base">{showKey ? '🙈' : '👁'}</button>
          </div>

          <label className="field-label">模型列表（每行一个 ID）</label>
          <textarea className="input-field w-full min-h-[120px] font-mono text-xs" value={modelsText} onChange={e => setModelsText(e.target.value)} placeholder="gpt-4o&#10;deepseek-v4-pro&#10;claude-sonnet-4-6" rows={6} />
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">取消</button>
          <button onClick={handleSave} className="btn-primary">保存</button>
        </div>
      </div>
    </div>
  );

  function handleSave() {
    if (!name.trim() || !endpoint.trim()) return;
    onSave({
      name: name.trim(), endpoint: endpoint.trim(), apiKey: apiKey.trim(),
      models: modelsText.split('\n').map(l => l.trim()).filter(Boolean).map(id => ({ id, name: id })),
      customHeaders: provider?.customHeaders || [],
      timeout: provider?.timeout || 120000,
    });
  }
}
