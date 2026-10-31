import { create } from 'zustand';
import { defaultOpacities, type SystemOpacity } from '../data/systems';
import type { BodyModel, LoadStatus, SystemId } from '../data/types';

export type IsolateMode = 'hide' | 'ghost';
export type QualityTier = 'low' | 'medium' | 'high';

export interface GuidedState {
  journeyId: string;
  /** Continuous progress in stage units: 0 … stages-1. */
  progress: number;
  /** False while the user is free-roaming during a journey (camera no longer follows scroll). */
  following: boolean;
}

export type HintAction = { label: string; kind: 'ghost-others'; target: string } | { label: string; kind: 'inspect'; target: string };

export interface Hint {
  id: number;
  text: string;
  action?: HintAction;
}

export interface AppState {
  bodyModel: BodyModel;
  /** Model-only view: panels hidden, single info line at the bottom. */
  immersive: boolean;
  /** One-finger / left-button drag pans instead of rotating. */
  panMode: boolean;
  setImmersive: (v: boolean) => void;
  setPanMode: (v: boolean) => void;
  ready: boolean;
  fatal: string | null;
  systemStatus: Partial<Record<SystemId, LoadStatus>>;
  opacity: SystemOpacity;
  hidden: Set<string>;
  faded: Set<string>;
  isolate: { id: string; mode: IsolateMode } | null;
  selectedId: string | null;
  hoveredId: string | null;
  hoverPos: { x: number; y: number } | null;
  explode: number;
  inspectorOpen: boolean;
  leftOpen: boolean;
  rightOpen: boolean;
  leftTab: 'layers' | 'explore' | 'sources';
  guided: GuidedState | null;
  tier: QualityTier;
  showStats: boolean;
  hint: Hint | null;
  hiResRegion: string | null;

  /** Switch body model; per-model state (load status, hidden/faded/isolate, selection) is reset or remapped. */
  setBodyModel: (m: BodyModel, mappedSelection?: string | null) => void;
  setSystemStatus: (s: SystemId, st: LoadStatus) => void;
  setOpacity: (s: SystemId, v: number) => void;
  setOpacities: (o: Partial<SystemOpacity>) => void;
  resetAppearance: () => void;
  toggleHidden: (id: string) => void;
  toggleFaded: (id: string) => void;
  setIsolate: (iso: AppState['isolate']) => void;
  select: (id: string | null) => void;
  hover: (id: string | null, pos?: { x: number; y: number } | null) => void;
  setExplode: (v: number) => void;
  setInspectorOpen: (v: boolean) => void;
  setLeftOpen: (v: boolean) => void;
  setRightOpen: (v: boolean) => void;
  setLeftTab: (t: AppState['leftTab']) => void;
  setGuided: (g: GuidedState | null) => void;
  patchGuided: (g: Partial<GuidedState>) => void;
  setTier: (t: QualityTier) => void;
  toggleStats: () => void;
  showHint: (text: string, action?: HintAction) => void;
  clearHint: () => void;
  setHiResRegion: (r: string | null) => void;
}

let hintSeq = 0;

const initialModel = (): BodyModel => {
  try {
    const q = new URLSearchParams(location.search).get('body');
    if (q === 'female' || q === 'male') return q;
    const s = localStorage.getItem('immersa.body');
    if (s === 'female' || s === 'male') return s;
  } catch {
    /* storage unavailable */
  }
  return 'male';
};

export const useApp = create<AppState>((set, get) => ({
  bodyModel: initialModel(),
  immersive: false,
  panMode: false,
  setImmersive: (immersive) => set({ immersive }),
  setPanMode: (panMode) => set({ panMode }),
  setBodyModel: (bodyModel, mappedSelection = null) => {
    if (get().bodyModel === bodyModel) return;
    try {
      localStorage.setItem('immersa.body', bodyModel);
    } catch {
      /* ignore */
    }
    set({
      bodyModel,
      systemStatus: {},
      hidden: new Set(),
      faded: new Set(),
      isolate: null,
      selectedId: mappedSelection,
      hoveredId: null,
      hoverPos: null,
      explode: 0,
      guided: null,
      hiResRegion: null,
      inspectorOpen: mappedSelection ? get().inspectorOpen : false,
    });
  },
  ready: false,
  fatal: null,
  systemStatus: {},
  opacity: defaultOpacities(),
  hidden: new Set(),
  faded: new Set(),
  isolate: null,
  selectedId: null,
  hoveredId: null,
  hoverPos: null,
  explode: 0,
  inspectorOpen: false,
  leftOpen: true,
  rightOpen: true,
  leftTab: 'layers',
  guided: null,
  tier: 'high',
  showStats: false,
  hint: null,
  hiResRegion: null,

  setSystemStatus: (s, st) => set((x) => ({ systemStatus: { ...x.systemStatus, [s]: st } })),
  setOpacity: (s, v) => set((x) => ({ opacity: { ...x.opacity, [s]: v } })),
  setOpacities: (o) => set((x) => ({ opacity: { ...x.opacity, ...o } })),
  resetAppearance: () =>
    set({ opacity: defaultOpacities(), hidden: new Set(), faded: new Set(), isolate: null, explode: 0 }),
  toggleHidden: (id) =>
    set((x) => {
      const h = new Set(x.hidden);
      if (h.has(id)) h.delete(id);
      else h.add(id);
      return { hidden: h };
    }),
  toggleFaded: (id) =>
    set((x) => {
      const f = new Set(x.faded);
      if (f.has(id)) f.delete(id);
      else f.add(id);
      return { faded: f };
    }),
  setIsolate: (isolate) => set({ isolate }),
  select: (id) => {
    if (get().selectedId === id) return;
    set({ selectedId: id, explode: 0 });
  },
  hover: (id, pos = null) => {
    const s = get();
    if (s.hoveredId !== id || (pos && (!s.hoverPos || Math.abs(s.hoverPos.x - pos.x) + Math.abs(s.hoverPos.y - pos.y) > 2)) || (!pos && s.hoverPos))
      set({ hoveredId: id, hoverPos: id ? pos : null });
  },
  setExplode: (explode) => set({ explode }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setLeftOpen: (leftOpen) => set({ leftOpen }),
  setRightOpen: (rightOpen) => set({ rightOpen }),
  setLeftTab: (leftTab) => set({ leftTab, leftOpen: true }),
  setGuided: (guided) => set({ guided }),
  patchGuided: (g) => set((x) => (x.guided ? { guided: { ...x.guided, ...g } } : {})),
  setTier: (tier) => set({ tier }),
  toggleStats: () => set((x) => ({ showStats: !x.showStats })),
  showHint: (text, action) => set({ hint: { id: ++hintSeq, text, action } }),
  clearHint: () => set({ hint: null }),
  setHiResRegion: (hiResRegion) => set({ hiResRegion }),
}));
