import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { getPartSex, isPartVisibleForSex } from '../../data/anatomyCatalog';
import { Search, X, ChevronRight, Sparkles, ArrowLeftRight, BookOpen } from 'lucide-react';

const SUGGESTIONS: Record<'male' | 'female', string[]> = {
  male: ['FJ3138', 'FJ3139', 'M_SCROTUM', 'FJ3134', 'FJ3143', 'FJ3149'],
  female: ['F_UTERUS', 'F_OVARY_L', 'F_TUBE_R', 'F_VAGINA', 'F_CLITORIS_GLANS', 'F_MONS_PUBIS'],
};

const ALIASES: Record<string, string[]> = {
  penis: ['glans penis', 'corpus cavernosum', 'corpus spongiosum', 'urethra'],
  testicle: ['testis', 'epididymis'],
  testes: ['testis', 'epididymis'],
  balls: ['testis', 'scrotum'],
  womb: ['uterus'],
  fallopian: ['uterine (fallopian) tube', 'uterine tube'],
  oviduct: ['uterine (fallopian) tube'],
  vulva: ['labium', 'mons pubis', 'clitoris', 'vestibule'],
  clit: ['clitoris'],
  vagina: ['vagina', 'vaginal orifice'],
  breast: ['mammary', 'areola', 'nipple'],
  hair: ['cranial hair', 'hair of head', 'eyebrow'],
  'adam\'s apple': ['larynx', 'thyroid cartilage'],
};

export const SearchModal: React.FC = () => {
  const searchOpen = useAnatomyStore((s) => s.searchOpen);
  const setSearchOpen = useAnatomyStore((s) => s.setSearchOpen);
  const manifest = useAnatomyStore((s) => s.manifest);
  const selectPart = useAnatomyStore((s) => s.selectPart);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);
  const setBiologicalSex = useAnatomyStore((s) => s.setBiologicalSex);
  const openDocumentation = useAnatomyStore((s) => s.openDocumentation);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [searchOpen]);

  const otherSex = biologicalSex === 'male' ? 'female' : 'male';

  const { results, otherResults } = useMemo(() => {
    if (!manifest) return { results: [], otherResults: [] };
    if (!query.trim()) {
      return {
        results: manifest.parts.filter((p) => SUGGESTIONS[biologicalSex].includes(p.id)),
        otherResults: [],
      };
    }

    const q = query.toLowerCase().trim();
    const aliases = Object.entries(ALIASES)
      .filter(([key]) => key.includes(q) || q.includes(key))
      .flatMap(([, values]) => values);

    const match = (part: (typeof manifest.parts)[number]) => {
      const haystack = `${part.name} ${part.conceptId} ${part.id} ${part.system}`.toLowerCase();
      return haystack.includes(q) || aliases.some((alias) => haystack.includes(alias));
    };

    const sameSex: typeof manifest.parts = [];
    const opposite: typeof manifest.parts = [];

    for (const part of manifest.parts) {
      if (!match(part)) continue;
      if (isPartVisibleForSex(part.id, biologicalSex)) {
        if (sameSex.length < 40) sameSex.push(part);
      } else if (opposite.length < 6) {
        opposite.push(part);
      }
    }

    return { results: sameSex, otherResults: opposite };
  }, [manifest, query, biologicalSex]);

  if (!searchOpen) return null;

  const handleSelect = (partId: string) => {
    if (!isPartVisibleForSex(partId, biologicalSex)) return;
    selectPart(partId);
    setSearchOpen(false);
  };

  const switchModel = () => {
    setBiologicalSex(otherSex);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].id);
      }
    }
  };

  const modelLabel = biologicalSex === 'male' ? 'Male' : 'Female';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="ui-interactive-surface w-full max-w-xl bg-[#0c1220]/97 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-teal-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={`Search ${modelLabel.toLowerCase()} anatomy — bone, muscle, organ, vessel or FMA ID`}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded text-slate-400 hover:text-slate-200 mr-2" title="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[26rem] overflow-y-auto p-2 divide-y divide-slate-800/40">
          {!query.trim() && (
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Suggested {modelLabel.toLowerCase()} landmarks
              </span>
              <span className={biologicalSex === 'female' ? 'text-rose-300' : 'text-cyan-300'}>
                {biologicalSex === 'female' ? '♀ Female model' : '♂ Male model'}
              </span>
            </div>
          )}

          {results.length === 0 && query.trim() && otherResults.length > 0 && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                “{query}” belongs to the <b>{otherSex}</b> reference model. Switch models to inspect it; the male and female
                simulations never mix structures.
              </p>
              <button
                onClick={switchModel}
                className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  otherSex === 'female'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Switch to {otherSex} model
              </button>
            </div>
          )}

          {results.length === 0 && (!query.trim() || otherResults.length === 0) && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching {modelLabel.toLowerCase()} structures found{query.trim() ? ` for “${query}”` : ''}.
            </div>
          )}

          {results.map((part, index) => {
            const isSelected = index === selectedIndex;
            const sex = getPartSex(part.id);
            return (
              <button
                key={part.id}
                onClick={() => handleSelect(part.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                  isSelected
                    ? 'bg-teal-500/15 border border-teal-500/30 text-teal-200'
                    : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-medium truncate">{part.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                    <span className="capitalize">{part.system}</span>
                    <span>•</span>
                    <span>FMA: {part.conceptId}</span>
                    {sex !== 'both' && (
                      <span className={sex === 'female' ? 'text-rose-300' : 'text-cyan-300'}>
                        {sex === 'female' ? '♀' : '♂'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDocumentation({ partId: part.id });
                    }}
                    className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-medium flex items-center gap-1 transition-colors"
                    title="Open comprehensive medical documentation"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span className="hidden sm:inline">Know More</span>
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono gap-3">
          <span>↑ ↓ navigate</span>
          <span className="truncate">Enter to inspect · {modelLabel} model only</span>
        </div>
      </div>
    </div>
  );
};
