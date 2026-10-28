import React, { useState } from 'react';
import { VisualToolConfig } from '../../../types/documentation';
import { GitCommit, ArrowDown, ChevronRight, Zap } from 'lucide-react';

interface ProcessFlowDiagramProps {
  processFlow: VisualToolConfig['processFlow'];
}

export const ProcessFlowDiagram: React.FC<ProcessFlowDiagramProps> = ({ processFlow }) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(0);

  const { processName, steps } = processFlow;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-4 md:p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <GitCommit className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-100 tracking-tight">
              Physiological Process Flow
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mechanism: <span className="text-cyan-300 font-medium">{processName}</span>
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 self-start md:self-auto">
          {steps.length} Sequential Stages
        </div>
      </div>

      {/* Interactive Process Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {steps.map((step, idx) => {
          const isSelected = selectedStepIndex === idx;
          return (
            <div
              key={idx}
              onClick={() => setSelectedStepIndex(idx)}
              className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left relative flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                  : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {step.stage}
                  </span>
                  {step.factorOrRate && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 truncate max-w-[140px]">
                      {step.factorOrRate}
                    </span>
                  )}
                </div>
                <h5 className="text-xs font-semibold text-slate-100">{step.title}</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">{step.description}</p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Stage {idx + 1} of {steps.length}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-cyan-400 translate-x-1' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

