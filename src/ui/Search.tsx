import { Search as SearchIcon, X } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { curatedFor } from '../data/curated';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import { viewer } from '../engine/viewer';

export function Search({ registry, onPicked }: { registry: Registry; onPicked?: () => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const dq = useDeferredValue(q);
  const results = useMemo(() => registry.search(dq, 30), [registry, dq]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setActive(0), [dq]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (id: string) => {
    viewer.selectAndFocus(id);
    setOpen(false);
    inputRef.current?.blur();
    onPicked?.();
  };

  return (
    <div className="search" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}>
      <div className="search-box">
        <SearchIcon size={15} className="muted" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          placeholder="Search structures — e.g. L1, femur, optic"
          aria-label="Search anatomical structures"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${results[active]!.id}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter' && results[active]) pick(results[active]!.id);
            else if (e.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
        />
        {q && (
          <button className="icon-btn xs ghost" onClick={() => setQ('')} aria-label="Clear search">
            <X size={13} />
          </button>
        )}
        <kbd className="kbd">/</kbd>
      </div>
      {open && dq.trim() && (
        <ul className="search-results" id="search-results" role="listbox" ref={listRef}>
          {results.length === 0 && <li className="empty">No modelled structure matches “{dq}”.</li>}
          {results.map((r, i) => {
            const path = registry.path(r.id);
            const crumbs = path.slice(0, -1).map((p) => p.name);
            const syn = r.synonyms?.find((s) => s.includes(dq.toLowerCase().trim()));
            return (
              <li key={r.id} id={`sr-${r.id}`} role="option" aria-selected={i === active}>
                <button tabIndex={-1} className={`result ${i === active ? 'active' : ''}`} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r.id)}>
                  <span className="swatch sm" style={{ background: SYSTEM_BY_ID[r.system].swatch }} />
                  <span className="result-main">
                    <span className="result-name">
                      {r.name}
                      {syn && <span className="muted"> · {syn}</span>}
                    </span>
                    <span className="result-path">{crumbs.slice(-3).join(' › ')}</span>
                  </span>
                  <span className="result-tags">
                    <span className="tag" title="Has selectable 3D geometry">
                      3D{r.kind !== 'structure' ? ` · ${r.unitCount}` : ''}
                    </span>
                    {curatedFor(r.name) && (
                      <span className="tag gold" title="Has a curated, referenced description">
                        Info
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
