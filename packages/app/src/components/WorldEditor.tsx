import { useState } from 'react';
import type { World } from '../store/data';

interface Props {
  world: World | null;
  onSave: (data: Omit<World, 'id'>) => void;
  onCancel: () => void;
}

const COLORS = ['#6366F1', '#0EA5E9', '#14B8A6', '#22C55E', '#EAB308', '#F97316', '#F43F5E', '#EC4899', '#8B5CF6', '#64748B'];

export function WorldEditor({ world, onSave, onCancel }: Props) {
  const [name, setName] = useState(world?.name || '');
  const [description, setDescription] = useState(world?.description || '');
  const [lore, setLore] = useState(world?.lore || '');
  const [coverColor, setCoverColor] = useState(world?.coverColor || COLORS[0]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 backdrop-blur" onClick={onCancel}>
      <div className="w-[500px] rounded-2xl border border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h3 className="m-0 text-[15px] font-bold text-slate-900">{world?.id ? '编辑世界观' : '新建世界观'}</h3>
          <button onClick={onCancel} className="cursor-pointer border-none bg-transparent text-xl text-slate-400 transition-colors hover:text-slate-600">x</button>
        </div>

        <div className="flex flex-col gap-2.5 p-5">
          <label className="field-label">名称</label>
          <input className="input-field w-full" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如 暗河、未来都市、校园社团" />

          <label className="field-label">描述</label>
          <textarea className="input-field min-h-[70px] w-full" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="一句话描述这个世界观的背景" rows={3} />

          <label className="field-label">世界观补充</label>
          <textarea className="input-field min-h-[100px] w-full text-xs" value={lore} onChange={(event) => setLore(event.target.value)} placeholder="可放入势力关系、背景规则、重要事件等" rows={5} />

          <label className="field-label">主题色</label>
          <div className="flex gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCoverColor(color)}
                className="h-7 w-7 cursor-pointer rounded-full transition-all"
                style={{
                  background: color,
                  border: coverColor === color ? '3px solid #1E293B' : '3px solid transparent',
                  transform: coverColor === color ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onCancel} className="btn-secondary">取消</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), description, coverColor, template: world?.template || '', lore, relations: world?.relations || [] });
            }}
            className="btn-primary"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
