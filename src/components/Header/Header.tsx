import React, { useState } from 'react';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { GUIDED_TOURS } from '../../data/guidedTours';
import {
  Compass,
  Search,
  RotateCcw,
  Info,
  ChevronDown,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const Header: React.FC = () => {
  const setSearchOpen = useAnatomyStore((s) => s.setSearchOpen);
  const triggerResetCamera = useAnatomyStore((s) => s.triggerResetCamera);
  const startTour = useAnatomyStore((s) => s.startTour);
  const activeTour = useAnatomyStore((s) => s.activeTour);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);
  const setBiologicalSex = useAnatomyStore((s) => s.setBiologicalSex);
  const [showToursDropdown, setShowToursDropdown] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const female = biologicalSex === 'female';

  return (
    <>
      <header className="ui-interactive-surface fixed top-0 left-0 right-0 h-16 bg-[#080d19]/85 backdrop-blur-xl border-b border-slate-800/80 px-3 md:px-5 flex items-center justify-between gap-3 z-30 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
            <span className="text-slate-950 font-black text-sm tracking-tighter">IM</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-bold tracking-[0.16em] text-slate-100 flex items-center gap-2">
              IMMERSA
              <span className="hidden sm:inline text-[8px] px-1.5 py-0.5 rounded font-mono font-medium tracking-normal bg-teal-500/15 text-teal-300 border border-teal-500/30">
                3D ANATOMY
              </span>
            </h1>
            <p className="text-[9px] text-slate-500 font-medium tracking-tight hidden md:block">
              Interactive human anatomy · medical education reference
            </p>
          </div>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-slate-400 hover:text-slate-200 transition-all shadow-inner w-52 lg:w-80 justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">Search structures or FMA IDs…</span>
          </span>
          <kbd className="hidden lg:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
            /
          </kbd>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
            title="Search anatomy"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-700/60 shadow-inner" role="group" aria-label="Reference model">
            <button
              onClick={() => setBiologicalSex('male')}
              aria-pressed={!female}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                !female
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Male reference model"
            >
              <span className="text-sm leading-none font-bold">♂</span>
              <span className="hidden sm:inline">Male</span>
            </button>
            <button
              onClick={() => setBiologicalSex('female')}
              aria-pressed={female}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                female
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Female reference model"
            >
              <span className="text-sm leading-none font-bold">♀</span>
              <span className="hidden sm:inline">Female</span>
            </button>
          </div>

          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowToursDropdown(!showToursDropdown)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${
                activeTour
                  ? 'bg-teal-500 text-slate-950 font-semibold border-teal-400'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/60'
              }`}
              title="Guided anatomical journeys"
            >
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden lg:inline">Guided journeys</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showToursDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0c1220]/97 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-left">
                <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-teal-400 border-b border-slate-800/80 mb-1">
                  Guided anatomical journeys
                </div>
                {GUIDED_TOURS.map((tour) => (
                  <button
                    key={tour.id}
                    onClick={() => {
                      startTour(tour.id);
                      setShowToursDropdown(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/70 transition-colors group"
                  >
                    <p className="text-[11px] font-semibold text-slate-200 group-hover:text-teal-300">
                      {tour.title}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{tour.shortDesc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={triggerResetCamera}
            className="hidden sm:flex p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"
            title="Reset perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAbout(true)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-teal-300 border border-slate-700/60 transition-colors"
            title="Scientific provenance and references"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-[#0c1220]/97 border border-slate-700 rounded-2xl p-5 md:p-6 shadow-2xl text-left text-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" />
                Scientific references & provenance
              </h3>
              <button onClick={() => setShowAbout(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-slate-300 space-y-3 leading-relaxed">
              <p>
                <b>IMMERSA</b> is an educational 3D anatomy explorer. Male reference geometry is derived from{' '}
                <b>BodyParts3D 4.0</b> by the Database Center for Life Science (DBCLS), Japan, licensed under CC BY
                4.0. The dataset is an adult male reference built from TARO MRI and anatomical illustration.
              </p>

              <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[10px] uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Female reference model
                </div>
                <p className="text-[10px] text-amber-100/80">
                  The female model is an <b>educational reference assembly</b>: the shared body mesh is transformed
                  with anthropometric female proportions and combined with explicitly modelled female pelvic viscera
                  and external genitalia. It is not a female cadaveric scan, and the skeletal and muscular templates
                  retain male-reference coverage. Female pelvic anatomy should be verified against the cited
                  references and is not intended for diagnosis.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-[10px]">
                <a
                  href="https://openstax.org/books/anatomy-and-physiology-2e/pages/27-1-anatomy-and-physiology-of-the-male-reproductive-system"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/70"
                >
                  OpenStax A&P 2e — Male reproductive
                  <ExternalLink className="w-3 h-3 text-teal-400" />
                </a>
                <a
                  href="https://openstax.org/books/anatomy-and-physiology-2e/pages/27-2-anatomy-and-physiology-of-the-female-reproductive-system"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/70"
                >
                  OpenStax A&P 2e — Female reproductive
                  <ExternalLink className="w-3 h-3 text-teal-400" />
                </a>
                <a
                  href="https://www.merckmanuals.com/home/men-s-health-issues/biology-of-the-male-reproductive-system/structure-of-the-male-reproductive-system"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/70"
                >
                  Merck Manual — Male reproductive system
                  <ExternalLink className="w-3 h-3 text-teal-400" />
                </a>
                <a
                  href="https://my.clevelandclinic.org/health/articles/9118-female-reproductive-system"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/70"
                >
                  Cleveland Clinic — Female reproductive system
                  <ExternalLink className="w-3 h-3 text-teal-400" />
                </a>
                <a
                  href="https://my.clevelandclinic.org/health/body/vulva"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/70"
                >
                  Cleveland Clinic — Vulva anatomy
                  <ExternalLink className="w-3 h-3 text-teal-400" />
                </a>
                <a
                  href="https://www.nlm.nih.gov/research/visible/visible_human.html"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/70"
                >
                  NLM Visible Human Project
                  <ExternalLink className="w-3 h-3 text-teal-400" />
                </a>
              </div>

              <p className="text-[10px] text-slate-500">
                Terminology follows Terminologia Anatomica (TA2) and the Foundational Model of Anatomy (FMA). Named
                structures are cross-linked to FMA identifiers where the source provides them. The interface is an
                educational visualization, not a medical device.
              </p>
            </div>

            <div className="pt-1 text-right">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-[11px] hover:bg-teal-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
