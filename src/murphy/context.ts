import type { MurphyContext } from '../../server/murphy/types';
import { SYSTEM_BY_ID } from '../data/systems';
import { viewer } from '../engine/viewer';
import { studyFor, studyKey, TOPIC_BY_ID } from '../learn';
import { getRoute } from '../learn/route';
import { mentionedNotes, noteText, plain } from './fuzzy';

export { mentionedNotes };
import { useApp } from '../state/store';

/** Snapshot of what the student is looking at, sent with each question. */
export function buildContext(message: string): MurphyContext {
  const st = useApp.getState();
  const reg = viewer.registry;
  const route = getRoute();
  const ctx: MurphyContext = { body: st.bodyModel, view: route.view };
  const local: { title: string; text: string }[] = [];

  const selId = route.view === 'learn' && route.focusId ? route.focusId : st.selectedId;
  const rec = reg && selId ? reg.get(selId) : undefined;
  if (reg && rec) {
    const path = reg
      .ancestorIds(rec.id)
      .slice(0, -1)
      .map((id) => reg.get(id)?.name)
      .filter((n): n is string => !!n);
    ctx.selected = { name: rec.name, system: SYSTEM_BY_ID[rec.system]?.label, kind: rec.kind, side: rec.side, path };
    const s = studyFor(reg, rec);
    local.push({ title: `${rec.name}${s.source === 'derived' ? ' (assembled from hierarchy)' : ''}`, text: noteText(s).slice(0, 1600) });
  }
  if (reg && st.isolate) {
    const iso = reg.get(st.isolate.id);
    if (iso && iso.id !== rec?.id) ctx.isolate = { name: iso.name, mode: st.isolate.mode };
  }
  if (route.view === 'learn' && route.topic) {
    const t = TOPIC_BY_ID.get(route.topic);
    if (t) ctx.topic = { title: t.title, tagline: plain(t.tagline) };
  }
  const already = new Set(local.map((l) => studyKey(l.title)));
  for (const n of mentionedNotes(message)) if (!already.has(studyKey(n.title))) local.push(n);
  if (local.length) ctx.local = local.slice(0, 3);
  return ctx;
}

/** One-line label of the current focus for the chat header. */
export function focusLabel(): string | null {
  const st = useApp.getState();
  const route = getRoute();
  const reg = viewer.registry;
  const id = route.view === 'learn' && route.focusId ? route.focusId : st.selectedId;
  const rec = reg && id ? reg.get(id) : undefined;
  if (rec) return rec.name;
  if (route.view === 'learn' && route.topic) return TOPIC_BY_ID.get(route.topic)?.title ?? null;
  return null;
}
