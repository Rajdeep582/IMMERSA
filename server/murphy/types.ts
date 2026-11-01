/** Wire types shared by the Doctor Murphy serverless function and the app. */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** What the student is doing in IMMERSA when they ask. */
export interface MurphyContext {
  body?: 'male' | 'female';
  view?: 'explore' | 'learn';
  /** Structure selected in the 3D explorer. */
  selected?: { name: string; system?: string; kind?: string; side?: string; path?: string[] };
  /** Isolated / ghosted structure, if any. */
  isolate?: { name: string; mode: string };
  /** Guide open in Learn. */
  topic?: { title: string; tagline?: string };
  /** Short extracts from IMMERSA's own study notes relevant to the question (built on the device). */
  local?: { title: string; text: string }[];
}

export interface MurphyRequest {
  message: string;
  history?: ChatTurn[];
  context?: MurphyContext;
}

export interface Source {
  n: number;
  title: string;
  url: string;
  /** e.g. "StatPearls", "Lancet (review)", "MedlinePlus", "IMMERSA notes" */
  source: string;
  year?: string;
  snippet: string;
}

/** Understanding of the question produced before retrieval. */
export interface Plan {
  /** Spelling-corrected wording of the user's message. */
  corrected: string;
  /** Self-contained question with pronouns/follow-ups resolved from context and history. */
  resolved: string;
  /** 1–3 PubMed-style search queries (medical terminology, MeSH-like). */
  search: string[];
  /** Lay term for MedlinePlus, '' if not useful. */
  consumer: string;
  intent: string;
  /** User describes their own (or someone's) current symptoms. */
  personal: boolean;
  /** Possible emergency (red-flag symptoms). */
  urgent: boolean;
  /** False for greetings / app questions that need no literature. */
  retrieve: boolean;
  /** The exact aspect asked (e.g. "function only", "nerve supply"), used to keep answers on point. */
  focus: string;
  /** How much the student asked for: brief (default), standard, or detailed (only when explicitly asked). */
  depth: 'brief' | 'standard' | 'detailed';
}

/** Server-sent events, one JSON object per `data:` line. */
export type MurphyEvent =
  | { type: 'status'; stage: 'understanding' | 'searching' | 'writing' }
  | { type: 'meta'; plan: Pick<Plan, 'corrected' | 'resolved' | 'urgent' | 'personal'>; sources: Source[]; model?: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; model?: string }
  | { type: 'error'; message: string; code?: string };
