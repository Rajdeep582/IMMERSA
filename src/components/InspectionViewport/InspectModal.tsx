import React from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { InspectionViewport } from './InspectionViewport';

export const InspectModal: React.FC = () => {
  const inspectModalOpen = useAnatomyStore((s) => s.inspectModalOpen);
  const setInspectModalOpen = useAnatomyStore((s) => s.setInspectModalOpen);

  if (!inspectModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setInspectModalOpen(false)}
    >
      <div
        className="ui-interactive-surface w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80 bg-[#090d18]"
        onClick={(e) => e.stopPropagation()}
      >
        <InspectionViewport isModal onClose={() => setInspectModalOpen(false)} />
      </div>
    </div>
  );
};

