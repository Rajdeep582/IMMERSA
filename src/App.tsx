import React, { useEffect } from 'react';
import { useAnatomyStore } from './store/useAnatomyStore';
import { fetchManifest } from './services/modelLoader';
import { ADDITIONAL_PARTS } from './data/anatomyCatalog';
import { Header } from './components/Header/Header';
import { MainViewport } from './components/MainViewport/MainViewport';
import { LayerPanel } from './components/LayerPanel/LayerPanel';
import { InfoPanel } from './components/InfoPanel/InfoPanel';
import { FloatingToolbar } from './components/Toolbar/FloatingToolbar';
import { GuidedTourOverlay } from './components/GuidedTour/GuidedTourOverlay';
import { SearchModal } from './components/SearchModal/SearchModal';
import { InspectModal } from './components/InspectionViewport/InspectModal';
import { MedicalDocumentationPage } from './components/MedicalDocumentation/MedicalDocumentationPage';

export const App: React.FC = () => {
  const setManifest = useAnatomyStore((s) => s.setManifest);
  const setError = useAnatomyStore((s) => s.setError);
  const setSearchOpen = useAnatomyStore((s) => s.setSearchOpen);
  const setActiveView = useAnatomyStore((s) => s.setActiveView);
  const triggerResetCamera = useAnatomyStore((s) => s.triggerResetCamera);
  const triggerZoomIn = useAnatomyStore((s) => s.triggerZoomIn);
  const triggerZoomOut = useAnatomyStore((s) => s.triggerZoomOut);
  const error = useAnatomyStore((s) => s.error);
  const activeDocumentation = useAnatomyStore((s) => s.activeDocumentation);

  // Initialize anatomical atlas manifest on mount
  useEffect(() => {
    fetchManifest()
      .then((data) => {
        // The host atlas is male-only; append curated female pelvic/external
        // anatomy and the missing male scrotum/meatus without duplicating IDs.
        const existing = new Set(data.parts.map((part) => part.id));
        const additions = ADDITIONAL_PARTS.filter((part) => !existing.has(part.id));
        setManifest({ ...data, parts: [...data.parts, ...additions] });
      })
      .catch((err) => {
        console.error('Failed to load anatomical atlas:', err);
        setError('Failed to load anatomical atlas. Please check your network and refresh.');
      });
  }, [setManifest, setError]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'r' || e.key === 'R') {
        triggerResetCamera();
      } else if (e.key === '+' || e.key === '=') {
        triggerZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        triggerZoomOut();
      } else if (e.key === '1') {
        setActiveView('anterior');
      } else if (e.key === '2') {
        setActiveView('posterior');
      } else if (e.key === '3') {
        setActiveView('left');
      } else if (e.key === '4') {
        setActiveView('right');
      } else if (e.key === '5') {
        setActiveView('superior');
      } else if (e.key === '6') {
        setActiveView('isometric');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen, triggerResetCamera, setActiveView]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d19] text-slate-100 font-sans select-none">
      {/* Top Header */}
      <Header />

      {/* Main 3D Viewport Canvas */}
      <main className="absolute top-16 left-0 right-0 bottom-0 z-0 overflow-hidden">
        <MainViewport />
      </main>

      {/* Left Layer Control Panel */}
      <div className="fixed top-20 left-4 z-20">
        <LayerPanel />
      </div>

      {/* Right Contextual Anatomical Inspector / Mobile Bottom Sheet */}
      <div className="fixed bottom-0 md:bottom-auto md:top-20 right-0 z-20 max-md:left-0 pointer-events-none [&>*]:pointer-events-auto">
        <InfoPanel />
      </div>

      {/* Bottom Floating Perspectives Toolbar */}
      <FloatingToolbar />

      {/* Guided Scrollytelling Overlay */}
      <GuidedTourOverlay />

      {/* Global Search Dialog */}
      <SearchModal />

      {/* Fullscreen 3D Structure Inspection Modal */}
      <InspectModal />

      {/* Dedicated Comprehensive Medical Documentation Page */}
      {activeDocumentation && <MedicalDocumentationPage />}

      {/* Global Error Banner */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-2xl flex items-center gap-3">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default App;

