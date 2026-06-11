import { useState } from 'react';
import type { World } from '../store/data';

interface Props { world: World | null; onSave: (d: Omit<World, 'id'>) => void; onCancel: () => void; }

const C = { bg: '#fff', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', accent: '#E91E63', inputBg: '#FFF5F8' };
const COLORS = ['#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#009688','#4CAF50','#FF9800','#795548','#607D8B'];

export function WorldEditor({ world, onSave, onCancel }: Props) {
  const [name, setName] = useState(world?.name || '');
  const [description, setDesc] = useState(world?.description || '');
  const [coverColor, setColor] = useState(world?.coverColor || COLORS[0]);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,.35)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onCancel}>
      <div style={{ background:'#fff',border:'1px solid #F0D8E0',borderRadius:14,width:440,boxShadow:'0 8px 40px rgba(0,0,0,.12)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:`1px solid ${C.border}` }}><h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.text }}>{world?.id ? '编辑世界观' : '新建世界观'}</h3><button onClick={onCancel} style={{ background:'none',border:'none',color:C.text2,fontSize:20,cursor:'pointer' }}>✕</button></div>
        <div style={{ padding:'16px 20px',display:'flex',flexDirection:'column',gap:10 }}>
          <label style={lbl}>名称</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="世界观名称" />
          <label style={lbl}>描述</label><textarea style={{...inp,minHeight:80}} value={description} onChange={e=>setDesc(e.target.value)} placeholder="描述这个世界观的背景..." rows={4} />
          <label style={lbl}>主题色</label>
          <div style={{ display:'flex',gap:6 }}>{COLORS.map(c=><button key={c} onClick={()=>setColor(c)} style={{ width:28,height:28,borderRadius:'50%',background:c,border:coverColor===c?'3px solid #4A2C3A':'3px solid transparent',cursor:'pointer' }} />)}</div>
        </div>
        <div style={{ padding:'12px 20px',borderTop:`1px solid ${C.border}`,display:'flex',justifyContent:'flex-end',gap:8 }}>
          <button onClick={onCancel} style={{ background:C.inputBg,border:'none',borderRadius:6,color:C.text,padding:'8px 18px',cursor:'pointer',fontSize:13 }}>取消</button>
          <button onClick={()=>{if(!name.trim())return;onSave({name:name.trim(),description,coverColor});}} style={{ background:C.accent,border:'none',borderRadius:6,color:'#fff',padding:'8px 18px',cursor:'pointer',fontSize:13,fontWeight:600 }}>保存</button>
        </div>
      </div>
    </div>
  );
}
const lbl: React.CSSProperties = { fontSize:11,color:'#8A6070',fontWeight:600 };
const inp: React.CSSProperties = { background:'#FFF5F8',border:'1px solid #F0D8E0',borderRadius:8,padding:'8px 12px',color:'#4A2C3A',fontSize:13,outline:'none',width:'100%' };
