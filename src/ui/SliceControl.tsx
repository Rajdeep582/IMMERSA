import { Focus, Rows3, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Registry } from '../data/registry';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';

const COUNTS = [6, 10, 16, 24];

/**
 * Slice dissection control. No selection: the whole visible body is cut into vertical (sagittal)
 * slabs that spread apart sideways. With a selection: only that structure is cut, the rest of the body is ghosted.
 */
export function SliceControl({ registry, variant, onClose }: { registry: Registry; variant: 'in-panel' | 'dock'; onClose?: () => void }) {
  const amount = useApp((s) => s.explode);
  const setAmount = useApp((s) => s.setExplode);
  const count = useApp((s) => s.sliceCount);
  const setCount = useApp((s) => s.setSliceCount);
  const selectedId = useApp((s) => s.selectedId);
  const rec = registry.get(selectedId);
  const wasActive = useRef(amount > 0.001);
  const frameTimer = useRef(0);

  // Frame the separated slabs: tilt down on the first opening, refit after each adjustment.
  const scheduleFrame = (elevate: boolean, delay = 260) => {
    window.clearTimeout(frameTimer.current);
    frameTimer.current = window.setTimeout(() => viewer.frameSlices(elevate), delay);
  };
  useEffect(() => () => window.clearTimeout(frameTimer.current), []);
  // A new selection during dissection becomes the sliced part: refit once its meshes are in.
  useEffect(() => {
    if (useApp.getState().explode > 0.001) scheduleFrame(true, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const onAmount = (v: number) => {
    const opening = !wasActive.current && v > 0.001;
    wasActive.current = v > 0.001;
    setAmount(v);
    if (v > 0.001) scheduleFrame(opening, opening ? 120 : 420);
  };
  const reset = () => {
    wasActive.current = false;
    setAmount(0);
    if (rec) viewer.focus(rec.id);
    else viewer.fullBody();
  };
  const active = amount > 0.001;
  const pct = Math.round(amount * 100);

  return (
    <section className={`slicer ${variant} ${active ? 'active' : ''}`} aria-label="Slice dissection">
      <div className="slicer-head">
        <span className="slicer-icon" aria-hidden>
          <Rows3 size={16} />
        </span>
        <div className="slicer-title">
          <strong>Slice dissection</strong>
          <span>{rec ? <>Cutting <b>{rec.name}</b> · rest of body ghosted</> : <>Whole body into vertical slabs · select a part to slice only it</>}</span>
        </div>
        {onClose && (
          <button className="icon-btn xs ghost" onClick={onClose} aria-label="Close slice dissection">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="slicer-row">
        <label htmlFor={`slice-${variant}`}>Separate</label>
        <input
          id={`slice-${variant}`}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={amount}
          onChange={(e) => onAmount(Number(e.target.value))}
          style={{ ['--v' as string]: `${pct}%` }}
          aria-valuetext={`${pct}%`}
        />
        <span className="slicer-val mono">{pct}%</span>
      </div>
      <div className="slicer-row">
        <span className="slicer-lbl">Slices</span>
        <div className="slicer-seg" role="radiogroup" aria-label="Number of slices">
          {COUNTS.map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={count === n}
              className={count === n ? 'on' : ''}
              onClick={() => {
                setCount(n);
                if (active) scheduleFrame(false, 300);
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <button className="icon-btn sm" onClick={() => (active ? viewer.frameSlices(true) : rec ? viewer.focus(rec.id) : viewer.fullBody())} aria-label="Frame slices" title="Fit the slices in view">
          <Focus size={14} />
        </button>
        <button className="icon-btn sm" onClick={reset} disabled={!active} aria-label="Close slices" title="Put the slices back together">
          <RotateCcw size={14} />
        </button>
      </div>
      {active && <p className="slicer-note">Cut study view — slabs are moved apart from their anatomical position. Click a slab to select that structure and dissect it on its own.</p>}
    </section>
  );
}
