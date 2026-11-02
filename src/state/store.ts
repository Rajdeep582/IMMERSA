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
  layout: 'phone' | 'tablet' | 'desktop';
  setLayout: (l: 'phone' | 'tablet' | 'desktop') => void;
  /** One-finger / left-button drag pans instead of rotating. */
  panMode: boolean;
  /** Right panel shows the full study view. */
  studyMode: boolean;
  setStudyMode: (v: boolean) => void;
  /** Start-up screen still covering the app (the 3D view does not draw meanwhile). */
  introActive: boolean;
  /** Merged draw batches still being built (start-up screen waits for 0). */
  batchPending: number;
  /** Atlas labels with leader lines in the 3D view. */
  labels: boolean;
  setLabels: (v: boolean) => void;
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
  /** Slice dissection amount 0–1 (vertical slabs; selected part only, rest ghosted). */
  explode: number;
  /** Number of vertical slabs for the slice dissection. */
  sliceCount: number;
  /** Floating slice-dissection control visible. */
  sliceOpen: boolean;
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
  setSliceCount: (n: number) => void;
  setSliceOpen: (v: boolean) => void;
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

/** Default layer opacities per body. Female musculature is switched off for now (the HRA source only has
 * a few muscles; a full fitted set is not enabled yet). */
const opacitiesFor = (m: BodyModel): SystemOpacity => {
  const o = defaultOpacities();
  if (m === 'female') o.muscular = 0;
  return o;
};

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
  layout: 'desktop',
  setLayout: (layout) => set({ layout }),
  panMode: false,
  batchPending: 0,
  studyMode: false,
  setStudyMode: (studyMode) => set(studyMode ? { studyMode, rightOpen: true } : { studyMode }),
  introActive: typeof document !== 'undefined' && !!document.getElementById('intro'),
  // Body labels start off on every launch; the toolbar Labels button (or L) turns them on.
  labels: false,
  setLabels: (labels) => set({ labels }),
  setImmersive: (immersive) => set({ immersive }),
  setPanMode: (panMode) => set({ panMode }),
  setBodyModel: (bodyModel, mappedSelection = null) => {
    if (get().bodyModel === bodyModel) return;
    set((x) => ({ opacity: { ...x.opacity, muscular: opacitiesFor(bodyModel).muscular } }));
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
    });
  },
  ready: false,
  fatal: null,
  systemStatus: {},
  opacity: opacitiesFor(initialModel()),
  hidden: new Set(),
  faded: new Set(),
  isolate: null,
  selectedId: null,
  hoveredId: null,
  hoverPos: null,
  explode: 0,
  sliceCount: 12,
  sliceOpen: false,
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
    set({ opacity: opacitiesFor(get().bodyModel), hidden: new Set(), faded: new Set(), isolate: null, explode: 0 }),
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
    // Selecting during a slice dissection keeps it running: the new selection becomes the dissected part.
    set({ selectedId: id });
  },
  hover: (id, pos = null) => {
    const s = get();
    if (s.hoveredId !== id || (pos && (!s.hoverPos || Math.abs(s.hoverPos.x - pos.x) + Math.abs(s.hoverPos.y - pos.y) > 2)) || (!pos && s.hoverPos))
      set({ hoveredId: id, hoverPos: id ? pos : null });
  },
  setExplode: (explode) => set({ explode }),
  setSliceCount: (sliceCount) => set({ sliceCount }),
  setSliceOpen: (sliceOpen) => set({ sliceOpen }),
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
