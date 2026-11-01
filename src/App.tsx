import { BookOpen, GraduationCap, Layers, ListTree, X, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { loadRegistry, mapSelection, type Registry } from './data/registry';
import type { BodyModel } from './data/types';
import { BodyToggle } from './ui/BodyToggle';
import { detectQuality, webgl2Available } from './engine/quality';
import { STANDARD_VIEWS } from './engine/cameraRig';
import { viewer } from './engine/viewer';
import { GuidedPanel, JourneyPicker } from './guided/GuidedPanel';
import { MainViewport } from './scene/MainViewport';
import { useApp } from './state/store';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { ImmersiveBar } from './ui/ImmersiveBar';
import { ExploreTree } from './ui/ExploreTree';
import { InspectorPanel } from './ui/InspectorPanel';
import { LayersPanel } from './ui/LayersPanel';
import { HintToast, HoverLabel, LoadingVeil, SelectionPin, StatsOverlay } from './ui/Overlays';
import { Search } from './ui/Search';
import { SourcesPanel } from './ui/SourcesPanel';
import { Toolbar } from './ui/Toolbar';
import { SliceControl } from './ui/SliceControl';
import { useLayout } from './ui/layout';
import { LearnPage } from './learn/LearnPage';
import { getRoute, openLearn, useRoute } from './learn/route';

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (getRoute().view === 'learn') return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const st = useApp.getState();
      const rig = viewer.rig;
      const v = STANDARD_VIEWS.find((x) => x.key === e.key);
      if (v) return viewer.standardView(v.id);
      switch (e.key) {
        case 'h':
        case 'H':
          return viewer.home();
        case 'f':
        case 'F':
          if (st.selectedId) viewer.focus(st.selectedId);
          return;
        case 'i':
        case 'I':
          if (st.selectedId) st.setInspectorOpen(!st.inspectorOpen);
          return;
        case 'g':
        case 'G':
          return window.dispatchEvent(new Event('immersa:guided'));
        case 'p':
        case 'P':
          return st.toggleStats();
        case '+':
        case '=':
          return viewer.zoom(0.75);
        case '-':
        case '_':
          return viewer.zoom(1 / 0.75);
        case 'Escape':
          if (st.immersive) st.setImmersive(false);
          else if (st.isolate) st.setIsolate(null);
          else st.select(null);
          return;
      }
      if (!rig || st.guided) return;
      const step = e.shiftKey ? 40 : 0;
      if (e.key === 'ArrowLeft') step ? rig.pan(-step, 0, 600) : rig.rotate(-28, 0, 600);
      else if (e.key === 'ArrowRight') step ? rig.pan(step, 0, 600) : rig.rotate(28, 0, 600);
      else if (e.key === 'ArrowUp') step ? rig.pan(0, -step, 600) : rig.rotate(0, -22, 600);
      else if (e.key === 'ArrowDown') step ? rig.pan(0, step, 600) : rig.rotate(0, 22, 600);
      else return;
      e.preventDefault();
      viewer.invalidate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function LeftPanel({ registry, onPicked }: { registry: Registry; onPicked?: () => void }) {
  const tab = useApp((s) => s.leftTab);
  const setTab = useApp((s) => s.setLeftTab);
  return (
    <>
      <div className="tabs" role="tablist">
        {(
          [
            ['layers', 'Layers', Layers],
            ['explore', 'Explore', ListTree],
            ['sources', 'Sources', BookOpen],
          ] as const
        ).map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      <div className="panel-scroll" role="tabpanel" onClick={(e) => onPicked && (e.target as HTMLElement).closest('.tree-label') && onPicked()}>
        {tab === 'layers' && <LayersPanel registry={registry} />}
        {tab === 'explore' && <ExploreTree registry={registry} />}
        {tab === 'sources' && <SourcesPanel registry={registry} />}
      </div>
    </>
  );
}

export function App() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [sheet, setSheet] = useState<'none' | 'left' | 'info'>('none');
  const quality = useMemo(() => detectQuality(), []);
  const hasGL = useMemo(() => webgl2Available(), []);
  const layout = useLayout();
  const mobile = layout.kind === 'phone';
  const leftOpen = useApp((s) => s.leftOpen);
  const rightOpen = useApp((s) => s.rightOpen);
  const setLeftOpen = useApp((s) => s.setLeftOpen);
  const setRightOpen = useApp((s) => s.setRightOpen);
  const guided = useApp((s) => s.guided);
  const selectedId = useApp((s) => s.selectedId);
  const immersive = useApp((s) => s.immersive);
  const sliceOpen = useApp((s) => s.sliceOpen);
  const route = useRoute();
  const learning = route.view === 'learn';
  useKeyboard();

  useEffect(() => {
    useApp.getState().setTier(quality.tier);
    loadRegistry(useApp.getState().bodyModel)
      .then(setRegistry)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layout transitions: phones use sheets; tablets start with drawers closed; desktop docks both.
  // Desktop and tablet open the isolated 3D view in the study panel by default (phones opt in).
  useEffect(() => {
    if (layout.kind !== 'phone') useApp.getState().setInspectorOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    useApp.getState().setLayout(layout.kind);
    if (layout.kind === 'phone') {
      setLeftOpen(false);
      setRightOpen(false);
    } else {
      setSheet('none');
      if (layout.kind === 'tablet') {
        setLeftOpen(false);
        setRightOpen(false);
      } else {
        setLeftOpen(true);
        setRightOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.kind]);

  // Tablet drawers are mutually exclusive so the model always keeps most of the screen.
  useEffect(
    () =>
      useApp.subscribe((s, p) => {
        if (s.layout !== 'tablet') return;
        if (s.leftOpen && !p.leftOpen && s.rightOpen) s.setRightOpen(false);
        else if (s.rightOpen && !p.rightOpen && s.leftOpen) s.setLeftOpen(false);
        if (s.guided && !p.guided && (s.leftOpen || s.rightOpen)) {
          s.setLeftOpen(false);
          s.setRightOpen(false);
        }
      }),
    [],
  );

  const [switching, setSwitching] = useState<BodyModel | null>(null);
  const switchModel = (m: BodyModel) => {
    if (m === useApp.getState().bodyModel || switching) return;
    setSwitching(m);
    loadRegistry(m)
      .then((next) => {
        const st = useApp.getState();
        const mapped = registry ? mapSelection(registry, next, st.selectedId) : null;
        setPicker(false);
        setRegistry(next);
        st.setBodyModel(m, mapped);
      })
      .catch((e: unknown) => useApp.getState().showHint(`Could not load the ${m} model: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setSwitching(null));
  };

  const toggleGuided = () => {
    if (useApp.getState().guided) useApp.getState().setGuided(null);
    else setPicker((p) => !p);
  };
  useEffect(() => {
    const on = () => toggleGuided();
    window.addEventListener('immersa:guided', on);
    return () => window.removeEventListener('immersa:guided', on);
  });

  useEffect(() => {
    if (immersive) {
      setSheet('none');
      setPicker(false);
    }
  }, [immersive]);

  // Sheets change the visible area; nudge the 3D view to re-centre.
  useEffect(() => {
    for (const t of [40, 360]) window.setTimeout(() => viewer.invalidate(), t);
  }, [sheet]);

  // On phones, a fresh selection peeks the info sheet.
  useEffect(() => {
    if (mobile && selectedId && !guided && !useApp.getState().immersive) setSheet('info');
  }, [mobile, selectedId, guided]);

  if (!hasGL)
    return (
      <div className="fatal">
        <h1>Immersa needs WebGL 2</h1>
        <p>This browser or device did not provide a WebGL 2 context. Try a current version of Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is enabled.</p>
      </div>
    );
  if (error)
    return (
      <div className="fatal">
        <h1>Anatomy data could not be loaded</h1>
        <p className="mono">{error}</p>
        <button className="chip gold" onClick={() => location.reload()}>
          Retry
        </button>
      </div>
    );

  return (
    <div
      className={[
        'app',
        `layout-${layout.kind}`,
        mobile ? 'mobile' : '',
        mobile && layout.landscape ? 'landscape' : '',
        layout.touch ? 'touch' : '',
        leftOpen && !mobile ? 'l-open' : '',
        rightOpen && !mobile && !guided ? 'r-open' : '',
        guided && !mobile ? 'g-open' : '',
        immersive ? 'immersive' : '',
        mobile && sheet !== 'none' ? 'sheet-open' : '',
        learning ? 'learning' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {registry && <MainViewport registry={registry} quality={quality} />}
      {registry && <HoverLabel registry={registry} />}
      {registry && <SelectionPin key={registry.model} registry={registry} />}
      <LoadingVeil />

      <header className="topbar">
        <div className="brand" aria-label="Immersa">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">Immersa</span>
          <span className="brand-sub">3D Anatomy</span>
        </div>
        {registry && <BodyToggle value={registry.model} pending={switching} onChange={switchModel} />}
        {registry && !mobile && <Search registry={registry} />}
        <button className="learn-btn" onClick={() => openLearn(null)} title="Study guides: structured notes for every system">
          <GraduationCap size={16} /> <span>Learn</span>
        </button>
      </header>

      {registry && !mobile && (
        <>
          <aside className={`panel left ${leftOpen ? 'open' : ''}`} aria-label="Anatomy controls" aria-hidden={!leftOpen}>
            <LeftPanel registry={registry} />
          </aside>
          <button className="panel-toggle left" onClick={() => setLeftOpen(!leftOpen)} aria-label={leftOpen ? 'Collapse controls' : 'Expand controls'}>
            {leftOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          {!guided && (
            <aside className={`panel right ${rightOpen ? 'open' : ''}`} aria-label="Structure inspector" aria-hidden={!rightOpen}>
              <InspectorPanel registry={registry} quality={quality} />
            </aside>
          )}
          {!guided && (
            <button className="panel-toggle right" onClick={() => setRightOpen(!rightOpen)} aria-label={rightOpen ? 'Collapse inspector' : 'Expand inspector'}>
              {rightOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          )}
        </>
      )}

      {registry && (mobile || !rightOpen || guided) && !immersive && <Breadcrumbs registry={registry} variant="float" />}
      {registry && <ImmersiveBar registry={registry} />}
      {registry && <Toolbar onGuided={toggleGuided} />}
      {registry && sliceOpen && !guided && !immersive && (
        <div className="slice-dock">
          <SliceControl registry={registry} variant="dock" onClose={() => useApp.getState().setSliceOpen(false)} />
        </div>
      )}
      {picker && !guided && (
        <JourneyPicker
          model={registry?.model ?? 'male'}
          onClose={() => setPicker(false)}
          onPick={(id) => {
            setPicker(false);
            setSheet('none');
            useApp.getState().setGuided({ journeyId: id, progress: 0, following: true });
          }}
        />
      )}
      {registry && guided && <GuidedPanel key={`${registry.model}-${guided.journeyId}`} registry={registry} onExit={() => useApp.getState().setGuided(null)} />}

      {registry && mobile && !guided && (
        <>
          <nav className="mobile-bar" aria-label="Panels">
            <button className={sheet === 'left' ? 'on' : ''} onClick={() => setSheet(sheet === 'left' ? 'none' : 'left')}>
              <Layers size={16} /> Layers
            </button>
            <button className={sheet === 'info' ? 'on' : ''} onClick={() => setSheet(sheet === 'info' ? 'none' : 'info')} disabled={!selectedId}>
              <BookOpen size={16} /> Details
            </button>
            <button onClick={() => openLearn(null)}>
              <GraduationCap size={16} /> Learn
            </button>
          </nav>
          {sheet !== 'none' && (
            <div className="sheet" role="dialog" aria-label={sheet === 'left' ? 'Layers and search' : 'Structure details'}>
              <div className="sheet-grip" onClick={() => setSheet('none')} aria-hidden />
              <div className="sheet-head" role="tablist">
                <button role="tab" aria-selected={sheet === 'left'} className={sheet === 'left' ? 'on' : ''} onClick={() => setSheet('left')}>
                  <Layers size={15} /> Browse
                </button>
                <button role="tab" aria-selected={sheet === 'info'} className={sheet === 'info' ? 'on' : ''} onClick={() => setSheet('info')} disabled={!selectedId}>
                  <BookOpen size={15} /> Details
                </button>
                <button className="icon-btn sm ghost sheet-close" onClick={() => setSheet('none')} aria-label="Close panel">
                  <X size={16} />
                </button>
              </div>
              {sheet === 'left' ? (
                <>
                  <Search registry={registry} onPicked={() => setSheet('info')} />
                  <LeftPanel registry={registry} onPicked={() => setSheet('info')} />
                </>
              ) : (
                <div className="panel-scroll">
                  <InspectorPanel registry={registry} quality={quality} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      <HintToast />
      <StatsOverlay />
      {learning && (
        <LearnPage
          topicId={route.view === 'learn' ? route.topic : null}
          section={route.view === 'learn' ? route.section : undefined}
          registry={registry}
          quality={quality}
          switching={switching}
          onSwitchModel={switchModel}
        />
      )}
    </div>
  );
}
