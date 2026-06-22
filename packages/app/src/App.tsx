import { useState } from 'react';
import { ChatPage } from './pages/ChatPage';
import { PersonaPage } from './pages/PersonaPage';
import { ExpansionPage } from './pages/ExpansionPage';
import { PersonalPage } from './pages/PersonalPage';

type Tab = 'chat' | 'personas' | 'expansion' | 'personal';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'chat', label: '聊天', icon: '💬' },
  { key: 'personas', label: '人设', icon: '🎭' },
  { key: 'expansion', label: '拓展', icon: '🌍' },
  { key: 'personal', label: '个人', icon: '👤' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('chat');

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      {/* 顶部导航 */}
      <header className="flex items-center bg-white border-b border-slate-200 px-5 h-[46px] shrink-0 shadow-sm z-10">
        <div className="text-[15px] font-bold text-accent mr-7 whitespace-nowrap tracking-tight">NIC-CHAT</div>
        <nav className="flex gap-0">
          {TABS.map(t => { const a = tab === t.key; return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-[18px] py-2.5 border-none rounded-t-lg text-[13px] cursor-pointer transition-all duration-150 ${
                a
                  ? 'bg-slate-50 text-accent font-semibold border-b-2 border-accent'
                  : 'bg-transparent text-slate-400 border-b-2 border-transparent hover:text-slate-600'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );})}
        </nav>
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">v2.0</span>
      </header>

      {/* 内容区 */}
      <main className="flex-1 flex overflow-hidden">
        {tab === 'chat' && <ChatPage />}
        {tab === 'personas' && <PersonaPage />}
        {tab === 'expansion' && <ExpansionPage />}
        {tab === 'personal' && <PersonalPage />}
      </main>
    </div>
  );
}
