import React, { useEffect } from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { GUIDED_TOURS } from '../../data/guidedTours';
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const GuidedTourOverlay: React.FC = () => {
  const activeTour = useAnatomyStore((s) => s.activeTour);
  const tourStepIndex = useAnatomyStore((s) => s.tourStepIndex);
  const nextTourStep = useAnatomyStore((s) => s.nextTourStep);
  const prevTourStep = useAnatomyStore((s) => s.prevTourStep);
  const setTourStep = useAnatomyStore((s) => s.setTourStep);
  const exitTour = useAnatomyStore((s) => s.exitTour);
  const focusOnStructure = useAnatomyStore((s) => s.focusOnStructure);
  const startTour = useAnatomyStore((s) => s.startTour);

  // When step changes, automatically animate camera pose
  useEffect(() => {
    if (!activeTour) return;
    const currentStep = activeTour.steps[tourStepIndex];
    if (currentStep) {
      focusOnStructure(
        currentStep.cameraPose.target,
        undefined,
        currentStep.cameraPose.position
      );
    }
  }, [activeTour, tourStepIndex]);

  if (!activeTour) {
    return null;
  }

  const currentStep = activeTour.steps[tourStepIndex];
  const progressPercent = ((tourStepIndex + 1) / activeTour.steps.length) * 100;

  return (
    <div className="ui-interactive-surface fixed bottom-6 left-1/2 -translate-x-1/2 w-[92vw] max-w-2xl bg-[#090d18]/95 backdrop-blur-xl border border-teal-500/30 rounded-2xl shadow-2xl z-30 p-5 text-left text-slate-200 transition-all duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400">
              Guided Anatomical Journey
            </span>
            <h3 className="text-xs font-semibold text-slate-100">{activeTour.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            Stage {tourStepIndex + 1} of {activeTour.steps.length}
          </span>
          <button
            onClick={exitTour}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Exit Guided Journey"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="py-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-teal-300 border border-slate-700/60">
            {currentStep.title}
          </span>
          <h4 className="text-sm font-semibold text-slate-100 tracking-tight">
            {currentStep.subtitle}
          </h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {currentStep.explanation}
        </p>

        {currentStep.clinicalHighlight && (
          <div className="text-[11px] text-amber-300/90 bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl mt-2 leading-relaxed">
            <b>Clinical Keypoint:</b> {currentStep.clinicalHighlight}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <div className="flex gap-1">
          {activeTour.steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setTourStep(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === tourStepIndex
                  ? 'bg-teal-400 scale-125 shadow-md shadow-teal-500/50'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevTourStep}
            disabled={tourStepIndex === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tourStepIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={nextTourStep}
            disabled={tourStepIndex === activeTour.steps.length - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tourStepIndex === activeTour.steps.length - 1
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20'
            }`}
          >
            <span>Next Stage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

