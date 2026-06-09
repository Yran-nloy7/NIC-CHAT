import { useState, useEffect } from 'react';
import { useSettingsStore, PROVIDER_PRESETS } from '../store/settings';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Settings({ open, onClose }: Props) {
  const store = useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [models, setModels] = useState<string[]>([]);

  if (!open) return null;

  const preset = PROVIDER_PRESETS[store.presetIndex];

  const testConnection = async () => {
    setTestStatus('testing');
    try {
      const params = new URLSearchParams({
        provider: store.provider,
        ...(store.apiKey && { apiKey: store.apiKey }),
        ...(store.endpoint && { endpoint: store.endpoint }),
      });
      const res = await fetch(`/api/models?${params}`);
      if (res.ok) {
        const data = await res.json();
        setModels(data.models?.map((m: { id: string }) => m.id) || []);
        setTestStatus('ok');
      } else {
        setTestStatus('fail');
      }
    } catch {
      setTestStatus('fail');
    }
  };

  // Load models on provider change
  useEffect(() => {
    if (store.provider === 'claude') {
      setModels(['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']);
    } else {
      setModels([]);
    }
    setTestStatus('idle');
  }, [store.provider]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">⚙️ 设置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Provider preset */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">AI 后端</label>
            <select
              value={store.presetIndex}
              onChange={e => store.selectPreset(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {PROVIDER_PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">API Endpoint</label>
            <input
              type="text"
              value={store.endpoint}
              onChange={e => store.setEndpoint(e.target.value)}
              placeholder={preset.defaultEndpoint || 'https://your-api.com'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* API Key */}
          {preset.needsAuth && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={store.apiKey}
                  onChange={e => store.setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white"
                >
                  {showKey ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          )}

          {/* Model */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Model</label>
            <div className="flex gap-2">
              {models.length > 0 ? (
                <select
                  value={store.model}
                  onChange={e => store.setModel(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={store.model}
                  onChange={e => store.setModel(e.target.value)}
                  placeholder={preset.defaultModel || 'model-name'}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              )}
              <button
                onClick={testConnection}
                disabled={testStatus === 'testing'}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  testStatus === 'ok' ? 'bg-green-900 text-green-300 border-green-700' :
                  testStatus === 'fail' ? 'bg-red-900 text-red-300 border-red-700' :
                  'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                }`}
              >
                {testStatus === 'testing' ? '...' : testStatus === 'ok' ? '✅' : testStatus === 'fail' ? '❌' : '测试'}
              </button>
            </div>
          </div>

          {/* System prompt */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">系统提示词</label>
            <textarea
              value={store.systemPrompt}
              onChange={e => store.setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* OpenClaw section */}
          <div className="border-t border-gray-800 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={store.openclawEnabled}
                onChange={e => store.setOpenclawEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700 accent-blue-500"
              />
              <span className="text-sm text-gray-300">启用 OpenClaw 微信模式</span>
            </label>
            {store.openclawEnabled && (
              <div className="mt-2 pl-6 space-y-2">
                <p className="text-xs text-gray-500">
                  OpenClaw Gateway 将微信消息转发到 <code className="text-blue-400">POST /api/openclaw/chat</code>
                </p>
                <input
                  type="password"
                  value={store.openclawToken}
                  onChange={e => store.setOpenclawToken(e.target.value)}
                  placeholder="OpenClaw Webhook Token（可选）"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-600">
            配置存储在浏览器本地，不会上传到服务器
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
