import * as THREE from 'three';
import type { Registry } from '../data/registry';
import { defaultOpacities, type SystemOpacity } from '../data/systems';
import type { BodyModel, CameraPose, SystemId } from '../data/types';
import { HOME_POSE, fitDistance } from '../engine/cameraRig';

export interface StageDef {
  title: string;
  text: string;
  /** Registry node to frame, by exact name (optionally restricted to a system). */
  focus?: { name: string; system?: SystemId };
  /** System opacities for this stage (merged over the journey base). */
  layers?: Partial<SystemOpacity>;
  /** Ghost everything outside this node. */
  ghostOutside?: { name: string; system?: SystemId };
  select?: boolean;
  view?: { theta?: number; phi?: number };
  margin?: number;
}

export interface JourneyDef {
  id: string;
  model: BodyModel;
  title: string;
  blurb: string;
  base: Partial<SystemOpacity>;
  stages: StageDef[];
}

const off = (ids: SystemId[]): Partial<SystemOpacity> => Object.fromEntries(ids.map((i) => [i, 0]));
const VISCERA: SystemId[] = ['respiratory', 'digestive', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'sensory'];

export const JOURNEYS: JourneyDef[] = [
  {
    id: 'spine',
    model: 'male',
    title: 'Into the spine',
    blurb: 'From the whole body to the first lumbar vertebra.',
    base: {},
    stages: [
      { title: 'The human body', text: 'A complete body reconstructed from the BodyParts3D dataset: 2,234 separately segmented meshes. Scroll to travel inward.', layers: { integumentary: 0.9 } },
      {
        title: 'Skeletal system',
        text: 'Removing the skin and viscera leaves the skeleton — the axial skeleton (skull, vertebral column, thoracic cage) and the appendicular skeleton of the limbs and girdles.',
        layers: { integumentary: 0, ...off(['muscular', 'cardiovascular', 'nervous', ...VISCERA]) },
        focus: { name: 'Skeletal system' },
        view: { theta: 0.55 },
      },
      {
        title: 'Vertebral column',
        text: '7 cervical, 12 thoracic and 5 lumbar vertebrae above the sacrum. Seen from behind and to the side, its four curvatures become visible.',
        layers: { integumentary: 0, ...off(['muscular', 'cardiovascular', 'nervous', ...VISCERA]) },
        focus: { name: 'Vertebral column' },
        view: { theta: Math.PI * 0.72, phi: Math.PI * 0.5 },
        margin: 1.2,
      },
      {
        title: 'Lumbar region',
        text: 'The five lumbar vertebrae carry the greatest axial load of the movable column. Neighbouring structures fade to keep the region legible.',
        layers: { integumentary: 0, ...off(['muscular', 'cardiovascular', 'nervous', ...VISCERA]) },
        focus: { name: 'Lumbar vertebrae' },
        ghostOutside: { name: 'Vertebral column' },
        view: { theta: Math.PI * 0.7, phi: Math.PI * 0.47 },
      },
      {
        title: 'L1 — first lumbar vertebra',
        text: 'L1 sits at the thoracolumbar junction between T12 and L2. Open the 3D inspector to examine its full-resolution mesh independently.',
        layers: { integumentary: 0, ...off(['muscular', 'cardiovascular', 'nervous', ...VISCERA]) },
        focus: { name: 'First lumbar vertebra' },
        ghostOutside: { name: 'Lumbar vertebrae' },
        select: true,
        view: { theta: Math.PI * 0.68, phi: Math.PI * 0.45 },
        margin: 1.6,
      },
    ],
  },
  {
    id: 'heart',
    model: 'male',
    title: 'Heart and great vessels',
    blurb: 'Thorax, heart, chambers and coronary circulation.',
    base: { integumentary: 0.08, muscular: 0 },
    stages: [
      { title: 'Circulation', text: 'Arteries (red) carry blood away from the heart and veins (blue) return it. Pulmonary arteries are blue and pulmonary veins red by convention, reflecting oxygen content.', layers: { cardiovascular: 1, skeletal: 0.35, ...off(VISCERA), nervous: 0 }, focus: { name: 'Cardiovascular system' } },
      { title: 'The thorax', text: 'The heart lies in the middle mediastinum between the lungs. Here only the airways of the lungs are modelled, not their outer surface.', layers: { cardiovascular: 1, skeletal: 0.3, respiratory: 0.5, ...off(['digestive', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'sensory']), nervous: 0 }, focus: { name: 'Heart' }, margin: 2.6, view: { theta: 0.25 } },
      { title: 'The heart', text: 'A four-chambered muscular pump. Its right side drives the pulmonary circuit and its left side the systemic circuit.', layers: { cardiovascular: 1, skeletal: 0.15, ...off([...VISCERA, 'nervous']) }, focus: { name: 'Heart' }, ghostOutside: { name: 'Heart' }, view: { theta: 0.35 } },
      { title: 'Chambers and valves', text: 'Cavities of the atria and ventricles with valve leaflets and papillary muscles, each a separately selectable mesh.', layers: { cardiovascular: 1, skeletal: 0, ...off([...VISCERA, 'nervous']) }, focus: { name: 'Chambers and valves' }, ghostOutside: { name: 'Chambers and valves' }, view: { theta: -0.4 } },
      { title: 'Coronary circulation', text: 'The heart muscle has its own supply: coronary arteries branching from the base of the aorta and cardiac veins draining toward the coronary sinus.', layers: { cardiovascular: 1, skeletal: 0, ...off([...VISCERA, 'nervous']) }, focus: { name: 'Coronary vessels' }, ghostOutside: { name: 'Heart' }, select: true, view: { theta: 0.3 } },
    ],
  },
  {
    id: 'brain',
    model: 'male',
    title: 'The brain',
    blurb: 'Cerebrum, deep nuclei, brainstem and cerebellum.',
    base: { integumentary: 0.1, muscular: 0, cardiovascular: 0 },
    stages: [
      { title: 'Head', text: 'The brain occupies the cranial cavity, enclosed by the eight cranial bones.', layers: { skeletal: 0.9, nervous: 1, ...off(VISCERA) }, focus: { name: 'Skull' }, view: { theta: 0.6 } },
      { title: 'Brain', text: 'With the skull faded, the cerebral hemispheres, brainstem and cerebellum are visible. The cortex in this dataset is divided into selected gyri and lobes.', layers: { skeletal: 0.12, nervous: 1, ...off(VISCERA) }, focus: { name: 'Brain' }, view: { theta: 0.9 } },
      { title: 'Deep structures', text: 'Hidden inside each hemisphere: basal nuclei (caudate, putamen, globus pallidus), the thalamus and the fluid-filled ventricles.', layers: { skeletal: 0, nervous: 1, ...off(VISCERA) }, focus: { name: 'Diencephalon' }, ghostOutside: { name: 'Diencephalon' }, view: { theta: 0.9, phi: Math.PI * 0.4 }, margin: 2.2 },
      { title: 'Brainstem', text: 'Midbrain, pons and medulla oblongata connect the cerebrum and cerebellum to the spinal cord and contain vital autonomic centres.', layers: { skeletal: 0, nervous: 1, ...off(VISCERA) }, focus: { name: 'Brainstem' }, ghostOutside: { name: 'Brainstem' }, view: { theta: Math.PI * 0.5 } },
      { title: 'Cerebellum', text: 'Posterior to the brainstem, the cerebellum coordinates movement and balance.', layers: { skeletal: 0, nervous: 1, ...off(VISCERA) }, focus: { name: 'Cerebellum', system: 'nervous' }, ghostOutside: { name: 'Brain' }, select: true, view: { theta: Math.PI * 0.8 } },
    ],
  },
  {
    id: 'arm',
    model: 'male',
    title: 'Upper limb',
    blurb: 'Shoulder, arm muscles and the bones of the hand.',
    base: { integumentary: 0.06, cardiovascular: 0 },
    stages: [
      { title: 'Right upper limb', text: 'From the shoulder to the fingertips: muscles over a skeleton of 30 bones per limb in this model (humerus, radius, ulna, 8 carpals, 5 metacarpals, 14 phalanges).', layers: { muscular: 1, skeletal: 1, ...off([...VISCERA, 'nervous']) }, focus: { name: 'Right upper limb', system: 'muscular' }, view: { theta: -0.7 } },
      { title: 'Arm muscles', text: 'The biceps brachii (two heads) flexes the elbow and supinates the forearm; the triceps brachii (three heads) extends it.', layers: { muscular: 1, skeletal: 1, ...off([...VISCERA, 'nervous']) }, focus: { name: 'Arm', system: 'muscular' }, ghostOutside: { name: 'Right upper limb', system: 'muscular' }, view: { theta: -0.5 } },
      { title: 'Biceps brachii', text: 'Each head is a separate mesh: the long head arises from the supraglenoid tubercle and the short head from the coracoid process.', layers: { muscular: 1, skeletal: 1, ...off([...VISCERA, 'nervous']) }, focus: { name: 'Right biceps brachii' }, ghostOutside: { name: 'Right biceps brachii' }, select: true, view: { theta: -0.3 } },
      { title: 'Bones of the hand', text: 'With the muscles removed: carpal bones in two rows, five metacarpals and fourteen phalanges.', layers: { muscular: 0, skeletal: 1, ...off([...VISCERA, 'nervous']) }, focus: { name: 'Hand', system: 'skeletal' }, ghostOutside: { name: 'Right upper limb', system: 'skeletal' }, view: { theta: -0.2, phi: Math.PI * 0.42 }, margin: 1.05 },
    ],
  },

  {
    id: 'f-pelvis',
    model: 'female',
    title: 'Female pelvis',
    blurb: 'Bony pelvis, uterus, ovaries, uterine tubes and their ligaments.',
    base: { integumentary: 0.1 },
    stages: [
      { title: 'Female body', text: 'The female model is built from the HuBMAP Human Reference Atlas organs of the Visible Human Female, registered in one body frame.', layers: { integumentary: 0.85 } },
      { title: 'Bony pelvis', text: 'Sacrum, coccyx and the two hip bones, each split into ilium, ischium and pubis. The female pelvis is typically wider with a rounder inlet than the male pelvis.', layers: { integumentary: 0, ...off(['cardiovascular', 'nervous', 'respiratory', 'digestive', 'urinary', 'lymphatic', 'sensory', 'reproductive']), skeletal: 1 }, focus: { name: 'Pelvis' }, view: { theta: 0.35, phi: Math.PI * 0.42 } },
      { title: 'Pelvic organs', text: 'Within the pelvis: the urinary bladder anteriorly, the uterus and vagina centrally, and the rectum posteriorly.', layers: { integumentary: 0, skeletal: 0.3, reproductive: 1, urinary: 1, digestive: 0.6, ...off(['cardiovascular', 'nervous', 'respiratory', 'lymphatic', 'sensory']) }, focus: { name: 'Uterus' }, margin: 2.4, view: { theta: 0.5 } },
      { title: 'Uterus', text: 'Fundus, body and cervix, with anterior and posterior walls and the internal and external cervical os as separate selectable parts.', layers: { integumentary: 0, skeletal: 0.15, reproductive: 1, urinary: 0.25, digestive: 0, ...off(['cardiovascular', 'nervous', 'respiratory', 'lymphatic', 'sensory']) }, focus: { name: 'Uterus' }, ghostOutside: { name: 'Uterus' }, select: true, view: { theta: 0.9 } },
      { title: 'Ovaries and uterine tubes', text: 'Each uterine (fallopian) tube runs from the uterine cornu through isthmus, ampulla and infundibulum to its fimbriae beside the ovary.', layers: { integumentary: 0, skeletal: 0.1, reproductive: 1, ...off(['urinary', 'digestive', 'cardiovascular', 'nervous', 'respiratory', 'lymphatic', 'sensory']) }, focus: { name: 'Ovaries and uterine tubes' }, ghostOutside: { name: 'Reproductive system (female)' }, view: { theta: 0.1 } },
      { title: 'Supporting ligaments', text: 'Broad, round, cardinal, uterosacral, ovarian and suspensory ligaments hold the uterus and ovaries in position.', layers: { integumentary: 0, skeletal: 0.3, reproductive: 1, ...off(['urinary', 'digestive', 'cardiovascular', 'nervous', 'respiratory', 'lymphatic', 'sensory']) }, focus: { name: 'Ligaments of uterus and ovaries' }, ghostOutside: { name: 'Reproductive system (female)' }, select: true, view: { theta: 0.6, phi: Math.PI * 0.4 } },
    ],
  },
  {
    id: 'f-thorax',
    model: 'female',
    title: 'Lungs and heart',
    blurb: 'Bronchopulmonary segments, airways, heart and coronary vessels.',
    base: { integumentary: 0.08 },
    stages: [
      { title: 'Thorax', text: 'Unlike the male dataset, the female model includes the lung surfaces, divided into bronchopulmonary segments.', layers: { respiratory: 1, cardiovascular: 1, skeletal: 0.4, ...off(['digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory', 'nervous']) }, focus: { name: 'Lungs' }, view: { theta: 0.3 } },
      { title: 'Bronchopulmonary segments', text: 'Each segment is supplied by its own segmental bronchus. The left lung has the lingula in place of a middle lobe.', layers: { respiratory: 1, cardiovascular: 0.2, skeletal: 0, ...off(['digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory', 'nervous']) }, focus: { name: 'Left lung' }, ghostOutside: { name: 'Lungs' }, view: { theta: 0.9 } },
      { title: 'Airways', text: 'Trachea with its cartilage, carina, main bronchi and the lobar and segmental bronchi inside the lungs.', layers: { respiratory: 1, cardiovascular: 0, skeletal: 0, ...off(['digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory', 'nervous']) }, focus: { name: 'Trachea and main bronchi' }, ghostOutside: { name: 'Respiratory system' }, view: { theta: 0.2 }, margin: 2 },
      { title: 'Heart', text: 'Atria, ventricles, interventricular septum, papillary muscles and the four valves.', layers: { respiratory: 0.1, cardiovascular: 1, skeletal: 0, ...off(['digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory', 'nervous']) }, focus: { name: 'Chambers, septum and valves' }, ghostOutside: { name: 'Heart' }, view: { theta: -0.4 } },
      { title: 'Coronary vessels', text: 'Left and right coronary arteries with their branches, and the cardiac veins draining to the coronary sinus.', layers: { respiratory: 0, cardiovascular: 1, skeletal: 0, ...off(['digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory', 'nervous']) }, focus: { name: 'Coronary vessels' }, ghostOutside: { name: 'Heart' }, select: true, view: { theta: 0.4 } },
    ],
  },
  {
    id: 'f-cns',
    model: 'female',
    title: 'Brain and spinal cord',
    blurb: 'Allen atlas brain regions and spinal cord segments C1–S4.',
    base: { integumentary: 0.08 },
    stages: [
      { title: 'Central nervous system', text: 'Brain and spinal cord, with the vertebral column for orientation.', layers: { nervous: 1, skeletal: 0.35, ...off(['cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory']) }, focus: { name: 'Nervous system' }, view: { theta: 0.9 } },
      { title: 'Brain', text: 'The brain is parcellated into about 280 regions from the Allen human brain reference atlas.', layers: { nervous: 1, skeletal: 0, ...off(['cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory']) }, focus: { name: 'Brain' }, view: { theta: 0.8 } },
      { title: 'Diencephalon', text: 'Thalamic nuclei, hypothalamus and geniculate nuclei, deep to the cerebral hemispheres.', layers: { nervous: 1, skeletal: 0, ...off(['cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory']) }, focus: { name: 'Diencephalon' }, ghostOutside: { name: 'Diencephalon' }, view: { theta: 0.9, phi: Math.PI * 0.4 }, margin: 1.6 },
      { title: 'Brainstem and cerebellum', text: 'Midbrain, pons and medulla, with the cerebellum and its peduncles posteriorly.', layers: { nervous: 1, skeletal: 0, ...off(['cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory']) }, focus: { name: 'Brainstem' }, ghostOutside: { name: 'Brain' }, view: { theta: Math.PI * 0.6 }, margin: 2 },
      { title: 'Spinal cord', text: 'The cord is divided into its 8 cervical, 12 thoracic, 5 lumbar and sacral segments, each selectable, inside the vertebral canal.', layers: { nervous: 1, skeletal: 0.35, ...off(['cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory']) }, focus: { name: 'Spinal cord' }, view: { theta: Math.PI * 0.72 } },
      { title: 'Lumbar enlargement', text: 'The lumbar cord segments lie well above the lumbar vertebrae of the same number; in adults the cord ends around the L1–L2 level.', layers: { nervous: 1, skeletal: 0.6, ...off(['cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive', 'lymphatic', 'sensory']) }, focus: { name: 'Lumbar segments' }, select: true, view: { theta: Math.PI * 0.62, phi: Math.PI * 0.48 }, margin: 2.2 },
    ],
  },
];

export interface ResolvedStage extends StageDef {
  pose: CameraPose;
  opacity: SystemOpacity;
  focusId: string | null;
  ghostId: string | null;
}

export function findNode(reg: Registry, name: string, system?: SystemId): string | null {
  let fallback: string | null = null;
  for (const s of reg.structures.values()) {
    if (s.name !== name) continue;
    if (system && s.system !== system) continue;
    // Prefer the right side for limb groups that exist on both sides (e.g. "Arm").
    if (/^grp:.*\/right-/.test(s.id)) return s.id;
    if (s.kind === 'group' && !fallback) fallback = s.id;
    fallback ??= s.id;
  }
  return fallback;
}

/** Pre-compute camera poses and layer states for each stage given the current camera aspect. */
export function resolveJourney(reg: Registry, j: JourneyDef, camera: THREE.PerspectiveCamera): ResolvedStage[] {
  let prevTheta = HOME_POSE.theta;
  return j.stages.map((s) => {
    const focusId = s.focus ? findNode(reg, s.focus.name, s.focus.system) : null;
    const ghostId = s.ghostOutside ? findNode(reg, s.ghostOutside.name, s.ghostOutside.system) : null;
    const opacity = { ...defaultOpacities(), ...j.base, ...(s.layers ?? {}) };
    let pose: CameraPose = { ...HOME_POSE, theta: s.view?.theta ?? prevTheta, phi: s.view?.phi ?? HOME_POSE.phi };
    const rec = reg.get(focusId);
    if (rec) {
      const b = rec.bbox;
      const c: [number, number, number] = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2];
      const rad = Math.max(0.015, new THREE.Vector3(b[1][0] - b[0][0], b[1][1] - b[0][1], b[1][2] - b[0][2]).length() / 2);
      pose = { target: c, radius: fitDistance(rad, camera, s.margin ?? 1.15), theta: s.view?.theta ?? prevTheta, phi: s.view?.phi ?? Math.PI * 0.47 };
    }
    prevTheta = pose.theta;
    return { ...s, pose, opacity, focusId, ghostId };
  });
}

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Interpolated camera pose + layer opacities at continuous progress p (stage units). */
export function sampleJourney(stages: ResolvedStage[], p: number) {
  const n = stages.length;
  const pc = THREE.MathUtils.clamp(p, 0, n - 1);
  const i = Math.min(n - 2, Math.floor(pc));
  if (n === 1) return { pose: stages[0]!.pose, opacity: stages[0]!.opacity, stage: stages[0]!, index: 0, f: 0 };
  const a = stages[i]!;
  const b = stages[i + 1]!;
  const raw = pc - i;
  // Rest briefly at each stage, travel in between.
  const f = smooth(0.12, 0.88, raw);
  const ta = new THREE.Vector3(...a.pose.target);
  const tb = new THREE.Vector3(...b.pose.target);
  const la = Math.log(a.pose.radius);
  const lb = Math.log(b.pose.radius);
  const dist = ta.distanceTo(tb);
  const bump = Math.max(0, Math.log((dist + a.pose.radius + b.pose.radius) / (a.pose.radius + b.pose.radius))) * 0.45;
  const target = ta.lerp(tb, f);
  const pose: CameraPose = {
    target: target.toArray() as [number, number, number],
    radius: Math.exp(THREE.MathUtils.lerp(la, lb, f) + bump * Math.sin(Math.PI * f)),
    theta: THREE.MathUtils.lerp(a.pose.theta, b.pose.theta, f),
    phi: THREE.MathUtils.lerp(a.pose.phi, b.pose.phi, f),
  };
  const opacity = { ...a.opacity };
  for (const k of Object.keys(opacity) as SystemId[]) opacity[k] = THREE.MathUtils.lerp(a.opacity[k], b.opacity[k], f);
  const index = raw < 0.5 ? i : i + 1;
  return { pose, opacity, stage: stages[index]!, index, f };
}
