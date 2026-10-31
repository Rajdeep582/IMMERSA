import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';

const Node = memo(function Node({ registry, id, depth, openSet, toggle }: { registry: Registry; id: string; depth: number; openSet: Set<string>; toggle: (id: string) => void }) {
  const rec = registry.get(id)!;
  const selected = useApp((s) => s.selectedId === id);
  const hidden = useApp((s) => s.hidden.has(id));
  const toggleHidden = useApp((s) => s.toggleHidden);
  const open = openSet.has(id);
  const hasKids = rec.children.length > 0;
  return (
    <li role="treeitem" aria-expanded={hasKids ? open : undefined} aria-selected={selected}>
      <div className={`tree-row ${selected ? 'sel' : ''} ${hidden ? 'hid' : ''}`} style={{ paddingLeft: 6 + depth * 12 }}>
        {hasKids ? (
          <button className={`twisty ${open ? 'open' : ''}`} onClick={() => toggle(id)} aria-label={open ? 'Collapse' : 'Expand'}>
            <ChevronRight size={13} />
          </button>
        ) : (
          <span className="twisty-spacer" />
        )}
        <button className="tree-label" onClick={() => viewer.selectAndFocus(id)} onDoubleClick={() => hasKids && toggle(id)} title={rec.name}>
          {depth === 0 && <span className="swatch sm" style={{ background: SYSTEM_BY_ID[rec.system].swatch }} />}
          <span className="tree-name">{rec.name}</span>
          {rec.kind !== 'structure' && <span className="mono count">{rec.unitCount}</span>}
        </button>
        <button className="icon-btn xs ghost" onClick={() => toggleHidden(id)} aria-label={hidden ? `Show ${rec.name}` : `Hide ${rec.name}`}>
          {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>
      {hasKids && open && (
        <ul role="group">
          {rec.children.map((c) => (
            <Node key={c} registry={registry} id={c} depth={depth + 1} openSet={openSet} toggle={toggle} />
          ))}
        </ul>
      )}
    </li>
  );
});

/** Full anatomical hierarchy: system → region → group → structure, lazily expanded. */
export function ExploreTree({ registry }: { registry: Registry }) {
  const [openSet, setOpen] = useState<Set<string>>(() => new Set());
  const selectedId = useApp((s) => s.selectedId);
  // Reveal the selected node's ancestry so selection from the 3D view is reflected in the tree.
  useEffect(() => {
    if (!selectedId) return;
    const anc = registry.ancestorIds(selectedId).slice(0, -1);
    setOpen((o) => {
      if (anc.every((a) => o.has(a))) return o;
      const n = new Set(o);
      anc.forEach((a) => n.add(a));
      return n;
    });
    requestAnimationFrame(() => document.querySelector('.tree-row.sel')?.scrollIntoView({ block: 'nearest' }));
  }, [selectedId, registry]);
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const roots = registry.systems.map((s) => `sys:${s}`).filter((id) => registry.get(id));
  return (
    <ul className="tree" role="tree" aria-label="Anatomical hierarchy">
      {roots.map((id) => (
        <Node key={id} registry={registry} id={id} depth={0} openSet={openSet} toggle={toggle} />
      ))}
    </ul>
  );
}
