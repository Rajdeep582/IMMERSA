import { Fragment, type ReactNode } from 'react';

/**
 * Small, safe Markdown renderer for model output (no HTML injection: everything is React text).
 * Supports headings, paragraphs, bullet/numbered lists, simple tables, **bold**, *italic*, `code`,
 * [text](https://…) links and [n] citations.
 */
export function Markdown({ text, onCite }: { text: string; onCite?: (n: number) => void }) {
  return <>{blocks(text, onCite)}</>;
}

function inline(s: string, onCite?: (n: number) => void, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[\d+(?:\s*[,;–-]\s*\d+)*\](?:\[\d+(?:\s*[,;–-]\s*\d+)*\])*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith('**')) out.push(<strong key={k}>{inline(t.slice(2, -2), onCite, k)}</strong>);
    else if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (t.startsWith('*') || t.startsWith('_')) out.push(<em key={k}>{inline(t.slice(1, -1), onCite, k)}</em>);
    else if (/^\[\d/.test(t)) {
      const nums = t.match(/\d+/g)!.map(Number);
      out.push(
        <span key={k} className="dm-cites">
          {nums.map((n) => (
            <button key={n} className="dm-cite" onClick={() => onCite?.(n)} aria-label={`Source ${n}`}>
              {n}
            </button>
          ))}
        </span>,
      );
    } else {
      const lm = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(t)!;
      out.push(
        <a key={k} href={lm[2]} target="_blank" rel="noreferrer noopener">
          {lm[1]}
        </a>,
      );
    }
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function blocks(text: string, onCite?: (n: number) => void): ReactNode[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const para: string[] = [];
  const flush = () => {
    if (para.length) out.push(<p key={k++}>{inline(para.join(' '), onCite, `p${k}`)}</p>);
    para.length = 0;
  };
  while (i < lines.length) {
    const line = lines[i]!;
    const t = line.trim();
    if (!t) {
      flush();
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(t);
    if (h) {
      flush();
      const lvl = Math.min(4, h[1]!.length + 2);
      const Tag = `h${lvl}` as 'h3' | 'h4';
      out.push(<Tag key={k++}>{inline(h[2]!, onCite, `h${k}`)}</Tag>);
      i++;
      continue;
    }
    if (/^[-*•]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) {
      flush();
      const ordered = /^\d+[.)]\s+/.test(t);
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const l = lines[i]!.trim();
        const mm = ordered ? /^\d+[.)]\s+(.*)$/.exec(l) : /^[-*•]\s+(.*)$/.exec(l);
        if (!mm) {
          // indented continuation / nested bullet → fold into the previous item
          if (l && /^\s{2,}\S/.test(lines[i]!) && items.length) {
            const sub = /^[-*•]\s+(.*)$/.exec(l)?.[1] ?? l;
            items.push(
              <li key={`s${i}`} className="dm-sub">
                {inline(sub, onCite, `s${i}`)}
              </li>,
            );
            i++;
            continue;
          }
          break;
        }
        items.push(<li key={i}>{inline(mm[1]!, onCite, `l${i}`)}</li>);
        i++;
      }
      out.push(ordered ? <ol key={k++}>{items}</ol> : <ul key={k++}>{items}</ul>);
      continue;
    }
    if (t.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1]!.trim())) {
      flush();
      const row = (l: string) =>
        l
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const head = row(t);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('|')) rows.push(row(lines[i++]!));
      out.push(
        <div key={k++} className="dm-table">
          <table>
            <thead>
              <tr>
                {head.map((c, j) => (
                  <th key={j}>{inline(c, onCite, `th${j}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, j) => (
                    <td key={j}>{inline(c, onCite, `td${ri}-${j}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^---+$/.test(t)) {
      flush();
      out.push(<hr key={k++} />);
      i++;
      continue;
    }
    para.push(t);
    i++;
  }
  flush();
  return out.map((n, j) => <Fragment key={j}>{n}</Fragment>);
}
