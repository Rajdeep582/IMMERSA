import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [file, out] = process.argv.slice(2);
const doc = await io.read(file);
const pts = [];
for (const node of doc.getRoot().listNodes()) {
  const p = node.getMesh()?.listPrimitives()[0]; if (!p) continue;
  const M = node.getWorldMatrix(); const P = p.getAttribute('POSITION'); const v = [0,0,0];
  for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v);
    pts.push(M[0]*v[0]+M[4]*v[1]+M[8]*v[2]+M[12], M[1]*v[0]+M[5]*v[1]+M[9]*v[2]+M[13], M[2]*v[0]+M[6]*v[1]+M[10]*v[2]+M[14]); }
}
fs.writeFileSync(out, Buffer.from(new Float32Array(pts).buffer));
console.log(file, pts.length / 3);
