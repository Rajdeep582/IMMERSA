import { ChevronDown, ChevronUp, Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { Registry } from '../data/registry';
import type { SystemOpacity } from '../data/systems';
import type { BodyModel } from '../data/types';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';
import { JOURNEYS, resolveJourney, sampleJourney, type ResolvedStage } from './journeys';

interface Snapshot {
  opacity: SystemOpacity;
  isolate: ReturnType<typeof useApp.getState>['isolate'];
  selectedId: string | null;
}

/** Journey picker shown when guided mode is requested but no journey is chosen yet. */
export function JourneyPicker({ model, onPick, onClose }: { model: BodyModel; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <div className="journey-picker" role="dialog" aria-label="Choose a guided journey">
      <div className="jp-head">
        <span>Guided journeys</span>
        <button className="icon-btn xs ghost" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      </div>
      {JOURNEYS.filter((j) => j.model === model).map((j) => (
        <button key={j.id} className="jp-item" onClick={() => onPick(j.id)}>
          <Play size={14} />
          <span>
            <b>{j.title}</b>
            <span className="muted small">{j.blurb}</span>
          </span>
        </button>
      ))}
      <p className="muted small">Scroll the story panel (or use ↑ ↓) to move through each journey. Drag the model at any time to explore freely.</p>
    </div>
  );
}

/**
 * Scroll-scrubbed anatomical journey. Scroll position inside this panel (never the page) maps to
 * continuous stage progress; the camera follows with damping, so reversing scroll reverses the
 * motion and the user can interrupt at any time by manipulating the model.
 */
export function GuidedPanel({ registry, onExit }: { registry: Registry; onExit: () => void }) {
  const guided = useApp((s) => s.guided)!;
  const journey = JOURNEYS.find((j) => j.id === guided.journeyId && j.model === registry.model) ?? JOURNEYS.find((j) => j.model === registry.model)!;
  const scroller = useRef<HTMLDivElement>(null);
  const snapshot = useRef<Snapshot | null>(null);
  const lastIndex = useRef(-1);
  const stages = useMemo<ResolvedStage[] | null>(() => (viewer.rig ? resolveJourney(registry, journey, viewer.rig.camera) : null), [registry, journey]);

  // Save and restore the user's own layer state around the journey.
  useEffect(() => {
    const s = useApp.getState();
    snapshot.current = { opacity: s.opacity, isolate: s.isolate, selectedId: s.selectedId };
    return () => {
      const snap = snapshot.current;
      if (snap) {
        const st = useApp.getState();
        st.setOpacities(snap.opacity);
        st.setIsolate(snap.isolate);
      }
    };
  }, [journey.id]);

  // Drive camera + layers from progress.
  useEffect(() => {
    if (!stages) return;
    const apply = (p: number, following: boolean) => {
      const smp = sampleJourney(stages, p);
      const st = useApp.getState();
      st.setOpacities(smp.opacity);
      if (smp.index !== lastIndex.current) {
        lastIndex.current = smp.index;
        st.setIsolate(smp.stage.ghostId ? { id: smp.stage.ghostId, mode: 'ghost' } : null);
        st.select(smp.stage.select ? smp.stage.focusId : null);
      }
      if (following) {
        viewer.rig?.follow(smp.pose, 0.2);
        viewer.invalidate();
      }
    };
    apply(guided.progress, guided.following);
    return useApp.subscribe((s, prev) => {
      if (!s.guided) return;
      if (s.guided.progress !== prev.guided?.progress || (s.guided.following && !prev.guided?.following)) apply(s.guided.progress, s.guided.following);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const h = el.clientHeight;
    const p = el.scrollTop / Math.max(1, h * 0.8);
    useApp.getState().patchGuided({ progress: Math.min(journey.stages.length - 1, p), following: true });
  };

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: i * el.clientHeight * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    useApp.getState().patchGuided({ following: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const idx = Math.round(useApp.getState().guided?.progress ?? 0);
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(Math.min(journey.stages.length - 1, idx + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(Math.max(0, idx - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.id]);

  const idx = Math.round(guided.progress);
  return (
    <aside className="guided" aria-label={`Guided journey: ${journey.title}`}>
      <div className="guided-head">
        <div>
          <div className="kicker">Journey</div>
          <div className="g-title">{journey.title}</div>
        </div>
        <button className="icon-btn sm" onClick={onExit} aria-label="Exit journey">
          <X size={15} />
        </button>
      </div>
      <div className="g-progress" aria-hidden>
        <div style={{ width: `${(guided.progress / Math.max(1, journey.stages.length - 1)) * 100}%` }} />
      </div>
      <div className="guided-scroll" ref={scroller} onScroll={onScroll} tabIndex={0} aria-label="Scroll to progress through the journey">
        {journey.stages.map((s, i) => (
          <section key={s.title} className={`g-stage ${i === idx ? 'cur' : ''}`} aria-current={i === idx ? 'step' : undefined}>
            <div className="g-step mono">
              {String(i + 1).padStart(2, '0')} / {String(journey.stages.length).padStart(2, '0')}
            </div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </section>
        ))}
        <div className="g-tail" />
      </div>
      <div className="guided-foot">
        <button className="icon-btn sm" onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0} aria-label="Previous stage">
          <ChevronUp size={15} />
        </button>
        <button className="icon-btn sm" onClick={() => goTo(Math.min(journey.stages.length - 1, idx + 1))} disabled={idx >= journey.stages.length - 1} aria-label="Next stage">
          <ChevronDown size={15} />
        </button>
        {!guided.following ? (
          <button className="chip gold" onClick={() => useApp.getState().patchGuided({ following: true })}>
            Resume journey camera
          </button>
        ) : (
          <span className="muted small">Scroll here · drag model to explore</span>
        )}
      </div>
    </aside>
  );
}
