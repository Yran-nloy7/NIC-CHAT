import { useDataStore } from '../store/data';

interface Props { onAdd: () => void; }

export function Sidebar({ onAdd }: Props) {
  const personas = useDataStore(s => s.personas);
  const selectedId = useDataStore(s => s.selectedPersonaId);
  const select = useDataStore(s => s.selectPersona);

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* 标题栏 */}
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-slate-200">
        <span className="section-label">角色</span>
        <button
          onClick={onAdd}
          className="bg-accent text-white rounded-md w-[26px] h-[26px] flex items-center justify-center cursor-pointer font-semibold text-base hover:bg-accent-dark transition-colors"
        >+</button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {personas.length === 0 && (
          <div className="p-[30px] text-center text-slate-400 text-xs">
            暂无角色<br />
            <span className="text-accent cursor-pointer text-[11px] hover:underline" onClick={onAdd}>+ 创建第一个</span>
          </div>
        )}
        {personas.map(p => { const sel = p.id === selectedId; return (
          <div
            key={p.id}
            onClick={() => select(p.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-[3px] cursor-pointer transition-all duration-100 ${
              sel
                ? 'bg-accent/10 border border-accent/20'
                : 'bg-transparent border border-transparent hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">{p.avatar || '🤖'}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] whitespace-nowrap overflow-hidden text-ellipsis ${sel ? 'font-semibold text-slate-900' : 'font-normal text-slate-700'}`}>
                {p.name || '未命名'}
              </div>
              <div className="text-[10px] text-slate-400">{p.model || '未配置'}</div>
            </div>
          </div>
        );})}
      </div>
    </aside>
  );
}
