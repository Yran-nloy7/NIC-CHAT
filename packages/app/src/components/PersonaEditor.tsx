import { useState } from 'react';
import type { Persona } from '../store/data';
import { useDataStore } from '../store/data';

interface Props { persona: Persona | null; onSave: (d: Omit<Persona, 'id'>) => void; onCancel: () => void; }

const AVATARS = ['🤖','🌧️','⚔️','🌸','🔥','💀','🦊','🐉','👤','🎭','🧙','🗡️','🛡️','📜','✨','💫'];

export function PersonaEditor({ persona, onSave, onCancel }: Props) {
  const providers = useDataStore.getState().providers;
  const worlds = useDataStore.getState().worlds;
  const [name, setName] = useState(persona?.name || '');
  const [avatar, setAvatar] = useState(persona?.avatar || '🤖');
  const [providerId, setProviderId] = useState(persona?.providerId || providers[0]?.id || '');
  const [model, setModel] = useState(persona?.model || providers[0]?.models[0]?.id || '');
  const [temperature, setTemp] = useState(persona?.temperature ?? 1);
  const [maxTokens, setMax] = useState(persona?.maxTokens ?? 2000);
  const [systemPrompt, setSys] = useState(persona?.systemPrompt || '');
  const [worldId, setWorldId] = useState(persona?.worldId || '');
  const [emojiEnabled, setEmoji] = useState(persona?.emojiEnabled ?? false);
  const [emojiProb, setEmojiProb] = useState(persona?.emojiProbability ?? 25);
  const [memEnabled, setMem] = useState(persona?.memoryEnabled ?? false);
  const [memRounds, setMemRounds] = useState(persona?.memoryTriggerRounds ?? 10);
  const [maxMems, setMaxMems] = useState(persona?.maxMemories ?? 50);
  const [memInPrompt, setMemPrompt] = useState(persona?.memoryInPrompt ?? true);
  const [proEnabled, setPro] = useState(persona?.proactiveEnabled ?? false);
  const [proMinH, setProMin] = useState(persona?.proactiveMinHours ?? 1);
  const [proMaxH, setProMax] = useState(persona?.proactiveMaxHours ?? 3);
  const [proMaxC, setProMaxC] = useState(persona?.proactiveMaxConsecutive ?? 3);
  const [proQuietS, setProQS] = useState(persona?.proactiveQuietStart ?? '22:00');
  const [proQuietE, setProQE] = useState(persona?.proactiveQuietEnd ?? '08:00');
  const [proPrompt, setProP] = useState(persona?.proactivePrompt || '');

  const selProv = providers.find(p => p.id === providerId);
  const models = selProv?.models || [];

  const save = () => {
    if (!name.trim() || !providerId) return;
    onSave({ name: name.trim(), avatar: avatar.trim() || '🤖', providerId, model, temperature, maxTokens, systemPrompt, worldId: worldId || undefined, emojiEnabled, emojiGroup: '', emojiProbability: emojiProb, memoryEnabled: memEnabled, memoryTriggerRounds: memRounds, maxMemories: maxMems, memoryInPrompt: memInPrompt, proactiveEnabled: proEnabled, proactiveMinHours: proMinH, proactiveMaxHours: proMaxH, proactiveMaxConsecutive: proMaxC, proactiveQuietStart: proQuietS, proactiveQuietEnd: proQuietE, proactivePrompt: proPrompt });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/35 backdrop-blur flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white border border-slate-200 rounded-2xl w-[620px] max-h-[90vh] overflow-auto shadow-xl" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-200">
          <h3 className="m-0 text-base font-bold text-slate-900">{persona?.id ? '编辑角色' : '添加角色'}</h3>
          <button onClick={onCancel} className="bg-transparent border-none text-slate-400 text-xl cursor-pointer hover:text-slate-600 transition-colors">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-auto">
          {/* 基础信息 */}
          <Section title="基础信息">
            <div className="flex gap-1.5 flex-wrap mb-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)}
                  className={`text-xl cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                    avatar === a ? 'bg-accent/10 border-2 border-accent' : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                  }`}
                >{a}</button>
              ))}
              <input className="input-field w-16 text-lg text-center" value={avatar} onChange={e => setAvatar(e.target.value)} maxLength={4} />
            </div>
            <label className="field-label">角色名称</label>
            <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} placeholder="输入角色名称" />
          </Section>

          {/* 模型配置 */}
          <Section title="模型配置">
            <div className="flex gap-2.5 mb-2">
              <div className="flex-1">
                <label className="field-label">服务商</label>
                <select className="input-field w-full cursor-pointer" value={providerId} onChange={e => { setProviderId(e.target.value); const p = providers.find(pp => pp.id === e.target.value); if (p?.models.length) setModel(p.models[0].id); }}>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name || '未命名'}</option>)}
                  {providers.length === 0 && <option value="">无供应商</option>}
                </select>
              </div>
              <div className="flex-1">
                <label className="field-label">模型</label>
                <select className="input-field w-full cursor-pointer" value={model} onChange={e => setModel(e.target.value)}>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
                  {models.length === 0 && <option value="">先选择服务商</option>}
                </select>
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="field-label">温度 ({temperature})</label>
                <input className="input-field w-full" type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemp(parseFloat(e.target.value))} />
              </div>
              <div className="flex-1">
                <label className="field-label">最大 Token</label>
                <input className="input-field w-full" type="number" min={100} max={128000} step={100} value={maxTokens} onChange={e => setMax(parseInt(e.target.value) || 2000)} />
              </div>
            </div>
          </Section>

          {/* 表情包 */}
          <Section title="表情包">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={emojiEnabled} onChange={e => setEmoji(e.target.checked)} className="accent-accent" />
              <span className="field-label mb-0">启用表情包</span>
            </label>
            {emojiEnabled && (
              <div className="mt-2">
                <label className="field-label">发送概率 ({emojiProb}%)</label>
                <input className="input-field w-full" type="range" min="0" max="100" step="5" value={emojiProb} onChange={e => setEmojiProb(parseInt(e.target.value))} />
                <span className="text-[10px] text-slate-400">每次回复后按概率自动发送匹配情绪的表情包</span>
              </div>
            )}
          </Section>

          {/* 记忆设置 */}
          <Section title="记忆设置">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={memEnabled} onChange={e => setMem(e.target.checked)} className="accent-accent" />
              <span className="field-label mb-0">启用记忆</span>
            </label>
            {memEnabled && (
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <label className="field-label">触发轮数</label>
                    <input className="input-field w-full" type="number" min={1} max={100} value={memRounds} onChange={e => setMemRounds(parseInt(e.target.value) || 10)} />
                    <span className="text-[10px] text-slate-400">每累积多少轮对话后自动总结为一条记忆</span>
                  </div>
                  <div className="flex-1">
                    <label className="field-label">最大记忆条数</label>
                    <input className="input-field w-full" type="number" min={1} max={200} value={maxMems} onChange={e => setMaxMems(parseInt(e.target.value) || 50)} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={memInPrompt} onChange={e => setMemPrompt(e.target.checked)} className="accent-accent" />
                  <span className="field-label mb-0">包含在提示词</span>
                  <span className="text-[10px] text-slate-400">开启后将所有记忆注入 LLM 上下文</span>
                </label>
              </div>
            )}
          </Section>

          {/* 主动消息 */}
          <Section title="主动消息">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={proEnabled} onChange={e => setPro(e.target.checked)} className="accent-accent" />
              <span className="field-label mb-0">启用</span>
            </label>
            {proEnabled && (
              <div className="mt-2 flex flex-col gap-2">
                <div className="text-[10px] text-slate-400">微信通道限制：只能在用户最近一次消息 24 小时内回复。</div>
                <div className="flex gap-2.5">
                  <div className="flex-1"><label className="field-label">最小间隔（小时）</label><input className="input-field w-full" type="number" min={0.5} max={72} step={0.5} value={proMinH} onChange={e => setProMin(parseFloat(e.target.value) || 1)} /></div>
                  <div className="flex-1"><label className="field-label">最大间隔（小时）</label><input className="input-field w-full" type="number" min={1} max={72} step={0.5} value={proMaxH} onChange={e => setProMax(parseFloat(e.target.value) || 3)} /></div>
                </div>
                <div><label className="field-label">连续上限</label><input className="input-field w-full" type="number" min={1} max={20} value={proMaxC} onChange={e => setProMaxC(parseInt(e.target.value) || 3)} /><span className="text-[10px] text-slate-400">用户回消息前最多连续触发的主动消息条数</span></div>
                <div><label className="field-label">静默时段</label><div className="flex gap-2.5 items-center"><input className="input-field flex-1" type="time" value={proQuietS} onChange={e => setProQS(e.target.value)} /><span className="text-[11px] text-slate-400">至</span><input className="input-field flex-1" type="time" value={proQuietE} onChange={e => setProQE(e.target.value)} /></div><span className="text-[10px] text-slate-400">静默时段内不会触发主动消息（支持跨午夜）</span></div>
                <div><label className="field-label">自定义提示词</label><textarea className="input-field w-full min-h-[80px] text-xs" value={proPrompt} onChange={e => setProP(e.target.value)} rows={3} /></div>
              </div>
            )}
          </Section>

          {/* 人设提示词 */}
          <Section title="人设提示词">
            <textarea className="input-field w-full min-h-[140px] text-xs" value={systemPrompt} onChange={e => setSys(e.target.value)} placeholder="描述角色的身份、性格、说话风格..." rows={8} />
          </Section>

          {/* 世界观 */}
          <Section title="所属世界观（可选）">
            <select className="input-field w-full cursor-pointer" value={worldId} onChange={e => setWorldId(e.target.value)}>
              <option value="">无</option>
              {worlds.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Section>
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">取消</button>
          <button onClick={save} className="btn-primary">保存</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="text-[13px] font-bold text-slate-700 mb-2.5">{title}</div>
      {children}
    </div>
  );
}
