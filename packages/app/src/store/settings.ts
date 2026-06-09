import { create } from 'zustand';

export const MODELS = [
  'gpt-4o', 'deepseek-v4-pro', 'deepseek-v3', 'deepseek-v4-flash',
  'claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5-20251001',
  'gemini-3-pro', 'gemini-2.5-pro', 'gemini-2.5-flash',
  'doubao-seed-1-6-250615', 'doubao-seed-2-0-pro-260215',
];

export const PERSONAS: Record<string, string> = {
  '': '',
  '苏暮雨': '你是苏暮雨，暗河杀手组织蛛影团首领「傀」。外表清冷疏离、沉默寡言，内心温柔且重信守诺。你惯用一把内藏利刃的油纸伞，精于十八剑阵。说话简洁有力，偶尔流露出对江湖往事的感怀。用中文回答，不使用机器人术语，回答尽量在30字以内。',
  '燕应行': '你是燕应行，一位行走江湖的神秘剑客。性格豪迈洒脱，喜欢以剑会友。说话风趣幽默偶尔引用诗词。对武林典故了如指掌。用中文回答，不使用机器人术语，回答尽量在30字以内。',
  '通用助手': '你是一个有用的 AI 助手，用简洁清晰的中文回答。',
};

function load() {
  try { return JSON.parse(localStorage.getItem('paw-settings') || '{}'); } catch { return {}; }
}
function save(s: Partial<SettingsStore>) {
  localStorage.setItem('paw-settings', JSON.stringify({
    model: s.model, apiKey: s.apiKey, persona: s.persona,
    systemPrompt: s.systemPrompt, endpoint: s.endpoint,
  }));
}

interface SettingsStore {
  model: string;
  apiKey: string;
  persona: string;
  systemPrompt: string;
  endpoint: string;

  setModel: (v: string) => void;
  setApiKey: (v: string) => void;
  setPersona: (v: string) => void;
  setSystemPrompt: (v: string) => void;
  setEndpoint: (v: string) => void;
}

const s = load();

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  model: s.model || 'gpt-4o',
  apiKey: s.apiKey || 'sk-EiMUv0xpSpRk6JJWBZz6Ob7yzx6sKBFXRSaK4HyKjrEqXoS6',
  persona: s.persona || '',
  systemPrompt: s.systemPrompt || '',
  endpoint: s.endpoint || 'https://paw.v1chat.cc/v1',

  setModel: (v) => { set({ model: v }); save({ ...get() }); },
  setApiKey: (v) => { set({ apiKey: v }); save({ ...get() }); },
  setPersona: (v) => {
    set({ persona: v, systemPrompt: PERSONAS[v] || '' });
    save({ ...get() });
  },
  setSystemPrompt: (v) => { set({ systemPrompt: v }); save({ ...get() }); },
  setEndpoint: (v) => { set({ endpoint: v }); save({ ...get() }); },
}));
