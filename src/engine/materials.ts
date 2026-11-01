import * as THREE from 'three';
import type { SystemId } from '../data/types';

export interface Look {
  color: string;
  roughness: number;
  metalness?: number;
  clearcoat?: number;
  sheen?: number;
  /** Intrinsic translucency (eye media, organ capsules) multiplied with layer opacity. */
  opacity?: number;
  /** Hue spread between neighbouring parts of the same tissue (segments, gyri, muscles). 0–1. */
  spread?: number;
  /** Thin surface patch that must draw over the surface it lies on. */
  overlay?: boolean;
}

/**
 * Tissue appearance from system + structure name. Colours follow common anatomical-atlas
 * conventions (arteries red, veins blue, nerves yellow, bone ivory, cartilage blue-grey) with
 * richer saturation so adjacent tissues separate clearly. Works for both source vocabularies
 * (FMA names from BodyParts3D and HRA node labels).
 */
export function lookFor(system: SystemId, name: string, landmark = false): Look {
  const n = name.toLowerCase();
  if (landmark) return { color: '#2fc4ae', roughness: 0.45, opacity: 0.9, overlay: true, spread: 0.6 };
  switch (system) {
    case 'skeletal':
      if (/tooth/.test(n)) return { color: '#f6f0e1', roughness: 0.3, clearcoat: 0.5 };
      if (/spongy bone/.test(n)) return { color: '#c99a63', roughness: 0.8 };
      if (/cartilage|disk|disc|meniscus/.test(n)) return { color: '#7fbfd2', roughness: 0.4, clearcoat: 0.35 };
      if (/ligament|membrane|retinaculum/.test(n)) return { color: '#d2bf8a', roughness: 0.45, clearcoat: 0.2, spread: 0.5 };
      return { color: '#eddcb8', roughness: 0.7, spread: 0.35 };
    case 'muscular':
      if (/tendon|tendinous|aponeurosis|linea alba|raphe|ring|tract/.test(n)) return { color: '#e6d8b5', roughness: 0.4, clearcoat: 0.3 };
      return { color: '#b8322b', roughness: 0.55, sheen: 0.5, spread: 0.45 };
    case 'cardiovascular': {
      const pulmonaryArtery = /pulmonary trunk|pulmonary artery|segmental artery|lingular artery|basal artery|apical part|subsuperior/.test(n) && !/vein/.test(n);
      const pulmonaryVein = /pulmonary vein|segmental vein|lingular vein|basal vein/.test(n);
      if (/cusp|leaflet|valve|chorda/.test(n)) return { color: '#f0c9a8', roughness: 0.4 };
      if (/papillary|septum/.test(n)) return { color: '#a3242a', roughness: 0.5, sheen: 0.4 };
      if (/cavity of|atrium|ventricle(?! branch)/.test(n) && !/vein|artery|branch/.test(n)) return { color: '#a8262b', roughness: 0.45, clearcoat: 0.25, spread: 0.4 };
      if (pulmonaryVein) return { color: '#d8392b', roughness: 0.35, clearcoat: 0.35 };
      if (pulmonaryArtery) return { color: '#3a62cc', roughness: 0.35, clearcoat: 0.35 };
      if (/vein|venous|vena|sinus/.test(n)) return { color: '#2c5ac6', roughness: 0.35, clearcoat: 0.35, spread: 0.25 };
      return { color: '#d6281f', roughness: 0.35, clearcoat: 0.35, spread: 0.25 };
    }
    case 'nervous':
      if (/dura/.test(n)) return { color: '#c8b49c', roughness: 0.5, opacity: 0.55 };
      if (/spinal cord|segment of cervical|spinal cord segment/.test(n)) return { color: '#f2cf61', roughness: 0.45, sheen: 0.3, spread: 0.35 };
      // Peripheral nerves, colour-coded by class so pathways stay distinguishable: autonomic (sympathetic) green,
      // cranial nerves amber, spinal nerves and plexus branches yellow; per-nerve tone jitter separates neighbours.
      if (/sympathetic/.test(n)) return { color: '#9cc24a', roughness: 0.45, sheen: 0.25, spread: 0.25 };
      if (/\(cn [ivx]+\)|alveolar|lingual nerve|mental nerve|buccal nerve|chorda tympani|maxillary nerve|mandibular nerve|ophthalmic nerve|nasociliary|frontal nerve|lacrimal nerve|supra-orbital|supratrochlear|infratrochlear|ethmoidal|ciliary|cochlear nerve|vestibular nerve|trigeminal|oculomotor|trochlear|mylohyoid|meningeal branch|optic nerve|oculomotor nerve/.test(n))
        return { color: '#f2a93b', roughness: 0.45, sheen: 0.25, spread: 0.3 };
      if (/nerve|ganglion|branch|tract$|optic chiasm|plexus(?! of)|trunk|root|\brami\b|\bramus\b|cauda equina|division of|cord of brachial|chorda tympani/.test(n) && !/choroid/.test(n)) return { color: '#f4cc2e', roughness: 0.45, sheen: 0.25, spread: 0.35 };
      if (/ventricle|aqueduct|canal|foramen|choroid plexus/.test(n)) return { color: '#47b0e4', roughness: 0.25, clearcoat: 0.5 };
      if (/white matter|callosum|capsule|commissure|fornix|peduncle|tract|lemniscus/.test(n)) return { color: '#f3ebdd', roughness: 0.55 };
      if (/tentorium/.test(n)) return { color: '#c9b8a6', roughness: 0.5, opacity: 0.6 };
      if (/thalam|geniculate|pulvinar|habenul/.test(n)) return { color: '#d79a5e', roughness: 0.5, spread: 0.6 };
      if (/hypothalam|mammillary|tuber/.test(n)) return { color: '#c66f6a', roughness: 0.5, spread: 0.5 };
      if (/caudate|putamen|pallid|accumbens|claustrum|amygdal|septal|basal forebrain|stria terminalis|substantia innominata/.test(n)) return { color: '#b8737f', roughness: 0.5, spread: 0.7 };
      if (/cerebell|vermis|dentate|fastigial|flocculus/.test(n)) return { color: '#c77f9f', roughness: 0.55, spread: 0.6 };
      if (/pons|medulla|midbrain|colliculus|tegment|nigra|red nucleus|olive|pontine|reticular/.test(n)) return { color: '#d3a982', roughness: 0.55, spread: 0.6 };
      if (/hippocamp|parahippocamp|cingulate|entorhinal|olfactory|piriform/.test(n)) return { color: '#d98f84', roughness: 0.55, spread: 0.6 };
      return { color: '#e5ab98', roughness: 0.6, sheen: 0.35, spread: 0.85 };
    case 'respiratory':
      if (/cartilage|epiglott/.test(n)) return { color: '#7fbfd2', roughness: 0.4, clearcoat: 0.35 };
      if (/ligament|conus/.test(n)) return { color: '#d2bf8a', roughness: 0.45 };
      if (/arytenoid$|crico-arytenoid|vocalis|aryepiglott|thyro-arytenoid/.test(n)) return { color: '#b8322b', roughness: 0.55 };
      if (/bronchopulmonary segment/.test(n)) return { color: '#ea9c9a', roughness: 0.5, sheen: 0.4, spread: 1 };
      if (/bronch|trachea|carina/.test(n)) return { color: '#f1b4a2', roughness: 0.45, clearcoat: 0.25 };
      if (/concha|nasal/.test(n)) return { color: '#e39b92', roughness: 0.5 };
      return { color: '#e69b94', roughness: 0.45, clearcoat: 0.2, spread: 0.6 };
    case 'digestive':
      if (/capsule of liver|diaphragmatic surface|bare area|porta hepatis/.test(n)) return { color: '#8c3123', roughness: 0.4, clearcoat: 0.4, opacity: 0.4 };
      if (/ligament|ligamentum/.test(n)) return { color: '#e8cf9a', roughness: 0.45 };
      if (/liver|hepatovenous|segment|lobe|caudate|quadrate/.test(n)) return { color: '#8a2e22', roughness: 0.42, clearcoat: 0.4, spread: 0.9 };
      if (/gallbladder/.test(n)) return { color: '#3e9a3b', roughness: 0.38, clearcoat: 0.4 };
      if (/biliary|hepatic duct|cystic|bile|pancreatic duct|ampulla/.test(n)) return { color: '#69b43d', roughness: 0.4, clearcoat: 0.3 };
      if (/pancrea|uncinate/.test(n)) return { color: '#f0bc63', roughness: 0.55, spread: 0.5 };
      if (/tongue|lip|gingiva/.test(n)) return { color: '#cc6762', roughness: 0.48 };
      if (/gland/.test(n)) return { color: '#ebc382', roughness: 0.55 };
      if (/mesentery|mesocolon|mesoappendix/.test(n)) return { color: '#efd395', roughness: 0.5, opacity: 0.8 };
      if (/colon|caecum|cecum|rectum|appendix|taenia|flexure|ileocecal/.test(n)) return { color: '#cf7a5a', roughness: 0.5, clearcoat: 0.22, sheen: 0.35, spread: 0.6 };
      if (/stomach/.test(n)) return { color: '#e0876f', roughness: 0.45, clearcoat: 0.3 };
      return { color: '#e6977f', roughness: 0.5, clearcoat: 0.22, sheen: 0.35, spread: 0.6 };
    case 'urinary':
      if (/capsule/.test(n)) return { color: '#9f3a2e', roughness: 0.4, clearcoat: 0.3, opacity: 0.35 };
      if (/outer cortex|cortex/.test(n)) return { color: '#9b2f28', roughness: 0.45, opacity: 0.55 };
      if (/pyramid/.test(n)) return { color: '#cf5246', roughness: 0.45, spread: 0.6 };
      if (/column/.test(n)) return { color: '#b33a30', roughness: 0.45 };
      if (/calyx|pelvis|hilum/.test(n)) return { color: '#f2c255', roughness: 0.4, spread: 0.4 };
      if (/kidney/.test(n)) return { color: '#982d26', roughness: 0.42, clearcoat: 0.35 };
      return { color: '#e8ae3e', roughness: 0.42, spread: 0.3 };
    case 'reproductive':
      if (/broad ligament|mesosalpinx|mesovarium|pouch/.test(n)) return { color: '#ecc9a8', roughness: 0.45, opacity: 0.55 };
      if (/ligament/.test(n)) return { color: '#e3b98f', roughness: 0.45 };
      if (/adipose|fat/.test(n)) return { color: '#f3d68b', roughness: 0.55, opacity: 0.45 };
      if (/lobe/.test(n)) return { color: '#ea95a2', roughness: 0.5 };
      if (/lactiferous|duct|sinus/.test(n)) return { color: '#f3b8c6', roughness: 0.4 };
      if (/nipple|areola|tubercle/.test(n)) return { color: '#b9665a', roughness: 0.5 };
      if (/ovary/.test(n)) return { color: '#ebb3c9', roughness: 0.55 };
      if (/tube|ampulla|infundibulum|fimbria|isthmus/.test(n)) return { color: '#e57f97', roughness: 0.45, spread: 0.4 };
      if (/cervix|cervical|os$/.test(n)) return { color: '#c85267', roughness: 0.45 };
      if (/uter|fundus|cornua/.test(n)) return { color: '#d6606f', roughness: 0.45, clearcoat: 0.25, spread: 0.45 };
      if (/vagina/.test(n)) return { color: '#cf6b7c', roughness: 0.45 };
      if (/testis|epididym/.test(n)) return { color: '#e3a3a8', roughness: 0.5 };
      if (/prostate|seminal|deferent/.test(n)) return { color: '#d58a76', roughness: 0.5 };
      return { color: '#d4879a', roughness: 0.5, spread: 0.4 };
    case 'endocrine':
      return { color: '#b48ad8', roughness: 0.45, clearcoat: 0.2 };
    case 'lymphatic':
      if (/spleen/.test(n)) return { color: '#7b2341', roughness: 0.42, clearcoat: 0.35 };
      if (/tonsil/.test(n)) return { color: '#d97ea1', roughness: 0.5 };
      if (/thymus/.test(n)) return { color: '#d8a6cc', roughness: 0.5 };
      return { color: '#9f84d8', roughness: 0.5, spread: 0.6 };
    case 'sensory':
      if (/cornea/.test(n)) return { color: '#cfe8f2', roughness: 0.05, clearcoat: 1, opacity: 0.3 };
      if (/vitreous|aqueous|chamber/.test(n)) return { color: '#d8ecf2', roughness: 0.05, clearcoat: 1, opacity: 0.18 };
      if (/lens/.test(n)) return { color: '#efe4b8', roughness: 0.1, clearcoat: 1, opacity: 0.7 };
      if (/iris|pupil/.test(n)) return { color: '#3e7eb3', roughness: 0.4 };
      if (/sclera|corneo/.test(n)) return { color: '#f5f1ea', roughness: 0.32 };
      if (/conjunctiva/.test(n)) return { color: '#f1c7bf', roughness: 0.3, opacity: 0.5 };
      if (/retina|macula|fovea|optic disc|ora serrata/.test(n)) return { color: '#d6513d', roughness: 0.45 };
      if (/choroid|ciliary|corona|trabecular|schlemm/.test(n)) return { color: '#7a2f2b', roughness: 0.5, spread: 0.5 };
      if (/lacrimal/.test(n)) return { color: '#e6b6a6', roughness: 0.5 };
      if (/ear/.test(n)) return { color: '#e0b296', roughness: 0.6 };
      return { color: '#dcc6ae', roughness: 0.5 };
    case 'integumentary':
      if (/hair|eyebrow/.test(n)) return { color: '#3b2c24', roughness: 0.8 };
      return { color: '#e1b297', roughness: 0.58, sheen: 0.55 };
  }
}

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic hue/lightness offset so neighbouring parts of one tissue stay distinguishable. */
function jitter(seed: string, base: THREE.Color, spread: number): THREE.Color {
  const h = hash(seed);
  const r1 = (h % 1000) / 1000 - 0.5;
  const r2 = ((h >>> 10) % 1000) / 1000 - 0.5;
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  return new THREE.Color().setHSL(
    (hsl.h + r1 * spread * 0.07 + 1) % 1,
    THREE.MathUtils.clamp(hsl.s * (1 + r2 * spread * 0.35), 0, 1),
    THREE.MathUtils.clamp(hsl.l + r2 * spread * 0.1, 0.05, 0.95),
  );
}

/** Shared uniforms of one scene's vertical slice dissection (see AnatomyScene.applyState). */
export interface SliceUniforms {
  uSliceY0: { value: number };
  uSliceH: { value: number };
  uSliceN: { value: number };
  uSliceGap: { value: number };
}
export const createSliceUniforms = (): SliceUniforms => ({ uSliceY0: { value: 0 }, uSliceH: { value: 1 }, uSliceN: { value: 1 }, uSliceGap: { value: 0 } });

const SLICE_DECL = /* glsl */ `
#define USE_SLICE_OFFSET
uniform float uSliceY0;
uniform float uSliceH;
uniform float uSliceN;
uniform float uSliceGap;
uniform float uSliceOn;
varying float vSliceY;
varying float vSliceOff;
float sliceOffset(float y) {
  float k = clamp(floor((y - uSliceY0) / uSliceH), 0.0, uSliceN - 1.0);
  return (k - (uSliceN - 1.0) * 0.5) * uSliceGap;
}
`;

/**
 * Vertical (sagittal) slice dissection in the shader: each vertex moves left/right by the offset
 * of the vertical slab it lies in, so the mesh separates into slabs without duplicating geometry.
 * Triangles that straddle a slab boundary get stretched across the gap; their fragments are
 * discarded (a fragment is kept only where its interpolated offset matches the slab of its
 * original x position), which leaves clean open cuts. Back faces seen through a cut are darkened so
 * the hollow interior reads as a cut surface.
 */
function applySlice(m: THREE.MeshStandardMaterial, slice: SliceUniforms) {
  const on = { value: 0 };
  m.userData.sliceOn = on;
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey;
  m.customProgramCacheKey = () => (prevKey ? prevKey.call(m) : '') + '|slice-v1';
  m.onBeforeCompile = (shader, renderer) => {
    prev.call(m, shader, renderer);
    Object.assign(shader.uniforms, slice, { uSliceOn: on });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + SLICE_DECL)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float sliceOffW = 0.0;
        {
          vec4 swp = modelMatrix * vec4(transformed, 1.0);
          vSliceY = swp.x;
          if (uSliceOn > 0.5 && uSliceGap > 0.0) {
            sliceOffW = sliceOffset(swp.x);
            transformed += inverse(mat3(modelMatrix)) * vec3(sliceOffW, 0.0, 0.0);
          }
          vSliceOff = sliceOffW;
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + SLICE_DECL)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        if (uSliceOn > 0.5 && uSliceGap > 0.0 && abs(vSliceOff - sliceOffset(vSliceY)) > uSliceGap * 0.04) discard;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if (uSliceOn > 0.5 && uSliceGap > 0.0 && !gl_FrontFacing) diffuseColor.rgb *= 0.5;`,
      );
  };
}

export function createUnitMaterial(system: SystemId, name: string, seed: string, tier: 'low' | 'medium' | 'high', landmark = false, doubleSided = false, slice?: SliceUniforms): THREE.MeshStandardMaterial {
  const look = lookFor(system, name, landmark);
  const color = jitter(seed, new THREE.Color(look.color), look.spread ?? 0.2);
  const common = { color, roughness: look.roughness, metalness: look.metalness ?? 0, side: THREE.FrontSide as THREE.Side };
  const m =
    tier === 'low'
      ? new THREE.MeshStandardMaterial(common)
      : new THREE.MeshPhysicalMaterial({
          ...common,
          clearcoat: look.clearcoat ?? 0,
          clearcoatRoughness: 0.32,
          sheen: look.sheen ?? 0,
          sheenRoughness: 0.55,
          sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45),
        });
  m.userData.baseOpacity = look.opacity ?? 1;
  if (look.overlay) {
    m.polygonOffset = true;
    m.polygonOffsetFactor = -2;
    m.polygonOffsetUnits = -2;
  }
  // Translucent media show both faces so their volume reads correctly. Sources with open or
  // inconsistently wound patches (HRA female) render both faces; three flips back-face normals.
  if ((look.opacity ?? 1) < 0.9 || doubleSided) m.side = THREE.DoubleSide;
  if (tier !== 'low' && !look.overlay) applySurfaceDetail(m, detailFor(system, name), seed);
  if (slice) applySlice(m, slice);
  m.userData.baseSide = m.side;
  return m;
}

/** Procedural micro-surface: bump amplitude, feature size (metres), albedo cavity, grazing-angle depth. */
export interface SurfaceDetail {
  size: number;
  bump: number;
  cavity: number;
  rim: number;
  /** Elongated noise (muscle fibres, tendon) along the mesh's longest axis. 0 = isotropic. */
  stretch?: number;
}

export function detailFor(system: SystemId, name: string): SurfaceDetail {
  const n = name.toLowerCase();
  switch (system) {
    case 'muscular':
      if (/tendon|tendinous|aponeurosis|linea alba|raphe|ring|tract/.test(n)) return { size: 0.004, bump: 0.35, cavity: 0.08, rim: 0.18, stretch: 6 };
      return { size: 0.0035, bump: 0.75, cavity: 0.2, rim: 0.3, stretch: 5 };
    case 'digestive':
      if (/liver|segment|lobe|caudate|quadrate|impression|surface/.test(n)) return { size: 0.006, bump: 0.25, cavity: 0.14, rim: 0.28 };
      if (/colon|caecum|cecum|rectum|appendix|flexure|ileocecal|intestin|ileum|jejunum|duoden/.test(n)) return { size: 0.0045, bump: 0.7, cavity: 0.24, rim: 0.5 };
      if (/stomach|oesophag|esophag/.test(n)) return { size: 0.0045, bump: 0.55, cavity: 0.2, rim: 0.36 };
      if (/pancrea/.test(n)) return { size: 0.0028, bump: 0.8, cavity: 0.26, rim: 0.3 };
      return { size: 0.005, bump: 0.4, cavity: 0.15, rim: 0.3 };
    case 'skeletal':
      if (/cartilage|disk|disc|meniscus/.test(n)) return { size: 0.006, bump: 0.15, cavity: 0.05, rim: 0.2 };
      return { size: 0.003, bump: 0.45, cavity: 0.16, rim: 0.22 };
    case 'cardiovascular':
      if (/atrium|ventricle|heart|papillary|septum/.test(n)) return { size: 0.004, bump: 0.45, cavity: 0.18, rim: 0.32, stretch: 3 };
      return { size: 0.004, bump: 0.2, cavity: 0.08, rim: 0.3 };
    case 'nervous':
      if (/nerve|ganglion|branch|plexus(?! of)|trunk|root|\brami\b|\bramus\b|cauda equina|division of|cord of brachial|chorda tympani/.test(n) && !/choroid/.test(n)) return { size: 0.0012, bump: 0.35, cavity: 0.1, rim: 0.25, stretch: 6 };
      return { size: 0.004, bump: 0.35, cavity: 0.16, rim: 0.32 };
    case 'respiratory':
      if (/lung|lobe|segment/.test(n)) return { size: 0.0035, bump: 0.45, cavity: 0.18, rim: 0.32 };
      return { size: 0.004, bump: 0.35, cavity: 0.12, rim: 0.28 };
    case 'urinary':
    case 'reproductive':
    case 'endocrine':
    case 'lymphatic':
      return { size: 0.004, bump: 0.45, cavity: 0.16, rim: 0.32 };
    case 'sensory':
      return { size: 0.0025, bump: 0.15, cavity: 0.05, rim: 0.15 };
    case 'integumentary':
      return { size: 0.0018, bump: 0.25, cavity: 0.05, rim: 0.0 };
  }
}

const DETAIL_NOISE = /* glsl */ `
varying vec3 vDetailPos;
uniform float uDetailSize;
uniform float uDetailBump;
uniform float uDetailCavity;
uniform float uDetailRim;
uniform vec3 uDetailAxis;
uniform float uDetailStretch;
uniform vec3 uDetailSeed;
float dHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dHash(i), dHash(i + vec3(1, 0, 0)), f.x), mix(dHash(i + vec3(0, 1, 0)), dHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(dHash(i + vec3(0, 0, 1)), dHash(i + vec3(1, 0, 1)), f.x), mix(dHash(i + vec3(0, 1, 1)), dHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float detailField(vec3 p) {
  // Compress along the fibre axis so features elongate (muscle fascicles, tendon, nerve fibres).
  float a = dot(p, uDetailAxis);
  p += uDetailAxis * a * (1.0 / max(uDetailStretch, 1.0) - 1.0);
  p = p / uDetailSize + uDetailSeed;
  return dNoise(p) * 0.55 + dNoise(p * 2.03 + 7.1) * 0.3 + dNoise(p * 4.1 + 3.7) * 0.15;
}
`;

/**
 * Inject a procedural micro-surface into a standard/physical material: a derivative-based bump
 * (no tangents or UVs needed, works on quantised glTF), matching albedo cavities and roughness
 * variation, plus grazing-angle darkening that reads as volume. The detail fades out when its
 * features fall below a pixel, so distant views stay clean and free of shimmer.
 */
/** Orient fibre-like detail along a unit's longest world-space extent. */
export function setDetailAxis(m: THREE.Material, mesh: THREE.Mesh) {
  const u = m.userData.detail as { uDetailAxis: { value: THREE.Vector3 } } | undefined;
  const g = mesh.geometry;
  if (!u) return;
  if (!g.boundingBox) g.computeBoundingBox();
  const size = g.boundingBox!.getSize(new THREE.Vector3()).multiply(mesh.scale);
  const ax = size.x >= size.y && size.x >= size.z ? new THREE.Vector3(1, 0, 0) : size.y >= size.z ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
  u.uDetailAxis.value.copy(ax.applyQuaternion(mesh.quaternion).normalize());
}

function applySurfaceDetail(m: THREE.MeshStandardMaterial, d: SurfaceDetail, seed: string) {
  const h = hash(seed);
  const uniforms = {
    uDetailSize: { value: d.size },
    uDetailBump: { value: d.bump },
    uDetailCavity: { value: d.cavity },
    uDetailRim: { value: d.rim },
    uDetailAxis: { value: new THREE.Vector3(0, 1, 0) },
    uDetailStretch: { value: d.stretch ?? 1 },
    uDetailSeed: { value: new THREE.Vector3((h % 997) / 7.3, ((h >>> 8) % 991) / 5.1, ((h >>> 16) % 983) / 3.7) },
  };
  m.userData.detail = uniforms;
  m.customProgramCacheKey = () => 'immersa-detail-v1';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDetailPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDetailPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#ifdef USE_SLICE_OFFSET\nvDetailPos.x -= sliceOffW;\n#endif');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + DETAIL_NOISE)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 dFw = fwidth(vDetailPos) / uDetailSize;
        float dFade = 1.0 - smoothstep(0.5, 1.6, max(dFw.x, max(dFw.y, dFw.z)));
        float dH = detailField(vDetailPos);
        diffuseColor.rgb *= 1.0 - uDetailCavity * dFade * smoothstep(0.62, 0.2, dH);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor * mix(1.0, 0.82 + dH * 0.4, dFade), 0.04, 1.0);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          vec3 sp = -vViewPosition;
          vec3 sx = dFdx(sp), sy = dFdy(sp);
          float bx = dFdx(dH), by = dFdy(dH);
          vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
          float det = dot(sx, r1) * faceDirection;
          vec3 g = sign(det) * (bx * r1 + by * r2);
          float amp = uDetailBump * dFade * 0.28 * uDetailSize;
          normal = normalize(abs(det) * normal - g * amp);
          float nv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          diffuseColor.rgb *= mix(1.0 - uDetailRim, 1.0, pow(nv, 0.6));
        }`,
      );
  };
}

export const ACCENT = new THREE.Color('#f0c25e');
export const HOVER = new THREE.Color('#8ec5f0');

/**
 * Screen-space inverted-hull outline. Vertices are pushed along the clip-space normal by a fixed
 * pixel width, so the rim stays the same thickness at any zoom level. Works with quantised
 * (normalised integer) glTF attributes because the mesh transform carries the dequantisation.
 */
export function createOutlineMaterial(color: THREE.Color, widthPx: number) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: color.clone() }, width: { value: widthPx }, resolution: { value: new THREE.Vector2(1, 1) }, opacity: { value: 0.95 } },
    vertexShader: /* glsl */ `
      uniform float width;
      uniform vec2 resolution;
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 nv = normalize(normalMatrix * normal);
        vec2 dir = (projectionMatrix * vec4(nv, 0.0)).xy;
        float len = length(dir);
        if (len > 1e-5) clip.xy += (dir / len) * width / resolution * 2.0 * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float opacity;
      void main() { gl_FragColor = vec4(color, opacity); }`,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
}
