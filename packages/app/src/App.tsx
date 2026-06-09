import { useState } from 'react';
import { ChatPage } from './pages/ChatPage';
import { PersonaPage } from './pages/PersonaPage';
import { SettingsPage } from './pages/SettingsPage';

type Tab = 'chat' | 'personas' | 'settings';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'chat', label: '聊天', icon: '💬' },
  { key: 'personas', label: '人设', icon: '🎭' },
  { key: 'settings', label: '配置', icon: '⚙️' },
];

const W = { bg: '#FFF5F8', card: '#FFFFFF', border: '#F0D8E0', text: '#4A2C3A', text2: '#8A6070', text3: '#B890A0', accent: '#E91E63', accentLight: '#FCE4EC', hover: '#FFEEF3', navBg: '#FFFFFF' };

export default function App() {
  const [tab, setTab] = useState<Tab>('chat');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: W.bg, color: W.text }}>
      {/* Top Navigation */}
      <nav style={{
        display: 'flex', alignItems: 'center',
        background: W.navBg, borderBottom: `1px solid ${W.border}`,
        padding: '0 20px', height: 46, flexShrink: 0, gap: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}>
        <div style={{
          fontSize: 15, fontWeight: 700, marginRight: 28,
          color: W.accent, whiteSpace: 'nowrap',
        }}>
          AI Chat
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', border: 'none', borderRadius: '8px 8px 0 0',
                  background: active ? W.bg : 'transparent',
                  color: active ? W.accent : W.text3,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  borderBottom: active ? `2px solid ${W.accent}` : '2px solid transparent',
                  transition: 'all .15s',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: W.text3 }}>v1.0</span>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {tab === 'chat' && <ChatPage />}
        {tab === 'personas' && <PersonaPage />}
        {tab === 'settings' && <SettingsPage />}
      </div>
    </div>
  );
}
