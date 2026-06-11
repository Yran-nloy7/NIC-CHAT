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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FFF5F8', color: '#4A2C3A', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif" }}>
      <nav style={{ display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #F0D8E0', padding: '0 20px', height: 46, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#E91E63', marginRight: 28, whiteSpace: 'nowrap' }}>NIC-CHAT</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => { const a = tab === t.key; return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: 'none', borderRadius: '8px 8px 0 0', background: a ? '#FFF5F8' : 'transparent', color: a ? '#E91E63' : '#C0A0B0', fontSize: 13, fontWeight: a ? 600 : 400, cursor: 'pointer', borderBottom: a ? '2px solid #E91E63' : '2px solid transparent', transition: 'all .15s' }}><span>{t.icon}</span><span>{t.label}</span></button>
          );})}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#C0A0B0' }}>v2.0</span>
      </nav>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {tab === 'chat' && <ChatPage />}
        {tab === 'personas' && <PersonaPage />}
        {tab === 'expansion' && <ExpansionPage />}
        {tab === 'personal' && <PersonalPage />}
      </div>
    </div>
  );
}
