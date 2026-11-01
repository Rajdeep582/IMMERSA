import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CURATED_KEYS, curatedFor } from '../src/data/curated';
import { Registry, mapSelection } from '../src/data/registry';
import type { ManifestFile, RegistryFile } from '../src/data/types';
import { CameraRig } from '../src/engine/cameraRig';
import { JOURNEYS, findNode, resolveJourney, sampleJourney } from '../src/guided/journeys';
import { TOPICS, resolveName, studyFor, topicFor } from '../src/learn';

const load = (m: 'male' | 'female') =>
  new Registry(
    JSON.parse(readFileSync(`public/data/${m}/registry.json`, 'utf8')) as RegistryFile,
    JSON.parse(readFileSync(`public/data/${m}/manifest.json`, 'utf8')) as ManifestFile,
    m,
  );
const reg = load('male');
const fem = load('female');

describe('registry', () => {
  it('every mesh unit belongs to exactly one structure and appears in the manifest', () => {
    for (const [fj, sid] of reg.unitStructure) {
      expect(reg.get(sid)?.units).toContain(fj);
      expect(reg.manifest.units[fj]).toBeDefined();
    }
    // 2,234 BodyParts3D element meshes + Z-Anatomy peripheral nerve meshes
    expect(reg.unitStructure.size).toBeGreaterThan(2234 + 200);
    expect([...reg.unitStructure.keys()].filter((u) => !u.startsWith('Z_')).length).toBe(2234);
  });
  it('hierarchy is a consistent tree rooted at systems', () => {
    for (const s of reg.structures.values()) {
      if (s.kind === 'system') expect(s.parent).toBeNull();
      else expect(reg.get(s.parent)?.children).toContain(s.id);
      for (const c of s.children) expect(reg.get(c)?.parent).toBe(s.id);
    }
  });
  it('resolves L1 by abbreviation and its path matches the vertebral hierarchy', () => {
    const r = reg.search('L1')[0]!;
    expect(r.name).toBe('First lumbar vertebra');
    expect(reg.path(r.id).map((p) => p.name)).toEqual(['Skeletal system', 'Vertebral column', 'Lumbar vertebrae', 'First lumbar vertebra']);
  });
  it('finds synonyms', () => {
    expect(reg.search('achilles')[0]?.name).toMatch(/calcaneal tendon/i);
    expect(reg.search('collarbone')[0]?.name).toMatch(/clavicle/i);
  });
  it('L1 neighbours include adjacent vertebrae and discs', () => {
    const n = reg.spatialNeighbours('FMA13072', 0.004, 10).map((r) => r.name);
    expect(n).toContain('Twelfth thoracic vertebra');
    expect(n).toContain('Second lumbar vertebra');
  });
  it('mirrors left/right counterparts', () => {
    expect(reg.counterpart('FMA24475')?.name).toBe('Right femur');
  });
  it('every curated entry matches at least one modelled node', () => {
    const all = [...reg.structures.values(), ...fem.structures.values()];
    const missing = CURATED_KEYS.filter((k) => !all.some((s) => curatedFor(s.name) === curatedFor(k) && curatedFor(s.name)));
    expect(missing).toEqual([]);
  });
});

describe('female model', () => {
  it('is a consistent tree with every unit in the manifest', () => {
    for (const s of fem.structures.values()) {
      if (s.kind === 'system') expect(s.parent).toBeNull();
      else expect(fem.get(s.parent)?.children).toContain(s.id);
    }
    for (const fj of fem.unitStructure.keys()) expect(fem.manifest.units[fj]).toBeDefined();
    expect(fem.unitStructure.size).toBeGreaterThan(800);
  });
  it('contains female-specific anatomy', () => {
    for (const n of ['Uterus', 'Cervix', 'Left ovary', 'Right ovary', 'Vagina', 'Broad ligament', 'Left mammary gland', 'Left ampulla of uterine tube'])
      expect(fem.search(n)[0]?.name, n).toBe(n);
  });
  it('shares the body frame scale with the male model', () => {
    const h = (r: Registry) => r.get('sys:integumentary')!.bbox[1][1] - r.get('sys:integumentary')!.bbox[0][1];
    expect(h(fem)).toBeGreaterThan(1.55);
    expect(h(fem)).toBeLessThan(1.8);
    expect(Math.abs(fem.center('sys:integumentary')[1])).toBeLessThan(0.01);
  });
  it('maps selections across models', () => {
    expect(fem.get(mapSelection(reg, fem, 'FMA13072'))?.name).toBe('Lumbar vertebra 1');
    expect(mapSelection(reg, fem, 'sys:skeletal')).toBe('sys:skeletal');
    expect(reg.get(mapSelection(fem, reg, fem.search('L1')[0]!.id))?.name).toBe('First lumbar vertebra');
  });
  it('left-side structures lie at +x like the male model', () => {
    expect(fem.center(fem.search('Left kidney')[0]!.id)[0]).toBeGreaterThan(0);
    expect(reg.center('FMA7205')[0]).toBeGreaterThan(0);
  });
});

describe('journeys', () => {
  const cam = new THREE.PerspectiveCamera(30, 1.6, 0.01, 20);
  it('all stage targets resolve to registry nodes', () => {
    for (const j of JOURNEYS)
      for (const s of j.stages) {
        const reg = j.model === 'female' ? fem : load('male');
        if (s.focus) expect(findNode(reg, s.focus.name, s.focus.system), `${j.id}: ${s.focus.name}`).not.toBeNull();
        if (s.ghostOutside) expect(findNode(reg, s.ghostOutside.name, s.ghostOutside.system), `${j.id}: ${s.ghostOutside.name}`).not.toBeNull();
      }
  });
  it('sampling is continuous and reversible', () => {
    const st = resolveJourney(reg, JOURNEYS[0]!, cam);
    const a = sampleJourney(st, 1.4).pose;
    const b = sampleJourney(st, 1.4001).pose;
    expect(Math.abs(a.radius - b.radius)).toBeLessThan(1e-3);
    expect(sampleJourney(st, 2).pose).toEqual(sampleJourney(st, 2).pose);
    expect(sampleJourney(st, st.length - 1).pose.target).toEqual(st[st.length - 1]!.pose.target);
  });
});

describe('camera rig', () => {
  const mk = () => new CameraRig(new THREE.PerspectiveCamera(30, 1.5, 0.01, 20), { target: [0, 0, 0], radius: 2, theta: 0, phi: Math.PI / 2 });
  const project = (rig: CameraRig, p: THREE.Vector3) => {
    rig.camera.updateMatrixWorld();
    return p.clone().project(rig.camera);
  };
  it('dolly keeps the pivot fixed on screen', () => {
    const rig = mk();
    const pivot = new THREE.Vector3(0.3, -0.2, 0);
    const before = project(rig, pivot);
    rig.dollyAt(0.5, pivot);
    for (let i = 0; i < 200; i++) rig.update(1 / 60);
    const after = project(rig, pivot);
    expect(after.x).toBeCloseTo(before.x, 3);
    expect(after.y).toBeCloseTo(before.y, 3);
    expect(rig.radius).toBeCloseTo(1, 3);
  });
  it('clamps at the detail limit and reports it', () => {
    const rig = mk();
    let hit = 0;
    rig.onDetailLimit = () => hit++;
    for (let i = 0; i < 80; i++) rig.dollyAt(0.5, null);
    for (let i = 0; i < 300; i++) rig.update(1 / 60);
    expect(rig.radius).toBeCloseTo(rig.minRadius, 4);
    expect(hit).toBeGreaterThan(0);
  });
  it('interrupting a flight freezes in place without a jump; retargeting continues from current state', () => {
    const rig = mk();
    rig.flyTo({ target: [0.5, 0.5, 0], radius: 0.3, theta: 1, phi: 1.2 });
    for (let i = 0; i < 20; i++) rig.update(1 / 60);
    const mid = rig.camera.position.clone();
    rig.rotate(0, 0, 600);
    rig.update(1 / 60);
    expect(rig.camera.position.distanceTo(mid)).toBeLessThan(0.02);
    expect(rig.isAnimating).toBe(false);
    rig.flyTo({ target: [-0.4, 0, 0], radius: 1, theta: -1, phi: 1.5 });
    const p0 = rig.camera.position.clone();
    rig.update(1 / 60);
    expect(rig.camera.position.distanceTo(p0)).toBeLessThan(0.05);
    for (let i = 0; i < 400; i++) rig.update(1 / 60);
    expect(rig.pose.target[0]).toBeCloseTo(-0.4, 3);
  });
});

describe('peripheral nervous system', () => {
  for (const [m, r] of [['male', reg], ['female', fem]] as const) {
    it(`${m}: major nerves and plexuses are modelled and selectable`, () => {
      for (const n of ['Brachial plexus', 'Lumbar plexus', 'Sacral plexus', 'Sciatic nerve', 'Median nerve', 'Ulnar nerve', 'Radial nerve', 'Femoral nerve', 'Vagus nerve (CN X)', 'Sympathetic trunk', 'Intercostal nerves', 'Cauda equina', 'Phrenic nerve', 'Ganglia of sympathetic trunk']) {
        const rec = resolveName(r, n);
        expect(rec, `${m}: ${n}`).toBeDefined();
        expect(r.unitsUnder(rec!.id).length).toBeGreaterThan(0);
      }
      const pns = r.get('grp:nervous/peripheral-nervous-system')!;
      expect(pns.parent).toBe('sys:nervous');
      expect(r.unitsUnder(pns.id).length).toBeGreaterThan(200);
    });
  }
});

describe('learning content', () => {
  it('every topic follows the standard section order and has a self-test and references', () => {
    const order = ['overview', 'structure', 'function', 'clinical', 'key'];
    for (const t of TOPICS) {
      expect(t.sections.map((s) => s.id), t.id).toEqual(order);
      expect(t.quiz.length, t.id).toBeGreaterThan(0);
      expect(t.refs.length, t.id).toBeGreaterThan(0);
      if (t.parent) expect(TOPICS.some((p) => p.id === t.parent), t.id).toBe(true);
    }
  });
  it('topic focus nodes and [[links]] resolve in at least one body model', () => {
    const texts: string[] = [];
    for (const t of TOPICS) {
      expect(resolveName(reg, t.focus.male) ?? resolveName(fem, t.focus.female), `${t.id} focus`).toBeDefined();
      const walk = (x: unknown): void => (typeof x === 'string' ? void texts.push(x) : Array.isArray(x) ? x.forEach(walk) : x && typeof x === 'object' ? Object.values(x).forEach(walk) : undefined);
      walk(t.sections);
    }
    const links = new Set([...texts.join('\n').matchAll(/\[\[([^\]|]+)/g)].map((m) => m[1]!));
    const missing = [...links].filter((l) => !resolveName(reg, l) && !resolveName(fem, l));
    expect(missing).toEqual([]);
  });
  it('every node in both models gets a study card and a topic page', () => {
    for (const r of [reg, fem]) {
      for (const rec of r.structures.values()) {
        const s = studyFor(r, rec);
        expect(s.what.length).toBeGreaterThan(5);
        expect(topicFor(r, rec)).toBeDefined();
      }
    }
  });
  it('nerves map to the nervous-system guides', () => {
    expect(topicFor(reg, resolveName(reg, 'Right median nerve'))!.id).toBe('peripheral-nerves');
    expect(topicFor(reg, resolveName(reg, 'Right facial nerve (CN VII)'))!.id).toBe('cranial-nerves');
    expect(studyFor(reg, resolveName(reg, 'Right sciatic nerve')!).source).toBe('curated');
    expect(topicFor(fem, resolveName(fem, 'Uterus'))!.id).toBe('reproductive');
  });
});
