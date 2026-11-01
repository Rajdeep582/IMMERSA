import { ArrowDown, ArrowRight, Box, Lightbulb, Pin, RotateCw, Stethoscope } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Registry } from '../data/registry';
import type { QualityProfile } from '../engine/quality';
import { InspectViewport } from '../scene/InspectViewport';
import { resolveName } from './index';
import { Rich } from './Rich';
import type { Block, TreeNode } from './types';

export interface BlockCtx {
  registry: Registry | null;
  quality: QualityProfile;
  onLink: (id: string) => void;
  figureNo: () => number;
}

function TreeView({ node, ctx, depth = 0 }: { node: TreeNode; ctx: BlockCtx; depth?: number }) {
  return (
    <li className={`tree-n d${depth}`}>
      <div className="tree-box">
        <span className="tree-t">{node.label}</span>
        {node.note && <span className="tree-note">{node.note}</span>}
      </div>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <TreeView key={c.label} node={c} ctx={ctx} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Live, isolated 3D figure of a registry node; mounts its WebGL view only once scrolled into view. */
function Figure3D({ target, caption, ctx, n }: { target: { male?: string; female?: string }; caption: string; ctx: BlockCtx; n: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const rec = ctx.registry ? resolveName(ctx.registry, target[ctx.registry.model]) : undefined;
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setVisible(true), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return (
    <figure className="lfig" ref={ref}>
      <div className="lfig-view">
        {!ctx.registry ? (
          <div className="lfig-empty">Loading model…</div>
        ) : !rec ? (
          <div className="lfig-empty">This structure is not part of the {ctx.registry.model} model. Switch body model to view it in 3D.</div>
        ) : visible ? (
          <InspectViewport registry={ctx.registry} targetId={rec.id} quality={ctx.quality} />
        ) : (
          <div className="lfig-empty">
            <Box size={18} /> Interactive 3D view
          </div>
        )}
      </div>
      <figcaption>
        <span className="lfig-no">Fig. {n}</span> {caption}
        {rec && (
          <button className="xlink strong" onClick={() => ctx.onLink(rec.id)}>
            Open in 3D explorer <ArrowRight size={13} />
          </button>
        )}
      </figcaption>
    </figure>
  );
}

export function BlockView({ b, ctx }: { b: Block; ctx: BlockCtx }) {
  const R = (s: string) => <Rich text={s} registry={ctx.registry} onLink={ctx.onLink} />;
  switch (b.t) {
    case 'p':
      return <p className="lp">{R(b.text)}</p>;
    case 'bullets':
      return (
        <ul className="lbul">
          {b.items.map((x, i) => (
            <li key={i}>{R(x)}</li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="lsteps">
          {b.items.map((x, i) => (
            <li key={i}>
              <span className="lstep-n" aria-hidden>
                {i + 1}
              </span>
              <div>{R(x)}</div>
            </li>
          ))}
        </ol>
      );
    case 'flow':
      return (
        <div className="lflow" role="group" aria-label={b.title}>
          <div className="ldiag-title">{b.title}</div>
          <ol className={`lflow-list ${b.steps.length > 5 ? 'long' : ''}`}>
            {b.steps.map((s, i) => (
              <li key={i} className="lflow-step">
                <div className="lflow-card">
                  <span className="lflow-n">{i + 1}</span>
                  <div className="lflow-text">
                    <div className="lflow-label">{R(s.label)}</div>
                    {s.note && <div className="lflow-note">{R(s.note)}</div>}
                  </div>
                </div>
                {i < b.steps.length - 1 && (
                  <span className="lflow-arrow" aria-hidden>
                    <ArrowRight size={16} className="h" />
                    <ArrowDown size={16} className="v" />
                  </span>
                )}
              </li>
            ))}
          </ol>
          {b.loop && (
            <div className="lflow-loop">
              <RotateCw size={13} /> Cycle repeats
            </div>
          )}
        </div>
      );
    case 'tree':
      return (
        <div className="ltree" role="group" aria-label={b.title}>
          <div className="ldiag-title">{b.title}</div>
          <ul className="tree-root">
            <TreeView node={b.root} ctx={ctx} />
          </ul>
        </div>
      );
    case 'layers':
      return (
        <div className="llayers" role="group" aria-label={b.title}>
          <div className="ldiag-title">{b.title}</div>
          <ol>
            {b.layers.map((l, i) => (
              <li key={l.name} style={{ ['--i' as string]: i, ['--n' as string]: b.layers.length }}>
                <span className="ll-band" aria-hidden />
                <div className="ll-text">
                  <span className="ll-name">{l.name}</span>
                  <span className="ll-note">{R(l.note)}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case 'table':
      return (
        <div className="ltable">
          {b.title && <div className="ldiag-title">{b.title}</div>}
          <div className="ltable-scroll" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  {b.head.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} data-label={b.head[j]}>
                        {R(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case 'callout': {
      const Icon = b.tone === 'clinical' ? Stethoscope : b.tone === 'tip' ? Lightbulb : Pin;
      const title = b.title ?? (b.tone === 'clinical' ? 'Clinical note' : b.tone === 'tip' ? 'Memory aid' : 'Remember');
      return (
        <aside className={`lcall ${b.tone}`}>
          <Icon size={17} aria-hidden />
          <div>
            <div className="lcall-t">{title}</div>
            <div>{R(b.text)}</div>
          </div>
        </aside>
      );
    }
    case 'facts':
      return (
        <dl className="lfacts">
          {b.items.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{R(v)}</dd>
            </div>
          ))}
        </dl>
      );
    case 'figure':
      return <Figure3D target={b.target} caption={b.caption} ctx={ctx} n={ctx.figureNo()} />;
  }
}
