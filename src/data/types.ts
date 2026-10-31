/** Anatomical system identifiers used throughout the registry, renderer and UI. */
export type SystemId =
  | 'integumentary'
  | 'muscular'
  | 'skeletal'
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'reproductive'
  | 'endocrine'
  | 'lymphatic'
  | 'sensory';

export type NodeKind = 'system' | 'group' | 'structure';
export type BodyModel = 'male' | 'female';
export type Side = 'L' | 'R';
export type Vec3 = [number, number, number];
export type Box3Tuple = [Vec3, Vec3];

/** One node of the anatomical hierarchy (system, regional group, or modelled structure). */
export interface StructureRecord {
  /** Stable identifier: FMA concept id for modelled structures (e.g. "FMA13072"), "grp:*" for groups, "sys:*" for systems. */
  id: string;
  name: string;
  system: SystemId;
  kind: NodeKind;
  parent: string | null;
  children: string[];
  /** Axis-aligned bounds in world metres (y-up, +z anterior). */
  bbox: Box3Tuple;
  unitCount: number;
  /** BodyParts3D element-file ids (FJ*) that make up this structure. Present only for kind === 'structure'. */
  units?: string[];
  fma?: string;
  side?: Side;
  synonyms?: string[];
  tris?: number;
  /** Ontology id for non-FMA sources, e.g. "UBERON:0000995" (HRA crosswalk). */
  ont?: string;
  /** Surface patch marking a landmark/region on another structure (HRA). */
  landmark?: boolean;
  /** Source mesh node name (HRA). */
  hraNode?: string;
}

export interface UnitRecord {
  structure: string;
  system: SystemId;
}

export interface RegistryFile {
  version: number;
  source: string;
  model?: BodyModel;
  structures: Record<string, StructureRecord>;
  units: Record<string, UnitRecord>;
  systems: SystemId[];
}

export interface ManifestSystem {
  file: string;
  bytes: number;
  tris: number;
  trisFull: number;
  units: number;
  hiChunks: Record<string, number>;
}

export interface ManifestFile {
  generated: string;
  systems: Partial<Record<SystemId, ManifestSystem>>;
  units: Record<string, { lo: number; hi: number; chunk: string }>;
}

export interface Reference {
  label: string;
  url: string;
}

/** Hand-curated educational text. Keys are laterality-neutral lowercase names. */
export interface CuratedEntry {
  summary: string;
  function?: string;
  relations?: string;
  innervation?: string;
  bloodSupply?: string;
  clinical?: string;
  refs: Reference[];
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface CameraPose {
  target: Vec3;
  radius: number;
  /** Azimuth around +Y, radians. 0 = anterior view. */
  theta: number;
  /** Polar angle from +Y, radians. */
  phi: number;
}
