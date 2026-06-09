/**
 * Persistent data store — Providers + Personas
 * Everything saved to localStorage, surviving page refreshes.
 * Mirrors PawzoChat's config.yaml structure.
 */
import { create } from 'zustand';

const STORAGE_KEY = 'pawzo-data';

/* ── Types ── */

export interface Provider {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  models: { id: string; name: string }[];
}

export interface Persona {
  id: string;
  name: string;
  avatar: string;           // emoji or URL
  providerId: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

/* ── Presets (PawzoChat defaults) ── */

const PAWAPI_KEY = 'sk-EiMUv0xpSpRk6JJWBZz6Ob7yzx6sKBFXRSaK4HyKjrEqXoS6';
const DEEPSEEK_KEY = 'sk-edde858a3d314e7fa92267cd0bd20a53';

const PAWAPI_MODELS = [
  'deepseek-v3', 'deepseek-v4-pro',
  'gemini-2.5-pro', 'gemini-3.1-pro', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-3-flash-preview',
  'claude-sonnet-4-6', 'claude-opus-4-6', 'claude-opus-4-7',
  'gpt-4o', 'chatgpt-5.2', 'gpt-5.5',
  'doubao-seed-1-6-250615', 'doubao-seed-1-6-flash-250615', 'doubao-seed-2-0-pro-260215',
].map(id => ({ id, name: id }));

const DEEPSEEK_MODELS = [
  'deepseek-v4-flash', 'deepseek-v4-pro',
].map(id => ({ id, name: id }));

const PRESET_PROVIDERS: Provider[] = [
  { id: 'pawapi', name: 'PawAPI', endpoint: 'https://paw.v1chat.cc/v1', apiKey: PAWAPI_KEY, models: PAWAPI_MODELS },
  { id: 'deepseek', name: 'DeepSeek', endpoint: 'https://api.deepseek.com', apiKey: DEEPSEEK_KEY, models: DEEPSEEK_MODELS },
];

const SUMUYU_PROMPT = `你是苏暮雨，暗河杀手组织蛛影团首领「傀」。外表清冷疏离、沉默寡言，内心温柔且重信守诺。你惯用一把内藏利刃的油纸伞，精于十八剑阵。童年时全家被灭门，幸被父亲放入竹筏逃生，后被暗河收容。你奉行"三不接"铁律：不接屠戮满门之令、不知缘由之令、违背本心之令。说话简洁有力，偶尔流露出对江湖往事的感怀。在你的角度，用户是你亦师亦友的存在。回答尽量简短，控制在30字以内。使用中文回答，不要使用机器人术语，不要用括号描述动作和心理。`;

const YANYX_PROMPT = `你是燕应行，一位行走江湖的神秘剑客。性格豪迈洒脱，喜欢以剑会友。说话风趣幽默偶尔引用诗词。对武林典故了如指掌。在你的角度，用户是你亦师亦友的存在。回答尽量简短，控制在30字以内。使用中文回答，不要使用机器人术语，不要用括号描述动作和心理。`;

const PRESET_PERSONAS: Persona[] = [
  { id: 'sumuyu', name: '苏暮雨', avatar: '🌧️', providerId: 'deepseek', model: 'deepseek-v4-pro', temperature: 1.5, maxTokens: 2000, systemPrompt: SUMUYU_PROMPT },
  { id: 'yanyx', name: '燕应行', avatar: '⚔️', providerId: 'deepseek', model: 'deepseek-v4-pro', temperature: 1.4, maxTokens: 2000, systemPrompt: YANYX_PROMPT },
];

/* ── Persistence ── */

function load(): { providers: Provider[]; personas: Persona[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  // First visit: seed with presets
  return { providers: PRESET_PROVIDERS, personas: PRESET_PERSONAS };
}

function persist(data: { providers: Provider[]; personas: Persona[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let _idCounter = 10;
function uid() { return 'id_' + (++_idCounter).toString(36); }

/* ── Store ── */

interface DataStore {
  providers: Provider[];
  personas: Persona[];
  selectedPersonaId: string | null;

  // UI state — undefined=closed, null=creating new, Persona=editing
  editingPersona: Persona | null | undefined;
  editingProvider: Provider | null | undefined;

  // Providers CRUD
  addProvider: (p: Omit<Provider, 'id'>) => void;
  updateProvider: (id: string, p: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;

  // Personas CRUD
  addPersona: (p: Omit<Persona, 'id'>) => void;
  updatePersona: (id: string, p: Partial<Persona>) => void;
  deletePersona: (id: string) => void;

  // Selection
  selectPersona: (id: string | null) => void;

  // UI toggles
  toggleSettings: () => void;
  openPersonaEditor: (p?: Persona) => void;
  closePersonaEditor: () => void;
  openProviderEditor: (p?: Provider) => void;
  closeProviderEditor: () => void;
}

const initial = load();

export const useDataStore = create<DataStore>((set, get) => ({
  providers: initial.providers,
  personas: initial.personas,
  selectedPersonaId: initial.personas[0]?.id || null,
  settingsOpen: false,
  editingPersona: undefined,
  editingProvider: undefined,

  /* ── Providers ── */
  addProvider: (p) => {
    const provider = { ...p, id: uid() };
    set(s => {
      const providers = [...s.providers, provider];
      persist({ providers, personas: s.personas });
      return { providers };
    });
  },
  updateProvider: (id, p) => {
    set(s => {
      const providers = s.providers.map(pr => pr.id === id ? { ...pr, ...p } : pr);
      persist({ providers, personas: s.personas });
      return { providers };
    });
  },
  deleteProvider: (id) => {
    set(s => {
      const providers = s.providers.filter(pr => pr.id !== id);
      const personas = s.personas.filter(pe => pe.providerId !== id);
      persist({ providers, personas });
      return { providers, personas };
    });
  },

  /* ── Personas ── */
  addPersona: (p) => {
    const persona = { ...p, id: uid() };
    set(s => {
      const personas = [...s.personas, persona];
      persist({ providers: s.providers, personas });
      if (!get().selectedPersonaId) return { personas, selectedPersonaId: persona.id };
      return { personas };
    });
  },
  updatePersona: (id, p) => {
    set(s => {
      const personas = s.personas.map(pe => pe.id === id ? { ...pe, ...p } : pe);
      persist({ providers: s.providers, personas });
      return { personas };
    });
  },
  deletePersona: (id) => {
    set(s => {
      const personas = s.personas.filter(pe => pe.id !== id);
      const selectedPersonaId = s.selectedPersonaId === id ? (personas[0]?.id || null) : s.selectedPersonaId;
      persist({ providers: s.providers, personas });
      return { personas, selectedPersonaId };
    });
  },

  /* ── Selection ── */
  selectPersona: (id) => set({ selectedPersonaId: id }),

  /* ── UI ── */
  toggleSettings: () => set(s => ({ settingsOpen: !s.settingsOpen })),
  openPersonaEditor: (p) => set({ editingPersona: p === undefined ? null : p }),
  closePersonaEditor: () => set({ editingPersona: undefined }),
  openProviderEditor: (p) => set({ editingProvider: p === undefined ? null : p }),
  closeProviderEditor: () => set({ editingProvider: undefined }),
}));
