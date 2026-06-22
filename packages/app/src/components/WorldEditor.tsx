import { useState } from 'react';
import type { World } from '../store/data';

interface Props { world: World | null; onSave: (d: Omit<World, 'id'>) => void; onCancel: () => void; }

const COLORS = ['#6366F1','#8B5CF6','#EC4899','#F43F5E','#F97316','#EAB308','#22C55E','#14B8A6','#3B82F6','#64748B'];

export function WorldEditor({ world, onSave, onCancel }: Props) {
  const [name, setName] = useState(world?.name || '');
  const [description, setDesc] = useState(world?.description || '');
  const [coverColor, setColor] = useState(world?.coverColor || COLORS[0]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/35 backdrop-blur flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white border border-slate-200 rounded-2xl w-[440px] shadow-xl" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-200">
          <h3 className="m-0 text-[15px] font-bold text-slate-900">{world?.id ? '编辑世界观' : '新建世界观'}</h3>
          <button onClick={onCancel} className="bg-transparent border-none text-slate-400 text-xl cursor-pointer hover:text-slate-600 transition-colors">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-2.5">
          <label className="field-label">名称</label>
          <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} placeholder="世界观名称" />

          <label className="field-label">描述</label>
          <textarea className="input-field w-full min-h-[80px]" value={description} onChange={e => setDesc(e.target.value)} placeholder="描述这个世界观的背景..." rows={4} />

          <label className="field-label">主题色</label>
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full cursor-pointer transition-all"
                style={{
                  background: c,
                  border: coverColor === c ? '3px solid #1E293B' : '3px solid transparent',
                  transform: coverColor === c ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">取消</button>
          <button onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), description, coverColor, template: world?.template || '', lore: world?.lore || '', relations: world?.relations || [] }); }} className="btn-primary">保存</button>
        </div>
      </div>
    </div>
  );
}
