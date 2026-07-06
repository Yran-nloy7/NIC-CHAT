import { useState } from 'react';
import { ChatPage } from './pages/ChatPage';
import { PersonaPage } from './pages/PersonaPage';
import { ExpansionPage } from './pages/ExpansionPage';
import { PersonalPage } from './pages/PersonalPage';

type Tab = 'chat' | 'personas' | 'expansion' | 'personal';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'chat', label: '对话', icon: 'Chat' },
  { key: 'personas', label: '人设', icon: 'Persona' },
  { key: 'expansion', label: '拓展', icon: 'Tools' },
  { key: 'personal', label: '设置', icon: 'Config' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('chat');

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <header className="z-10 flex h-[46px] shrink-0 items-center border-b border-slate-200 bg-white px-5 shadow-sm">
        <div className="mr-7 whitespace-nowrap text-[15px] font-bold tracking-tight text-accent">NIC-CHAT</div>
        <nav className="flex gap-0">
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-t-lg border-none border-b-2 px-[18px] py-2.5 text-[13px] transition-all duration-150 ${
                  active
                    ? 'border-accent bg-slate-50 font-semibold text-accent'
                    : 'border-transparent bg-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">Agent Workspace</span>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {tab === 'chat' && <ChatPage />}
        {tab === 'personas' && <PersonaPage />}
        {tab === 'expansion' && <ExpansionPage />}
        {tab === 'personal' && <PersonalPage />}
      </main>
    </div>
  );
}
