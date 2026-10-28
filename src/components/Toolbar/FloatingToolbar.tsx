import React from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { StandardView } from '../../types/anatomy';
import { Compass, RotateCcw, ZoomIn, ZoomOut, Move3d, Hand } from 'lucide-react';

export const FloatingToolbar: React.FC = () => {
  const activeView = useAnatomyStore((s) => s.activeView);
  const setActiveView = useAnatomyStore((s) => s.setActiveView);
  const triggerResetCamera = useAnatomyStore((s) => s.triggerResetCamera);
  const triggerZoomIn = useAnatomyStore((s) => s.triggerZoomIn);
  const triggerZoomOut = useAnatomyStore((s) => s.triggerZoomOut);
  const inspectorOpen = useAnatomyStore((s) => s.inspectorOpen);
  const selectedPartId = useAnatomyStore((s) => s.selectedPartId);
  const interactionMode = useAnatomyStore((s) => s.interactionMode);
  const setInteractionMode = useAnatomyStore((s) => s.setInteractionMode);

  const isSheetOpenOnMobile = inspectorOpen;

  const views: { id: StandardView; label: string; short: string }[] = [
    { id: 'anterior', label: 'Anterior (Front)', short: 'ANT' },
    { id: 'posterior', label: 'Posterior (Back)', short: 'POST' },
    { id: 'left', label: 'Left Lateral', short: 'L-LAT' },
    { id: 'right', label: 'Right Lateral', short: 'R-LAT' },
    { id: 'superior', label: 'Superior (Top)', short: 'SUP' },
    { id: 'isometric', label: 'Isometric (3/4)', short: 'ISO' },
  ];

  return (
    <div
      className={`ui-interactive-surface fixed bottom-6 left-4 md:left-6 z-20 flex items-center gap-1.5 p-1.5 bg-[#0c1220]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl transition-opacity duration-200 ${
        isSheetOpenOnMobile ? 'max-md:opacity-0 max-md:pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Interaction Mode: Orbit / Pan */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-1.5">
        <button
          onClick={() => setInteractionMode('rotate')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            interactionMode === 'rotate'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Rotate Mode (Default): Left-click or 1-finger to rotate whole body (Press H to toggle)"
        >
          <Move3d className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono text-[11px]">Rotate</span>
        </button>

        <button
          onClick={() => setInteractionMode('pan')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            interactionMode === 'pan'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Pan Mode: Drag to move the entire body model up, down, left, right (Press H to toggle)"
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono text-[11px]">Pan</span>
        </button>
      </div>

      <div className="flex items-center gap-1">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              activeView === v.id
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title={v.label}
          >
            {v.short}
          </button>
        ))}
      </div>

      <div className="border-l border-slate-800 pl-1 flex items-center gap-1">
        <button
          onClick={triggerZoomIn}
          className="p-1.5 rounded-xl text-slate-400 hover:text-teal-300 hover:bg-slate-800/60 transition-colors"
          title="Zoom In (Fast)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={triggerZoomOut}
          className="p-1.5 rounded-xl text-slate-400 hover:text-teal-300 hover:bg-slate-800/60 transition-colors"
          title="Zoom Out (Fast)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={triggerResetCamera}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title="Reset Camera Target and Angle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

