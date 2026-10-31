import { ChevronRight } from 'lucide-react';
import type { Registry } from '../data/registry';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';

/**
 * Location in the anatomical hierarchy; every level is a way back out.
 * `panel` sits in the inspector header; `float` is a compact bar above the toolbar used when the
 * inspector is collapsed (or on phones). Neither covers the model's head region.
 */
export function Breadcrumbs({ registry, variant }: { registry: Registry; variant: 'panel' | 'float' }) {
  const selectedId = useApp((s) => s.selectedId);
  const select = useApp((s) => s.select);
  if (!selectedId) return null;
  const path = registry.path(selectedId);
  return (
    <nav className={`crumbs ${variant === "panel" ? "in-panel" : "floating"}`} aria-label="Anatomical location">
      <button
        className="crumb"
        onClick={() => {
          select(null);
          viewer.fullBody();
        }}
      >
        Body
      </button>
      {path.map((p, i) => (
        <span key={p.id} className="crumb-wrap">
          <ChevronRight size={11} className="sep" aria-hidden />
          <button className={`crumb ${i === path.length - 1 ? 'cur' : ''}`} aria-current={i === path.length - 1 ? 'location' : undefined} onClick={() => viewer.selectAndFocus(p.id)} title={p.name}>
            {p.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
