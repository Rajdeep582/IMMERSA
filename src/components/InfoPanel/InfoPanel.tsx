import React from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { getAnatomicalProfile } from '../../data/clinicalProfiles';
import { ANATOMICAL_SYSTEMS } from '../../data/systems';
import { getPartSex, isExternalGenitalPart } from '../../data/anatomyCatalog';
import { InspectionViewport } from '../InspectionViewport/InspectionViewport';
import {
  Activity,
  Layers,
  Eye,
  Maximize2,
  ChevronRight,
  BookOpen,
  Zap,
  Droplet,
  ShieldAlert,
  X,
  Compass,
  MousePointer2,
  Move3d,
  Search,
  Bone,
  Heart,
  User,
  Info,
  ArrowUpRight,
} from 'lucide-react';

const systemLabel = (id: string) =>
  ANATOMICAL_SYSTEMS.find((s) => s.id === id)?.name || id;

export const InfoPanel: React.FC = () => {
  const manifest = useAnatomyStore((s) => s.manifest);
  const selectedPartId = useAnatomyStore((s) => s.selectedPartId);
  const selectPart = useAnatomyStore((s) => s.selectPart);
  const isolated = useAnatomyStore((s) => s.isolated);
  const setIsolated = useAnatomyStore((s) => s.setIsolated);
  const ghostOthers = useAnatomyStore((s) => s.ghostOthers);
  const setGhostOthers = useAnatomyStore((s) => s.setGhostOthers);
  const inspectorOpen = useAnatomyStore((s) => s.inspectorOpen);
  const setInspectorOpen = useAnatomyStore((s) => s.setInspectorOpen);
  const setInspectModalOpen = useAnatomyStore((s) => s.setInspectModalOpen);
  const isolateSystem = useAnatomyStore((s) => s.isolateSystem);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);
  const setBiologicalSex = useAnatomyStore((s) => s.setBiologicalSex);
  const visibleSystems = useAnatomyStore((s) => s.visibleSystems);
  const displayMode = useAnatomyStore((s) => s.displayMode);
  const setDisplayMode = useAnatomyStore((s) => s.setDisplayMode);
  const openDocumentation = useAnatomyStore((s) => s.openDocumentation);

  const currentPart = manifest?.parts.find((p) => p.id === selectedPartId);
  const profile = currentPart
    ? getAnatomicalProfile(currentPart.id, currentPart.name, currentPart.system)
    : null;

  if (!inspectorOpen) {
    return (
      <button
        onClick={() => setInspectorOpen(true)}
        className="fixed bottom-20 md:bottom-auto md:top-20 right-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 backdrop-blur-md shadow-xl text-xs font-medium text-slate-200 transition-all"
      >
        <BookOpen className="w-4 h-4 text-teal-400" />
        <span>Anatomical Inspector</span>
      </button>
    );
  }

  const sexLabel = biologicalSex === 'female' ? 'Female' : 'Male';
  const sexAccent = biologicalSex === 'female' ? 'rose' : 'cyan';
  const modelPartCount = manifest ? manifest.parts.length : 0;

  return (
    <aside className={`ui-interactive-surface flex flex-col w-full md:w-[24rem] max-h-[55vh] md:max-h-none md:h-[calc(100vh-5rem)] bg-[#0c1220]/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-800/80 shadow-2xl z-20 overflow-hidden transition-all duration-300 ${currentPart ? 'max-md:max-h-[55vh]' : 'max-md:max-h-[13.5rem]'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-200 truncate">
            {currentPart ? 'Structure Inspector' : 'Model Overview'}
          </span>
        </div>
        <button
          onClick={() => setInspectorOpen(false)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Collapse panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!currentPart || !profile ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left text-slate-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-100">
                Adult {sexLabel} Reference
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  biologicalSex === 'female'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {biologicalSex === 'female' ? '♀' : '♂'} {sexLabel}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 max-md:hidden">
              Explore {modelPartCount.toLocaleString()} named structures in an interactive 3D reference atlas. The
              surface view keeps the body intact; systemic views expose the layers beneath.
            </p>
            <div className="md:hidden flex items-center gap-2 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900/60">
                {visibleSystems.length} layers
              </span>
              <span>{modelPartCount.toLocaleString()} structures</span>
              <span className="text-slate-600">·</span>
              <span className="capitalize text-teal-400">{displayMode}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-md:hidden">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Visible layers</div>
              <div className="mt-1 text-xl font-semibold text-teal-300">{visibleSystems.length}</div>
              <div className="text-[10px] text-slate-500">{displayMode === 'surface' ? 'intact surface' : 'systemic view'}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Atlas structures</div>
              <div className="mt-1 text-xl font-semibold text-slate-100">{modelPartCount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">FMA-linked meshes</div>
            </div>
          </div>

          {/* Model Overview "Know More" Option */}
          <button
            onClick={() => openDocumentation({ systemId: visibleSystems[0] || 'cardiac' })}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-slate-900 border border-teal-500/40 text-teal-300 font-semibold text-xs hover:border-teal-400 hover:text-teal-200 transition-all group"
            title="Explore comprehensive medical documentation for the active anatomical system"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400 transition-transform group-hover:scale-110" />
              <span>Know More · Explore System Dossier</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-teal-400" />
          </button>

          <div className="space-y-2 max-md:hidden">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Quick start</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'surface' as const, label: 'Surface', icon: <User className="w-3.5 h-3.5" /> },
                { id: 'muscles' as const, label: 'Muscles', icon: <Activity className="w-3.5 h-3.5" /> },
                { id: 'skeleton' as const, label: 'Skeleton', icon: <Bone className="w-3.5 h-3.5" /> },
                { id: 'organs' as const, label: 'Organs', icon: <Heart className="w-3.5 h-3.5" /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDisplayMode(item.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-[11px] transition-colors ${
                    displayMode === item.id
                      ? 'border-teal-500/50 bg-teal-500/15 text-teal-200'
                      : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3 max-md:hidden">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-400">
              <Compass className="w-3.5 h-3.5" />
              How to explore
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Move3d className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                Drag to rotate · scroll or pinch to zoom
              </div>
              <div className="flex items-center gap-2">
                <MousePointer2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                Click any structure to open its clinical profile
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                Press <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-mono">/</kbd> to search
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3 max-md:hidden">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              Model basis
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Male atlas geometry: BodyParts3D 4.0 (DBCLS, CC BY 4.0). Female pelvic viscera and external genitalia
              are curated procedural anatomy placed on the shared reference body; this is an educational reference,
              not a clinical diagnostic device.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setBiologicalSex(biologicalSex === 'male' ? 'female' : 'male')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                  sexAccent === 'rose'
                    ? 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
                    : 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
                }`}
              >
                Switch to {biologicalSex === 'male' ? 'female' : 'male'} model
              </button>
              <button
                onClick={() => selectPart(null)}
                className="px-2 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 text-left text-slate-200">
          <nav className="flex items-center flex-wrap gap-1 text-[10px] font-medium text-slate-400">
            <button onClick={() => selectPart(null)} className="hover:text-teal-300 transition-colors">
              Human Body
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <button
              onClick={() => openDocumentation({ systemId: currentPart.system })}
              className="hover:text-teal-300 transition-colors font-medium text-slate-300"
              title="Open medical documentation for this anatomical system"
            >
              {systemLabel(currentPart.system)}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-teal-400 font-semibold truncate max-w-[150px]">
              {profile.canonicalName}
            </span>
          </nav>

          {/* Prominent "Know More" Primary Action Button */}
          <button
            onClick={() => openDocumentation({ partId: currentPart.id })}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 transition-all group"
            title="Open dedicated, comprehensive medical documentation page for this structure"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-950 transition-transform group-hover:scale-110" />
              <span>Know More · Medical Dossier</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-950 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-snug">
                {profile.canonicalName}
              </h2>
              <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
                {getPartSex(currentPart.id) === 'female' && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    ♀ Female
                  </span>
                )}
                {getPartSex(currentPart.id) === 'male' && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    ♂ Male
                  </span>
                )}
                {isExternalGenitalPart(currentPart.id) && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    Surface
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {currentPart.system}
                </span>
              </div>
            </div>
            {profile.latinName && (
              <p className="text-[11px] italic text-slate-400 font-serif mt-0.5">{profile.latinName}</p>
            )}
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              FMA: {currentPart.conceptId} · {profile.region}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setIsolated(!isolated)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all ${
                isolated
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow-lg shadow-teal-500/25'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isolated ? 'Isolated' : 'Isolate'}</span>
            </button>

            <button
              onClick={() => setGhostOthers(!ghostOthers)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all ${
                ghostOthers
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{ghostOthers ? 'Ghosted' : 'Ghost'}</span>
            </button>

            <button
              onClick={() => setInspectModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Full View</span>
            </button>
          </div>

          <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
            <InspectionViewport />
          </div>

          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Primary Function</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{profile.primaryFunction}</p>
          </div>

          {(profile.arterialSupply || profile.innervation) && (
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-[11px]">
              {profile.arterialSupply && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                    <Droplet className="w-3.5 h-3.5" />
                    <span>Arterial Supply</span>
                  </div>
                  <p className="text-slate-300 text-[10px] leading-relaxed">{profile.arterialSupply}</p>
                </div>
              )}
              {profile.innervation && (
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Innervation</span>
                  </div>
                  <p className="text-slate-300 text-[10px] leading-relaxed">{profile.innervation}</p>
                </div>
              )}
            </div>
          )}

          {profile.relations && profile.relations.length > 0 && (
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              <h4 className="text-[10px] font-semibold text-slate-200 uppercase tracking-wider">
                Anatomical Relationships
              </h4>
              <ul className="space-y-1 text-[10px] text-slate-300">
                {profile.relations.map((rel, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    <span>{rel}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.clinicalNotes && (
            <div className="space-y-1.5 bg-amber-950/20 p-3 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Clinical Relevance</span>
              </div>
              <p className="text-[10px] text-amber-200/90 leading-relaxed">{profile.clinicalNotes}</p>
            </div>
          )}

          {profile.references && (
            <div className="pt-2 border-t border-slate-800/80 text-[9px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">Scientific Sources</span>
              {profile.references.map((ref, idx) => (
                <p key={idx} className="leading-normal">
                  • {ref}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
