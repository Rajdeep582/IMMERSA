import { create } from 'zustand';
import type {
  AtlasManifest,
  BiologicalSex,
  DisplayMode,
  GuidedTour,
  StandardView,
  SystemId,
  ViewportSettings,
} from '../types/anatomy';
import { ALL_SYSTEM_IDS } from '../data/systems';
import { GUIDED_TOURS } from '../data/guidedTours';
import { isExternalGenitalPart, isPartVisibleForSex, isSurfacePart } from '../data/anatomyCatalog';

const SURFACE_SYSTEMS: SystemId[] = ['integumentary', 'sensory', 'reproductive'];

const MODE_SYSTEMS: Record<Exclude<DisplayMode, 'custom'>, SystemId[]> = {
  surface: SURFACE_SYSTEMS,
  muscles: ['muscular', 'skeletal', 'connective'],
  skeleton: ['skeletal', 'connective'],
  organs: [
    'cardiac',
    'arterial',
    'venous',
    'nervous',
    'respiratory',
    'digestive',
    'urinary',
    'lymphatic',
    'endocrine',
    'reproductive',
  ],
  all: ALL_SYSTEM_IDS,
};

interface AnatomyStoreState {
  manifest: AtlasManifest | null;
  loading: boolean;
  loadProgress: number;
  error: string | null;

  // Biological sex
  biologicalSex: BiologicalSex;

  // Layer & structure state
  visibleSystems: SystemId[];
  displayMode: DisplayMode;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isolated: boolean;
  ghostOthers: boolean;
  explosionFactor: number;

  // View & camera state
  activeView: StandardView;
  cameraResetNonce: number;
  zoomInNonce: number;
  zoomOutNonce: number;
  focusTarget: {
    position: [number, number, number];
    eyePosition?: [number, number, number];
    distance?: number;
    nonce: number;
  } | null;

  // Inspector & secondary viewport
  inspectorOpen: boolean;
  inspectModalOpen: boolean;

  // Guided tours & scrollytelling
  activeTour: GuidedTour | null;
  tourStepIndex: number;

  // Search UI
  searchOpen: boolean;

  // Medical Documentation Page
  activeDocumentation: { partId?: string; systemId?: SystemId } | null;

  // Settings
  settings: ViewportSettings;

  // Actions
  setBiologicalSex: (sex: BiologicalSex) => void;
  setManifest: (manifest: AtlasManifest) => void;
  setLoading: (loading: boolean) => void;
  setLoadProgress: (progress: number) => void;
  setError: (error: string | null) => void;

  setDisplayMode: (mode: DisplayMode) => void;
  toggleSystem: (system: SystemId) => void;
  setSystemVisible: (system: SystemId, visible: boolean) => void;
  showAllSystems: () => void;
  isolateSystem: (system: SystemId) => void;
  setExplosionFactor: (factor: number) => void;

  selectPart: (partId: string | null) => void;
  setHoveredPart: (partId: string | null) => void;
  setIsolated: (isolated: boolean) => void;
  setGhostOthers: (ghost: boolean) => void;

  setActiveView: (view: StandardView) => void;
  triggerResetCamera: () => void;
  triggerZoomIn: () => void;
  triggerZoomOut: () => void;
  focusOnStructure: (coords: [number, number, number], distance?: number, eyePosition?: [number, number, number]) => void;

  setInspectorOpen: (open: boolean) => void;
  setInspectModalOpen: (open: boolean) => void;

  startTour: (tourId: string) => void;
  exitTour: () => void;
  setTourStep: (stepIndex: number) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;

  setSearchOpen: (open: boolean) => void;
  openDocumentation: (target: { partId?: string; systemId?: SystemId }) => void;
  closeDocumentation: () => void;
  updateSettings: (partial: Partial<ViewportSettings>) => void;
}

export const useAnatomyStore = create<AnatomyStoreState>((set, get) => ({
  manifest: null,
  loading: true,
  loadProgress: 0,
  error: null,

  biologicalSex: 'male',

  visibleSystems: [...SURFACE_SYSTEMS],
  displayMode: 'surface',
  selectedPartId: null,
  hoveredPartId: null,
  isolated: false,
  ghostOthers: false,
  explosionFactor: 0,

  activeView: 'isometric',
  cameraResetNonce: 0,
  zoomInNonce: 0,
  zoomOutNonce: 0,
  focusTarget: null,

  inspectorOpen: true,
  inspectModalOpen: false,

  activeTour: null,
  tourStepIndex: 0,

  searchOpen: false,
  activeDocumentation: null,

  settings: {
    showPlatform: true,
    showFloorGrid: true,
    ambientOcclusion: true,
    highQualityMaterials: true,
    autoRotate: false,
    cameraSpeed: 1.0,
  },

  setBiologicalSex: (sex) => {
    const { selectedPartId, manifest, displayMode, visibleSystems } = get();
    let newSelectedId = selectedPartId;

    if (selectedPartId) {
      const part = manifest?.parts.find((p) => p.id === selectedPartId);
      const stillVisible =
        part &&
        isPartVisibleForSex(selectedPartId, sex) &&
        (displayMode !== 'surface' || isSurfacePart(part)) &&
        visibleSystems.includes(part.system);
      if (!stillVisible) newSelectedId = null;
    }

    set({
      biologicalSex: sex,
      selectedPartId: newSelectedId,
      inspectorOpen: newSelectedId ? get().inspectorOpen : true,
    });
  },

  setManifest: (manifest) => set({ manifest }),
  setLoading: (loading) => set({ loading }),
  setLoadProgress: (progress) => set({ loadProgress: progress }),
  setError: (error) => set({ error }),

  setDisplayMode: (mode) => {
    if (mode === 'custom') {
      set({ displayMode: mode });
      return;
    }

    const systems = [...MODE_SYSTEMS[mode]];
    const { selectedPartId, manifest, biologicalSex } = get();
    let selected = selectedPartId;

    if (selected) {
      const part = manifest?.parts.find((p) => p.id === selected);
      const staysVisible =
        part &&
        isPartVisibleForSex(selected, biologicalSex) &&
        systems.includes(part.system) &&
        (mode !== 'surface' || isSurfacePart(part));
      if (!staysVisible) selected = null;
    }

    set({
      displayMode: mode,
      visibleSystems: systems,
      selectedPartId: selected,
      isolated: false,
      explosionFactor: 0,
      cameraResetNonce: get().cameraResetNonce + 1,
    });
  },

  toggleSystem: (system) => {
    const { visibleSystems, selectedPartId, manifest, biologicalSex } = get();
    const nextSystems = visibleSystems.includes(system)
      ? visibleSystems.filter((s) => s !== system)
      : [...visibleSystems, system];

    let selected = selectedPartId;
    if (selected) {
      const part = manifest?.parts.find((p) => p.id === selected);
      if (part && !nextSystems.includes(part.system) && !(isExternalGenitalPart(selected) && nextSystems.includes('reproductive'))) {
        selected = null;
      }
    }

    set({
      visibleSystems: nextSystems,
      displayMode: 'custom',
      selectedPartId: selected,
      isolated: false,
    });
  },

  setSystemVisible: (system, visible) => {
    const { visibleSystems, selectedPartId, manifest } = get();
    let nextSystems = [...visibleSystems];
    if (visible && !nextSystems.includes(system)) nextSystems.push(system);
    if (!visible && nextSystems.includes(system)) nextSystems = nextSystems.filter((s) => s !== system);

    let selected = selectedPartId;
    if (selected && !visible) {
      const part = manifest?.parts.find((p) => p.id === selected);
      if (part && part.system === system) selected = null;
    }

    set({ visibleSystems: nextSystems, displayMode: 'custom', selectedPartId: selected });
  },

  showAllSystems: () => {
    set({
      visibleSystems: [...ALL_SYSTEM_IDS],
      displayMode: 'all',
      isolated: false,
      explosionFactor: 0,
      cameraResetNonce: get().cameraResetNonce + 1,
    });
  },

  isolateSystem: (system) => {
    const { selectedPartId, manifest } = get();
    let selected = selectedPartId;
    if (selected) {
      const part = manifest?.parts.find((p) => p.id === selected);
      const allowed =
        part &&
        (part.system === system ||
          (system === 'reproductive' && isExternalGenitalPart(selected)));
      if (!allowed) selected = null;
    }

    set({
      visibleSystems: [system],
      displayMode: 'custom',
      isolated: false,
      selectedPartId: selected,
    });
  },

  setExplosionFactor: (factor) => set({ explosionFactor: Math.max(0, Math.min(1, factor)) }),

  selectPart: (partId) => {
    const state = get();
    if (!partId) {
      set({ selectedPartId: null, inspectorOpen: false });
      return;
    }

    const part = state.manifest?.parts.find((p) => p.id === partId);
    if (!part) {
      set({ selectedPartId: partId, inspectorOpen: true });
      return;
    }

    // Never select a structure that belongs to the other reference model.
    if (!isPartVisibleForSex(partId, state.biologicalSex)) {
      return;
    }

    let systems = state.visibleSystems;
    let mode = state.displayMode;

    if (!systems.includes(part.system)) {
      systems = [...systems, part.system];
    }

    // Selecting an internal structure from an intact surface view must open an
    // explicit cutaway/transparent mode rather than render it through skin.
    if (mode === 'surface' && !isSurfacePart(part)) {
      mode = 'custom';
    }

    set({
      visibleSystems: systems,
      displayMode: mode,
      selectedPartId: partId,
      inspectorOpen: true,
      isolated: false,
    });
  },

  setHoveredPart: (partId) => set({ hoveredPartId: partId }),
  setIsolated: (isolated) => set({ isolated }),
  setGhostOthers: (ghostOthers) => set({ ghostOthers }),

  setActiveView: (view) => set({ activeView: view }),
  triggerResetCamera: () => set((state) => ({ cameraResetNonce: state.cameraResetNonce + 1 })),
  triggerZoomIn: () => set((state) => ({ zoomInNonce: state.zoomInNonce + 1 })),
  triggerZoomOut: () => set((state) => ({ zoomOutNonce: state.zoomOutNonce + 1 })),

  focusOnStructure: (coords, distance, eyePosition) => {
    set((state) => ({
      focusTarget: {
        position: coords,
        eyePosition,
        distance,
        nonce: (state.focusTarget?.nonce || 0) + 1,
      },
    }));
  },

  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setInspectModalOpen: (open) => set({ inspectModalOpen: open }),

  startTour: (tourId) => {
    const tour = GUIDED_TOURS.find((t) => t.id === tourId);
    if (!tour) return;
    const firstStep = tour.steps[0];
    set({
      activeTour: tour,
      tourStepIndex: 0,
      biologicalSex: firstStep.biologicalSex || get().biologicalSex,
      visibleSystems: [...firstStep.visibleSystems],
      displayMode: 'custom',
      isolated: !!firstStep.isolate,
      selectedPartId: firstStep.targetStructureId || null,
      inspectorOpen: !!firstStep.targetStructureId,
    });
  },

  exitTour: () => {
    set({ activeTour: null, tourStepIndex: 0 });
  },

  setTourStep: (stepIndex) => {
    const { activeTour } = get();
    if (!activeTour) return;
    const clampedIndex = Math.max(0, Math.min(activeTour.steps.length - 1, stepIndex));
    const step = activeTour.steps[clampedIndex];
    set({
      tourStepIndex: clampedIndex,
      biologicalSex: step.biologicalSex || get().biologicalSex,
      visibleSystems: [...step.visibleSystems],
      displayMode: 'custom',
      isolated: !!step.isolate,
      selectedPartId: step.targetStructureId || null,
      inspectorOpen: !!step.targetStructureId,
    });
  },

  nextTourStep: () => {
    const { activeTour, tourStepIndex, setTourStep } = get();
    if (!activeTour) return;
    if (tourStepIndex < activeTour.steps.length - 1) {
      setTourStep(tourStepIndex + 1);
    }
  },

  prevTourStep: () => {
    const { activeTour, tourStepIndex, setTourStep } = get();
    if (!activeTour) return;
    if (tourStepIndex > 0) {
      setTourStep(tourStepIndex - 1);
    }
  },

  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openDocumentation: (target) => set({ activeDocumentation: target, searchOpen: false }),
  closeDocumentation: () => set({ activeDocumentation: null }),
  updateSettings: (partial) => set((state) => ({ settings: { ...state.settings, ...partial } })),
}));
