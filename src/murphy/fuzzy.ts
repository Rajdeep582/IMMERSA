import { studyByName, studyNames } from '../learn';
import type { StudyEntry } from '../learn/types';

/** Strip IMMERSA inline markup ([[links]], **bold**) to plain text. */
export const plain = (s: string) => s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\*\*/g, '');

export function noteText(s: StudyEntry): string {
  const parts = [s.what, ...(s.location ?? []), ...(s.structure ?? []), ...(s.functions ?? []), ...(s.clinical ?? []), ...(s.key ?? [])];
  if (s.innervation) parts.push(`Nerve supply: ${s.innervation}`);
  if (s.blood) parts.push(`Blood supply: ${s.blood}`);
  return plain(parts.join(' '));
}

// ---------- fuzzy matching of structure names typed in the question (typos allowed) ----------
function distance(a: string, b: string): number {
  // Damerau–Levenshtein (optimal string alignment), bounded inputs.
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array<number>(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0]![j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  return d[m]![n]!;
}

let NAMES: { key: string; words: number }[] | null = null;
function names() {
  if (!NAMES) NAMES = studyNames().map((key) => ({ key, words: key.split(' ').length }));
  return NAMES;
}

/** Written study cards whose names appear (possibly misspelt) in the message. */
export function mentionedNotes(message: string, max = 2): { title: string; text: string }[] {
  const toks = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const hits: { key: string; score: number }[] = [];
  for (const { key, words } of names()) {
    if (key.length < 5) continue;
    let best = 1;
    for (let i = 0; i + words <= toks.length; i++) {
      const gram = toks.slice(i, i + words).join(' ');
      if (Math.abs(gram.length - key.length) > 3) continue;
      const r = distance(gram, key) / key.length;
      if (r < best) best = r;
    }
    if (best <= 0.2) hits.push({ key, score: best });
  }
  return hits
    .sort((a, b) => a.score - b.score || b.key.length - a.key.length)
    .slice(0, max)
    .map(({ key }) => ({ title: key.replace(/^\w/, (c) => c.toUpperCase()), text: noteText(studyByName(key)!).slice(0, 1400) }));
}

