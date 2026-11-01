// Dump world-space vertices of named structures (by registry unit ids) from hi chunks → JSON {name: [x,y,z,...]}
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [model, out, ...names] = process.argv.slice(2);
const root = `/home/claude/immersa/public`;
const reg = JSON.parse(fs.readFileSync(`/home/claude/pipeline/za/orig/${model}/registry.json`, 'utf8'));
const man = JSON.parse(fs.readFileSync(`/home/claude/pipeline/za/orig/${model}/manifest.json`, 'utf8'));
const byName = new Map(Object.values(reg.structures).map((s) => [s.name.toLowerCase(), s]));
const unitsUnder = (s) => [...(s.units ?? []), ...s.children.flatMap((c) => unitsUnder(reg.structures[c]))];
const res = {};
const cache = new Map();
for (const n of names) {
  const s = byName.get(n.toLowerCase());
  if (!s) { console.log('missing', n); continue; }
  const pts = [];
  for (const u of unitsUnder(s)) {
    const chunk = man.units[u].chunk;
    if (!cache.has(chunk)) cache.set(chunk, await io.read(`${root}/models/${model}/hi/${chunk}.glb`));
    const doc = cache.get(chunk);
    const node = doc.getRoot().listNodes().find((x) => x.getName() === u);
    const p = node?.getMesh()?.listPrimitives()[0]; if (!p) continue;
    const M = node.getWorldMatrix(); const P = p.getAttribute('POSITION'); const v = [0, 0, 0];
    for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); pts.push(M[0]*v[0]+M[4]*v[1]+M[8]*v[2]+M[12], M[1]*v[0]+M[5]*v[1]+M[9]*v[2]+M[13], M[2]*v[0]+M[6]*v[1]+M[10]*v[2]+M[14]); }
  }
  res[n] = pts.map((x) => +x.toFixed(5));
  console.log(n, pts.length / 3);
}
fs.writeFileSync(out, JSON.stringify(res));
