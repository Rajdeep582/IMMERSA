// Append Z-Anatomy peripheral nerves (already transformed into each model's frame by apply.py)
// to the nervous-system body-view GLB, add a full-resolution hi chunk, and extend registry + manifest.
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { quantize, meshopt, mergeDocuments, unpartition, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await Promise.all([MeshoptSimplifier.ready, MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const ROOT = '/home/claude/immersa/public';
const ZA = '/home/claude/pipeline/za';
const data = JSON.parse(fs.readFileSync(path.join(ZA, 'nerves_xf.json'), 'utf8'));

function weld(pos, idx) {
  const key = new Map(); const remap = new Uint32Array(pos.length / 3); const np = [];
  for (let v = 0; v < pos.length / 3; v++) {
    const k = `${Math.round(pos[v * 3] * 1e5)},${Math.round(pos[v * 3 + 1] * 1e5)},${Math.round(pos[v * 3 + 2] * 1e5)}`;
    let id = key.get(k); if (id === undefined) { id = np.length / 3; key.set(k, id); np.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); }
    remap[v] = id;
  }
  const tri = [];
  for (let i = 0; i + 2 < idx.length; i += 3) { const a = remap[idx[i]], b = remap[idx[i + 1]], c = remap[idx[i + 2]]; if (a !== b && b !== c && a !== c) tri.push(a, b, c); }
  return { pos: new Float32Array(np), idx: new Uint32Array(tri) };
}
function normals(pos, idx) {
  const n = new Float32Array(pos.length);
  const ang = (ax, ay, az, bx, by, bz) => { const l = Math.hypot(ax, ay, az) * Math.hypot(bx, by, bz) || 1; return Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by + az * bz) / l))); };
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const wx = pos[c] - pos[b], wy = pos[c + 1] - pos[b + 1], wz = pos[c + 2] - pos[b + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (!l) continue; nx /= l; ny /= l; nz /= l;
    const wa = ang(ux, uy, uz, vx, vy, vz), wb = ang(-ux, -uy, -uz, wx, wy, wz), wc = Math.PI - wa - wb;
    for (const [k, w] of [[a, wa], [b, wb], [c, wc]]) { n[k] += nx * w; n[k + 1] += ny * w; n[k + 2] += nz * w; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}
function compact(pos, idx) {
  const map = new Int32Array(pos.length / 3).fill(-1); let k = 0; const out = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) { const v = idx[i]; if (map[v] < 0) map[v] = k++; out[i] = map[v]; }
  const p = new Float32Array(k * 3); for (let v = 0; v < map.length; v++) if (map[v] >= 0) p.set(pos.subarray(v * 3, v * 3 + 3), map[v] * 3);
  return { pos: p, idx: out };
}
function simplify(g) {
  const target = Math.max(48, Math.floor((g.idx.length * 0.3) / 3) * 3);
  const [ind] = MeshoptSimplifier.simplify(g.idx, g.pos, 3, target, 0.00012, ['ErrorAbsolute']);
  if (ind.length >= g.idx.length * 0.95) return g;
  return compact(g.pos, ind);
}
function docFor(items) {
  const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene();
  for (const { id, g } of items) {
    const nrm = normals(g.pos, g.idx);
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(buf))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(nrm).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(g.pos.length / 3 < 65535 ? new Uint16Array(g.idx) : g.idx).setBuffer(buf));
    scene.addChild(doc.createNode(id).setMesh(doc.createMesh(id).addPrimitive(prim)));
  }
  return doc;
}
const bboxOf = (pos) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], pos[i + k]); mx[k] = Math.max(mx[k], pos[i + k]); } return [mn, mx].map((a) => a.map((x) => +x.toFixed(5))); };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Collection names → display group names; flat "Nerves" members re-homed to their anatomical group.
const RENAME = {
  'Automatic division of peripheral nervous system': 'Autonomic nervous system',
  'Thoracolumbar part of autonomic division': 'Sympathetic (thoracolumbar) division',
};
const cn = (s) => s.replace(/ \(([IVX]+)\)$/, ' (CN $1)');
function groupPath(n) {
  let p = n.path.slice();
  if (p[0] === 'Nerves' || p.length === 0) {
    const b = n.za.replace(/\.(l|r)$/, '');
    if (/Abducens|Trochlear/.test(b)) p = ['Cranial nerves', b];
    else if (/root of spinal nerve|Cauda equina/i.test(b)) p = ['Spinal nerves', 'Spinal nerve roots and cauda equina'];
    else p = ['Spinal nerves', 'Lumbosacral plexus', 'Sacral plexus'];
  }
  return p.map((x) => cn(RENAME[x] ?? x));
}

for (const model of ['male', 'female']) {
  const reg = JSON.parse(fs.readFileSync(path.join(ZA, 'orig', model, 'registry.json'), 'utf8'));
  const man = JSON.parse(fs.readFileSync(path.join(ZA, 'orig', model, 'manifest.json'), 'utf8'));
  const S = reg.structures;
  const ROOTG = 'grp:nervous/peripheral-nervous-system';
  const CHUNK = 'nervous__grp-nervous-peripheral-nervous-system';
  const lo = [], hi = [];
  const ensure = (id, name, parent) => {
    if (!S[id]) { S[id] = { id, name, system: 'nervous', kind: 'group', parent, children: [], bbox: [[1e9, 1e9, 1e9], [-1e9, -1e9, -1e9]], unitCount: 0 }; S[parent].children.push(id); }
    return id;
  };
  ensure(ROOTG, 'Peripheral nervous system', 'sys:nervous');
  const ensureTop = (id) => ensure(id, 'Spinal cord', 'sys:nervous');
  let tLo = 0, tHi = 0;
  for (const n of data[model]) {
    const w = weld(new Float32Array(n.v), new Uint32Array(n.t));
    if (w.idx.length < 36) continue;
    // Z-Anatomy nerve tubes are schematic (≈0.2–2 mm radius). Inflate by 0.5 mm along the normals
    // toward real calibre so peripheral branches stay visible at body scale; paths are unchanged.
    const isCord = n.path[0] === '__cord__';
    const isAns = n.path[0] === '__ans__';
    if (!isCord && !isAns && n.kind !== 'constructed') { const nn = normals(w.pos, w.idx); for (let i = 0; i < w.pos.length; i++) w.pos[i] += nn[i] * 0.0005; }
    const g1 = simplify(w);
    lo.push({ id: n.id, g: g1 }); hi.push({ id: n.id, g: w });
    tLo += g1.idx.length / 3; tHi += w.idx.length / 3;
    let parent = ROOTG, gid = ROOTG;
    if (isAns) {
      parent = ensure('grp:nervous/pns/autonomic-nervous-system', 'Autonomic nervous system', ROOTG);
      parent = ensure('grp:nervous/pns/autonomic-nervous-system/sympathetic-thoracolumbar-division', 'Sympathetic (thoracolumbar) division', parent);
      parent = ensure('grp:nervous/pns/autonomic-nervous-system/sympathetic-thoracolumbar-division/sympathetic-trunk', 'Sympathetic trunk', parent);
    } else if (isCord) {
      parent = gid = 'grp:nervous/spinal-cord';
      if (!S[parent]) ensureTop(parent);
      parent = ensure(`${parent}/${slug(n.path[1])}`, n.path[1], parent);
    } else for (const seg of groupPath(n)) { gid = `${gid}/${slug(seg)}`.replace('grp:nervous/peripheral-nervous-system/', 'grp:nervous/pns/'); if (!gid.startsWith('grp:')) gid = 'grp:nervous/pns/' + slug(seg); parent = ensure(gid, seg, parent); }
    const sid = `Z:${n.id}`;
    const bb = bboxOf(w.pos);
    S[sid] = { id: sid, name: n.name, system: 'nervous', kind: 'structure', parent, children: [], bbox: bb, unitCount: 1, units: [n.id], tris: w.idx.length / 3, ...(n.kind === 'constructed' ? { constructed: true } : { zaNode: n.za }), ...(n.side ? { side: n.side } : {}) };
    S[parent].children.push(sid);
    reg.units[n.id] = { structure: sid, system: 'nervous' };
    man.units[n.id] = { lo: g1.idx.length / 3, hi: w.idx.length / 3, chunk: CHUNK };
    // propagate bounds and unit counts to ancestors
    let a = parent;
    while (a) { const r = S[a]; r.unitCount += 1; for (let k = 0; k < 3; k++) { r.bbox[0][k] = Math.min(r.bbox[0][k], bb[0][k]); r.bbox[1][k] = Math.max(r.bbox[1][k], bb[1][k]); } a = r.parent; }
  }
  // body view: merge into existing nervous.glb
  const target = await io.read(path.join(ZA, 'orig', model, 'nervous.glb'));
  const add = docFor(lo);
  await add.transform(quantize({ quantizePosition: 14, quantizeNormal: 8 }));
  const map = mergeDocuments(target, add);
  const scene = target.getRoot().getDefaultScene() ?? target.getRoot().listScenes()[0];
  for (const s of target.getRoot().listScenes()) if (s !== scene) { for (const c of s.listChildren()) scene.addChild(c); s.dispose(); }
  await target.transform(unpartition(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  const bodyFile = path.join(ROOT, 'models', model, 'nervous.glb');
  fs.writeFileSync(bodyFile, await io.writeBinary(target));
  const hiDoc = docFor(hi);
  await hiDoc.transform(quantize({ quantizePosition: 14, quantizeNormal: 8 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  const hiFile = path.join(ROOT, 'models', model, 'hi', `${CHUNK}.glb`);
  fs.writeFileSync(hiFile, await io.writeBinary(hiDoc));
  const ns = man.systems.nervous;
  ns.bytes = fs.statSync(bodyFile).size; ns.tris += tLo; ns.trisFull += tHi; ns.units += lo.length; ns.hiChunks[CHUNK] = fs.statSync(hiFile).size;
  fs.writeFileSync(path.join(ROOT, 'data', model, 'registry.json'), JSON.stringify(reg));
  fs.writeFileSync(path.join(ROOT, 'data', model, 'manifest.json'), JSON.stringify(man));
  console.log(model, 'nerves', lo.length, 'lo tris', tLo, 'hi tris', tHi, 'body', (ns.bytes / 1e6).toFixed(2) + 'MB', 'hi', (ns.hiChunks[CHUNK] / 1e6).toFixed(2) + 'MB');
}
