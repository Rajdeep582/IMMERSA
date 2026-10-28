import React, { useState } from 'react';
import { VisualToolConfig } from '../../../types/documentation';
import { CheckCircle2, AlertTriangle, ArrowRightLeft, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PathologyComparisonProps {
  comparison: VisualToolConfig['pathologyComparison'];
}

export const PathologyComparison: React.FC<PathologyComparisonProps> = ({ comparison }) => {
  const [activeTab, setActiveTab] = useState<'both' | 'normal' | 'pathological'>('both');

  const { normalState, pathologicalState, diseaseName } = comparison;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-4 md:p-6 shadow-xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ArrowRightLeft className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-100 tracking-tight">
              Normal Physiology vs. Pathological State
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pathological comparison: <span className="text-amber-300 font-medium">{diseaseName}</span>
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 self-start md:self-auto text-xs">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === 'both'
                ? 'bg-slate-800 text-slate-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setActiveTab('normal')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === 'normal'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Healthy Normal
          </button>
          <button
            onClick={() => setActiveTab('pathological')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === 'pathological'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pathological State
          </button>
        </div>
      </div>

      {/* Comparative Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Normal State Card */}
        {(activeTab === 'both' || activeTab === 'normal') && (
          <div className="rounded-xl border border-teal-500/30 bg-teal-950/10 p-4 space-y-3 flex flex-col justify-between transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Healthy Physiological State</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Normal
                </span>
              </div>
              <h5 className="text-sm font-semibold text-slate-100">{normalState.title}</h5>
              <p className="text-xs text-slate-300 leading-relaxed">{normalState.description}</p>
            </div>

            <div className="pt-3 border-t border-teal-500/20 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-teal-400/90 font-semibold">
                Physiological Biomarkers & Features
              </span>
              <ul className="space-y-1.5">
                {normalState.keyMarkers.map((marker, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{marker}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Pathological State Card */}
        {(activeTab === 'both' || activeTab === 'pathological') && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-3 flex flex-col justify-between transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Pathological & Diseased State</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Pathology
                </span>
              </div>
              <h5 className="text-sm font-semibold text-slate-100">{pathologicalState.title}</h5>
              <p className="text-xs text-slate-300 leading-relaxed">{pathologicalState.description}</p>
            </div>

            <div className="pt-3 border-t border-rose-500/20 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400/90 font-semibold">
                Pathological Hallmarks & Diagnostic Markers
              </span>
              <ul className="space-y-1.5">
                {pathologicalState.keyMarkers.map((marker, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{marker}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

