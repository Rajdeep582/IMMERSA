import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { quantize, meshopt, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';

const OBJ_DIR = process.env.BP3D_OBJ_DIR ?? 'raw/bp3d/isa/isa_BP3D_4.0_obj_99';
const OUT = process.argv[2] || 'public/models/male';
const reg = JSON.parse(fs.readFileSync('public/data/male/registry.json', 'utf8'));
const { YC, ZC } = reg.transform;
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;

function parseObj(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const pos = [], nrm = [], idx = [];
  let ln = 0;
  for (const line of txt.split('\n')) {
    if (line.startsWith('v ')) { const p = line.split(/\s+/); const x = +p[1], y = +p[2], z = +p[3]; pos.push(x / 1000, (z - ZC) / 1000, -(y - YC) / 1000); }
    else if (line.startsWith('vn ')) { const p = line.split(/\s+/); nrm.push(+p[1], +p[3], -(+p[2])); ln++; }
    else if (line.startsWith('f ')) {
      const p = line.trim().split(/\s+/).slice(1).map((t) => parseInt(t.split('/')[0], 10) - 1);
      for (let i = 1; i + 1 < p.length; i++) idx.push(p[0], p[i], p[i + 1]);
    }
  }
  return { pos: new Float32Array(pos), nrm: ln * 3 === pos.length ? new Float32Array(nrm) : null, idx: new Uint32Array(idx) };
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
function compact(pos, nrm, idx) {
  const map = new Int32Array(pos.length / 3).fill(-1); let k = 0;
  const out = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) { const v = idx[i]; if (map[v] < 0) map[v] = k++; out[i] = map[v]; }
  const p = new Float32Array(k * 3), n = new Float32Array(k * 3);
  for (let v = 0; v < map.length; v++) if (map[v] >= 0) { p.set(pos.subarray(v * 3, v * 3 + 3), map[v] * 3); n.set(nrm.subarray(v * 3, v * 3 + 3), map[v] * 3); }
  return { pos: p, nrm: n, idx: out };
}
function simplify(g, errM) {
  const target = Math.max(36, Math.floor(g.idx.length * 0.02 / 3) * 3);
  const [ind] = MeshoptSimplifier.simplify(g.idx, g.pos, 3, target, errM, ['ErrorAbsolute']);
  if (ind.length >= g.idx.length * 0.95) return g;
  return compact(g.pos, g.nrm, ind);
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
async function writeGlb(file, items) {
  const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene();
  for (const { id, g } of items) {
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(buf))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(g.nrm).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(g.pos.length / 3 < 65535 ? new Uint16Array(g.idx) : g.idx).setBuffer(buf));
    scene.addChild(doc.createNode(id).setMesh(doc.createMesh(id).addPrimitive(prim)));
  }
  await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  fs.writeFileSync(file, await io.writeBinary(doc));
  return fs.statSync(file).size;
}
// error tolerances (metres) per system for the body-view LOD
const ERR = { integumentary: 0.0007, muscular: 0.0003, skeletal: 0.00018, cardiovascular: 0.00022, nervous: 0.0002, respiratory: 0.00022, digestive: 0.0003, sensory: 0.00012, urinary: 0.00025, reproductive: 0.00025, endocrine: 0.0002, lymphatic: 0.00025 };
fs.mkdirSync(path.join(OUT, 'hi'), { recursive: true });
const manifest = { generated: new Date().toISOString(), systems: {}, units: {} };
const bySys = {};
for (const [fj, u] of Object.entries(reg.units)) (bySys[u.system] ??= []).push(fj);
// hi-res chunks: by top-level group under the system
const topGroup = (sid) => { let id = sid, p = reg.structures[id].parent; while (p && !p.startsWith('sys:')) { id = p; p = reg.structures[id].parent; } return id; };
for (const [sys, fjs] of Object.entries(bySys)) {
  const lo = [], hiChunks = {}; let triLo = 0, triHi = 0;
  for (const fj of fjs.sort()) {
    const raw = parseObj(path.join(OBJ_DIR, fj + '.obj'));
    const g0 = { pos: raw.pos, nrm: raw.nrm ?? computeNormals(raw.pos, raw.idx), idx: raw.idx };
    const g1 = simplify(g0, ERR[sys]);
    lo.push({ id: fj, g: g1 }); triLo += g1.idx.length / 3; triHi += g0.idx.length / 3;
    const chunk = sys + '__' + topGroup(reg.units[fj].structure).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    (hiChunks[chunk] ??= []).push({ id: fj, g: g0 });
    manifest.units[fj] = { lo: g1.idx.length / 3, hi: g0.idx.length / 3, chunk };
  }
  const loBytes = await writeGlb(path.join(OUT, `${sys}.glb`), lo);
  const chunks = {};
  for (const [c, items] of Object.entries(hiChunks)) chunks[c] = await writeGlb(path.join(OUT, 'hi', `${c}.glb`), items);
  manifest.systems[sys] = { file: `${sys}.glb`, bytes: loBytes, tris: triLo, trisFull: triHi, units: fjs.length, hiChunks: chunks };
  console.log(sys, fjs.length, 'lo', triLo, (loBytes / 1e6).toFixed(2) + 'MB', 'hi', triHi, (Object.values(chunks).reduce((a, b) => a + b, 0) / 1e6).toFixed(2) + 'MB');
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
