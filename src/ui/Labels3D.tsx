import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import type { StructureRecord } from '../data/types';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';

/**
 * Atlas-style labels: major bones, muscles, organs, vessels and nerves named in small type at the side of
 * the body, each joined to its structure by a leader line. Density follows the zoom; labels never overlap;
 * they hide for systems that are switched off. Tap a label to select the structure.
 */

// [label, priority (1 = always, 3 = close-up only), candidate names (first found wins); "L|" = paired]
type Spec = [string, 1 | 2 | 3, string[]];
const SPECS: Spec[] = [
  ['Skull', 1, ['Skull']],
  ['Brain', 1, ['Cerebrum', 'Brain']],
  ['Cerebellum', 3, ['Cerebellum']],
  ['Mandible', 3, ['Mandible']],
  ['Eye', 3, ['L|eye']],
  ['Trachea', 2, ['Trachea']],
  ['Thyroid cartilage', 3, ['Thyroid cartilage']],
  ['Clavicle', 2, ['L|clavicle']],
  ['Scapula', 3, ['L|scapula']],
  ['Sternum', 2, ['Sternum']],
  ['Rib cage', 2, ['Thoracic cage']],
  ['Heart', 1, ['Heart']],
  ['Lung', 1, ['L|lung']],
  ['Aorta', 1, ['Arch of aorta', 'Ascending aorta']],
  ['Inferior vena cava', 3, ['Inferior vena cava', 'Inferior vena cava A']],
  ['Common carotid artery', 3, ['L|common carotid artery', 'Left common carotid artery A']],
  ['Oesophagus', 3, ['Esophagus']],
  ['Diaphragm', 3, ['Diaphragm']],
  ['Liver', 1, ['Liver']],
  ['Stomach', 1, ['Stomach']],
  ['Spleen', 2, ['Spleen']],
  ['Gallbladder', 3, ['Gallbladder']],
  ['Pancreas', 3, ['Pancreas']],
  ['Kidney', 1, ['L|kidney']],
  ['Small intestine', 2, ['Small intestine']],
  ['Large intestine', 2, ['Transverse colon', 'Large intestine']],
  ['Urinary bladder', 2, ['Urinary bladder']],
  ['Uterus', 2, ['Uterus']],
  ['Ovary', 3, ['L|ovary']],
  ['Prostate', 3, ['Prostate']],
  ['Testis', 3, ['L|testis']],
  ['Spinal cord', 2, ['Spinal cord']],
  ['Vertebral column', 1, ['Vertebral column']],
  ['Brachial plexus', 3, ['Brachial plexus']],
  ['Sciatic nerve', 2, ['L|sciatic nerve']],
  ['Femoral nerve', 3, ['L|femoral nerve']],
  ['Median nerve', 3, ['L|median nerve']],
  ['Ulnar nerve', 3, ['L|ulnar nerve']],
  ['Radial nerve', 3, ['L|radial nerve']],
  ['Humerus', 1, ['L|humerus']],
  ['Radius', 2, ['L|radius']],
  ['Ulna', 2, ['L|ulna']],
  ['Hip bone', 1, ['L|hip bone']],
  ['Sacrum', 2, ['Sacrum']],
  ['Femur', 1, ['L|femur']],
  ['Patella', 2, ['L|patella']],
  ['Tibia', 1, ['L|tibia']],
  ['Fibula', 2, ['L|fibula']],
  ['Calcaneus', 3, ['L|calcaneus']],
  ['Femoral artery', 3, ['L|femoral artery']],
  ['Deltoid', 2, ['L|deltoid']],
  ['Pectoralis major', 1, ['L|pectoralis major']],
  ['Biceps brachii', 2, ['L|biceps brachii']],
  ['Triceps brachii', 3, ['L|triceps brachii']],
  ['Sternocleidomastoid', 3, ['L|sternocleidomastoid']],
  ['Trapezius', 3, ['L|trapezius']],
  ['External oblique', 3, ['L|external oblique']],
  ['Rectus abdominis', 2, ['L|rectus abdominis', 'Rectus abdominis']],
  ['Latissimus dorsi', 3, ['L|latissimus dorsi']],
  ['Temporalis', 3, ['L|temporalis']],
  ['Gluteus maximus', 3, ['L|gluteus maximus']],
  ['Rectus femoris', 1, ['L|rectus femoris']],
  ['Sartorius', 3, ['L|sartorius']],
  ['Gastrocnemius', 2, ['L|gastrocnemius']],
  ['Tibialis anterior', 3, ['L|tibialis anterior']],
];

interface Item {
  key: string;
  label: string;
  prio: number;
  recs: StructureRecord[]; // one, or [left, right]
  color: string;
  pref: -1 | 1; // preferred column for paired structures
}

function buildItems(registry: Registry): Item[] {
  const byName = new Map<string, StructureRecord>();
  for (const s of registry.structures.values()) if (s.kind !== 'system' && !s.landmark && !byName.has(s.name.toLowerCase())) byName.set(s.name.toLowerCase(), s);
  const out: Item[] = [];
  let alt = 1;
  for (const [label, prio, names] of SPECS) {
    let recs: StructureRecord[] | null = null;
    for (const n of names) {
      if (n.startsWith('L|')) {
        const base = n.slice(2);
        const l = byName.get(`left ${base}`);
        const r = byName.get(`right ${base}`);
        if (l && r) recs = [l, r];
        else if (l || r) recs = [(l ?? r)!];
      } else {
        const s = byName.get(n.toLowerCase());
        if (s) recs = [s];
      }
      if (recs) break;
    }
    if (!recs) continue;
    alt = -alt as -1 | 1;
    out.push({ key: label, label, prio, recs, color: SYSTEM_BY_ID[recs[0]!.system]?.swatch ?? '#d9b360', pref: alt as -1 | 1 });
  }
  return out;
}

const ROW = 17; // px between label baselines

export function Labels3D({ registry }: { registry: Registry }) {
  const on = useApp((s) => s.labels);
  const guided = useApp((s) => s.guided);
  const items = useMemo(() => buildItems(registry), [registry]);
  const root = useRef<HTMLDivElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const tags = useRef<(HTMLButtonElement | null)[]>([]);
  const chosen = useRef<number[]>([]);
  // Tag widths are measured once (layout reads inside the per-frame callback would force a reflow every frame).
  const widths = useRef<number[]>([]);

  useEffect(() => {
    if (!on || guided) return;
    const centers = items.map((it) => it.recs.map((r) => new THREE.Vector3(...registry.center(r.id))));
    const v = new THREE.Vector3();
    const mid = new THREE.Vector3();
    let lastSig = '';
    let bounds = { l: 0, r: 0, t: 0 };
    let boundsAt = 0;
    const fn = (cam: THREE.PerspectiveCamera) => {
      const el = root.current;
      if (!el) return;
      const st = useApp.getState();
      const W = el.clientWidth;
      const H = el.clientHeight;
      const now = performance.now();
      if (now - boundsAt > 400) {
        boundsAt = now;
        const box = el.getBoundingClientRect();
        const imm = !!document.querySelector('.app.immersive');
        const lp = imm ? null : document.querySelector('.panel.left.open');
        const rp = imm || document.querySelector('.app.mobile') ? null : document.querySelector('.panel.right.open, .guided');
        bounds = { l: lp ? Math.max(0, lp.getBoundingClientRect().right - box.left) : 0, r: rp ? Math.max(0, box.right - rp.getBoundingClientRect().left) : 0, t: 0 };
        // vertical toolbar docked at the right edge (phones)
        const tb = imm ? null : document.querySelector('.toolbar')?.getBoundingClientRect();
        if (tb && tb.height > tb.width * 1.5 && tb.left > box.left + box.width / 2) bounds.r = Math.max(bounds.r, box.right - tb.left + 4);
      }
      const hideAll = !!st.isolate || st.explode > 0.001 || !viewer.rig;
      const d = viewer.rig ? viewer.rig.radius : 3;
      const ppm = H / (2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
      const bodyPx = ppm * 1.7;
      const maxPrio = bodyPx > 1500 ? 3 : bodyPx > 760 ? 2 : 1;
      const camDir = cam.getWorldDirection(new THREE.Vector3());
      // candidates
      type C = { i: number; ax: number; ay: number; side: -1 | 1; y: number; cx: number };
      const cand: C[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i]!;
        if (hideAll || it.prio > maxPrio) continue;
        const rec = it.recs[0]!;
        if ((st.opacity[rec.system] ?? 0) < 0.08) continue;
        if (st.selectedId && it.recs.some((r) => r.id === st.selectedId)) continue;
        if (it.recs.some((r) => registry.ancestorIds(r.id).some((a) => st.hidden.has(a)))) continue;
        // pick the instance: on the preferred side, else the one nearer the camera
        let best = -1;
        let bx = 0;
        let by = 0;
        let bs: -1 | 1 = 1;
        let bdepth = Infinity;
        let bcx = 0;
        const opts: { k: number; x: number; y: number; s: -1 | 1; depth: number; cx: number }[] = [];
        for (let k = 0; k < it.recs.length; k++) {
          const c = centers[i]![k]!;
          v.copy(c).project(cam);
          if (v.z > 1 || Math.abs(v.x) > 1.02 || Math.abs(v.y) > 1.02) continue;
          mid.set(0, c.y, 0).project(cam);
          const x = ((v.x + 1) / 2) * W;
          const y = ((1 - v.y) / 2) * H;
          const cx = ((mid.x + 1) / 2) * W;
          opts.push({ k, x, y, s: x < cx ? -1 : 1, depth: c.clone().sub(cam.position).dot(camDir), cx });
        }
        if (!opts.length) continue;
        const sides = new Set(opts.map((o) => o.s));
        for (const o of opts) {
          const score = sides.size > 1 ? (o.s === it.pref ? 0 : 1) : o.depth;
          if (best < 0 || score < bdepth) {
            best = o.k;
            bdepth = score;
            bx = o.x;
            by = o.y;
            bs = o.s;
            bcx = o.cx;
          }
        }
        chosen.current[i] = best;
        cand.push({ i, ax: bx, ay: by, side: bs, y: by, cx: bcx });
      }
      // columns: just outside the body silhouette, clamped into the viewport
      const half = Math.min(0.34 * ppm, W * 0.42);
      const placed = new Map<number, { x: number; y: number; ax: number; ay: number; side: -1 | 1 }>();
      const maxPerCol = Math.max(3, Math.floor((H - 120) / ROW));
      for (const side of [-1, 1] as const) {
        let col = cand.filter((c) => c.side === side).sort((a, b) => a.ay - b.ay);
        if (col.length > maxPerCol) col = col.sort((a, b) => items[a.i]!.prio - items[b.i]!.prio).slice(0, maxPerCol).sort((a, b) => a.ay - b.ay);
        const top = 64;
        const bottom = H - 84;
        let prev = -Infinity;
        for (const c of col) {
          c.y = Math.max(c.ay, prev + ROW, top);
          prev = c.y;
        }
        // overflow at the bottom: push back up
        let next = Infinity;
        for (let k = col.length - 1; k >= 0; k--) {
          const c = col[k]!;
          c.y = Math.min(c.y, next - ROW, bottom);
          next = c.y;
        }
        for (const c of col) {
          // the whole tag stays on screen: clamp by its measured width
          const tag = tags.current[c.i];
          let w = widths.current[c.i];
          if (!w) {
            w = tag?.offsetWidth || 0;
            if (w) widths.current[c.i] = w;
            else w = items[c.i]!.label.length * 6 + 22;
          }
          w += 6;
          const x = side < 0 ? Math.max(bounds.l + 6 + w, c.cx - half - 18) : Math.min(W - bounds.r - 6 - w, c.cx + half + 18);
          placed.set(c.i, { x, y: c.y, ax: c.ax, ay: c.ay, side });
        }
      }
      const sig = [...placed.keys()].join(',');
      const changed = sig !== lastSig;
      lastSig = sig;
      for (let i = 0; i < items.length; i++) {
        const p = placed.get(i);
        const tag = tags.current[i];
        const path = paths.current[i];
        const dot = dots.current[i];
        if (!tag || !path || !dot) continue;
        if (!p) {
          if (changed) {
            tag.classList.remove('show');
            path.classList.remove('show');
            dot.classList.remove('show');
          }
          continue;
        }
        // keep the label clear of the anchor when the column is clamped to the screen edge
        const elbowX = p.x - p.side * 8;
        path.setAttribute('d', `M${p.ax.toFixed(1)},${p.ay.toFixed(1)} L${elbowX.toFixed(1)},${p.y.toFixed(1)} L${p.x.toFixed(1)},${p.y.toFixed(1)}`);
        dot.setAttribute('cx', p.ax.toFixed(1));
        dot.setAttribute('cy', p.ay.toFixed(1));
        tag.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(${p.side < 0 ? '-100%' : '0'}, -50%)`;
        if (changed || !tag.classList.contains('show')) {
          tag.classList.add('show');
          path.classList.add('show');
          dot.classList.add('show');
        }
      }
    };
    viewer.frameListeners.add(fn);
    viewer.invalidate();
    return () => {
      viewer.frameListeners.delete(fn);
    };
  }, [on, guided, items, registry]);

  if (!on || guided) return null;
  return (
    <div className="labels3d" ref={root} aria-hidden={false}>
      <svg className="labels3d-lines">
        {items.map((it, i) => (
          <g key={it.key} style={{ color: it.color }}>
            <path ref={(e) => void (paths.current[i] = e)} />
            <circle r={2.2} ref={(e) => void (dots.current[i] = e)} />
          </g>
        ))}
      </svg>
      {items.map((it, i) => (
        <button
          key={it.key}
          className="l3d-tag"
          style={{ ['--c' as string]: it.color }}
          ref={(e) => void (tags.current[i] = e)}
          onClick={() => {
            const id = it.recs[chosen.current[i] ?? 0]?.id ?? it.recs[0]!.id;
            useApp.getState().select(id);
            viewer.focus(id);
          }}
          title={`Select ${it.recs[0]!.name}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
