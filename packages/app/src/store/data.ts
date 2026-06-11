import { create } from 'zustand';

/* ── Types ── */

export interface Provider {
  id: string; name: string; endpoint: string; apiKey: string;
  models: { id: string; name: string }[];
}

export interface Persona {
  id: string; name: string; avatar: string; worldId?: string;
  providerId: string; model: string;
  temperature: number; maxTokens: number;
  systemPrompt: string;
  emojiEnabled: boolean; emojiGroup: string; emojiProbability: number;
  memoryEnabled: boolean; memoryTriggerRounds: number; maxMemories: number; memoryInPrompt: boolean;
  proactiveEnabled: boolean; proactiveMinHours: number; proactiveMaxHours: number;
  proactiveMaxConsecutive: number; proactiveQuietStart: string; proactiveQuietEnd: string;
  proactivePrompt: string;
}

export interface World {
  id: string; name: string; description: string; coverColor: string;
}

export interface MCPAgent {
  id: string; name: string; type: string; command: string; enabled: boolean;
}

export interface Moment {
  id: string; personaId: string; content: string; images: string[]; createdAt: number; likes: number;
}

/* ── Persistence ── */

const KEY = 'nic-chat-data';

function load(): { providers: Provider[]; personas: Persona[]; worlds: World[]; agents: MCPAgent[]; moments: Moment[] } {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {}
  return { providers: [], personas: [], worlds: [], agents: [], moments: [] };
}
function save(d: any) { localStorage.setItem(KEY, JSON.stringify(d)); }

let _id = 0; function uid() { return 'n' + (++_id).toString(36) + Date.now().toString(36); }

/* ── Store ── */

interface DataStore {
  providers: Provider[]; personas: Persona[]; worlds: World[]; agents: MCPAgent[]; moments: Moment[];
  selectedPersonaId: string | null; selectedWorldId: string | null;

  // Modals
  editingPersona: Persona | null | undefined;
  editingProvider: Provider | null | undefined;
  editingWorld: World | null | undefined;

  // CRUD — Providers
  addProvider: (p: Omit<Provider, 'id'>) => void; updateProvider: (id: string, p: Partial<Provider>) => void; deleteProvider: (id: string) => void;
  // CRUD — Personas
  addPersona: (p: Omit<Persona, 'id'>) => void; updatePersona: (id: string, p: Partial<Persona>) => void; deletePersona: (id: string) => void;
  // CRUD — Worlds
  addWorld: (w: Omit<World, 'id'>) => void; updateWorld: (id: string, w: Partial<World>) => void; deleteWorld: (id: string) => void;
  // CRUD — Agents
  addAgent: (a: Omit<MCPAgent, 'id'>) => void; updateAgent: (id: string, a: Partial<MCPAgent>) => void; deleteAgent: (id: string) => void;
  // Moments
  addMoment: (m: Omit<Moment, 'id' | 'createdAt' | 'likes'>) => void;

  // Selection
  selectPersona: (id: string | null) => void; selectWorld: (id: string | null) => void;

  // Modal toggles
  openPersonaEditor: (p?: Persona) => void; closePersonaEditor: () => void;
  openProviderEditor: (p?: Provider) => void; closeProviderEditor: () => void;
  openWorldEditor: (w?: World) => void; closeWorldEditor: () => void;
}

const init = load();

export const useDataStore = create<DataStore>((set, get) => ({
  providers: init.providers, personas: init.personas, worlds: init.worlds,
  agents: init.agents, moments: init.moments,
  selectedPersonaId: null, selectedWorldId: null,
  editingPersona: undefined, editingProvider: undefined, editingWorld: undefined,

  // ── Providers ──
  addProvider: (p) => { const n = { ...p, id: uid() }; set(s => { const r = { ...s, providers: [...s.providers, n] }; save(r); return r; }); },
  updateProvider: (id, p) => { set(s => { const r = { ...s, providers: s.providers.map(x => x.id === id ? { ...x, ...p } : x) }; save(r); return r; }); },
  deleteProvider: (id) => { set(s => { const r = { ...s, providers: s.providers.filter(x => x.id !== id), personas: s.personas.filter(x => x.providerId !== id) }; save(r); return r; }); },

  // ── Personas ──
  addPersona: (p) => { const n = { ...p, id: uid() }; set(s => { const r = { ...s, personas: [...s.personas, n] }; save(r); return r; }); },
  updatePersona: (id, p) => { set(s => { const r = { ...s, personas: s.personas.map(x => x.id === id ? { ...x, ...p } : x) }; save(r); return r; }); },
  deletePersona: (id) => { set(s => { const r = { ...s, personas: s.personas.filter(x => x.id !== id), selectedPersonaId: s.selectedPersonaId === id ? null : s.selectedPersonaId }; save(r); return r; }); },

  // ── Worlds ──
  addWorld: (w) => { const n = { ...w, id: uid() }; set(s => { const r = { ...s, worlds: [...s.worlds, n] }; save(r); return r; }); },
  updateWorld: (id, w) => { set(s => { const r = { ...s, worlds: s.worlds.map(x => x.id === id ? { ...x, ...w } : x) }; save(r); return r; }); },
  deleteWorld: (id) => { set(s => { const r = { ...s, worlds: s.worlds.filter(x => x.id !== id), personas: s.personas.map(x => x.worldId === id ? { ...x, worldId: undefined } : x) }; save(r); return r; }); },

  // ── Agents ──
  addAgent: (a) => { const n = { ...a, id: uid() }; set(s => { const r = { ...s, agents: [...s.agents, n] }; save(r); return r; }); },
  updateAgent: (id, a) => { set(s => { const r = { ...s, agents: s.agents.map(x => x.id === id ? { ...x, ...a } : x) }; save(r); return r; }); },
  deleteAgent: (id) => { set(s => { const r = { ...s, agents: s.agents.filter(x => x.id !== id) }; save(r); return r; }); },

  // ── Moments ──
  addMoment: (m) => { const n = { ...m, id: uid(), createdAt: Date.now(), likes: 0 }; set(s => { const r = { ...s, moments: [n, ...s.moments] }; save(r); return r; }); },

  // ── Selection ──
  selectPersona: (id) => set({ selectedPersonaId: id }),
  selectWorld: (id) => set({ selectedWorldId: id }),

  // ── Modals ──
  openPersonaEditor: (p) => set({ editingPersona: p === undefined ? null : p }),
  closePersonaEditor: () => set({ editingPersona: undefined }),
  openProviderEditor: (p) => set({ editingProvider: p === undefined ? null : p }),
  closeProviderEditor: () => set({ editingProvider: undefined }),
  openWorldEditor: (w) => set({ editingWorld: w === undefined ? null : w }),
  closeWorldEditor: () => set({ editingWorld: undefined }),
}));

/* ── Defaults for new Persona ── */
export function defaultPersona(): Omit<Persona, 'id'> {
  return {
    name: '', avatar: '🤖', worldId: undefined, providerId: '', model: '',
    temperature: 1, maxTokens: 2000, systemPrompt: '',
    emojiEnabled: false, emojiGroup: '', emojiProbability: 25,
    memoryEnabled: false, memoryTriggerRounds: 10, maxMemories: 50, memoryInPrompt: true,
    proactiveEnabled: false, proactiveMinHours: 1, proactiveMaxHours: 3,
    proactiveMaxConsecutive: 3, proactiveQuietStart: '22:00', proactiveQuietEnd: '08:00',
    proactivePrompt: '',
  };
}
