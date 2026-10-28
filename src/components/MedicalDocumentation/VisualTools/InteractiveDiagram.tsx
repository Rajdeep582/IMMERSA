import React, { useState } from 'react';
import { DiagramType } from '../../../types/documentation';
import { Activity, Info, Sparkles, ZoomIn } from 'lucide-react';

interface InteractiveDiagramProps {
  type: DiagramType;
  title: string;
  subtitle?: string;
  canonicalName: string;
}

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({
  type,
  title,
  subtitle,
  canonicalName
}) => {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Node details for interactive tooltips
  const getNodeDetails = (nodeId: string): { label: string; details: string; metric?: string } => {
    switch (nodeId) {
      // Cardiac conduction
      case 'sa-node':
        return { label: 'Sinoatrial (SA) Node', details: 'Primary pacemaker located at junction of superior vena cava and right atrium. HCN4 channels generate spontaneous diastolic action potentials.', metric: '60-100 bpm intrinsic rate' };
      case 'av-node':
        return { label: 'Atrioventricular (AV) Node', details: 'Crucial gatekeeper located in Koch’s triangle. Delays action potential by ~0.12 seconds to ensure complete ventricular filling.', metric: 'Conduction velocity: 0.05 m/s' };
      case 'bundle-his':
        return { label: 'Bundle of His & Bundle Branches', details: 'Penetrates the central fibrous body, bifurcating into Right and Left Bundle Branches across the muscular interventricular septum.', metric: 'Conduction velocity: 2.0 m/s' };
      case 'purkinje':
        return { label: 'Purkinje Fiber Network', details: 'Extensive subendocardial arborization rapidly distributing electrical excitation across ventricular myocardium for synchronous ejection.', metric: 'Conduction velocity: 4.0 m/s' };

      // Nephron
      case 'glomerulus':
        return { label: 'Glomerulus & Bowman Capsule', details: 'High-pressure capillary tuft filtering plasma across fenestrated endothelium, basement membrane, and podocytes.', metric: 'Normal GFR: 90-120 mL/min' };
      case 'pct':
        return { label: 'Proximal Convoluted Tubule', details: 'Obligatory reabsorption of 65% of filtered water and sodium, and 100% of filtered glucose and amino acids via SGLT2 and Na+/H+ exchangers.', metric: 'Osmolality: 300 mOsm/kg' };
      case 'loop-henle':
        return { label: 'Loop of Henle (Countercurrent Multiplier)', details: 'Descending limb extracts water; thick ascending limb actively pumps Na+-K+-2Cl- (NKCC2), building hypertonic medullary gradient.', metric: 'Medullary tip: 1200 mOsm/kg' };
      case 'dct-cd':
        return { label: 'Distal Tubule & Collecting Duct', details: 'Aldosterone modulates ENaC sodium reabsorption; Vasopressin (ADH) recruits Aquaporin-2 water channels.', metric: 'Final urine: 50-1200 mOsm/kg' };

      // Alveoli
      case 'terminal-bronchiole':
        return { label: 'Terminal & Respiratory Bronchioles', details: 'Transition zone between conduction and respiration, lined by ciliated cuboidal cells and surfactant-producing club cells.', metric: 'Airway diameter < 0.5 mm' };
      case 'alveolar-sac':
        return { label: 'Alveolar Sac Cluster', details: 'Cluster of 300-500 million alveoli providing ~85 square meters of gas diffusion surface area.', metric: 'Alveolar PO2: 104 mmHg' };
      case 'capillary-membrane':
        return { label: 'Alveolar-Capillary Diffusion Barrier', details: 'Type I pneumocyte, shared basal lamina, and capillary endothelial cell forming a 0.2 to 0.5 micrometer diffusion membrane.', metric: 'Membrane thickness: 0.2-0.5 µm' };

      // Neural
      case 'cortex':
        return { label: 'Cerebral Neocortex', details: 'Six-layered cortical mantle coordinating conscious perception, motor commands, speech, and executive cognition.', metric: '16 billion cortical neurons' };
      case 'synapse':
        return { label: 'Chemical Synaptic Cleft', details: '20-40 nm intercellular gap where presynaptic neurotransmitter exocytosis activates postsynaptic ligand-gated receptors.', metric: 'Synaptic delay: ~0.5 ms' };
      case 'spinal-tract':
        return { label: 'Lateral Corticospinal Tract', details: 'Primary voluntary motor pathway originating in primary motor cortex (Brodmann area 4), decussating at medullary pyramids.', metric: 'Conduction speed: ~70 m/s' };

      // Sarcomere
      case 'z-disc':
        return { label: 'Sarcomere Z-Disc', details: 'Mechanical anchoring boundary composed of alpha-actinin, defining the ends of the contractile sarcomere unit.', metric: 'Resting length: 2.0-2.2 µm' };
      case 'myosin-actin':
        return { label: 'Actin-Myosin Cross-Bridge Matrix', details: 'Thick myosin filaments pull thin actin filaments inward during ATP-driven power strokes in excitation-contraction coupling.', metric: 'Force: ~3-4 pN per head' };

      // Bone
      case 'haversian':
        return { label: 'Haversian Central Canal', details: 'Longitudinal vascular channel transmitting blood vessels and unmyelinated nerve fibers through the center of an osteon.', metric: 'Diameter: 50 µm' };
      case 'lamellae':
        return { label: 'Concentric Bony Lamellae', details: 'Alternating helical collagen fiber layers organized to resist rotational and tensile mechanical shear stresses.', metric: 'Collagen pitch shift: ~90°' };

      default:
        return { label: 'Anatomical Micro-Unit', details: `Specialized cellular and microvascular architectural unit of the ${canonicalName}.`, metric: 'Homeostatic baseline' };
    }
  };

  const activeInfo = activeNode ? getNodeDetails(activeNode) : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-4 md:p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Activity className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-100 tracking-tight">{title}</h4>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-lg self-start md:self-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Schematic · Click elements to inspect</span>
        </div>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[380px] bg-gradient-to-b from-[#0b1325] to-[#070b14] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        <svg viewBox="0 0 800 450" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="cardiacGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="arterialGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="venousGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="nephronGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="neuralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.9" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND GRID */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
          </pattern>
          <rect width="800" height="450" fill="url(#grid)" />

          {/* DIAGRAMS BASED ON TYPE */}
          {type === 'conduction' ? (
            <g className="cursor-pointer">
              {/* Cardiac Silhouette Outline */}
              <path
                d="M 400 90 C 470 50, 560 90, 560 180 C 560 270, 430 350, 400 390 C 370 350, 240 270, 240 180 C 240 90, 330 50, 400 90 Z"
                fill="rgba(244, 63, 94, 0.08)"
                stroke="rgba(244, 63, 94, 0.4)"
                strokeWidth="2"
                strokeDasharray="6 3"
              />

              {/* SA Node */}
              <g onClick={() => setActiveNode('sa-node')} className="transition-all hover:opacity-100">
                <circle cx="340" cy="140" r="18" fill="#f43f5e" filter="url(#glow)" />
                <circle cx="340" cy="140" r="26" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" className="animate-spin-slow" />
                <text x="340" y="145" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" pointerEvents="none">SA</text>
                <text x="340" y="112" textAnchor="middle" fill="#fda4af" fontSize="12" fontWeight="600">Sinoatrial Node</text>
              </g>

              {/* Internodal Pathways */}
              <path d="M 340 158 Q 370 190 395 215" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="4 4" />

              {/* AV Node */}
              <g onClick={() => setActiveNode('av-node')}>
                <circle cx="400" cy="225" r="16" fill="#fb7185" filter="url(#glow)" />
                <text x="400" y="229" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" pointerEvents="none">AV</text>
                <text x="450" y="220" textAnchor="start" fill="#fda4af" fontSize="12" fontWeight="600">Atrioventricular Node</text>
              </g>

              {/* Bundle of His */}
              <path d="M 400 241 L 400 275" fill="none" stroke="#fb7185" strokeWidth="4" />
              <g onClick={() => setActiveNode('bundle-his')}>
                <rect x="388" y="250" width="24" height="20" rx="4" fill="#e11d48" />
                <text x="470" y="265" textAnchor="start" fill="#fda4af" fontSize="11">Bundle of His</text>
              </g>

              {/* Left and Right Bundle Branches */}
              <path d="M 400 275 Q 360 300 340 340" fill="none" stroke="#fb7185" strokeWidth="3" />
              <path d="M 400 275 Q 440 300 460 340" fill="none" stroke="#fb7185" strokeWidth="3" />

              {/* Purkinje Network */}
              <g onClick={() => setActiveNode('purkinje')}>
                <path d="M 340 340 Q 320 360 300 330 M 340 340 Q 330 370 350 380" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                <path d="M 460 340 Q 480 360 500 330 M 460 340 Q 470 370 450 380" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                <text x="400" y="375" textAnchor="middle" fill="#fda4af" fontSize="12" fontWeight="bold">Purkinje Fiber Arborization</text>
              </g>

              {/* ECG Trace Reference Overlay */}
              <path
                d="M 120 400 L 170 400 L 180 388 L 195 400 L 205 400 L 210 415 L 220 340 L 230 425 L 235 400 L 255 400 Q 275 375 295 400 L 330 400"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="2.5"
              />
              <text x="180" y="425" fill="#2dd4bf" fontSize="10" fontFamily="monospace">P-QRS-T Normal Surface ECG</text>
            </g>
          ) : type === 'nephron' ? (
            <g className="cursor-pointer">
              {/* Bowman Capsule & Glomerulus */}
              <g onClick={() => setActiveNode('glomerulus')}>
                <circle cx="280" cy="120" r="30" fill="rgba(20, 184, 166, 0.15)" stroke="#14b8a6" strokeWidth="2.5" />
                {/* Glomerular capillary loops */}
                <path d="M 265 110 Q 280 95 295 110 Q 280 125 265 135 Q 295 135 285 115" fill="none" stroke="#ef4444" strokeWidth="3" />
                <text x="280" y="75" textAnchor="middle" fill="#2dd4bf" fontSize="12" fontWeight="bold">Glomerular Tuft & Bowman Capsule</text>
              </g>

              {/* Proximal Convoluted Tubule */}
              <g onClick={() => setActiveNode('pct')}>
                <path d="M 310 120 Q 360 100 370 140 Q 390 180 370 210" fill="none" stroke="#14b8a6" strokeWidth="6" strokeLinecap="round" />
                <text x="410" y="160" textAnchor="start" fill="#2dd4bf" fontSize="11" fontWeight="600">Proximal Convoluted Tubule (PCT)</text>
              </g>

              {/* Loop of Henle */}
              <g onClick={() => setActiveNode('loop-henle')}>
                <path d="M 370 210 L 370 340 Q 385 365 400 340 L 400 190" fill="none" stroke="#0d9488" strokeWidth="5" strokeLinecap="round" />
                <text x="385" y="380" textAnchor="middle" fill="#5eead4" fontSize="12" fontWeight="bold">Loop of Henle (Countercurrent Multiplier)</text>
                <text x="320" y="270" textAnchor="end" fill="#94a3b8" fontSize="10">Descending (H2O)</text>
                <text x="450" y="270" textAnchor="start" fill="#94a3b8" fontSize="10">Ascending (Na+/K+/2Cl-)</text>
              </g>

              {/* Distal Tubule and Collecting Duct */}
              <g onClick={() => setActiveNode('dct-cd')}>
                <path d="M 400 190 Q 430 160 470 170 L 510 170" fill="none" stroke="#14b8a6" strokeWidth="5" strokeLinecap="round" />
                <path d="M 510 120 L 510 370" fill="none" stroke="#0f766e" strokeWidth="8" strokeLinecap="round" />
                <text x="530" y="230" textAnchor="start" fill="#2dd4bf" fontSize="12" fontWeight="bold">Collecting Duct (ADH / Aquaporin-2)</text>
              </g>
            </g>
          ) : type === 'alveoli' ? (
            <g className="cursor-pointer">
              {/* Terminal Bronchiole */}
              <g onClick={() => setActiveNode('terminal-bronchiole')}>
                <path d="M 400 50 L 400 140" fill="none" stroke="#94a3b8" strokeWidth="16" strokeLinecap="round" />
                <text x="430" y="90" textAnchor="start" fill="#cbd5e1" fontSize="12" fontWeight="bold">Terminal Bronchiole</text>
              </g>

              {/* Alveolar Sacs */}
              <g onClick={() => setActiveNode('alveolar-sac')}>
                <circle cx="360" cy="200" r="32" fill="rgba(244, 63, 94, 0.15)" stroke="#fb7185" strokeWidth="2" />
                <circle cx="430" cy="190" r="36" fill="rgba(244, 63, 94, 0.15)" stroke="#fb7185" strokeWidth="2" />
                <circle cx="390" cy="250" r="42" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2.5" />
                <circle cx="450" cy="260" r="34" fill="rgba(244, 63, 94, 0.15)" stroke="#fb7185" strokeWidth="2" />
                <text x="400" y="315" textAnchor="middle" fill="#fda4af" fontSize="12" fontWeight="bold">Alveolar Acinus (Gas Exchange Unit)</text>
              </g>

              {/* Capillary Meshwork */}
              <g onClick={() => setActiveNode('capillary-membrane')}>
                <path d="M 310 180 Q 400 240 490 200" fill="none" stroke="#3b82f6" strokeWidth="5" opacity="0.8" />
                <path d="M 310 240 Q 400 290 500 250" fill="none" stroke="#ef4444" strokeWidth="5" opacity="0.8" />
                <text x="400" y="360" textAnchor="middle" fill="#38bdf8" fontSize="11">Pulmonary Capillary Perfusion Barrier (0.5 µm)</text>
              </g>
            </g>
          ) : type === 'sarcomere' ? (
            <g className="cursor-pointer">
              {/* Z-Discs */}
              <g onClick={() => setActiveNode('z-disc')}>
                <path d="M 200 120 L 220 150 L 200 180 L 220 210 L 200 240 L 220 270 L 200 300" fill="none" stroke="#ef4444" strokeWidth="4" />
                <path d="M 600 120 L 620 150 L 600 180 L 620 210 L 600 240 L 620 270 L 600 300" fill="none" stroke="#ef4444" strokeWidth="4" />
                <text x="210" y="100" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="bold">Z-Disc</text>
                <text x="610" y="100" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="bold">Z-Disc</text>
              </g>

              {/* Actin and Myosin Filaments */}
              <g onClick={() => setActiveNode('myosin-actin')}>
                {/* Actin */}
                <line x1="210" y1="160" x2="380" y2="160" stroke="#38bdf8" strokeWidth="4" />
                <line x1="210" y1="240" x2="380" y2="240" stroke="#38bdf8" strokeWidth="4" />
                <line x1="430" y1="160" x2="610" y2="160" stroke="#38bdf8" strokeWidth="4" />
                <line x1="430" y1="240" x2="610" y2="240" stroke="#38bdf8" strokeWidth="4" />

                {/* Myosin with Cross-Bridges */}
                <rect x="330" y="190" width="150" height="20" rx="4" fill="#f59e0b" />
                <line x1="405" y1="140" x2="405" y2="260" stroke="#d97706" strokeWidth="3" strokeDasharray="4 2" />
                <text x="405" y="280" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">Myosin Thick Filament & M-Line</text>
              </g>

              {/* Sarcomere Span */}
              <line x1="210" y1="330" x2="610" y2="330" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="410" y="350" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontFamily="monospace">Sarcomere Length: 2.2 µm</text>
            </g>
          ) : (
            /* Generic/Default Organ Architectural Relational Matrix */
            <g className="cursor-pointer">
              {/* Central Organ Core */}
              <g onClick={() => setActiveNode('generic-core')}>
                <rect x="300" y="140" width="200" height="150" rx="20" fill="rgba(20, 184, 166, 0.15)" stroke="#14b8a6" strokeWidth="3" filter="url(#glow)" />
                <text x="400" y="210" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">{canonicalName}</text>
                <text x="400" y="235" textAnchor="middle" fill="#2dd4bf" fontSize="11">Parenchymal Core</text>
              </g>

              {/* Arterial Pedicle */}
              <g onClick={() => setActiveNode('generic-artery')}>
                <path d="M 160 170 L 300 170" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                <polygon points="295,165 305,170 295,175" fill="#ef4444" />
                <text x="210" y="155" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="600">Arterial Inflow</text>
              </g>

              {/* Venous Drainage */}
              <g onClick={() => setActiveNode('generic-vein')}>
                <path d="M 300 240 L 160 240" fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
                <polygon points="170,235 160,240 170,245" fill="#3b82f6" />
                <text x="210" y="260" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="600">Venous Drainage</text>
              </g>

              {/* Neural Innervation */}
              <g onClick={() => setActiveNode('generic-nerve')}>
                <path d="M 400 60 L 400 140" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 3" />
                <text x="400" y="50" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="600">Neurovascular Innervation</text>
              </g>

              {/* Lymphatic Efflux */}
              <g onClick={() => setActiveNode('generic-lymph')}>
                <path d="M 500 210 L 640 210" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="4 2" />
                <polygon points="635,205 645,210 635,215" fill="#10b981" />
                <text x="580" y="195" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600">Lymphatic Outflow</text>
              </g>
            </g>
          )}
        </svg>

        {/* Floating Tooltip Callout */}
        {activeInfo && (
          <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:w-80 p-3 rounded-xl bg-slate-900/95 border border-teal-500/40 backdrop-blur-md shadow-2xl text-left animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300">{activeInfo.label}</span>
              {activeInfo.metric && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {activeInfo.metric}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{activeInfo.details}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>Click highlighted structures above to examine their physiological mechanics</span>
        {activeNode && (
          <button
            onClick={() => setActiveNode(null)}
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
};
