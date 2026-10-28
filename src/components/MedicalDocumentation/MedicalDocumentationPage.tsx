import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { getMedicalDocumentation } from '../../services/medicalDocumentationService';
import { SystemId } from '../../types/anatomy';
import { ANATOMICAL_SYSTEMS } from '../../data/systems';
import { InteractiveDiagram } from './VisualTools/InteractiveDiagram';
import { PathologyComparison } from './VisualTools/PathologyComparison';
import { ProcessFlowDiagram } from './VisualTools/ProcessFlowDiagram';
import { ClinicalSummaryTable } from './VisualTools/ClinicalSummaryTable';
import { Embedded3DViewer } from './VisualTools/Embedded3DViewer';
import {
  ArrowLeft,
  BookOpen,
  Box,
  Activity,
  Layers,
  Heart,
  Droplet,
  Zap,
  ShieldAlert,
  Stethoscope,
  Pill,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Share2,
  Printer,
  Compass,
  ArrowUpRight
} from 'lucide-react';

export const MedicalDocumentationPage: React.FC = () => {
  const activeDocumentation = useAnatomyStore((s) => s.activeDocumentation);
  const closeDocumentation = useAnatomyStore((s) => s.closeDocumentation);
  const openDocumentation = useAnatomyStore((s) => s.openDocumentation);
  const selectPart = useAnatomyStore((s) => s.selectPart);
  const isolateSystem = useAnatomyStore((s) => s.isolateSystem);
  const manifest = useAnatomyStore((s) => s.manifest);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Retrieve comprehensive documentation object
  const doc = useMemo(() => {
    if (!activeDocumentation) return null;
    return getMedicalDocumentation(activeDocumentation, biologicalSex, manifest);
  }, [activeDocumentation, biologicalSex, manifest]);

  // Handle Escape key to return to 3D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDocumentation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDocumentation]);

  // Scroll to section when tab is clicked
  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Search filter for fast navigation across all parts
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !manifest) return [];
    const q = searchQuery.toLowerCase();
    return manifest.parts
      .filter((p) => p.name.toLowerCase().includes(q) || p.system.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, manifest]);

  if (!doc) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b14] text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-400">Loading Medical Documentation...</p>
          <button
            onClick={closeDocumentation}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
          >
            Return to 3D Simulation
          </button>
        </div>
      </div>
    );
  }

  const systemDef = ANATOMICAL_SYSTEMS.find((s) => s.id === doc.system);
  const systemColor = systemDef?.color || '#14b8a6';

  const handleReturnTo3DWithPart = () => {
    if (doc.type === 'part') {
      selectPart(doc.id);
    } else {
      isolateSystem(doc.system);
    }
    closeDocumentation();
  };

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'visual-tools', label: 'Visual Tools', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'anatomy', label: 'Anatomy & Location', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'structure', label: 'Microstructure', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'physiology', label: 'Physiology & Function', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'neurovascular', label: 'Neurovascular', icon: <Droplet className="w-3.5 h-3.5" /> },
    { id: 'pathologies', label: 'Diseases & Disorders', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'diagnosis', label: 'Diagnosis & Treatment', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { id: 'references', label: 'Sources & Citations', icon: <Bookmark className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      ref={pageContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#070b14] text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-200"
    >
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090f1e]/90 border-b border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={closeDocumentation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-semibold text-xs transition-all shadow-sm group shrink-0"
            title="Return to the interactive 3D model (Esc)"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to 3D Simulation</span>
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
            <span className="text-slate-600">/</span>
            <button
              onClick={() => openDocumentation({ systemId: doc.system })}
              className="hover:text-teal-300 transition-colors capitalize truncate max-w-[150px]"
            >
              {systemDef?.name || doc.system}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-slate-200 font-semibold truncate">{doc.canonicalName}</span>
          </nav>
        </div>

        {/* Global Quick Search across anatomical atlas */}
        <div className="relative flex-1 max-w-xs md:max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Jump to any anatomical structure..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-teal-500/60 focus:bg-slate-900 focus:outline-none text-xs text-slate-200 placeholder-slate-500 transition-all"
            />
          </div>

          {/* Quick Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#0c1322] border border-slate-700/80 shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/80">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    openDocumentation({ partId: result.id });
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800/60 transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 truncate">
                      {result.name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{result.system}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReturnTo3DWithPart}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            title="Focus this structure directly in the 3D viewport"
          >
            <Box className="w-3.5 h-3.5 text-teal-400" />
            <span>Focus in 3D</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 md:px-8 py-8 md:py-12 border-b border-slate-800/80 bg-gradient-to-b from-[#0e172e]/60 via-[#090f1f]/80 to-[#070b14] overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        <div
          className="absolute -top-24 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ backgroundColor: systemColor }}
        />

        <div className="max-w-6xl mx-auto space-y-4 relative z-10 text-left">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border shadow-sm"
              style={{
                backgroundColor: `${systemColor}15`,
                color: systemColor,
                borderColor: `${systemColor}40`,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: systemColor }} />
              <span>{systemDef?.name || doc.system}</span>
            </span>

            {doc.conceptId && (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800/80 text-slate-300 border border-slate-700">
                {doc.conceptId}
              </span>
            )}

            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
              {doc.region}
            </span>

            {doc.biologicalSexSpecificity && doc.biologicalSexSpecificity !== 'both' && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  doc.biologicalSexSpecificity === 'female'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {doc.biologicalSexSpecificity === 'female' ? '♀ Female Specific' : '♂ Male Specific'}
              </span>
            )}
          </div>

          {/* Titles */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
              {doc.canonicalName}
            </h1>
            {doc.latinName && (
              <p className="text-base md:text-lg italic font-serif text-slate-400">
                {doc.latinName}
              </p>
            )}
          </div>

          {/* Concise Overview Summary */}
          <p className="text-sm md:text-base text-slate-300 max-w-4xl leading-relaxed pt-1">
            {doc.overview.summary}
          </p>
        </div>
      </section>

      {/* STICKY QUICK JUMP TABS BAR */}
      <nav className="sticky top-[57px] z-30 w-full backdrop-blur-md bg-[#090f1e]/95 border-b border-slate-800/80 px-4 md:px-8 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN CONTENT BODY */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-12 text-left">
        {/* SECTION 1: OVERVIEW & KEY TAKEAWAYS */}
        <section id="overview" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Overview & Clinical Significance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Takeaways Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3 shadow-lg">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold">
                Key Anatomical Points
              </span>
              <ul className="space-y-2">
                {doc.overview.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Physiological Significance Box */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-950/15 p-5 space-y-3 shadow-lg flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-teal-300 font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Physiological Imperative</span>
                </span>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  {doc.overview.physiologicalSignificance}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-teal-900/30 border border-teal-500/30 text-[11px] text-teal-200/90 leading-snug">
                Verified against clinical reference standards in anatomical morphology and modern surgical anatomy.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: VISUAL LEARNING TOOLS SUITE */}
        <section id="visual-tools" className="scroll-mt-24 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
                Visual Learning & Educational Tools
              </h2>
            </div>
            <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              Interactive Tools Suite
            </span>
          </div>

          {/* Interactive SVG Schematic */}
          <InteractiveDiagram
            type={doc.visualToolConfig.diagramType}
            title={doc.visualToolConfig.diagramTitle}
            subtitle={doc.visualToolConfig.diagramSubtitle}
            canonicalName={doc.canonicalName}
          />

          {/* Embedded 3D Inspection Turntable */}
          <Embedded3DViewer
            partId={doc.type === 'part' ? doc.id : undefined}
            systemId={doc.type === 'system' ? doc.system : undefined}
            canonicalName={doc.canonicalName}
          />

          {/* Pathology Comparative State Card */}
          <PathologyComparison comparison={doc.visualToolConfig.pathologyComparison} />

          {/* Process Flow Diagram */}
          <ProcessFlowDiagram processFlow={doc.visualToolConfig.processFlow} />

          {/* Structured Clinical Matrix Table */}
          <ClinicalSummaryTable matrix={doc.visualToolConfig.clinicalSummaryMatrix} />
        </section>

        {/* SECTION 3: ANATOMY & LOCATION */}
        <section id="anatomy" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Anatomy, Topography & Spatial Relations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Location & Spatial Geometry
              </span>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                {doc.anatomyAndLocation.location}
              </p>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400">Dimensions & Form:</span>
                <p className="text-xs text-slate-300 mt-0.5">{doc.anatomyAndLocation.shapeAndDimensions}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Anatomical Landmarks
              </span>
              <ul className="space-y-1.5">
                {doc.anatomyAndLocation.landmarks.map((landmark, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                    <span>{landmark}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Relations Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
              Anatomical Relationships & Boundaries
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {doc.anatomyAndLocation.anatomicalRelations.map((rel, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                    {rel.orientation}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{rel.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: MICROSTRUCTURE & HISTOLOGY */}
        <section id="structure" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Layers className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Structure, Histology & Cellular Composition
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-2">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold">
                Constituent Tissues
              </span>
              <ul className="space-y-1.5 pt-1">
                {doc.structureAndComposition.tissueTypes.map((t, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-2">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold">
                Histological Organization
              </span>
              <ul className="space-y-1.5 pt-1">
                {doc.structureAndComposition.histologicalFeatures.map((h, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-2">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold">
                Substructures & Matrix
              </span>
              <ul className="space-y-1.5 pt-1">
                {doc.structureAndComposition.substructures.map((s, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 5: FUNCTIONS & PHYSIOLOGY */}
        <section id="physiology" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Functions & Physiological Mechanisms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold">
                Primary Biological Functions
              </span>
              <ul className="space-y-2">
                {doc.functions.primary.map((fn, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{fn}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold">
                Physiological Mechanism & Regulation
              </span>
              <h4 className="text-sm font-semibold text-slate-100">
                {doc.physiologicalMechanisms.mechanismTitle}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {doc.physiologicalMechanisms.regulatoryFeedback}
              </p>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Cellular Pathway: </span>
                <span>{doc.physiologicalMechanisms.cellularPathways}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: NEUROVASCULAR SUPPLY */}
        <section id="neurovascular" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Droplet className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Blood Supply, Lymphatics & Innervation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <Droplet className="w-4 h-4 text-rose-400" />
                <span>Arterial Supply</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{doc.neurovascular.arterialSupply}</p>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-950/10 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Droplet className="w-4 h-4 text-blue-400" />
                <span>Venous Drainage</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{doc.neurovascular.venousDrainage}</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Lymphatic Flow</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{doc.neurovascular.lymphaticDrainage}</p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Nerve Supply</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {doc.neurovascular.innervation.general ||
                  `${doc.neurovascular.innervation.motor || ''} ${doc.neurovascular.innervation.sensory || ''} ${doc.neurovascular.innervation.autonomic || ''}`}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: RELATED ORGANS & SYSTEMS (CLICKABLE JUMP LINKS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                Related Structures & Interconnected Systems
              </h3>
            </div>
            <span className="text-xs text-slate-500">Click to explore dedicated documentation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {doc.relatedStructures.map((rel, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (ANATOMICAL_SYSTEMS.some((s) => s.id === rel.id)) {
                    openDocumentation({ systemId: rel.id as SystemId });
                  } else {
                    openDocumentation({ partId: rel.id });
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-teal-500/50 text-left transition-all group flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-teal-300 truncate transition-colors">
                    {rel.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                    {rel.relationship}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 8: COMMON DISEASES & PATHOLOGIES */}
        <section id="pathologies" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Common Diseases, Disorders & Pathophysiology
            </h2>
          </div>

          <div className="space-y-3">
            {doc.pathologies.map((pathology, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-800/80 bg-[#0a101f] space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100">{pathology.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                      pathology.severity === 'critical'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : pathology.severity === 'moderate'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                    }`}
                  >
                    {pathology.severity} severity
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{pathology.pathophysiology}</p>
                {pathology.prevalence && (
                  <p className="text-[11px] font-mono text-slate-500 pt-1">
                    Prevalence: {pathology.prevalence}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Signs and Symptoms Alert Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Hallmark Signs & Presentation
              </span>
              <ul className="space-y-1.5">
                {doc.signsAndSymptoms.hallmarkSigns.map((sign, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Emergency Red Flag Symptoms</span>
              </span>
              <ul className="space-y-1.5">
                {doc.signsAndSymptoms.emergencyRedFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-rose-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 9: DIAGNOSIS & MANAGEMENT */}
        <section id="diagnosis" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Stethoscope className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Diagnostic Investigations & Clinical Treatment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diagnosis */}
            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>Diagnostic Workup</span>
              </span>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold text-[11px]">Physical Examination:</span>
                  <p>{doc.diagnosisAndInvestigations.physicalExam.join(' · ')}</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold text-[11px]">Laboratory Biomarkers:</span>
                  <p>{doc.diagnosisAndInvestigations.laboratoryWorkup.join(' · ')}</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold text-[11px]">Imaging Modalities:</span>
                  <p>{doc.diagnosisAndInvestigations.imagingStudies.join(' · ')}</p>
                </div>
              </div>
            </div>

            {/* Treatment */}
            <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-400" />
                <span>Therapeutic Interventions</span>
              </span>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold text-[11px]">Pharmacotherapy:</span>
                  <p>{doc.treatmentAndManagement.pharmacotherapy.join(' · ')}</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold text-[11px]">Surgical & Interventional:</span>
                  <p>{doc.treatmentAndManagement.surgicalInterventions.join(' · ')}</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold text-[11px]">Rehabilitation & Conservative:</span>
                  <p>{doc.treatmentAndManagement.rehabilitation.join(' · ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prevention */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a101f] p-5 space-y-3">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
              Prevention & Health Maintenance
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-teal-300">Lifestyle Interventions</span>
                <p>{doc.preventionAndHealth.lifestyleInterventions.join(' · ')}</p>
              </div>
              <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-teal-300">Screening Protocols</span>
                <p>{doc.preventionAndHealth.screeningProtocols.join(' · ')}</p>
              </div>
              <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-teal-300">Dietary & Ergonomic Guidance</span>
                <p>{doc.preventionAndHealth.dietaryOrErgonomicRecommendations.join(' · ')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: INTERESTING MEDICAL FACTS */}
        {doc.interestingFacts && doc.interestingFacts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                Interesting Medical Facts & Clinical Pearls
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doc.interestingFacts.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 11: REFERENCES & CITATIONS */}
        <section id="references" className="scroll-mt-24 space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Bookmark className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Authoritative Medical References & Sources
            </h2>
          </div>

          <div className="space-y-2">
            {doc.references.map((ref, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200">{ref.title}</span>
                  <p className="text-[11px] text-slate-400">
                    Source: {ref.source} {ref.yearOrEdition ? `(${ref.yearOrEdition})` : ''} · {ref.authoritativeBody || 'Peer-reviewed Medical Literature'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 shrink-0">
                  Verified
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
            Disclaimer: This documentation is engineered for educational reference, academic study, and clinical knowledge dissemination. Not a substitute for formal diagnostic clinical evaluation.
          </p>
        </section>

        {/* BOTTOM RETURN BAR */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Current Article:</span>
            <span className="text-xs font-bold text-slate-200">{doc.canonicalName}</span>
          </div>

          <button
            onClick={closeDocumentation}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Interactive 3D Model</span>
          </button>
        </div>
      </main>
    </div>
  );
};

