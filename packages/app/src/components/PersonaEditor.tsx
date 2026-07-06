import { useState } from 'react';
import type { Persona } from '../store/data';
import { useDataStore } from '../store/data';

interface Props {
  persona: Persona | null;
  onSave: (data: Omit<Persona, 'id'>) => void;
  onCancel: () => void;
}

const AVATARS = ['AI', 'TA', 'ME', '01', '02', '03', 'RP', 'QA', 'DEV', 'DOC'];

export function PersonaEditor({ persona, onSave, onCancel }: Props) {
  const providers = useDataStore((s) => s.providers);
  const worlds = useDataStore((s) => s.worlds);
  const [name, setName] = useState(persona?.name || '');
  const [avatar, setAvatar] = useState(persona?.avatar || 'AI');
  const [providerId, setProviderId] = useState(persona?.providerId || providers[0]?.id || '');
  const [model, setModel] = useState(persona?.model || providers[0]?.models[0]?.id || '');
  const [temperature, setTemperature] = useState(persona?.temperature ?? 1);
  const [maxTokens, setMaxTokens] = useState(persona?.maxTokens ?? 2000);
  const [systemPrompt, setSystemPrompt] = useState(persona?.systemPrompt || '');
  const [worldId, setWorldId] = useState(persona?.worldId || '');
  const [emojiEnabled, setEmojiEnabled] = useState(persona?.emojiEnabled ?? false);
  const [emojiProbability, setEmojiProbability] = useState(persona?.emojiProbability ?? 25);
  const [memoryEnabled, setMemoryEnabled] = useState(persona?.memoryEnabled ?? true);
  const [memoryTriggerRounds, setMemoryTriggerRounds] = useState(persona?.memoryTriggerRounds ?? 10);
  const [maxMemories, setMaxMemories] = useState(persona?.maxMemories ?? 50);
  const [memoryInPrompt, setMemoryInPrompt] = useState(persona?.memoryInPrompt ?? true);
  const [proactiveEnabled, setProactiveEnabled] = useState(persona?.proactiveEnabled ?? false);
  const [proactiveMinHours, setProactiveMinHours] = useState(persona?.proactiveMinHours ?? 1);
  const [proactiveMaxHours, setProactiveMaxHours] = useState(persona?.proactiveMaxHours ?? 3);
  const [proactiveMaxConsecutive, setProactiveMaxConsecutive] = useState(persona?.proactiveMaxConsecutive ?? 3);
  const [proactiveQuietStart, setProactiveQuietStart] = useState(persona?.proactiveQuietStart ?? '22:00');
  const [proactiveQuietEnd, setProactiveQuietEnd] = useState(persona?.proactiveQuietEnd ?? '08:00');
  const [proactivePrompt, setProactivePrompt] = useState(persona?.proactivePrompt || '');

  const selectedProvider = providers.find((p) => p.id === providerId);
  const models = selectedProvider?.models || [];
  const selectedModel = models.find((item) => item.id === model);

  const save = () => {
    if (!name.trim() || !providerId) return;
    onSave({
      name: name.trim(),
      avatar: avatar.trim() || 'AI',
      providerId,
      model,
      temperature,
      maxTokens,
      systemPrompt,
      worldId: worldId || undefined,
      emojiEnabled,
      emojiGroup: 'default',
      emojiProbability,
      memoryEnabled,
      memoryTriggerRounds,
      maxMemories,
      memoryInPrompt,
      proactiveEnabled,
      proactiveMinHours,
      proactiveMaxHours,
      proactiveMaxConsecutive,
      proactiveQuietStart,
      proactiveQuietEnd,
      proactivePrompt,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 backdrop-blur" onClick={onCancel}>
      <div className="max-h-[90vh] w-[720px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h3 className="m-0 text-base font-bold text-slate-900">{persona?.id ? '编辑角色 Agent' : '添加角色 Agent'}</h3>
          <button onClick={onCancel} className="cursor-pointer border-none bg-transparent text-xl text-slate-400 transition-colors hover:text-slate-600">x</button>
        </div>

        <div className="flex flex-col gap-4 overflow-auto p-5">
          <Section title="基础信息">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {AVATARS.map((item) => (
                <button
                  key={item}
                  onClick={() => setAvatar(item)}
                  className={`flex h-9 w-11 cursor-pointer items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    avatar === item ? 'border-2 border-accent bg-accent/10 text-accent' : 'border border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
              <input className="input-field w-20 text-center text-xs font-bold" value={avatar} onChange={(event) => setAvatar(event.target.value)} maxLength={8} />
            </div>
            <label className="field-label">角色名称</label>
            <input className="input-field w-full" value={name} onChange={(event) => setName(event.target.value)} placeholder="输入角色名称" />
          </Section>

          <Section title="模型配置">
            <div className="mb-2 grid grid-cols-2 gap-2.5">
              <div>
                <label className="field-label">API 网关</label>
                <select
                  className="input-field w-full cursor-pointer"
                  value={providerId}
                  onChange={(event) => {
                    setProviderId(event.target.value);
                    const provider = providers.find((item) => item.id === event.target.value);
                    setModel(provider?.models[0]?.id || '');
                  }}
                >
                  {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name || '未命名'}</option>)}
                  {providers.length === 0 && <option value="">暂无网关</option>}
                </select>
              </div>
              <div>
                <label className="field-label">模型</label>
                <select className="input-field w-full cursor-pointer" value={model} onChange={(event) => setModel(event.target.value)}>
                  {models.map((item) => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}
                  {models.length === 0 && <option value="">先选择 API 网关</option>}
                </select>
              </div>
            </div>

            {selectedModel && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{selectedModel.name || selectedModel.id}</div>
                    <div className="truncate font-mono text-[10px] text-slate-400">{selectedModel.id}</div>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">{billingLabel(selectedModel.billingType)}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                  <div>上下文：{selectedModel.contextWindow || '-'}</div>
                  <div>输出上限：{selectedModel.maxOutput || '-'}</div>
                  <div>能力：{selectedModel.capabilities?.join(', ') || '-'}</div>
                  <div>输入价：{selectedModel.inputPrice || '-'}</div>
                  <div>输出价：{selectedModel.outputPrice || '-'}</div>
                  <div>单次价：{selectedModel.requestPrice || '-'}</div>
                </div>
                {selectedModel.note && <div className="mt-1 text-[10px] text-slate-400">{selectedModel.note}</div>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="field-label">温度 {temperature}</label>
                <input className="input-field w-full" type="range" min="0" max="2" step="0.1" value={temperature} onChange={(event) => setTemperature(parseFloat(event.target.value))} />
              </div>
              <div>
                <label className="field-label">最大输出 Token</label>
                <input className="input-field w-full" type="number" min={100} max={selectedModel?.maxOutput || 128000} step={100} value={maxTokens} onChange={(event) => setMaxTokens(parseInt(event.target.value) || 2000)} />
              </div>
            </div>
          </Section>

          <Section title="记忆与主动消息">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={memoryEnabled} onChange={(event) => setMemoryEnabled(event.target.checked)} className="accent-accent" />
                <span className="field-label mb-0">启用长期记忆</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={memoryInPrompt} onChange={(event) => setMemoryInPrompt(event.target.checked)} className="accent-accent" />
                <span className="field-label mb-0">注入提示词</span>
              </label>
              <div>
                <label className="field-label">触发轮数</label>
                <input className="input-field w-full" type="number" min={1} max={100} value={memoryTriggerRounds} onChange={(event) => setMemoryTriggerRounds(parseInt(event.target.value) || 10)} />
              </div>
              <div>
                <label className="field-label">最大记忆数</label>
                <input className="input-field w-full" type="number" min={1} max={200} value={maxMemories} onChange={(event) => setMaxMemories(parseInt(event.target.value) || 50)} />
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={proactiveEnabled} onChange={(event) => setProactiveEnabled(event.target.checked)} className="accent-accent" />
                <span className="field-label mb-0">启用主动消息</span>
              </label>
              <div>
                <label className="field-label">连续上限</label>
                <input className="input-field w-full" type="number" min={1} max={20} value={proactiveMaxConsecutive} onChange={(event) => setProactiveMaxConsecutive(parseInt(event.target.value) || 3)} />
              </div>
              <div>
                <label className="field-label">最小间隔小时</label>
                <input className="input-field w-full" type="number" min={0.5} max={72} step={0.5} value={proactiveMinHours} onChange={(event) => setProactiveMinHours(parseFloat(event.target.value) || 1)} />
              </div>
              <div>
                <label className="field-label">最大间隔小时</label>
                <input className="input-field w-full" type="number" min={1} max={72} step={0.5} value={proactiveMaxHours} onChange={(event) => setProactiveMaxHours(parseFloat(event.target.value) || 3)} />
              </div>
              <div>
                <label className="field-label">静默开始</label>
                <input className="input-field w-full" type="time" value={proactiveQuietStart} onChange={(event) => setProactiveQuietStart(event.target.value)} />
              </div>
              <div>
                <label className="field-label">静默结束</label>
                <input className="input-field w-full" type="time" value={proactiveQuietEnd} onChange={(event) => setProactiveQuietEnd(event.target.value)} />
              </div>
            </div>
            <label className="field-label mt-3">主动消息提示词</label>
            <textarea className="input-field min-h-[70px] w-full text-xs" value={proactivePrompt} onChange={(event) => setProactivePrompt(event.target.value)} rows={3} />
          </Section>

          <Section title="表情与世界观">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={emojiEnabled} onChange={(event) => setEmojiEnabled(event.target.checked)} className="accent-accent" />
                <span className="field-label mb-0">启用表情包</span>
              </label>
              <div>
                <label className="field-label">发送概率 {emojiProbability}%</label>
                <input className="input-field w-full" type="range" min="0" max="100" step="5" value={emojiProbability} onChange={(event) => setEmojiProbability(parseInt(event.target.value))} />
              </div>
            </div>
            <label className="field-label mt-3">所属世界观</label>
            <select className="input-field w-full cursor-pointer" value={worldId} onChange={(event) => setWorldId(event.target.value)}>
              <option value="">无</option>
              {worlds.map((world) => <option key={world.id} value={world.id}>{world.name}</option>)}
            </select>
          </Section>

          <Section title="人设提示词">
            <textarea className="input-field min-h-[160px] w-full text-xs" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} placeholder="描述角色身份、性格、说话风格、边界规则和输出约束" rows={8} />
          </Section>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
          <button onClick={onCancel} className="btn-secondary">取消</button>
          <button onClick={save} className="btn-primary">保存</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="mb-2.5 text-[13px] font-bold text-slate-700">{title}</div>
      {children}
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
