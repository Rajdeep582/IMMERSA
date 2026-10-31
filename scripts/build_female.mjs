// Build the female body model from the HuBMAP Human Reference Atlas (HRA) 3D reference organs
// (Visible Human Female, CC BY 4.0). Output mirrors the BodyParts3D male build:
//   public/data/female/registry.json, public/data/female/manifest.json,
//   public/models/female/<system>.glb (body-view LOD), public/models/female/hi/<chunk>.glb (full resolution)
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';

const LIB = process.env.HRA_LIB ?? 'raw/hra/ccf-3d-reference-object-library/VH_Female';
const XWALK = process.env.HRA_XWALK ?? 'raw/hra/ccf-releases/v2.0/models/asct-b-3d-models-crosswalk.csv';
const OUT_DATA = process.argv[2] ?? 'public/data/female';
const OUT_MODELS = process.argv[3] ?? 'public/models/female';
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

// ---------- crosswalk (node name → label + ontology id) ----------
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const xwalk = new Map();
for (const r of parseCsv(fs.readFileSync(XWALK, 'utf8'))) {
  const [, , node, label, ont] = r;
  if (!node || !node.startsWith('VH_F') && !node.startsWith('Allen_')) continue;
  const okOnt = ont && /^(UBERON|FMA):?\d+$/.test(ont.trim()) ? ont.trim().replace(/^FMA(\d)/, 'FMA:$1') : null;
  if (!xwalk.has(node)) xwalk.set(node, { label: label && label !== '-' ? label.trim() : null, ont: okOnt });
}

// ---------- source files ----------
// Order matters: the first file that contains a node name wins (organ-specific files before generic vasculature).
const R = (v, f) => path.join(LIB, v, f);
const SOURCES = [
  { file: R('v1.3', 'VH_F_skin.glb'), system: 'integumentary', group: null },
  { file: R('v1.3', 'VH_F_mammary_gland_L.glb'), system: 'reproductive', group: 'Left mammary gland' },
  { file: R('v1.3', 'VH_F_mammary_gland_R.glb'), system: 'reproductive', group: 'Right mammary gland' },
  { file: R('v1.2', 'VH_F_Uterus.glb'), system: 'reproductive', group: 'Uterus' },
  { file: R('v1.2', 'VH_F_Ovary_L.glb'), system: 'reproductive', group: 'Ovaries and uterine tubes' },
  { file: R('v1.2', 'VH_F_Ovary_R.glb'), system: 'reproductive', group: 'Ovaries and uterine tubes' },
  { file: R('v1.2', 'VH_F_Fallopian_Tube_L.glb'), system: 'reproductive', group: 'Ovaries and uterine tubes' },
  { file: R('v1.2', 'VH_F_Fallopian_Tube_R.glb'), system: 'reproductive', group: 'Ovaries and uterine tubes' },
  { file: R('v1.2', 'VH_F_Vagina.glb'), system: 'reproductive', group: 'Vagina' },
  { file: R('v1.2', 'VH_F_Ligaments_Uterus_Ovaries.glb'), system: 'reproductive', group: 'Ligaments of uterus and ovaries' },
  { file: R('v1.2', 'VH_F_Pelvis.glb'), system: 'skeletal', group: 'Pelvis' },
  { file: R('v1.2', 'VH_F_Vertebrae.glb'), system: 'skeletal', group: 'Vertebral column' },
  { file: R('v1.2', 'VH_F_Knee_L.glb'), system: 'skeletal', group: 'Left lower limb' },
  { file: R('v1.2', 'VH_F_Knee_R.glb'), system: 'skeletal', group: 'Right lower limb' },
  { file: R('v1.2', 'VH_F_Ligaments_Knee_L.glb'), system: 'skeletal', group: 'Left lower limb' },
  { file: R('v1.2', 'VH_F_Ligaments_Knee_R.glb'), system: 'skeletal', group: 'Right lower limb' },
  { file: R('v1.2', 'VH_F_Muscles_Knee_L.glb'), system: 'muscular', group: 'Left lower limb' },
  { file: R('v1.2', 'VH_F_Muscles_Knee_R.glb'), system: 'muscular', group: 'Right lower limb' },
  { file: R('v1.2', 'VH_F_Muscles_Eye_L.glb'), system: 'muscular', group: 'Extra-ocular muscles' },
  { file: R('v1.2', 'VH_F_Muscles_Eye_R.glb'), system: 'muscular', group: 'Extra-ocular muscles' },
  { file: R('v1.2', 'Allen_F_Brain.glb'), system: 'nervous', group: 'Brain' },
  { file: R('v1.2', 'VH_F_Spinal_Cord.glb'), system: 'nervous', group: 'Spinal cord' },
  { file: R('v1.2', 'VH_F_Nerves_of_Eye_L.glb'), system: 'nervous', group: 'Nerves of the eye' },
  { file: R('v1.2', 'VH_F_Nerves_of_Eye_R.glb'), system: 'nervous', group: 'Nerves of the eye' },
  { file: R('v1.2', 'VH_F_Heart.glb'), system: 'cardiovascular', group: 'Heart' },
  { file: R('v1.2', 'VH_F_Blood_Vasculature_Heart.glb'), system: 'cardiovascular', group: 'Heart' },
  { file: R('v1.4', '3d-vh-f-blood-vasculature.glb'), system: 'cardiovascular', group: 'Blood vessels' },
  { file: R('v1.2', 'VH_F_Blood_Vasculature_Liver.glb'), system: 'cardiovascular', group: 'Blood vessels' },
  { file: R('v1.2', 'VH_F_Blood_Vasculature_Kidney.glb'), system: 'cardiovascular', group: 'Blood vessels' },
  { file: R('v1.2', 'VH_F_Blood_Vasculature_Spleen.glb'), system: 'cardiovascular', group: 'Blood vessels' },
  { file: R('v1.2', 'VH_F_Blood_Vasculature_Gallbladder.glb'), system: 'cardiovascular', group: 'Blood vessels' },
  { file: R('v1.2', 'VH_F_Blood_Vasculature_Large_Intestine.glb'), system: 'cardiovascular', group: 'Blood vessels' },
  { file: R('v1.2', 'VH_F_Blood_Vasculature_Eye.glb'), system: 'cardiovascular', group: 'Blood vessels' },
  { file: R('v1.4', '3d-vh-f-lung.glb'), system: 'respiratory', group: 'Lungs' },
  { file: R('v1.4', '3d-vh-f-main-bronchus.glb'), system: 'respiratory', group: 'Trachea and main bronchi' },
  { file: R('v1.4', '3d-vh-f-trachea.glb'), system: 'respiratory', group: 'Trachea and main bronchi' },
  { file: R('v1.4', '3d-vh-f-larynx.glb'), system: 'respiratory', group: 'Larynx' },
  { file: R('v1.2', 'VH_F_Liver.glb'), system: 'digestive', group: 'Liver' },
  { file: R('v1.2', 'VH_F_Gallbladder.glb'), system: 'digestive', group: 'Gallbladder and biliary tree' },
  { file: R('v1.2', 'VH_F_Biliary_Tree.glb'), system: 'digestive', group: 'Gallbladder and biliary tree' },
  { file: R('v1.2', 'VH_F_Ducts_of_Gallbladder.glb'), system: 'digestive', group: 'Gallbladder and biliary tree' },
  { file: R('v1.2', 'VH_F_Ducts_of_Liver.glb'), system: 'digestive', group: 'Gallbladder and biliary tree' },
  { file: R('v1.2', 'VH_F_Pancreas.glb'), system: 'digestive', group: 'Pancreas' },
  { file: R('v1.2', 'VH_F_Ducts_of_Pancreas.glb'), system: 'digestive', group: 'Pancreas' },
  { file: R('v1.2', 'VH_F_Small_Intestine.glb'), system: 'digestive', group: 'Small intestine' },
  { file: R('v1.2', 'SBU_F_Intestine_Large.glb'), system: 'digestive', group: 'Large intestine' },
  { file: R('v1.2', 'VH_F_Kidney_L.glb'), system: 'urinary', group: 'Left kidney' },
  { file: R('v1.2', 'VH_F_Kidney_R.glb'), system: 'urinary', group: 'Right kidney' },
  { file: R('v1.2', 'VH_F_Ureter_L.glb'), system: 'urinary', group: 'Ureters' },
  { file: R('v1.2', 'VH_F_Ureter_R.glb'), system: 'urinary', group: 'Ureters' },
  { file: R('v1.2', 'VH_F_Urinary_Bladder.glb'), system: 'urinary', group: 'Urinary bladder' },
  { file: R('v1.2', 'VH_F_Spleen.glb'), system: 'lymphatic', group: 'Spleen' },
  { file: R('v1.2', 'VH_F_Thymus.glb'), system: 'lymphatic', group: 'Thymus' },
  { file: R('v1.4', '3d-vh-f-palatine-tonsil-l.glb'), system: 'lymphatic', group: 'Palatine tonsils' },
  { file: R('v1.4', '3d-vh-f-palatine-tonsil-r.glb'), system: 'lymphatic', group: 'Palatine tonsils' },
  { file: R('v1.2', 'NIH_F_Lymph_Node.glb'), system: 'lymphatic', group: 'Lymph node (reference)' },
  { file: R('v1.4', '3d-vh-f-eye-l.glb'), system: 'sensory', group: 'Left eye' },
  { file: R('v1.4', '3d-vh-f-eye-r.glb'), system: 'sensory', group: 'Right eye' },
];

// ---------- naming ----------
const TYPO = [
  [/\bopthalmic\b/g, 'ophthalmic'], [/\beigth\b/g, 'eighth'], [/\bepiglotic\b/g, 'epiglottic'], [/\bhepataduodenal\b/g, 'hepatoduodenal'],
  [/\bschlemms\b/g, "Schlemm's"], [/\bjejenum\b/g, 'jejunum'], [/\bheptopancreatic\b/g, 'hepatopancreatic'], [/\bfibria\b/g, 'fimbria'], [/\bsegmennt\b/g, 'segment'], [/\bsegm$/g, 'segment'], [/\bHTH\b/g, 'hypothalamus'], [/\bperichondular\b/g, 'perichondral'], [/\bthe liver\b/g, 'liver'],
];
const SUFFIX = { ant: 'anterior', pos: 'posterior', med: 'medial', lat: 'lateral', sup: 'superior', inf: 'inferior', antlat: 'anterolateral', posmed: 'posteromedial', frontal: 'frontal' };
function pretty(node) {
  let s = node.replace(/^VH_F_|^Allen_|^NIH_F_/, '').replace(/^Yao_/, '');
  let side = null;
  let toks = s.split('_').filter(Boolean);
  // side markers anywhere (…_L, …_L_sup, dura_mater_left)
  toks = toks.filter((t, i) => {
    if (i > 0 && (t === 'L' || t === 'R')) { side = t; return false; }
    if (i > 0 && (t === 'left' || t === 'right') && i === toks.length - 1) { side = t === 'left' ? 'L' : 'R'; return false; }
    return true;
  });
  const quals = [];
  while (toks.length > 2) {
    const t = toks[toks.length - 1];
    if (SUFFIX[t]) { quals.unshift(SUFFIX[t]); toks.pop(); continue; }
    if (/^[a-z]$/.test(t)) { quals.unshift(t.toUpperCase()); toks.pop(); continue; }
    break;
  }
  let name = toks.join(' ').replace(/\s+/g, ' ').trim();
  for (const [a, b] of TYPO) name = name.replace(a, b);
  name = name.replace(/^(.*?) (compact|spongy) bone$/, '$1 ($2 bone)');
  name = name.replace(/ segment1$/, ' segment (part 2)');
  if (name === 'fat') name = 'mammary adipose tissue';
  if (/\bleft\b/.test(name)) side = side ?? 'L';
  if (/\bright\b/.test(name)) side = side ?? 'R';
  if (side && !/\b(left|right)\b/.test(name)) name = `${side === 'L' ? 'left' : 'right'} ${name}`;
  const letters = quals.filter((q) => /^[A-Z]$/.test(q));
  const words = quals.filter((q) => !/^[A-Z]$/.test(q));
  if (letters.length) name += ` ${letters.join('')}`;
  if (words.length) name += ` (${words.join(', ')})`;
  if (/^Yao_/.test(node.replace(/^NIH_F_/, ''))) name += ' (reference lymph node)';
  return { name: name.charAt(0).toUpperCase() + name.slice(1), side };
}
const LANDMARK = /impression|enthesis|fossa|groove|perichondral|perichondular|condyle|distal most point|bare area|porta hepatis|surface of|ostium|internal cervical os|external cervical os|hilum|hilus|carina|fovea|macula|optic disc|ora serrata|junction|trigone|apex|landmark/i;

// ---------- geometry helpers ----------
function compact(pos, nrm, idx) {
  const map = new Int32Array(pos.length / 3).fill(-1); let k = 0;
  const out = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) { const v = idx[i]; if (map[v] < 0) map[v] = k++; out[i] = map[v]; }
  const p = new Float32Array(k * 3), n = new Float32Array(k * 3);
  for (let v = 0; v < map.length; v++) if (map[v] >= 0) { p.set(pos.subarray(v * 3, v * 3 + 3), map[v] * 3); n.set(nrm.subarray(v * 3, v * 3 + 3), map[v] * 3); }
  return { pos: p, nrm: n, idx: out };
}
function computeNormals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}
/** Merge vertices with identical positions so simplification can collapse across seams. */
function weld(pos, idx) {
  const key = new Map(); const remap = new Uint32Array(pos.length / 3); const np = [];
  for (let v = 0; v < pos.length / 3; v++) {
    const k = `${Math.round(pos[v * 3] * 1e6)},${Math.round(pos[v * 3 + 1] * 1e6)},${Math.round(pos[v * 3 + 2] * 1e6)}`;
    let id = key.get(k);
    if (id === undefined) { id = np.length / 3; key.set(k, id); np.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); }
    remap[v] = id;
  }
  const tri = [];
  for (let i = 0; i + 2 < idx.length; i += 3) {
    const a = remap[idx[i]], b = remap[idx[i + 1]], c = remap[idx[i + 2]];
    if (a !== b && b !== c && a !== c) tri.push(a, b, c); // drop triangles collapsed by welding
  }
  return { pos: new Float32Array(np), idx: new Uint32Array(tri) };
}
function simplify(g, errM) {
  if (g.idx.length < 300) return g;
  const target = Math.max(36, Math.floor((g.idx.length * 0.02) / 3) * 3);
  const [ind] = MeshoptSimplifier.simplify(g.idx, g.pos, 3, target, errM, ['ErrorAbsolute']);
  if (ind.length >= g.idx.length * 0.95) return g;
  return compact(g.pos, g.nrm, ind);
}
async function writeGlb(file, items) {
  const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene();
  for (const { id, g } of items) {
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(buf))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(g.nrm).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(g.pos.length / 3 < 65535 ? new Uint16Array(g.idx) : g.idx).setBuffer(buf));
    scene.addChild(doc.createNode(id).setMesh(doc.createMesh(id).addPrimitive(prim)));
  }
  await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 8 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  fs.writeFileSync(file, await io.writeBinary(doc));
  return fs.statSync(file).size;
}

// ---------- read all sources ----------
const units = []; // { id, name, side, system, group, ont, label, geo, bbox, src }
const seen = new Set();
let flipped = 0;
const mat4 = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
for (const src of SOURCES) {
  const doc = await io.read(src.file);
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const id = node.getName();
    if (seen.has(id)) continue;
    const wm = node.getWorldMatrix();
    const P = [], I = [];
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMode() !== 4) continue;
      const pa = prim.getAttribute('POSITION');
      const base = P.length / 3;
      const n = pa.getCount();
      const v = [0, 0, 0];
      for (let i = 0; i < n; i++) { pa.getElement(i, v); P.push(...mat4(wm, v[0], v[1], v[2])); }
      const ia = prim.getIndices();
      if (ia) for (let i = 0; i < ia.getCount(); i++) I.push(base + ia.getScalar(i));
      else for (let i = 0; i < n; i++) I.push(base + i);
    }
    if (I.length < 3) continue;
    seen.add(id);
    const w = weld(new Float32Array(P), new Uint32Array(I));
    // Orient closed surfaces outward: negative signed volume means inward-facing winding.
    let vol = 0;
    for (let i = 0; i < w.idx.length; i += 3) {
      const a = w.idx[i] * 3, b = w.idx[i + 1] * 3, c = w.idx[i + 2] * 3, p = w.pos;
      vol += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
    }
    if (vol < 0) for (let i = 0; i < w.idx.length; i += 3) { const t = w.idx[i + 1]; w.idx[i + 1] = w.idx[i + 2]; w.idx[i + 2] = t; }
    if (vol < 0) flipped++;
    const nrm = computeNormals(w.pos, w.idx);
    const { name, side } = pretty(id);
    const xw = xwalk.get(id) ?? {};
    units.push({ id, name, side, system: src.system, group: src.group, ont: xw.ont ?? null, label: xw.label ?? null, geo: { pos: w.pos, nrm, idx: w.idx }, src: path.basename(src.file) });
  }
}
// Centre the body like the male model (skin bounding-box centre at the origin).
const skin = units.find((u) => u.id === 'VH_F_skin');
const bb = (pos) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], pos[i + k]); mx[k] = Math.max(mx[k], pos[i + k]); } return [mn, mx]; };
const sb = bb(skin.geo.pos);
const C = [0, (sb[0][1] + sb[1][1]) / 2, (sb[0][2] + sb[1][2]) / 2];
for (const u of units) { const p = u.geo.pos; for (let i = 0; i < p.length; i += 3) { p[i + 1] -= C[1]; p[i + 2] -= C[2]; } u.bbox = bb(p).map((a) => a.map((x) => +x.toFixed(5))); }
console.log('units', units.length, 'flipped', flipped, 'centre shift', C);

// ---------- hierarchy ----------
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function subgroup(u) {
  const n = u.name.toLowerCase();
  if (LANDMARK.test(u.id) && u.system !== 'cardiovascular' && !/segment of .*spinal cord|spinal cord segment|bronchopulmonary/.test(n)) return ['Landmarks and surfaces'];
  switch (u.group) {
    case 'Brain': {
      if (/optic chiasm/.test(n)) return ['Midline structures'];
      if (/ventricle|cerebral aqueduct|choroid plexus|interventricular/.test(n)) return ['Ventricular system'];
      if (/cerebell|vermis|dentate|fastigial|interposed|flocculus/.test(n)) return ['Cerebellum'];
      if (/pons|medulla|midbrain|mesencephal|colliculus|tegment|substantia nigra|red nucleus|periaqueductal|raphe|olive|olivary|pontine|reticular|cuneate|gracile|vestibular nucleus|locus|interpeduncular|peduncle/.test(n)) return ['Brainstem'];
      if (/thalam|hypothalam|geniculate|pulvinar|habenul|subthalamic|mammillary|reuniens|zona incerta/.test(n)) return ['Diencephalon'];
      if (/caudate|putamen|pallidus|accumbens|claustrum|amygdal|septal|basal forebrain|stria terminalis|substantia innominata/.test(n)) return ['Basal nuclei and limbic'];
      if (u.side === 'L') return ['Left cerebral hemisphere'];
      if (u.side === 'R') return ['Right cerebral hemisphere'];
      return ['Midline structures'];
    }
    case 'Spinal cord':
      return [/cervical|C\d/i.test(n) ? 'Cervical segments' : /thoracic/.test(n) ? 'Thoracic segments' : /lumbar/.test(n) ? 'Lumbar segments' : 'Sacral and coccygeal segments'];
    case 'Vertebral column':
      return [/cervical/.test(n) ? 'Cervical vertebrae' : /thoracic/.test(n) ? 'Thoracic vertebrae' : /lumbar/.test(n) ? 'Lumbar vertebrae' : 'Other'].filter((x) => x !== 'Other');
    case 'Pelvis':
      if (/sacrum|coccyx/.test(n)) return [];
      return [u.side === 'L' ? 'Left hip bone' : 'Right hip bone'];
    case 'Lungs':
      if (/bronch(?!opulmonary)|trache/.test(n)) return ['Airways'];
      return [/\bleft\b|lingula/.test(n) || u.side === 'L' ? 'Left lung' : 'Right lung'];
    case 'Liver':
      if (/ligament|ligamentum/.test(n)) return ['Ligaments'];
      if (/segment|lobe/.test(n)) return ['Segments and lobes'];
      return [];
    case 'Heart': {
      if (/atrium|ventricle|septum|valve|papillary/.test(n) && !/vein|artery|branch/.test(n)) return ['Chambers, septum and valves'];
      if (/coronary|cardiac vein|coronary sinus|marginal|descending artery|circumflex|diagonal|ventricular branch|oblique vein/.test(n)) return ['Coronary vessels'];
      if (/pulmonary/.test(n)) return ['Pulmonary vessels'];
      return ['Great vessels'];
    }
    case 'Blood vessels': {
      const kind = /vein|venous|vena|sinus/.test(n) ? 'Veins' : 'Arteries';
      const y = (u.bbox[0][1] + u.bbox[1][1]) / 2;
      const reg = /ophthalm|retinal|ciliary|cerebr|carotid|jugular|vertebral|facial|lingual|temporal/.test(n) || y > 0.5 ? 'Head and neck'
        : /uterine|ovarian|iliac|vesical|rectal|pudendal|gluteal|sacral|obturator|vaginal/.test(n) || y < -0.02 ? 'Pelvis'
        : y > 0.24 && /pulmonary|bronchial|subclavian|brachiocephalic|thoracic|azygos|intercostal|aortic arch|ascending aorta/.test(n) ? 'Thorax' : 'Abdomen';
      return [kind, reg];
    }
    case 'Ureters':
      return [u.side === 'L' ? 'Left ureter and renal pelvis' : 'Right ureter and renal pelvis'];
    case 'Left lower limb': case 'Right lower limb':
      if (/ligament|meniscus|cartilage/.test(n)) return ['Knee joint'];
      return [];
    default:
      return [];
  }
}
const SYS_NAME = { integumentary: 'Integumentary system', muscular: 'Muscular system', skeletal: 'Skeletal system', nervous: 'Nervous system', cardiovascular: 'Cardiovascular system', respiratory: 'Respiratory system', digestive: 'Digestive system', urinary: 'Urinary system', reproductive: 'Reproductive system (female)', endocrine: 'Endocrine glands', lymphatic: 'Lymphoid organs', sensory: 'Sense organs' };
const SYSTEMS = ['integumentary', 'muscular', 'skeletal', 'nervous', 'cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'sensory'];
const nodes = new Map();
const ensure = (id, name, system, parent, kind = 'group') => {
  if (!nodes.has(id)) { nodes.set(id, { id, name, system, kind, parent, children: [] }); if (parent) nodes.get(parent).children.push(id); }
  return id;
};
for (const u of units) {
  ensure(`sys:${u.system}`, SYS_NAME[u.system], u.system, null, 'system');
  let cur = `sys:${u.system}`;
  const pathParts = [];
  for (const lab of [u.group, ...subgroup(u)].filter(Boolean)) {
    pathParts.push(lab);
    cur = ensure(`grp:${u.system}/${pathParts.map(slug).join('/')}`, cap(lab), u.system, cur);
  }
  const sid = `F:${u.id}`;
  nodes.set(sid, { id: sid, name: u.name, system: u.system, kind: 'structure', parent: cur, children: [], units: [u.id], unit: u });
  nodes.get(cur).children.push(sid);
}
// collapse groups with a single child (except system roots)
let changed = true;
while (changed) {
  changed = false;
  for (const n of [...nodes.values()]) {
    if (n.kind === 'group' && n.children.length === 1) {
      const c = nodes.get(n.children[0]); const p = nodes.get(n.parent);
      c.parent = p.id; p.children[p.children.indexOf(n.id)] = c.id; nodes.delete(n.id); changed = true;
    }
  }
}
// disambiguate duplicate display names among siblings (e.g. vessel segments)
const unitsUnder = (id) => { const n = nodes.get(id); return n.units ? [...n.units] : n.children.flatMap(unitsUnder); };
const ubox = new Map(units.map((u) => [u.id, u.bbox]));
const bboxOf = (us) => { const bs = us.map((u) => ubox.get(u)); return [[0, 1, 2].map((i) => Math.min(...bs.map((b) => b[0][i]))), [0, 1, 2].map((i) => Math.max(...bs.map((b) => b[1][i])))]; };
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
const sortKey = (id) => { const n = nodes.get(id); let s = n.name.toLowerCase(); for (const [w, v] of Object.entries(ORD)) s = s.replace(new RegExp(`\\b${w}\\b`), String(v).padStart(2, '0')); s = s.replace(/\d+/g, (d) => d.padStart(3, '0')); return `${n.kind === 'structure' ? 1 : 0}${s}`; };

const reg = { version: 1, source: 'HuBMAP HRA 3D Reference Object Library (Visible Human Female)', model: 'female', structures: {}, units: {}, systems: SYSTEMS.filter((s) => nodes.has(`sys:${s}`)), transform: { note: 'HRA VH_F frame (metres, y-up, +z anterior) shifted so the skin bounding-box centre is at the origin', shift: C } };
for (const n of nodes.values()) {
  const us = unitsUnder(n.id);
  const rec = { id: n.id, name: n.name, system: n.system, kind: n.kind, parent: n.parent, children: [...n.children].sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1)), bbox: bboxOf(us), unitCount: us.length };
  if (n.kind === 'structure') {
    const u = n.unit;
    rec.units = n.units;
    if (u.side) rec.side = u.side;
    if (u.ont) rec.ont = u.ont;
    if (u.label && u.label.toLowerCase() !== u.name.toLowerCase().replace(/^(left|right) /, '')) rec.synonyms = [u.label.toLowerCase()];
    if (LANDMARK.test(u.id)) rec.landmark = true;
    rec.tris = u.geo.idx.length / 3;
    rec.hraNode = u.id;
  }
  reg.structures[n.id] = rec;
}
for (const u of units) reg.units[u.id] = { structure: `F:${u.id}`, system: u.system };

// ---------- meshes ----------
const ERR = { integumentary: 0.0006, muscular: 0.0005, skeletal: 0.0003, cardiovascular: 0.00035, nervous: 0.0003, respiratory: 0.0004, digestive: 0.0004, sensory: 0.00015, urinary: 0.0003, reproductive: 0.0003, endocrine: 0.0003, lymphatic: 0.0003 };
fs.mkdirSync(path.join(OUT_MODELS, 'hi'), { recursive: true });
fs.mkdirSync(OUT_DATA, { recursive: true });
const manifest = { generated: new Date().toISOString(), systems: {}, units: {} };
const topGroup = (sid) => { let id = sid, p = nodes.get(id).parent; while (p && !p.startsWith('sys:')) { id = p; p = nodes.get(id).parent; } return id; };
for (const sys of reg.systems) {
  const su = units.filter((u) => u.system === sys);
  const lo = [], hiChunks = {}; let tLo = 0, tHi = 0;
  for (const u of su) {
    const g1 = simplify(u.geo, ERR[sys]);
    lo.push({ id: u.id, g: g1 });
    tLo += g1.idx.length / 3; tHi += u.geo.idx.length / 3;
    const chunk = `${sys}__${slug(topGroup(`F:${u.id}`))}`;
    (hiChunks[chunk] ??= []).push({ id: u.id, g: u.geo });
    manifest.units[u.id] = { lo: g1.idx.length / 3, hi: u.geo.idx.length / 3, chunk };
  }
  const bytes = await writeGlb(path.join(OUT_MODELS, `${sys}.glb`), lo);
  const chunks = {};
  for (const [c, items] of Object.entries(hiChunks)) chunks[c] = await writeGlb(path.join(OUT_MODELS, 'hi', `${c}.glb`), items);
  manifest.systems[sys] = { file: `${sys}.glb`, bytes, tris: tLo, trisFull: tHi, units: su.length, hiChunks: chunks };
  console.log(sys.padEnd(15), su.length, 'lo', tLo, (bytes / 1e6).toFixed(2) + 'MB', 'hi', tHi, (Object.values(chunks).reduce((a, b) => a + b, 0) / 1e6).toFixed(2) + 'MB');
}
fs.writeFileSync(path.join(OUT_DATA, 'registry.json'), JSON.stringify(reg));
fs.writeFileSync(path.join(OUT_DATA, 'manifest.json'), JSON.stringify(manifest));
console.log('structures', Object.keys(reg.structures).length);
