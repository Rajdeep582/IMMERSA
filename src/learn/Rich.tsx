import { Fragment, type ReactNode } from 'react';
import type { Registry } from '../data/registry';
import { resolveName } from './index';

/**
 * Renders learning markup: **term** → highlighted keyword, [[Name|label]] → link that selects the
 * structure in 3D (plain text when the current body model has no matching structure).
 */
export function Rich({ text, registry, onLink }: { text: string; registry?: Registry | null; onLink?: (id: string) => void }) {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={k++} className="kw">{inner(m[1], registry, onLink, k++)}</strong>);
    else {
      const target = m[2] ?? '';
      const label = m[3] ?? target;
      const rec = registry ? resolveName(registry, target) : undefined;
      out.push(
        rec && onLink ? (
          <button key={k++} type="button" className="xlink" onClick={() => onLink(rec.id)} title={`Show ${rec.name} in 3D`}>
            {inner(label, registry, onLink, k++)}
          </button>
        ) : (
          <Fragment key={k++}>{inner(label, registry, onLink, k++)}</Fragment>
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function inner(s: string, registry: Registry | null | undefined, onLink: ((id: string) => void) | undefined, key: number): ReactNode {
  return /\*\*|\[\[/.test(s) ? <Rich key={key} text={s} registry={registry} onLink={onLink} /> : s;
}

/** Plain-text version (search, titles). */
export const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, a: string, b?: string) => b ?? a);
