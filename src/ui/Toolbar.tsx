import { Compass, Hand, Home, Maximize, Minus, Plus, Route, Rows3, ScanLine, Tags } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { STANDARD_VIEWS } from '../engine/cameraRig';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';

export function Toolbar({ onGuided }: { onGuided: () => void }) {
  const [viewsOpen, setViewsOpen] = useState(false);
  const guided = useApp((s) => s.guided);
  const panMode = useApp((s) => s.panMode);
  const setPanMode = useApp((s) => s.setPanMode);
  const labels = useApp((s) => s.labels);
  const setLabels = useApp((s) => s.setLabels);
  const setImmersive = useApp((s) => s.setImmersive);
  const sliceOpen = useApp((s) => s.sliceOpen);
  const slicing = useApp((s) => s.explode > 0.001);
  const setSliceOpen = useApp((s) => s.setSliceOpen);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!viewsOpen) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setViewsOpen(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [viewsOpen]);
  return (
    <div className="toolbar" role="toolbar" aria-label="Camera controls" ref={ref}>
      <button className="icon-btn" onClick={() => viewer.zoom(0.7)} aria-label="Zoom in" title="Zoom in (+)">
        <Plus size={17} />
      </button>
      <button className="icon-btn" onClick={() => viewer.zoom(1 / 0.7)} aria-label="Zoom out" title="Zoom out (−)">
        <Minus size={17} />
      </button>
      <button className={`icon-btn ${panMode ? 'on' : ''}`} onClick={() => setPanMode(!panMode)} aria-pressed={panMode} aria-label="Pan mode" title={panMode ? 'Pan mode on: drag moves the model in any direction (click to return to rotate)' : 'Pan mode: drag to move the model in any direction'}>
        <Hand size={17} />
      </button>
      <button className={`icon-btn ${labels ? 'on' : ''}`} onClick={() => setLabels(!labels)} aria-pressed={labels} aria-label="Labels" title={labels ? 'Hide structure labels (L)' : 'Show structure labels (L)'}>
        <Tags size={17} />
      </button>
      <span className="tb-sep" />
      <button className="icon-btn" onClick={() => viewer.fullBody()} aria-label="Full body" title="Full body, keep angle">
        <ScanLine size={17} />
      </button>
      <button className="icon-btn" onClick={() => viewer.home()} aria-label="Reset camera" title="Reset camera (H)">
        <Home size={17} />
      </button>
      <div className="views">
        <button className={`icon-btn ${viewsOpen ? 'on' : ''}`} onClick={() => setViewsOpen((v) => !v)} aria-expanded={viewsOpen} aria-haspopup="menu" aria-label="Standard views" title="Standard views (1–6)">
          <Compass size={17} />
        </button>
        {viewsOpen && (
          <div className="menu" role="menu">
            {STANDARD_VIEWS.map((v) => (
              <button
                key={v.id}
                role="menuitem"
                onClick={() => {
                  viewer.standardView(v.id);
                  setViewsOpen(false);
                }}
              >
                <span>{v.label}</span>
                <kbd className="kbd">{v.key}</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="icon-btn" onClick={() => setImmersive(true)} aria-label="Model-only view" title="Model-only view (or click empty space)">
        <Maximize size={16} />
      </button>
      <span className="tb-sep" />
      <button className={`tb-text slice-btn ${sliceOpen || slicing ? 'on' : ''}`} onClick={() => setSliceOpen(!sliceOpen)} aria-pressed={sliceOpen} title="Slice dissection: cut the body (or the selected part) into vertical slabs">
        <Rows3 size={16} />
        <span>Slice</span>
      </button>
      <button className={`tb-text ${guided ? 'on' : ''}`} onClick={onGuided} aria-pressed={!!guided} title="Guided anatomical journeys (G)">
        <Route size={16} />
        <span>{guided ? 'Exit journey' : 'Journeys'}</span>
      </button>
    </div>
  );
}
