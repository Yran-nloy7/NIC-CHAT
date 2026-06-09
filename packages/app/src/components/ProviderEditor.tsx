import { useState } from 'react';
import type { Provider } from '../store/data';

interface Props {
  provider: Provider | null;
  onSave: (data: Omit<Provider, 'id'>) => void;
  onCancel: () => void;
}

const C = { bg: '#FFFFFF', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', accent: '#E91E63', inputBg: '#FFF5F8', danger: '#E53935' };

export function ProviderEditor({ provider, onSave, onCancel }: Props) {
  const [name, setName] = useState(provider?.name || '');
  const [endpoint, setEndpoint] = useState(provider?.endpoint || '');
  const [apiKey, setApiKey] = useState(provider?.apiKey || '');
  const [modelsText, setModelsText] = useState(provider?.models.map(m => m.id).join('\n') || '');
  const [showKey, setShowKey] = useState(false);

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.text }}>{provider ? '编辑供应商' : '添加供应商'}</h3>
          <button onClick={onCancel} style={{ background:'none',border:'none',color:C.text2,fontSize:18,cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:'16px 20px',display:'flex',flexDirection:'column',gap:10 }}>
          <label style={lbl}>名称</label>
          <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="如: PawAPI, DeepSeek, Ollama" />
          <label style={lbl}>Endpoint</label>
          <input style={inp} value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="https://paw.v1chat.cc/v1" />
          <label style={lbl}>API Key</label>
          <div style={{ display:'flex',gap:6 }}>
            <input style={{...inp,flex:1}} type={showKey?'text':'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-..." />
            <button onClick={()=>setShowKey(!showKey)} style={{ background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:'8px 10px',cursor:'pointer',fontSize:14 }}>{showKey?'🙈':'👁'}</button>
          </div>
          <label style={lbl}>模型列表（每行一个 ID）</label>
          <textarea style={{...inp,minHeight:120,fontFamily:'monospace',fontSize:12}} value={modelsText} onChange={e=>setModelsText(e.target.value)} placeholder="gpt-4o\ndeepseek-v4-pro\nclaude-sonnet-4-6" rows={6} />
        </div>
        <div style={{ padding:'12px 20px',borderTop:`1px solid ${C.border}`,display:'flex',justifyContent:'flex-end',gap:8 }}>
          <button onClick={onCancel} style={{ background:C.inputBg,border:'none',borderRadius:6,color:C.text,padding:'8px 18px',cursor:'pointer',fontSize:13 }}>取消</button>
          <button onClick={handleSave} style={{ background:C.accent,border:'none',borderRadius:6,color:'#fff',padding:'8px 18px',cursor:'pointer',fontSize:13,fontWeight:600 }}>保存</button>
        </div>
      </div>
    </div>
  );

  function handleSave() {
    if (!name.trim() || !endpoint.trim()) return;
    onSave({
      name: name.trim(), endpoint: endpoint.trim(), apiKey: apiKey.trim(),
      models: modelsText.split('\n').map(l=>l.trim()).filter(Boolean).map(id=>({id,name:id})),
    });
  }
}

const overlay: React.CSSProperties = { position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,.35)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center' };
const modal: React.CSSProperties = { background:'#fff',border:'1px solid #F0D8E0',borderRadius:14,width:480,maxHeight:'80vh',overflow:'auto',boxShadow:'0 8px 40px rgba(0,0,0,.12)' };
const lbl: React.CSSProperties = { fontSize:12,color:'#8A6070',fontWeight:600 };
const inp: React.CSSProperties = { background:'#FFF5F8',border:'1px solid #F0D8E0',borderRadius:8,padding:'8px 12px',color:'#4A2C3A',fontSize:13,outline:'none',width:'100%' };
