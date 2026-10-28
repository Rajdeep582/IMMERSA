export type SystemId =
  | 'skeletal'
  | 'muscular'
  | 'cardiac'
  | 'arterial'
  | 'venous'
  | 'nervous'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'lymphatic'
  | 'endocrine'
  | 'reproductive'
  | 'integumentary'
  | 'connective'
  | 'sensory';

export interface SystemDefinition {
  id: SystemId;
  name: string;
  category: 'Structural' | 'Visceral' | 'Circulatory' | 'Neural' | 'Superficial';
  color: string;
  pbr: {
    metalness: number;
    roughness: number;
    clearcoat?: number;
    opacity?: number;
    transmission?: number;
  };
  description: string;
  organCount?: number;
}

export interface Part {
  id: string;
  name: string;
  conceptId: string;
  system: SystemId;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [[number, number, number], [number, number, number]];
}

export interface Concept {
  id: string;
  name: string;
  elements: string[];
}

export type BiologicalSex = 'male' | 'female';

/**
 * High-level presentation presets. These deliberately control which layers are
 * visible so that an intact surface view never turns into an accidental flayed
 * dissection, and so that changing layers cannot leave stale structures behind.
 */
export type DisplayMode = 'surface' | 'muscles' | 'skeleton' | 'organs' | 'all' | 'custom';

export interface AtlasManifest {
  version: string;
  sex?: BiologicalSex;
  source?: string;
  scope?: string;
  parts: Part[];
  concepts: Concept[];
  chunks: { url: string; bytes: number; gzip?: string; gzipBytes?: number }[];
  triangles: number;
}

export type StandardView = 'anterior' | 'posterior' | 'left' | 'right' | 'superior' | 'inferior' | 'isometric';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface AnatomicalLandmark {
  id: string;
  name: string;
  latinName?: string;
  position: [number, number, number]; // relative to part center or world bounds
  description: string;
  clinicalSignificance?: string;
}

export interface ClinicalProfile {
  id: string;
  canonicalName: string;
  latinName?: string;
  commonName?: string;
  system: SystemId;
  region: string;
  parentStructure?: string;
  childStructures?: string[];
  primaryFunction: string;
  innervation?: string;
  arterialSupply?: string;
  venousDrainage?: string;
  relations: string[];
  clinicalNotes: string;
  landmarks?: AnatomicalLandmark[];
  references: string[];
}

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  targetStructureId?: string;
  cameraPose: CameraPose;
  visibleSystems: SystemId[];
  /** Some tours are sex-specific; applying a step may switch the reference model. */
  biologicalSex?: BiologicalSex;
  isolate?: boolean;
  explanation: string;
  clinicalHighlight?: string;
  recommendedAction?: 'rotate' | 'inspect' | 'explore';
}

export interface GuidedTour {
  id: string;
  title: string;
  shortDesc: string;
  icon: string;
  steps: TourStep[];
}

export interface ViewportSettings {
  showPlatform: boolean;
  showFloorGrid: boolean;
  ambientOcclusion: boolean;
  highQualityMaterials: boolean;
  autoRotate: boolean;
  cameraSpeed: number;
}

