import { useState } from 'react';
import type { Persona, Provider } from '../store/data';

interface Props {
  persona: Persona | null;
  providers: Provider[];
  onSave: (data: Omit<Persona, 'id'>) => void;
  onCancel: () => void;
}

const C = { bg: '#FFFFFF', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', accent: '#E91E63', inputBg: '#FFF5F8', accentBg: '#FCE4EC' };
const AVATARS = ['🤖','🌧️','⚔️','🌸','🔥','💀','🦊','🐉','👤','🎭','🧙','🗡️','🛡️','📜','✨','💫'];

export function PersonaEditor({ persona, providers, onSave, onCancel }: Props) {
  const [name, setName] = useState(persona?.name || '');
  const [avatar, setAvatar] = useState(persona?.avatar || '🤖');
  const [providerId, setProviderId] = useState(persona?.providerId || providers[0]?.id || '');
  const [model, setModel] = useState(persona?.model || providers[0]?.models[0]?.id || '');
  const [temperature, setTemperature] = useState(persona?.temperature ?? 1.0);
  const [maxTokens, setMaxTokens] = useState(persona?.maxTokens ?? 2000);
  const [systemPrompt, setSystemPrompt] = useState(persona?.systemPrompt || '');

  const selectedProvider = providers.find(p => p.id === providerId);
  const models = selectedProvider?.models || [];

  const handleProviderChange = (pid: string) => {
    setProviderId(pid);
    const p = providers.find(pr => pr.id === pid);
    if (p?.models.length && !p.models.find(m => m.id === model)) setModel(p.models[0].id);
  };

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.text }}>{persona ? '编辑角色' : '添加角色'}</h3>
          <button onClick={onCancel} style={{ background:'none',border:'none',color:C.text2,fontSize:18,cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:'16px 20px',display:'flex',flexDirection:'column',gap:10 }}>
          {/* Avatar */}
          <label style={lbl}>头像</label>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setAvatar(a)} style={{ background:avatar===a?C.accentBg:C.inputBg,border:avatar===a?`2px solid ${C.accent}`:`1px solid ${C.border}`,borderRadius:8,fontSize:20,cursor:'pointer',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center' }}>{a}</button>
            ))}
            <input style={{...inp,width:72,fontSize:18,textAlign:'center'}} value={avatar} onChange={e=>setAvatar(e.target.value)} placeholder="自定义" maxLength={4} />
          </div>

          <label style={lbl}>角色名</label>
          <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="如: 苏暮雨" />

          <div style={{ display:'flex',gap:10 }}>
            <div style={{ flex:1 }}>
              <label style={lbl}>API 供应商</label>
              <select style={sel} value={providerId} onChange={e=>handleProviderChange(e.target.value)}>
                {providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={lbl}>模型</label>
              <select style={sel} value={model} onChange={e=>setModel(e.target.value)}>
                {models.map(m=><option key={m.id} value={m.id}>{m.name||m.id}</option>)}
                {models.length===0&&<option value="">无可用模型</option>}
              </select>
            </div>
          </div>

          <div style={{ display:'flex',gap:10 }}>
            <div style={{ flex:1 }}>
              <label style={lbl}>Temperature ({temperature})</label>
              <input style={inp} type="range" min="0" max="2" step="0.1" value={temperature} onChange={e=>setTemperature(parseFloat(e.target.value))} />
            </div>
            <div style={{ flex:1 }}>
              <label style={lbl}>Max Tokens</label>
              <input style={inp} type="number" min={100} max={128000} step={100} value={maxTokens} onChange={e=>setMaxTokens(parseInt(e.target.value)||2000)} />
            </div>
          </div>

          <label style={lbl}>人设提示词</label>
          <textarea style={{...inp,minHeight:140,fontSize:12}} value={systemPrompt} onChange={e=>setSystemPrompt(e.target.value)} placeholder="描述角色的身份、性格、说话风格..." rows={8} />
        </div>
        <div style={{ padding:'12px 20px',borderTop:`1px solid ${C.border}`,display:'flex',justifyContent:'flex-end',gap:8 }}>
          <button onClick={onCancel} style={{ background:C.inputBg,border:'none',borderRadius:6,color:C.text,padding:'8px 18px',cursor:'pointer',fontSize:13 }}>取消</button>
          <button onClick={()=>{
            if(!name.trim()||!providerId)return;
            onSave({name:name.trim(),avatar:avatar.trim()||'🤖',providerId,model,temperature,maxTokens,systemPrompt});
          }} style={{ background:C.accent,border:'none',borderRadius:6,color:'#fff',padding:'8px 18px',cursor:'pointer',fontSize:13,fontWeight:600 }}>保存</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,.35)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center' };
const modal: React.CSSProperties = { background:'#fff',border:'1px solid #F0D8E0',borderRadius:14,width:540,maxHeight:'85vh',overflow:'auto',boxShadow:'0 8px 40px rgba(0,0,0,.12)' };
const lbl: React.CSSProperties = { fontSize:12,color:'#8A6070',fontWeight:600 };
const inp: React.CSSProperties = { background:'#FFF5F8',border:'1px solid #F0D8E0',borderRadius:8,padding:'8px 12px',color:'#4A2C3A',fontSize:13,outline:'none',width:'100%' };
const sel: React.CSSProperties = { ...inp, cursor:'pointer' };
