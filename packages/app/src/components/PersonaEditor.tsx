import { useState } from 'react';
import type { Persona } from '../store/data';
import { useDataStore } from '../store/data';

interface Props { persona: Persona | null; onSave: (d: Omit<Persona, 'id'>) => void; onCancel: () => void; }

const C = { bg: '#fff', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', accent: '#E91E63', inputBg: '#FFF5F8', accentBg: '#FCE4EC', sectionBg: '#FFF0F5' };
const AV = ['🤖','🌧️','⚔️','🌸','🔥','💀','🦊','🐉','👤','🎭','🧙','🗡️','🛡️','📜','✨','💫'];

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
    <div style={{ position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,.35)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onCancel}>
      <div style={{ background:'#fff',border:'1px solid #F0D8E0',borderRadius:14,width:620,maxHeight:'90vh',overflow:'auto',boxShadow:'0 8px 40px rgba(0,0,0,.12)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:`1px solid ${C.border}` }}><h3 style={{ margin:0,fontSize:16,fontWeight:700,color:C.text }}>{persona?.id ? '编辑角色' : '添加角色'}</h3><button onClick={onCancel} style={{ background:'none',border:'none',color:C.text2,fontSize:20,cursor:'pointer' }}>✕</button></div>

        <div style={{ padding:'18px 20px',display:'flex',flexDirection:'column',gap:16,overflow:'auto' }}>

          {/* 1. 基础信息 */}
          <Section title="基础信息">
            <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:8 }}>{AV.map(a=><button key={a} onClick={()=>setAvatar(a)} style={{ background:avatar===a?C.accentBg:C.inputBg,border:avatar===a?`2px solid ${C.accent}`:`1px solid ${C.border}`,borderRadius:8,fontSize:20,cursor:'pointer',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center' }}>{a}</button>)}<input style={{...inp,width:64,fontSize:18,textAlign:'center'}} value={avatar} onChange={e=>setAvatar(e.target.value)} maxLength={4} /></div>
            <label style={lbl}>角色名称</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="输入角色名称" />
          </Section>

          {/* 2. 模型配置 */}
          <Section title="模型配置">
            <div style={{ display:'flex',gap:10 }}>
              <div style={{ flex:1 }}><label style={lbl}>服务商</label><select style={sel} value={providerId} onChange={e=>{setProviderId(e.target.value);const p=providers.find(pp=>pp.id===e.target.value);if(p?.models.length)setModel(p.models[0].id);}}>{providers.map(p=><option key={p.id} value={p.id}>{p.name||'未命名'}</option>)}{providers.length===0&&<option value="">无供应商</option>}</select></div>
              <div style={{ flex:1 }}><label style={lbl}>模型</label><select style={sel} value={model} onChange={e=>setModel(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name||m.id}</option>)}{models.length===0&&<option value="">先选择服务商</option>}</select></div>
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <div style={{ flex:1 }}><label style={lbl}>温度 ({temperature})</label><input style={inp} type="range" min="0" max="2" step="0.1" value={temperature} onChange={e=>setTemp(parseFloat(e.target.value))} /></div>
              <div style={{ flex:1 }}><label style={lbl}>最大 Token</label><input style={inp} type="number" min={100} max={128000} step={100} value={maxTokens} onChange={e=>setMax(parseInt(e.target.value)||2000)} /></div>
            </div>
          </Section>

          {/* 3. 表情包 */}
          <Section title="表情包">
            <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}><input type="checkbox" checked={emojiEnabled} onChange={e=>setEmoji(e.target.checked)} style={{ accentColor:C.accent }} /> <span style={lbl}>启用表情包</span></label>
            {emojiEnabled && <div style={{ marginTop:8 }}><label style={lbl}>发送概率 ({emojiProb}%)</label><input style={inp} type="range" min="0" max="100" step="5" value={emojiProb} onChange={e=>setEmojiProb(parseInt(e.target.value))} /><span style={{ fontSize:10,color:C.text2 }}>每次回复后按概率自动发送匹配情绪的表情包</span></div>}
          </Section>

          {/* 4. 记忆设置 */}
          <Section title="记忆设置">
            <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}><input type="checkbox" checked={memEnabled} onChange={e=>setMem(e.target.checked)} style={{ accentColor:C.accent }} /> <span style={lbl}>启用记忆</span></label>
            {memEnabled && <div style={{ marginTop:8,display:'flex',flexDirection:'column',gap:8 }}>
              <div style={{ display:'flex',gap:10 }}><div style={{ flex:1 }}><label style={lbl}>触发轮数</label><input style={inp} type="number" min={1} max={100} value={memRounds} onChange={e=>setMemRounds(parseInt(e.target.value)||10)} /><span style={{ fontSize:10,color:C.text2 }}>每累积多少轮对话后自动总结为一条记忆</span></div><div style={{ flex:1 }}><label style={lbl}>最大记忆条数</label><input style={inp} type="number" min={1} max={200} value={maxMems} onChange={e=>setMaxMems(parseInt(e.target.value)||50)} /></div></div>
              <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}><input type="checkbox" checked={memInPrompt} onChange={e=>setMemPrompt(e.target.checked)} style={{ accentColor:C.accent }} /> <span style={lbl}>包含在提示词</span><span style={{ fontSize:10,color:C.text2 }}>开启后将所有记忆注入 LLM 上下文</span></label>
            </div>}
          </Section>

          {/* 5. 主动消息 */}
          <Section title="主动消息">
            <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}><input type="checkbox" checked={proEnabled} onChange={e=>setPro(e.target.checked)} style={{ accentColor:C.accent }} /> <span style={lbl}>启用</span></label>
            {proEnabled && <div style={{ marginTop:8,display:'flex',flexDirection:'column',gap:8 }}>
              <div style={{ fontSize:10,color:C.text2 }}>微信通道限制：只能在用户最近一次消息 24 小时内回复，超时后该角色的主动消息会被跳过。用户每次发消息后，微信只展示机器人前 10 条连续回复。</div>
              <div style={{ display:'flex',gap:10 }}><div style={{ flex:1 }}><label style={lbl}>最小间隔（小时）</label><input style={inp} type="number" min={0.5} max={72} step={0.5} value={proMinH} onChange={e=>setProMin(parseFloat(e.target.value)||1)} /></div><div style={{ flex:1 }}><label style={lbl}>最大间隔（小时）</label><input style={inp} type="number" min={1} max={72} step={0.5} value={proMaxH} onChange={e=>setProMax(parseFloat(e.target.value)||3)} /></div></div>
              <div style={{ display:'flex',gap:10 }}><div style={{ flex:1 }}><label style={lbl}>连续上限</label><input style={inp} type="number" min={1} max={20} value={proMaxC} onChange={e=>setProMaxC(parseInt(e.target.value)||3)} /><span style={{ fontSize:10,color:C.text2 }}>用户回消息前最多连续触发的主动消息条数</span></div></div>
              <div><label style={lbl}>静默时段</label><div style={{ display:'flex',gap:10,alignItems:'center' }}><input style={inp} type="time" value={proQuietS} onChange={e=>setProQS(e.target.value)} /><span style={{ fontSize:11,color:C.text2 }}>至</span><input style={inp} type="time" value={proQuietE} onChange={e=>setProQE(e.target.value)} /></div><span style={{ fontSize:10,color:C.text2 }}>静默时段内不会触发主动消息（支持跨午夜）</span></div>
              <div><label style={lbl}>自定义提示词</label><textarea style={{ ...inp,minHeight:80,fontSize:12 }} value={proPrompt} onChange={e=>setProP(e.target.value)} rows={3} /></div>
            </div>}
          </Section>

          {/* 6. 人设提示词 */}
          <Section title="人设提示词">
            <textarea style={{ ...inp,minHeight:140,fontSize:12 }} value={systemPrompt} onChange={e=>setSys(e.target.value)} placeholder="描述角色的身份、性格、说话风格..." rows={8} />
          </Section>

          {/* 世界观 */}
          <Section title="所属世界观（可选）">
            <select style={sel} value={worldId} onChange={e=>setWorldId(e.target.value)}><option value="">无</option>{worlds.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
          </Section>

        </div>

        <div style={{ padding:'14px 20px',borderTop:`1px solid ${C.border}`,display:'flex',justifyContent:'flex-end',gap:8 }}>
          <button onClick={onCancel} style={{ background:C.inputBg,border:'none',borderRadius:8,color:C.text,padding:'8px 20px',cursor:'pointer',fontSize:13 }}>取消</button>
          <button onClick={save} style={{ background:C.accent,border:'none',borderRadius:8,color:'#fff',padding:'8px 20px',cursor:'pointer',fontSize:13,fontWeight:600 }}>保存</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'#FFF0F5',borderRadius:10,padding:'14px 16px' }}>
      <div style={{ fontSize:13,fontWeight:700,color:'#E91E63',marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}
const lbl: React.CSSProperties = { fontSize:11,color:'#8A6070',fontWeight:600,marginBottom:3,display:'block' };
const inp: React.CSSProperties = { background:'#fff',border:'1px solid #F0D8E0',borderRadius:8,padding:'7px 10px',color:'#4A2C3A',fontSize:13,outline:'none',width:'100%' };
const sel: React.CSSProperties = { ...inp,cursor:'pointer' };
