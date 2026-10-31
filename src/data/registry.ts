import type { BodyModel, Box3Tuple, ManifestFile, RegistryFile, StructureRecord, SystemId, Vec3 } from './types';

export const ROOT_ID = 'body';

/**
 * In-memory anatomical registry: the single source of truth for structure names,
 * hierarchy, mesh membership and bounds. UI components and the renderer both read from it.
 */
export class Registry {
  readonly structures: Map<string, StructureRecord>;
  readonly unitStructure = new Map<string, string>();
  readonly unitSystem = new Map<string, SystemId>();
  readonly systems: SystemId[];
  readonly manifest: ManifestFile;
  readonly model: BodyModel;
  readonly source: string;
  private unitsUnderCache = new Map<string, string[]>();
  private ancestorsCache = new Map<string, string[]>();
  private searchIndex: { id: string; hay: string[]; kindRank: number }[] = [];

  constructor(file: RegistryFile, manifest: ManifestFile, model: BodyModel = file.model ?? 'male') {
    this.model = model;
    this.source = file.source;
    this.structures = new Map(Object.entries(file.structures));
    this.systems = file.systems;
    this.manifest = manifest;
    for (const [fj, u] of Object.entries(file.units)) {
      this.unitStructure.set(fj, u.structure);
      this.unitSystem.set(fj, u.system);
    }
    // Clinical vertebral abbreviations for sources that name vertebrae numerically ("Lumbar vertebra 1" → L1).
    for (const s of this.structures.values()) {
      const m = /^(Cervical|Thoracic|Lumbar) vertebra (\d+)$/.exec(s.name);
      if (m) s.synonyms = [...new Set([...(s.synonyms ?? []), `${m[1]![0]}${m[2]}`])];
    }
    for (const s of this.structures.values()) {
      const hay = [s.name.toLowerCase(), ...(s.synonyms ?? []).map((x) => x.toLowerCase())];
      if (s.fma) hay.push(s.fma.toLowerCase());
      if (s.ont) hay.push(s.ont.toLowerCase());
      this.searchIndex.push({ id: s.id, hay, kindRank: s.kind === 'structure' ? 0 : s.kind === 'group' ? 1 : 2 });
    }
  }

  get(id: string | null | undefined): StructureRecord | undefined {
    return id ? this.structures.get(id) : undefined;
  }

  /** Ancestors from the system root down to (and including) the node. */
  path(id: string): StructureRecord[] {
    const out: StructureRecord[] = [];
    let cur = this.get(id);
    while (cur) {
      out.unshift(cur);
      cur = this.get(cur.parent);
    }
    return out;
  }

  ancestorIds(id: string): string[] {
    const hit = this.ancestorsCache.get(id);
    if (hit) return hit;
    const ids = this.path(id).map((s) => s.id);
    this.ancestorsCache.set(id, ids);
    return ids;
  }

  /** Every mesh unit (FJ id) that belongs to a node, recursively. */
  unitsUnder(id: string): string[] {
    const hit = this.unitsUnderCache.get(id);
    if (hit) return hit;
    const s = this.get(id);
    let out: string[] = [];
    if (s) {
      if (s.units) out = [...s.units];
      for (const c of s.children) out = out.concat(this.unitsUnder(c));
    }
    this.unitsUnderCache.set(id, out);
    return out;
  }

  /** Ancestor chain (system → leaf) for the structure owning a unit. */
  unitAncestors(fj: string): string[] {
    const sid = this.unitStructure.get(fj);
    return sid ? this.ancestorIds(sid) : [];
  }

  isAncestorOrSelf(ancestor: string, id: string): boolean {
    return this.ancestorIds(id).includes(ancestor);
  }

  center(id: string): Vec3 {
    const b = this.get(id)?.bbox;
    if (!b) return [0, 0, 0];
    return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2];
  }

  /** Counterpart on the other side of the body (left ↔ right) when one exists. */
  counterpart(id: string): StructureRecord | undefined {
    const s = this.get(id);
    if (!s) return undefined;
    const swapped = s.name.replace(/\b(Left|left|Right|right)\b/g, (w) =>
      ({ Left: 'Right', left: 'right', Right: 'Left', right: 'left' })[w as 'Left'] ?? w,
    );
    if (swapped === s.name) return undefined;
    for (const cand of this.structures.values()) {
      if (cand.name === swapped && cand.system === s.system && cand.kind === s.kind) return cand;
    }
    return undefined;
  }

  /**
   * Structures whose bounds lie within `gap` metres of the node's bounds (computed from the model,
   * not anatomical ground truth). Large branching structures whose boxes overlap almost everything
   * (vessel trees, skin) are excluded unless they share the node's system.
   */
  spatialNeighbours(id: string, gap = 0.006, limit = 12): StructureRecord[] {
    const s = this.get(id);
    if (!s) return [];
    const own = new Set(this.unitsUnder(id));
    const b = s.bbox;
    const vol = (bb: Box3Tuple) => Math.max(1e-9, (bb[1][0] - bb[0][0]) * (bb[1][1] - bb[0][1]) * (bb[1][2] - bb[0][2]));
    const ownVol = vol(b);
    const res: { r: StructureRecord; score: number }[] = [];
    for (const r of this.structures.values()) {
      if (r.kind !== 'structure' || r.id === id || r.system === 'integumentary' || (r.units && r.units.every((u) => own.has(u)))) continue;
      const rb = r.bbox;
      let d = 0;
      for (let i = 0; i < 3; i++) {
        const lo = Math.max(b[0][i]!, rb[0][i]!);
        const hi = Math.min(b[1][i]!, rb[1][i]!);
        if (lo > hi) d = Math.max(d, lo - hi);
      }
      if (d > gap) continue;
      const ratio = vol(rb) / ownVol;
      const same = r.system === s.system;
      if (!same && ratio > 25) continue;
      // Prefer same-system, similar-sized, closest structures.
      const score = d * 100 + (same ? 0 : 1) + Math.abs(Math.log(ratio)) * 0.15;
      res.push({ r, score });
    }
    return res
      .sort((a, c) => a.score - c.score)
      .slice(0, limit)
      .map((x) => x.r);
  }

  search(query: string, limit = 40): StructureRecord[] {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    const toks = q.split(/\s+/).filter(Boolean);
    const scored: { id: string; score: number }[] = [];
    for (const e of this.searchIndex) {
      let best = -1;
      for (const h of e.hay) {
        let score = 0;
        let ok = true;
        for (const t of toks) {
          const at = h.indexOf(t);
          if (at < 0) {
            ok = false;
            break;
          }
          const wordStart = at === 0 || h[at - 1] === ' ' || h[at - 1] === '(';
          score += wordStart ? 3 : 1;
        }
        if (!ok) continue;
        if (h === q) score += 20;
        else if (h.startsWith(q)) score += 8;
        score -= h.length / 60;
        best = Math.max(best, score);
      }
      if (best >= 0) scored.push({ id: e.id, score: best - e.kindRank * 0.5 });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => this.structures.get(s.id)!);
  }

  /** Laterality-neutral key used for curated-text lookup, e.g. "Navicular bone of left foot" → "navicular bone of foot". */
  static neutralKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(left|right) /g, '')
      .replace(/ of (left|right) /g, ' of ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

const cache = new Map<BodyModel, Promise<Registry>>();

export function loadRegistry(model: BodyModel, signal?: AbortSignal): Promise<Registry> {
  const hit = cache.get(model);
  if (hit) return hit;
  const p = fetchRegistry(model, signal);
  cache.set(model, p);
  p.catch(() => cache.delete(model));
  return p;
}

async function fetchRegistry(model: BodyModel, signal?: AbortSignal): Promise<Registry> {
  const base = `${import.meta.env.BASE_URL}data/${model}/`;
  const [r, m] = await Promise.all([fetch(`${base}registry.json`, { signal }), fetch(`${base}manifest.json`, { signal })]);
  if (!r.ok || !m.ok) throw new Error(`Anatomy data failed to load (${r.status}/${m.status})`);
  const reg = (await r.json()) as RegistryFile;
  const man = (await m.json()) as ManifestFile;
  return new Registry(reg, man, model);
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

/** Comparable name across sources: "First lumbar vertebra" and "Lumbar vertebra 1" both → "lumbar vertebra 1". */
export function canonicalName(name: string): string {
  let n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  n = n.replace(/^(\w+) (cervical|thoracic|lumbar) vertebra$/, (m, o: string, r: string) => {
    const i = ORDINALS.indexOf(o);
    return i >= 0 ? `${r} vertebra ${i + 1}` : m;
  });
  if (n === 'atlas') n = 'cervical vertebra 1';
  if (n === 'axis') n = 'cervical vertebra 2';
  return n.replace(/^cavity of /, '').replace(/ system \((male|female)\)$/, ' system');
}

/** Best equivalent of a selection in another model's registry (same canonical name, else same system root). */
export function mapSelection(from: Registry, to: Registry, id: string | null): string | null {
  const rec = from.get(id);
  if (!rec) return null;
  if (to.get(rec.id)) return rec.id;
  const key = canonicalName(rec.name);
  for (const s of to.structures.values()) if (canonicalName(s.name) === key) return s.id;
  for (const s of to.structures.values()) if (s.synonyms?.some((x) => canonicalName(x) === key)) return s.id;
  // Walk up: nearest ancestor with an equivalent.
  const parent = from.get(rec.parent);
  return parent ? mapSelection(from, to, parent.id) : null;
}
