import type { Reference, SystemId } from '../data/types';

/**
 * Inline markup used in all learning text:
 *   **term**      highlighted key term
 *   [[Name]]      link that selects the named structure in the 3D view (resolved per body model;
 *                 rendered as plain text when the current model has no such structure)
 *   [[Name|label]] same, with custom link text
 */
export type Rich = string;

export interface FlowStep {
  label: Rich;
  note?: Rich;
}

export interface TreeNode {
  label: string;
  note?: string;
  children?: TreeNode[];
}

export type Block =
  | { t: 'p'; text: Rich }
  | { t: 'bullets'; items: Rich[] }
  | { t: 'steps'; items: Rich[] }
  | { t: 'flow'; title: string; steps: FlowStep[]; loop?: boolean }
  | { t: 'tree'; title: string; root: TreeNode }
  | { t: 'layers'; title: string; layers: { name: string; note: Rich }[] }
  | { t: 'table'; title?: string; head: string[]; rows: Rich[][] }
  | { t: 'callout'; tone: 'remember' | 'clinical' | 'tip' | 'pitfall'; title?: string; text: Rich }
  /** Memory aid: each letter of a phrase mapped to what it stands for. */
  | { t: 'mnemonic'; title: string; phrase: string; items: [string, Rich][]; note?: Rich }
  /** Relations "compass": what lies on each side of a structure. */
  | { t: 'relations'; title: string; center: string; sides: Partial<Record<'anterior' | 'posterior' | 'superior' | 'inferior' | 'medial' | 'lateral', Rich>> }
  /** Side-by-side comparison of two (or three) commonly confused things. */
  | { t: 'compare'; title: string; cols: string[]; rows: [string, ...Rich[]][] }
  /** Exam favourites: the facts most often asked. */
  | { t: 'highyield'; title?: string; items: Rich[] }
  /** Key terminology with short definitions. */
  | { t: 'terms'; items: [string, Rich][] }
  | { t: 'facts'; items: [string, Rich][] }
  | { t: 'figure'; caption: string; target: { male?: string; female?: string } };

/** Standard section ids keep every page in the same order: what/where → structure → function → clinical → key points. */
export type SectionId = 'overview' | 'structure' | 'function' | 'clinical' | 'key' | string;

export interface Section {
  id: SectionId;
  title: string;
  blocks: Block[];
}

export interface QA {
  q: Rich;
  a: Rich;
}

/** A dedicated learning page for a system or large topic. */
export interface Topic {
  id: string;
  title: string;
  system: SystemId;
  /** Parent topic id (systems have none). */
  parent?: string;
  /** One-line definition shown under the title and on cards. */
  tagline: string;
  /** Registry node names (per model) that represent this topic in 3D. Group/system ids are accepted too. */
  focus: { male?: string; female?: string };
  /** Registry ids or names whose selection should offer this topic (besides `focus`). */
  match?: RegExp;
  minutes: number;
  sections: Section[];
  quiz: QA[];
  refs: Reference[];
}

/** Structured study card for an individual structure (contextual panel). */
export interface StudyEntry {
  what: Rich;
  location?: Rich[];
  structure?: Rich[];
  functions?: Rich[];
  clinical?: Rich[];
  key?: Rich[];
  innervation?: Rich;
  blood?: Rich;
  /** Topic page offered as "Learn more". */
  topic?: string;
  refs: Reference[];
}
