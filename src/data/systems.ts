import type { SystemId } from './types';

export interface SystemMeta {
  id: SystemId;
  label: string;
  short: string;
  /** UI swatch colour. */
  swatch: string;
  /** Default opacity at start (0 = hidden). */
  defaultOpacity: number;
  /** Rough depth order from superficial (0) to deep. Used by dissection presets. */
  depth: number;
  /** Whether the body-view mesh is fetched during the initial load. */
  eager: boolean;
}

export const SYSTEMS: SystemMeta[] = [
  { id: 'integumentary', label: 'Integumentary', short: 'Skin', swatch: '#d8b49c', defaultOpacity: 0.16, depth: 0, eager: true },
  { id: 'muscular', label: 'Muscular', short: 'Muscles', swatch: '#b4473f', defaultOpacity: 0, depth: 1, eager: false },
  { id: 'cardiovascular', label: 'Cardiovascular', short: 'Vessels', swatch: '#c23b32', defaultOpacity: 0, depth: 2, eager: false },
  { id: 'nervous', label: 'Nervous', short: 'Nervous', swatch: '#e9cf7a', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'respiratory', label: 'Respiratory', short: 'Airways', swatch: '#d79a95', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'digestive', label: 'Digestive', short: 'Digestive', swatch: '#c88a63', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'urinary', label: 'Urinary', short: 'Urinary', swatch: '#d1a04a', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'reproductive', label: 'Reproductive', short: 'Reproductive', swatch: '#c98a9a', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'endocrine', label: 'Endocrine glands', short: 'Endocrine', swatch: '#b28bd0', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'lymphatic', label: 'Lymphoid organs', short: 'Lymphoid', swatch: '#8e6aa8', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'sensory', label: 'Sense organs', short: 'Senses', swatch: '#8fb3c9', defaultOpacity: 1, depth: 2, eager: true },
  { id: 'skeletal', label: 'Skeletal', short: 'Skeleton', swatch: '#e6dcc6', defaultOpacity: 1, depth: 3, eager: true },
];

export const SYSTEM_BY_ID: Record<SystemId, SystemMeta> = Object.fromEntries(SYSTEMS.map((s) => [s.id, s])) as Record<
  SystemId,
  SystemMeta
>;

export const ALL_SYSTEM_IDS: SystemId[] = SYSTEMS.map((s) => s.id);

export type SystemOpacity = Record<SystemId, number>;

export const defaultOpacities = (): SystemOpacity =>
  Object.fromEntries(SYSTEMS.map((s) => [s.id, s.defaultOpacity])) as SystemOpacity;

/** Dissection presets: progressively remove superficial layers. */
export interface DissectionPreset {
  id: string;
  label: string;
  opacity: Partial<SystemOpacity>;
}

const organs = (v: number): Partial<SystemOpacity> => ({
  nervous: v,
  respiratory: v,
  digestive: v,
  urinary: v,
  reproductive: v,
  endocrine: v,
  lymphatic: v,
  sensory: v,
});

export const DISSECTION_PRESETS: DissectionPreset[] = [
  { id: 'surface', label: 'Surface', opacity: { integumentary: 1, muscular: 0, cardiovascular: 0, ...organs(0), skeletal: 0 } },
  { id: 'muscles', label: 'Muscles', opacity: { integumentary: 0.08, muscular: 1, cardiovascular: 0, ...organs(0), skeletal: 1 } },
  { id: 'deep', label: 'Deep muscles', opacity: { integumentary: 0, muscular: 0.35, cardiovascular: 1, ...organs(1), skeletal: 1 } },
  { id: 'viscera', label: 'Organs', opacity: { integumentary: 0.12, muscular: 0, cardiovascular: 0.25, ...organs(1), skeletal: 1 } },
  { id: 'vessels', label: 'Vessels & nerves', opacity: { integumentary: 0.08, muscular: 0, cardiovascular: 1, ...organs(0), nervous: 1, skeletal: 0.35 } },
  { id: 'skeleton', label: 'Skeleton', opacity: { integumentary: 0, muscular: 0, cardiovascular: 0, ...organs(0), skeletal: 1 } },
];
