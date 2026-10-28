import React, { useState } from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { ANATOMICAL_SYSTEMS } from '../../data/systems';
import type { DisplayMode } from '../../types/anatomy';
import {
  Layers,
  Eye,
  EyeOff,
  Sliders,
  RotateCcw,
  ChevronDown,
  User,
  Activity,
  Bone,
  Heart,
  Sparkles,
  Ban,
  BookOpen,
} from 'lucide-react';

const MODES: { id: DisplayMode; label: string; icon: React.ReactNode; title: string }[] = [
  { id: 'surface', label: 'Surface', icon: <User className="w-3.5 h-3.5" />, title: 'Intact external surface with skin and external genitalia' },
  { id: 'muscles', label: 'Muscles', icon: <Activity className="w-3.5 h-3.5" />, title: 'Muscular system with skeleton for context' },
  { id: 'skeleton', label: 'Skeleton', icon: <Bone className="w-3.5 h-3.5" />, title: 'Skeletal system and connective tissues' },
  { id: 'organs', label: 'Organs', icon: <Heart className="w-3.5 h-3.5" />, title: 'Viscera, vessels and nerves without skin or muscle' },
  { id: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" />, title: 'All systems with translucent skin' },
  { id: 'custom', label: 'Custom', icon: <Sparkles className="w-3.5 h-3.5" />, title: 'Your current layer selection' },
];

export const LayerPanel: React.FC = () => {
  const visibleSystems = useAnatomyStore((s) => s.visibleSystems);
  const displayMode = useAnatomyStore((s) => s.displayMode);
  const setDisplayMode = useAnatomyStore((s) => s.setDisplayMode);
  const toggleSystem = useAnatomyStore((s) => s.toggleSystem);
  const isolateSystem = useAnatomyStore((s) => s.isolateSystem);
  const explosionFactor = useAnatomyStore((s) => s.explosionFactor);
  const setExplosionFactor = useAnatomyStore((s) => s.setExplosionFactor);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);
  const openDocumentation = useAnatomyStore((s) => s.openDocumentation);

  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Structural', 'Circulatory', 'Neural', 'Visceral', 'Superficial'];
  const filteredSystems = ANATOMICAL_SYSTEMS.filter(
    (sys) => selectedCategory === 'All' || sys.category === selectedCategory
  );

  const activeMode = MODES.find((m) => m.id === displayMode) || MODES[5];
  const isSurface = displayMode === 'surface';

  return (
    <div
      className={`ui-interactive-surface flex flex-col bg-[#0c1220]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl transition-all duration-300 z-20 overflow-hidden ${
        collapsed ? 'w-12 h-12' : 'w-[19rem] max-md:w-[calc(100vw-2rem)] max-h-[calc(100vh-6.5rem)] max-md:max-h-[42vh]'
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-left hover:text-teal-300 transition-colors min-w-0"
        >
          <Layers className="w-4 h-4 text-teal-400 shrink-0" />
          {!collapsed && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100 truncate">
              Anatomy Layers
            </span>
          )}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-1">
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                biologicalSex === 'female'
                  ? 'text-rose-300 bg-rose-500/10 border-rose-500/25'
                  : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25'
              }`}
            >
              {biologicalSex === 'female' ? '♀' : '♂'}
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Collapse panel"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Presentation modes */}
          <div className="px-3 pt-3 pb-2.5 border-b border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Presentation
              </span>
              <span className="text-[10px] text-teal-400/90">{activeMode.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MODES.filter((m) => m.id !== 'custom').map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setDisplayMode(mode.id)}
                  title={mode.title}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                    displayMode === mode.id
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-200 shadow-sm shadow-teal-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
            {isSurface ? (
              <p className="mt-2 text-[10px] leading-snug text-slate-500">
                Intact surface: internal organs stay hidden until you open a cutaway or systemic view.
              </p>
            ) : (
              <p className="mt-2 text-[10px] leading-snug text-slate-500">
                {displayMode === 'all'
                  ? 'All systems are shown with a translucent body surface.'
                  : 'Layer visibility is explicit; changing a layer cannot leave an old organ behind.'}
              </p>
            )}
          </div>

          {/* Dissection */}
          <div className="p-3 bg-slate-900/30 border-b border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                {isSurface ? <Ban className="w-3.5 h-3.5 text-slate-500" /> : <Sliders className="w-3.5 h-3.5 text-teal-400" />}
                <span>Layer dissection</span>
              </span>
              <span className={`font-mono text-[10px] ${isSurface ? 'text-slate-600' : 'text-teal-400'}`}>
                {isSurface ? 'surface' : `${Math.round(explosionFactor * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isSurface ? 0 : explosionFactor}
              disabled={isSurface}
              onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
              <span>Anatomical</span>
              <span>Exploded</span>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-1.5 py-1 rounded text-[9px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* System list */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredSystems.map((sys) => {
              const isVisible = visibleSystems.includes(sys.id);
              return (
                <div
                  key={sys.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                    isVisible
                      ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-100'
                      : 'bg-transparent hover:bg-slate-900/60 text-slate-500'
                  }`}
                >
                  <button
                    onClick={() => toggleSystem(sys.id)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    title={sys.description}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: sys.color }}
                    />
                    <span className="truncate font-medium">{sys.name}</span>
                  </button>

                  <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100">
                    <button
                      onClick={() => openDocumentation({ systemId: sys.id })}
                      className="p-1 rounded text-slate-500 hover:text-teal-300 hover:bg-slate-700/60 transition-colors"
                      title={`Know More · Read full medical documentation for ${sys.name}`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => isolateSystem(sys.id)}
                      className="px-1 py-0.5 rounded text-[9px] font-mono text-slate-500 hover:text-teal-300 hover:bg-slate-700/60 transition-colors"
                      title="Isolate this system"
                    >
                      only
                    </button>
                    <button
                      onClick={() => toggleSystem(sys.id)}
                      className={`p-0.5 rounded transition-colors ${
                        isVisible ? 'text-teal-400 hover:text-teal-300' : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={isVisible ? 'Hide system' : 'Show system'}
                    >
                      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between gap-1">
            <button
              onClick={() => setDisplayMode('surface')}
              className="px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-[9px] transition-colors"
              title="Return to the intact surface"
            >
              Reset surface
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => isolateSystem('reproductive')}
                className="px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-[9px] transition-colors"
                title={`Isolate the ${biologicalSex} reproductive system`}
              >
                Reproductive
              </button>
              <button
                onClick={() => setDisplayMode('all')}
                className="p-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-400 transition-colors"
                title="Show all systems"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
