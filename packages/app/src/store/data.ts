import { create } from 'zustand';

export interface ProviderModel {
  id: string;
  name: string;
  capabilities?: string[];
  contextWindow?: number;
  maxOutput?: number;
  billingType?: 'token' | 'request' | 'quota' | 'free' | 'unknown';
  inputPrice?: string;
  outputPrice?: string;
  requestPrice?: string;
  quotaNote?: string;
  enabled?: boolean;
  note?: string;
}

export interface Provider {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  preset: 'openai-compatible' | 'pawapi' | 'deepseek' | 'ollama' | 'custom';
  authMode: 'bearer' | 'none';
  models: ProviderModel[];
  customHeaders: { key: string; value: string }[];
  timeout: number;
  rateLimitNote?: string;
  billingNote?: string;
}

export interface Persona {
  id: string;
  name: string;
  avatar: string;
  worldId?: string;
  providerId: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  emojiEnabled: boolean;
  emojiGroup: string;
  emojiProbability: number;
  memoryEnabled: boolean;
  memoryTriggerRounds: number;
  maxMemories: number;
  memoryInPrompt: boolean;
  proactiveEnabled: boolean;
  proactiveMinHours: number;
  proactiveMaxHours: number;
  proactiveMaxConsecutive: number;
  proactiveQuietStart: string;
  proactiveQuietEnd: string;
  proactivePrompt: string;
}

export interface CharacterRelation {
  from: string;
  to: string;
  type: string;
}

export interface World {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  template: string;
  lore: string;
  relations: CharacterRelation[];
}

export interface MCPAgent {
  id: string;
  name: string;
  type: string;
  command: string;
  enabled: boolean;
}

export interface Memory {
  id: string;
  personaId: string;
  content: string;
  summary: string;
  triggerRound: number;
  createdAt: number;
  conversationRefs: string[];
}

export interface PersonaCard {
  version: 1;
  exportedAt: string;
  persona: Omit<Persona, 'id'>;
  provider?: { name: string; endpoint: string };
}

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'interview' | 'creative' | 'companion' | 'debate' | 'roleplay' | 'custom';
  systemPromptAddon: string;
}

export interface Moment {
  id: string;
  personaId: string;
  content: string;
  images: string[];
  createdAt: number;
  likes: number;
  mood: string;
  isAuto: boolean;
}

export const SCENARIO_PRESETS: Scenario[] = [
  {
    id: 'interview',
    name: '模拟面试',
    icon: 'M',
    description: '结构化追问并给出复盘建议',
    category: 'interview',
    systemPromptAddon: '你现在是面试官。请围绕用户的目标岗位进行结构化面试，每轮只提出一个问题，并在最后给出评分和改进建议。',
  },
  {
    id: 'writer',
    name: '写作助手',
    icon: 'W',
    description: '改写、润色、提纲和风格迁移',
    category: 'creative',
    systemPromptAddon: '你是专业写作助手。先指出文本优点，再给出具体修改建议，并解释修改原因。',
  },
  {
    id: 'teacher',
    name: '知识导师',
    icon: 'T',
    description: '用启发式提问帮助理解知识',
    category: 'interview',
    systemPromptAddon: '你是知识导师。使用启发式提问和分层提示帮助用户理解问题，不要一开始就直接给完整答案。',
  },
  {
    id: 'companion',
    name: '陪伴对话',
    icon: 'C',
    description: '短句、自然、低打扰的日常对话',
    category: 'companion',
    systemPromptAddon: '你是一个自然、温和的聊天对象。回复尽量简短，像日常聊天，不要使用机器人口吻。',
  },
  {
    id: 'debate',
    name: '辩论陪练',
    icon: 'D',
    description: '从反方角度提出论证和追问',
    category: 'debate',
    systemPromptAddon: '你是辩论陪练。请对用户观点提出合理反驳，保持尊重，并指出双方论点的强弱。',
  },
  {
    id: 'roleplay',
    name: '角色扮演',
    icon: 'R',
    description: '根据人设和世界观持续对话',
    category: 'roleplay',
    systemPromptAddon: '你正在进行角色扮演。请严格遵守角色设定、世界观和说话风格，避免跳出角色。',
  },
];

const KEY = 'nic-chat-data';

interface StoredData {
  providers: Provider[];
  personas: Persona[];
  worlds: World[];
  agents: MCPAgent[];
  moments: Moment[];
  memories: Memory[];
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore corrupt local data and fall back to an empty workspace.
  }
  return { providers: [], personas: [], worlds: [], agents: [], moments: [], memories: [] };
}

function persist(d: StoredData) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

let seed = 0;
function uid(prefix = 'n') {
  seed += 1;
  return `${prefix}${seed.toString(36)}${Date.now().toString(36)}`;
}

interface DataStore extends StoredData {
  selectedPersonaId: string | null;
  selectedWorldId: string | null;
  editingPersona: Persona | null | undefined;
  editingProvider: Provider | null | undefined;
  editingWorld: World | null | undefined;
  addProvider: (p: Omit<Provider, 'id'>) => void;
  updateProvider: (id: string, p: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  addPersona: (p: Omit<Persona, 'id'>) => void;
  updatePersona: (id: string, p: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  addWorld: (w: Omit<World, 'id'>) => void;
  updateWorld: (id: string, w: Partial<World>) => void;
  deleteWorld: (id: string) => void;
  addAgent: (a: Omit<MCPAgent, 'id'>) => void;
  updateAgent: (id: string, a: Partial<MCPAgent>) => void;
  deleteAgent: (id: string) => void;
  addMoment: (m: Omit<Moment, 'id' | 'createdAt' | 'likes'>) => void;
  likeMoment: (id: string) => void;
  addMemory: (m: Omit<Memory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;
  exportPersonaCard: (personaId: string) => PersonaCard | null;
  importPersonaCard: (card: PersonaCard) => string;
  selectPersona: (id: string | null) => void;
  selectWorld: (id: string | null) => void;
  openPersonaEditor: (p?: Persona) => void;
  closePersonaEditor: () => void;
  openProviderEditor: (p?: Provider) => void;
  closeProviderEditor: () => void;
  openWorldEditor: (w?: World) => void;
  closeWorldEditor: () => void;
}

const init = load();

export const useDataStore = create<DataStore>((set, get) => ({
  ...init,
  selectedPersonaId: init.personas[0]?.id ?? null,
  selectedWorldId: init.worlds[0]?.id ?? null,
  editingPersona: undefined,
  editingProvider: undefined,
  editingWorld: undefined,

  addProvider: (p) => set((s) => saveState(s, { providers: [...s.providers, { ...p, id: uid('provider-') }] })),
  updateProvider: (id, p) => set((s) => saveState(s, { providers: s.providers.map((x) => x.id === id ? { ...x, ...p } : x) })),
  deleteProvider: (id) => set((s) => saveState(s, {
    providers: s.providers.filter((x) => x.id !== id),
    personas: s.personas.filter((x) => x.providerId !== id),
    selectedPersonaId: s.personas.some((x) => x.id === s.selectedPersonaId && x.providerId === id) ? null : s.selectedPersonaId,
  })),

  addPersona: (p) => set((s) => {
    const persona = { ...p, id: uid('persona-') };
    return saveState(s, { personas: [...s.personas, persona], selectedPersonaId: persona.id });
  }),
  updatePersona: (id, p) => set((s) => saveState(s, { personas: s.personas.map((x) => x.id === id ? { ...x, ...p } : x) })),
  deletePersona: (id) => set((s) => saveState(s, {
    personas: s.personas.filter((x) => x.id !== id),
    memories: s.memories.filter((x) => x.personaId !== id),
    moments: s.moments.filter((x) => x.personaId !== id),
    selectedPersonaId: s.selectedPersonaId === id ? null : s.selectedPersonaId,
  })),

  addWorld: (w) => set((s) => {
    const world = { ...w, id: uid('world-') };
    return saveState(s, { worlds: [...s.worlds, world], selectedWorldId: world.id });
  }),
  updateWorld: (id, w) => set((s) => saveState(s, { worlds: s.worlds.map((x) => x.id === id ? { ...x, ...w } : x) })),
  deleteWorld: (id) => set((s) => saveState(s, {
    worlds: s.worlds.filter((x) => x.id !== id),
    personas: s.personas.map((x) => x.worldId === id ? { ...x, worldId: undefined } : x),
    selectedWorldId: s.selectedWorldId === id ? null : s.selectedWorldId,
  })),

  addAgent: (a) => set((s) => saveState(s, { agents: [...s.agents, { ...a, id: uid('agent-') }] })),
  updateAgent: (id, a) => set((s) => saveState(s, { agents: s.agents.map((x) => x.id === id ? { ...x, ...a } : x) })),
  deleteAgent: (id) => set((s) => saveState(s, { agents: s.agents.filter((x) => x.id !== id) })),

  addMoment: (m) => set((s) => saveState(s, { moments: [{ ...m, id: uid('moment-'), createdAt: Date.now(), likes: 0 }, ...s.moments] })),
  likeMoment: (id) => set((s) => saveState(s, { moments: s.moments.map((x) => x.id === id ? { ...x, likes: x.likes + 1 } : x) })),

  addMemory: (m) => set((s) => saveState(s, { memories: [{ ...m, id: uid('memory-'), createdAt: Date.now() }, ...s.memories] })),
  deleteMemory: (id) => set((s) => saveState(s, { memories: s.memories.filter((x) => x.id !== id) })),

  exportPersonaCard: (personaId) => {
    const persona = get().personas.find((x) => x.id === personaId);
    if (!persona) return null;
    const provider = get().providers.find((x) => x.id === persona.providerId);
    const { id: _id, ...portable } = persona;
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      persona: portable,
      provider: provider ? { name: provider.name, endpoint: provider.endpoint } : undefined,
    };
  },

  importPersonaCard: (card) => {
    if (card.version !== 1) return '';
    let providerId = card.persona.providerId;
    if (card.provider?.endpoint) {
      const existing = get().providers.find((x) => x.endpoint === card.provider?.endpoint);
      providerId = existing?.id || uid('provider-');
      if (!existing) {
        const provider: Omit<Provider, 'id'> = {
          name: card.provider.name || 'Imported Provider',
          endpoint: card.provider.endpoint,
          apiKey: '',
          preset: 'openai-compatible',
          authMode: 'bearer',
          models: [{ id: card.persona.model, name: card.persona.model }],
          customHeaders: [],
          timeout: 120000,
        };
        set((s) => saveState(s, { providers: [...s.providers, { ...provider, id: providerId }] }));
      }
    }
    const id = uid('persona-');
    set((s) => saveState(s, { personas: [...s.personas, { ...card.persona, id, providerId }], selectedPersonaId: id }));
    return id;
  },

  selectPersona: (id) => set({ selectedPersonaId: id }),
  selectWorld: (id) => set({ selectedWorldId: id }),
  openPersonaEditor: (p) => set({ editingPersona: p === undefined ? null : p }),
  closePersonaEditor: () => set({ editingPersona: undefined }),
  openProviderEditor: (p) => set({ editingProvider: p === undefined ? null : p }),
  closeProviderEditor: () => set({ editingProvider: undefined }),
  openWorldEditor: (w) => set({ editingWorld: w === undefined ? null : w }),
  closeWorldEditor: () => set({ editingWorld: undefined }),
}));

function saveState(state: DataStore, patch: Partial<DataStore>): Partial<DataStore> {
  const next = { ...state, ...patch };
  persist({
    providers: next.providers,
    personas: next.personas,
    worlds: next.worlds,
    agents: next.agents,
    moments: next.moments,
    memories: next.memories,
  });
  return patch;
}

export function defaultPersona(): Omit<Persona, 'id'> {
  return {
    name: '',
    avatar: 'AI',
    worldId: undefined,
    providerId: '',
    model: '',
    temperature: 1,
    maxTokens: 2000,
    systemPrompt: '',
    emojiEnabled: false,
    emojiGroup: 'default',
    emojiProbability: 25,
    memoryEnabled: true,
    memoryTriggerRounds: 10,
    maxMemories: 50,
    memoryInPrompt: true,
    proactiveEnabled: false,
    proactiveMinHours: 1,
    proactiveMaxHours: 3,
    proactiveMaxConsecutive: 3,
    proactiveQuietStart: '22:00',
    proactiveQuietEnd: '08:00',
    proactivePrompt: '',
  };
}
