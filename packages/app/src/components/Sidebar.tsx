import { useDataStore } from '../store/data';

interface Props {
  onAdd: () => void;
}

export function Sidebar({ onAdd }: Props) {
  const personas = useDataStore((s) => s.personas);
  const selectedId = useDataStore((s) => s.selectedPersonaId);
  const select = useDataStore((s) => s.selectPersona);

  return (
    <aside className="flex w-[220px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
        <span className="section-label">角色 Agent</span>
        <button
          onClick={onAdd}
          className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {personas.length === 0 && (
          <div className="p-[30px] text-center text-xs text-slate-400">
            暂无角色
            <br />
            <span className="cursor-pointer text-[11px] text-accent hover:underline" onClick={onAdd}>
              + 创建第一个
            </span>
          </div>
        )}
        {personas.map((persona) => {
          const selected = persona.id === selectedId;
          return (
            <div
              key={persona.id}
              onClick={() => select(persona.id)}
              className={`mb-[3px] flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-100 ${
                selected
                  ? 'border-accent/20 bg-accent/10'
                  : 'border-transparent bg-transparent hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-bold text-accent">{persona.avatar || 'AI'}</span>
              <div className="min-w-0 flex-1">
                <div className={`overflow-hidden text-ellipsis whitespace-nowrap text-[13px] ${selected ? 'font-semibold text-slate-900' : 'font-normal text-slate-700'}`}>
                  {persona.name || '未命名'}
                </div>
                <div className="text-[10px] text-slate-400">{persona.model || '未配置模型'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
