import { curatedFor } from '../data/curated';
import { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import type { StructureRecord, SystemId } from '../data/types';
import { NERVE_STUDY } from './studyNerves';
import { ORGAN_STUDY } from './studyOrgans';
import { EXTRA_STUDY, PATTERN_STUDY } from './studyExtra';
import { CARDIORESP_TOPICS } from './topics/cardiorespiratory';
import { MSK_TOPICS } from './topics/musculoskeletal';
import { NERVOUS_TOPICS } from './topics/nervous';
import { OTHER_TOPICS } from './topics/other';
import { VISCERAL_TOPICS } from './topics/visceral';
import { ENRICH, REGIONAL_TOPICS } from './topics/enrich';
import type { StudyEntry, Topic } from './types';

/** Learning pages, in reading order: each system followed by its sub-topics. */
/** Extra exam-oriented sections go after "Clinical significance", before "Key points". */
function enrich(t: Topic): Topic {
  const extra = ENRICH[t.id];
  if (!extra?.length) return t;
  const at = t.sections.findIndex((s) => s.id === 'key');
  const sections = at < 0 ? [...t.sections, ...extra] : [...t.sections.slice(0, at), ...extra, ...t.sections.slice(at)];
  return { ...t, sections, minutes: t.minutes + Math.round(extra.length * 2.5) };
}
const MSK_WITH_REGIONS = [...MSK_TOPICS, ...REGIONAL_TOPICS];
export const TOPICS: Topic[] = [...NERVOUS_TOPICS, ...MSK_WITH_REGIONS, ...CARDIORESP_TOPICS, ...VISCERAL_TOPICS, ...OTHER_TOPICS].map(enrich);
export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));
export const SYSTEM_TOPICS = TOPICS.filter((t) => !t.parent);
export const childTopics = (id: string) => TOPICS.filter((t) => t.parent === id);
export const systemTopicFor = (s: SystemId) => SYSTEM_TOPICS.find((t) => t.system === s) ?? SYSTEM_TOPICS.find((t) => t.id === 'nervous')!;

/** Laterality-neutral lookup key; drops "(CN V)" style suffixes. */
export function studyKey(name: string): string {
  return Registry.neutralKey(name).replace(/\s*\((?:cn )?[ivx]+\)$/, '').trim();
}

const STUDY: Record<string, StudyEntry> = { ...EXTRA_STUDY, ...ORGAN_STUDY, ...NERVE_STUDY };

// ---------- name resolution for [[links]] and topic focus ----------
const nameIndex = new WeakMap<Registry, { exact: Map<string, StructureRecord>; neutral: Map<string, StructureRecord[]> }>();
function indexFor(reg: Registry) {
  let ix = nameIndex.get(reg);
  if (!ix) {
    ix = { exact: new Map(), neutral: new Map() };
    for (const r of reg.structures.values()) {
      if (!ix.exact.has(r.name.toLowerCase())) ix.exact.set(r.name.toLowerCase(), r);
      const k = studyKey(r.name);
      const arr = ix.neutral.get(k) ?? [];
      arr.push(r);
      ix.neutral.set(k, arr);
    }
    nameIndex.set(reg, ix);
  }
  return ix;
}

/** Find a registry node for a display name or id. Prefers whole groups over one side; prefers the right side. */
export function resolveName(reg: Registry, name: string | undefined): StructureRecord | undefined {
  if (!name) return undefined;
  const direct = reg.get(name);
  if (direct) return direct;
  const ix = indexFor(reg);
  const ex = ix.exact.get(name.toLowerCase());
  if (ex) return ex;
  const cands = ix.neutral.get(studyKey(name));
  if (!cands?.length) return undefined;
  const rank = (r: StructureRecord) => (r.kind !== 'structure' ? 0 : !r.side ? 1 : r.side === 'R' ? 2 : 3);
  return [...cands].sort((a, b) => rank(a) - rank(b) || b.unitCount - a.unitCount)[0];
}

/** Topic page that best explains a node: explicit focus match, regex match on the node or its ancestors, else its system page. */
export function topicFor(reg: Registry, rec: StructureRecord | undefined): Topic | undefined {
  if (!rec) return undefined;
  const chain = [...reg.ancestorIds(rec.id)].reverse(); // self first, system root last
  for (const id of chain) {
    const r = reg.get(id);
    if (!r) continue;
    const hit = TOPICS.find((t) => {
      const f = resolveName(reg, t.focus[reg.model]);
      return f?.id === r.id;
    });
    if (hit && (hit.parent || id !== chain[chain.length - 1] || rec.kind === 'system')) return hit;
  }
  const sub = TOPICS.filter((t) => t.parent && t.system === rec.system && t.match).find((t) => chain.some((id) => t.match!.test(id) || t.match!.test(reg.get(id)?.name ?? '')));
  return sub ?? systemTopicFor(rec.system);
}

export interface Study extends StudyEntry {
  /** 'curated' = written for this structure; 'derived' = assembled from the hierarchy and a related entry. */
  source: 'curated' | 'derived';
  /** Name of the structure whose entry was borrowed for derived content. */
  from?: string;
}

function curatedStudy(name: string): StudyEntry | undefined {
  const s = STUDY[studyKey(name)];
  if (s) return s;
  const pat = PATTERN_STUDY.find(([re]) => re.test(name));
  if (pat) return pat[1];
  const c = curatedFor(name);
  if (!c) return undefined;
  return {
    what: c.summary,
    structure: c.relations ? [c.relations] : undefined,
    functions: c.function ? [c.function] : undefined,
    clinical: c.clinical ? [c.clinical] : undefined,
    innervation: c.innervation,
    blood: c.bloodSupply,
    refs: c.refs,
  };
}

/**
 * Study card for any node. Written entries are used as-is; otherwise the card is assembled from
 * registry facts (laterality, hierarchy, contents) plus the nearest ancestor with written content,
 * clearly labelled as borrowed.
 */
export function studyFor(reg: Registry, rec: StructureRecord): Study {
  const own = curatedStudy(rec.name);
  const topic = topicFor(reg, rec);
  if (own) return { ...own, topic: own.topic ?? topic?.id, source: 'curated' };
  // Systems and large groups that have their own learning page: summarise that page.
  if (topic && resolveName(reg, topic.focus[reg.model])?.id === rec.id) {
    const sec = (id: string) => topic.sections.find((x) => x.id === id);
    const bullets = (id: string) => sec(id)?.blocks.flatMap((b) => (b.t === 'bullets' || b.t === 'steps' ? b.items : b.t === 'p' ? [b.text] : [])) ?? [];
    return {
      what: topic.tagline,
      location: bullets('overview').slice(0, 3),
      structure: bullets('structure').slice(0, 4),
      functions: bullets('function').slice(0, 4),
      clinical: bullets('clinical').slice(0, 3),
      key: bullets('key').slice(0, 4),
      topic: topic.id,
      refs: topic.refs,
      source: 'curated',
    };
  }
  const sys = SYSTEM_BY_ID[rec.system];
  const parent = reg.get(rec.parent);
  let anc: { rec: StructureRecord; s: StudyEntry } | undefined;
  for (const id of [...reg.ancestorIds(rec.id)].reverse().slice(1)) {
    const r = reg.get(id);
    const s = r && r.kind !== 'system' ? curatedStudy(r.name) : undefined;
    if (r && s) {
      anc = { rec: r, s };
      break;
    }
  }
  const side = rec.side ? (rec.side === 'L' ? 'Left-sided' : 'Right-sided') : null;
  const kindWord = rec.kind === 'structure' ? 'structure' : rec.kind === 'group' ? 'group of structures' : 'body system';
  const whatRaw = parent
    ? `${side ? side + ' ' : ''}${kindWord} of the **${parent.name.toLowerCase()}** (${sys.label.toLowerCase()} system).`
    : `${sys.label} system.`;
  const what = whatRaw.charAt(0).toUpperCase() + whatRaw.slice(1);
  const location: string[] = [];
  const path = reg.ancestorIds(rec.id).slice(0, -1).map((id) => reg.get(id)!).filter((r) => r && r.kind !== 'system').map((r) => r.name);
  if (path.length) location.push(`Hierarchy: ${path.join(' → ')}.`);
  if (rec.side) location.push(`On the **${rec.side === 'L' ? 'left' : 'right'}** side; a mirror counterpart exists on the other side.`);
  if (anc?.s.location?.length) location.push(...anc.s.location.map((l) => `As part of the ${anc!.rec.name.toLowerCase()}: ${l}`));
  const structure = rec.children.length ? [`Made up of **${rec.children.length}** modelled part${rec.children.length === 1 ? '' : 's'} (listed under “Contains”).`] : undefined;
  return {
    what,
    location,
    structure,
    functions: anc?.s.functions?.slice(0, 2),
    clinical: anc?.s.clinical?.slice(0, 2),
    key: anc?.s.key?.slice(0, 2),
    topic: anc?.s.topic ?? topic?.id,
    refs: anc?.s.refs ?? topic?.refs.slice(0, 2) ?? [],
    source: 'derived',
    from: anc?.rec.name,
  };
}
