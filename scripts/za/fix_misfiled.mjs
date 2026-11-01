// BodyParts3D FMA13884 "Wall of ventricle" (FJ2428) is the cardiac ventricular wall but the registry
// build filed it under the brain's ventricular system. Move it to the heart (registry + meshes).
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, mergeDocuments, unpartition, prune } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const PUB = '/home/claude/immersa/public', ORIG = '/home/claude/pipeline/za/orig/male/cv';
const FJ = 'FJ2428', SID = 'FMA13884', HEART_GRP = 'grp:cardiovascular/heart/chambers-and-valves';
async function move(fromFile, toOrig, outTo) {
  const src = await io.read(fromFile);
  const node = src.getRoot().listNodes().find((n) => n.getName() === FJ);
  if (!node) throw new Error('node missing in ' + fromFile);
  // extract: copy the source doc, keep only FJ node
  const only = await io.read(fromFile);
  for (const n of only.getRoot().listNodes()) if (n.getName() !== FJ) n.dispose();
  await only.transform(prune());
  node.dispose();
  await src.transform(prune(), unpartition(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  fs.writeFileSync(fromFile, await io.writeBinary(src));
  const dst = await io.read(toOrig);
  mergeDocuments(dst, only);
  const scene = dst.getRoot().listScenes()[0];
  for (const s of dst.getRoot().listScenes().slice(1)) { for (const c of s.listChildren()) scene.addChild(c); s.dispose(); }
  await dst.transform(unpartition(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  fs.writeFileSync(outTo, await io.writeBinary(dst));
}
// body view (nervous.glb was just rebuilt from the original by build_nerves.mjs) and hi chunks
await move(`${PUB}/models/male/nervous.glb`, `${ORIG}/cardiovascular.glb`, `${PUB}/models/male/cardiovascular.glb`);
fs.copyFileSync(`${ORIG}/nervous__grp-nervous-brain.glb`, `${PUB}/models/male/hi/nervous__grp-nervous-brain.glb`);
await move(`${PUB}/models/male/hi/nervous__grp-nervous-brain.glb`, `${ORIG}/cardiovascular__grp-cardiovascular-heart.glb`, `${PUB}/models/male/hi/cardiovascular__grp-cardiovascular-heart.glb`);
// registry + manifest
const rp = `${PUB}/data/male/registry.json`, mp = `${PUB}/data/male/manifest.json`;
const reg = JSON.parse(fs.readFileSync(rp, 'utf8')), man = JSON.parse(fs.readFileSync(mp, 'utf8'));
const S = reg.structures, rec = S[SID];
const ancestors = (id) => { const out = []; let p = S[id].parent; while (p) { out.push(p); p = S[p].parent; } return out; };
for (const a of ancestors(SID)) S[a].unitCount -= 1;
S[rec.parent].children = S[rec.parent].children.filter((c) => c !== SID);
rec.system = 'cardiovascular'; rec.parent = HEART_GRP; rec.name = 'Wall of ventricle';
S[HEART_GRP].children.push(SID);
for (const a of ancestors(SID)) {
  S[a].unitCount += 1;
  for (let k = 0; k < 3; k++) { S[a].bbox[0][k] = Math.min(S[a].bbox[0][k], rec.bbox[0][k]); S[a].bbox[1][k] = Math.max(S[a].bbox[1][k], rec.bbox[1][k]); }
}
reg.units[FJ] = { structure: SID, system: 'cardiovascular' };
const u = man.units[FJ];
man.units[FJ] = { ...u, chunk: 'cardiovascular__grp-cardiovascular-heart' };
const n = man.systems.nervous, c = man.systems.cardiovascular;
n.tris -= u.lo; n.trisFull -= u.hi; n.units -= 1; c.tris += u.lo; c.trisFull += u.hi; c.units += 1;
n.bytes = fs.statSync(`${PUB}/models/male/nervous.glb`).size; c.bytes = fs.statSync(`${PUB}/models/male/cardiovascular.glb`).size;
n.hiChunks['nervous__grp-nervous-brain'] = fs.statSync(`${PUB}/models/male/hi/nervous__grp-nervous-brain.glb`).size;
c.hiChunks['cardiovascular__grp-cardiovascular-heart'] = fs.statSync(`${PUB}/models/male/hi/cardiovascular__grp-cardiovascular-heart.glb`).size;
fs.writeFileSync(rp, JSON.stringify(reg)); fs.writeFileSync(mp, JSON.stringify(man));
console.log('moved', FJ, 'to heart');
