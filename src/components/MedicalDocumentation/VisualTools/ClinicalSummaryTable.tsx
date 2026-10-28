import React from 'react';
import { VisualToolConfig } from '../../../types/documentation';
import { Table2, Check } from 'lucide-react';

interface ClinicalSummaryTableProps {
  matrix: VisualToolConfig['clinicalSummaryMatrix'];
}

export const ClinicalSummaryTable: React.FC<ClinicalSummaryTableProps> = ({ matrix }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-4 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Table2 className="w-4 h-4" />
        </span>
        <div>
          <h4 className="text-sm font-bold text-slate-100 tracking-tight">
            Clinical Summary & Evidence Matrix
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Key diagnostic modalities, staging criteria, and first-line clinical guidelines
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matrix.map((section, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-800/80 bg-slate-900/50 overflow-hidden flex flex-col"
          >
            <div className="px-3.5 py-2.5 bg-slate-800/50 border-b border-slate-800 text-xs font-bold text-purple-300 uppercase tracking-wider">
              {section.category}
            </div>

            <div className="divide-y divide-slate-800/60 flex-1">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="p-3 text-left space-y-1">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pl-3">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

