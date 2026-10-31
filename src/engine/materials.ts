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
      return { color: '#b8322b', roughness: 0.55, sheen: 0.5, spread: 1 };
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
      if (/nerve|ganglion|branch|tract$|optic chiasm/.test(n)) return { color: '#f4cc2e', roughness: 0.45 };
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
      if (/colon|caecum|cecum|rectum|appendix|taenia|flexure|ileocecal/.test(n)) return { color: '#d98564', roughness: 0.45, clearcoat: 0.3, spread: 0.6 };
      if (/stomach/.test(n)) return { color: '#e0876f', roughness: 0.45, clearcoat: 0.3 };
      return { color: '#ec9f8a', roughness: 0.45, clearcoat: 0.3, spread: 0.6 };
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

export function createUnitMaterial(system: SystemId, name: string, seed: string, tier: 'low' | 'medium' | 'high', landmark = false): THREE.MeshStandardMaterial {
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
  // Translucent media show both faces so their volume reads correctly.
  if ((look.opacity ?? 1) < 0.9) m.side = THREE.DoubleSide;
  return m;
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
