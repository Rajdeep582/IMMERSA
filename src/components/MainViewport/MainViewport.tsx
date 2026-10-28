import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { ANATOMICAL_SYSTEMS } from '../../data/systems';
import {
  getPartMaterialKey,
  isExternalGenitalPart,
  isPartVisibleForSex,
  isSurfacePart,
} from '../../data/anatomyCatalog';
import { AnatomyTouchController } from '../../utils/anatomyTouchController';
import { loadChunk } from '../../services/modelLoader';
import { getHighDetailGeometry } from '../../services/highDetailAnatomy';
import { FEMALE_ANTHROPOMETRY_GLSL, morphBoundingBox } from '../../utils/anthropometry';
import { Loader2 } from 'lucide-react';

const PELVIC_VISCERA = new Set([
  'F_UTERUS',
  'F_OVARY_R',
  'F_OVARY_L',
  'F_TUBE_R',
  'F_TUBE_L',
  'F_VAGINA',
  'F_URETHRA',
  'F_CLITORIS',
  'FJ3149',
  'FJ3139',
  'FJ3137',
  'FJ3143',
  'FJ3135',
  'FJ3140',
  'FJ3136',
  'FJ3141',
  'FJ3138',
  'FJ3142',
  'FJ3148',
]);

const EXTERNAL_GENITAL_FOCUS = new Set([
  'F_MONS_PUBIS',
  'F_LABIUM_MAJUS_R',
  'F_LABIUM_MAJUS_L',
  'F_LABIUM_MINUS_R',
  'F_LABIUM_MINUS_L',
  'F_CLITORIS_GLANS',
  'F_CLITORAL_HOOD',
  'F_VESTIBULE',
  'F_URETHRA_ORIFICE',
  'F_VAGINAL_ORIFICE',
  'M_SCROTUM',
  'M_URETHRA_MEATUS',
  'FJ3134',
]);

const SKIN_INTEGRATED_SURFACE_PARTS = new Set([
  'F_MONS_PUBIS',
  'F_LABIUM_MAJUS_R',
  'F_LABIUM_MAJUS_L',
  'F_LABIUM_MINUS_R',
  'F_LABIUM_MINUS_L',
  'F_CLITORIS_GLANS',
  'F_CLITORAL_HOOD',
  'F_VESTIBULE',
  'F_URETHRA_ORIFICE',
  'F_VAGINAL_ORIFICE',
  'F_AREOLA_R',
  'F_AREOLA_L',
  'F_NIPPLE_R',
  'F_NIPPLE_L',
]);

/**
 * Pelvic viscera are framed from a left anterior oblique angle so the pubic
 * bones and vulva do not sit between the camera and the uterus/ovaries.
 */
function getPreferredFocusAngle(partId: string, system: string): THREE.Vector3 {
  if (PELVIC_VISCERA.has(partId)) return new THREE.Vector3(1.0, 0.28, 0.24).normalize();
  if (EXTERNAL_GENITAL_FOCUS.has(partId)) return new THREE.Vector3(0.12, 0.10, 1.0).normalize();
  if (system === 'reproductive' || system === 'urinary') return new THREE.Vector3(0.8, 0.2, 0.45).normalize();
  return new THREE.Vector3(0.2, 0.1, 1.0).normalize();
}

export const MainViewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const manifest = useAnatomyStore((s) => s.manifest);
  const loading = useAnatomyStore((s) => s.loading);
  const loadProgress = useAnatomyStore((s) => s.loadProgress);
  const setLoadProgress = useAnatomyStore((s) => s.setLoadProgress);
  const setLoading = useAnatomyStore((s) => s.setLoading);
  const setError = useAnatomyStore((s) => s.setError);

  const visibleSystems = useAnatomyStore((s) => s.visibleSystems);
  const displayMode = useAnatomyStore((s) => s.displayMode);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);
  const selectedPartId = useAnatomyStore((s) => s.selectedPartId);
  const isolated = useAnatomyStore((s) => s.isolated);
  const ghostOthers = useAnatomyStore((s) => s.ghostOthers);
  const explosionFactor = useAnatomyStore((s) => s.explosionFactor);
  const activeView = useAnatomyStore((s) => s.activeView);
  const cameraResetNonce = useAnatomyStore((s) => s.cameraResetNonce);
  const zoomInNonce = useAnatomyStore((s) => s.zoomInNonce);
  const zoomOutNonce = useAnatomyStore((s) => s.zoomOutNonce);
  const focusTarget = useAnatomyStore((s) => s.focusTarget);
  const selectPart = useAnatomyStore((s) => s.selectPart);

  // References across render frames
  const touchControllerRef = useRef<AnatomyTouchController | null>(null);
  const stateTextureRef = useRef<THREE.DataTexture | null>(null);
  const selectionTextureRef = useRef<THREE.DataTexture | null>(null);
  const stateDataRef = useRef<Float32Array | null>(null);
  const selectionDataRef = useRef<Uint8Array | null>(null);
  const pickersRef = useRef<(THREE.Mesh | undefined)[]>([]);
  const boundsRef = useRef<THREE.Box3[]>([]);
  const originalBoundsRef = useRef<THREE.Box3[]>([]);
  const centersRef = useRef<THREE.Vector3[]>([]);
  const femaleUniformsRef = useRef<{ value: number }[]>([]);
  const skinMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const scrotumMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const femaleFactorRef = useRef<number>(biologicalSex === 'female' ? 1.0 : 0.0);
  const skinOpacityRef = useRef<number>(1.0);
  const biologicalSexRef = useRef(biologicalSex);
  biologicalSexRef.current = biologicalSex;
  const dirtyRef = useRef(true);

  // Initialize Scene, Renderer, Camera, Shaders, Models
  useEffect(() => {
    if (!manifest || !containerRef.current) return;
    const container = containerRef.current;
    let disposed = false;
    let animId = 0;

    const parts = manifest.parts;
    const partsCount = parts.length;
    const texWidth = THREE.MathUtils.ceilPowerOfTwo(partsCount);

    const stateData = new Float32Array(texWidth * 4);
    const selectionData = new Uint8Array(texWidth * 4);
    stateDataRef.current = stateData;
    selectionDataRef.current = selectionData;

    // Initialize stateData with active visibility on frame 0.
    const defaultVisibleSet = new Set(visibleSystems);
    for (let i = 0; i < partsCount; i++) {
      const p = parts[i];
      const sexMatch = isPartVisibleForSex(p.id, biologicalSex);
      const external = isExternalGenitalPart(p.id);
      const systemActive = defaultVisibleSet.has(p.system) || (external && defaultVisibleSet.has('reproductive'));
      const surfaceVisible = displayMode === 'surface' ? isSurfacePart(p) && systemActive : systemActive;
      const hiddenSurfaceDetail = SKIN_INTEGRATED_SURFACE_PARTS.has(p.id);
      stateData[i * 4 + 3] = sexMatch && surfaceVisible && !hiddenSurfaceDetail ? 1.0 : 0.0;
    }

    const stateTexture = new THREE.DataTexture(stateData, texWidth, 1, THREE.RGBAFormat, THREE.FloatType);
    stateTexture.minFilter = THREE.NearestFilter;
    stateTexture.magFilter = THREE.NearestFilter;
    stateTexture.generateMipmaps = false;
    stateTexture.needsUpdate = true;

    const selectionTexture = new THREE.DataTexture(selectionData, texWidth, 1);
    selectionTexture.minFilter = THREE.NearestFilter;
    selectionTexture.magFilter = THREE.NearestFilter;
    selectionTexture.generateMipmaps = false;
    stateTextureRef.current = stateTexture;
    selectionTextureRef.current = selectionTexture;

    // Precalculate part bounds & centers
    const bounds: THREE.Box3[] = [];
    const originalBounds: THREE.Box3[] = [];
    const centers: THREE.Vector3[] = [];
    const initialFactor = biologicalSex === 'female' ? 1.0 : 0.0;
    parts.forEach((p) => {
      const min = new THREE.Vector3(...p.bounds[0]);
      const max = new THREE.Vector3(...p.bounds[1]);
      const box = new THREE.Box3(min, max);
      originalBounds.push(box.clone());
      const morphed = morphBoundingBox(box, initialFactor, p.system === 'muscular');
      bounds.push(morphed);
      centers.push(morphed.getCenter(new THREE.Vector3()));
    });
    boundsRef.current = bounds;
    originalBoundsRef.current = originalBounds;
    centersRef.current = centers;

    // WebGL Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setError('WebGL 2 is not enabled on this browser.');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x080c15); // Deep elegant dark navy studio
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080c15, 0.042);

    const camera = new THREE.PerspectiveCamera(
      34,
      container.clientWidth / container.clientHeight,
      0.005, // 5mm near plane prevents clipping on close inspection
      60
    );
    camera.position.set(0, 0.88, 3.1);

    // Unified, Rock-Solid Touch & Camera Controller
    const controller = new AnatomyTouchController(camera, renderer.domElement);
    controller.target.set(0, 0.865, 0);
    controller.syncFromCamera();
    touchControllerRef.current = controller;
    controller.onChange = () => {
      dirtyRef.current = true;
    };

    // Environment Lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();

    // Studio Lights — Cinematic medical-visualization three-point lighting
    // Key: Warm directional from upper-left-front simulating surgical scialytic
    const hemiLight = new THREE.HemisphereLight(0xfff8f0, 0x0c1628, 1.0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.8);
    keyLight.position.set(-3, 4.5, 4);
    scene.add(keyLight);

    // Fill: Cool blue from right to lift shadow side with anatomical depth
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.5);
    fillLight.position.set(3.5, 2, 2.5);
    scene.add(fillLight);

    // Rim/Back: Strong cyan-blue rim for silhouette separation from background
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    rimLight.position.set(0, 3.5, -4.5);
    scene.add(rimLight);

    // Inferior bounce: Subtle warm under-light to prevent pitch-black underside on pelvis/legs
    const bounceLight = new THREE.DirectionalLight(0xffe4c4, 0.6);
    bounceLight.position.set(0, -3, 2);
    scene.add(bounceLight);

    // Floating anatomical studio - platform and ring removed to prevent z-fighting clipping

    // Material generator per system with GPU shader injection
    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const pickers: (THREE.Mesh | undefined)[] = [];
    pickersRef.current = pickers;

    interface MaterialSpec {
      color: string;
      metalness: number;
      roughness: number;
      sysType: number;
      isSkin?: boolean;
    }

    const EXTRA_MATERIALS: Record<string, MaterialSpec> = {
      skin: { color: '#d7a589', metalness: 0.01, roughness: 0.68, sysType: 6, isSkin: true },
      'genital-skin': { color: '#c99078', metalness: 0.01, roughness: 0.64, sysType: 6 },
      scrotum: { color: '#b57f6d', metalness: 0.01, roughness: 0.72, sysType: 6 },
      hair: { color: '#2b211b', metalness: 0.02, roughness: 0.65, sysType: 0 },
      lip: { color: '#a96363', metalness: 0, roughness: 0.5, sysType: 0 },
      mucosa: { color: '#9d5960', metalness: 0, roughness: 0.44, sysType: 0 },
      'mucosa-light': { color: '#c07e82', metalness: 0, roughness: 0.42, sysType: 0 },
      vestibule: { color: '#6b3f47', metalness: 0, roughness: 0.52, sysType: 0 },
      areola: { color: '#985a57', metalness: 0, roughness: 0.6, sysType: 0 },
      nipple: { color: '#ad6b65', metalness: 0, roughness: 0.58, sysType: 0 },
      orifice: { color: '#3a2228', metalness: 0, roughness: 0.65, sysType: 0 },
    };

    const getMaterialSpec = (key: string): MaterialSpec => {
      const extra = EXTRA_MATERIALS[key];
      if (extra) return extra;
      const def = ANATOMICAL_SYSTEMS.find((s) => s.id === key);
      const sysType =
        key === 'muscular' ? 1.0 : key === 'skeletal' ? 2.0 : key === 'arterial' || key === 'cardiac' ? 3.0 : key === 'venous' ? 4.0 : key === 'nervous' ? 5.0 : 0.0;
      return {
        color: def?.color || '#cbd5e1',
        metalness: def?.pbr.metalness ?? 0.05,
        roughness: def?.pbr.roughness ?? 0.55,
        sysType,
      };
    };

    const createSystemMaterial = (materialKey: string) => {
      const spec = getMaterialSpec(materialKey);
      const isBodySkin = materialKey === 'skin';
      const isScrotum = materialKey === 'scrotum';
      const appliesSurface = isBodySkin || materialKey === 'areola' || materialKey === 'nipple';
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.color),
        metalness: spec.metalness,
        roughness: spec.roughness,
        transparent: isBodySkin || isScrotum,
        opacity: isBodySkin ? skinOpacityRef.current : isScrotum ? 0.98 : 1.0,
        depthWrite: !isBodySkin && !isScrotum,
        depthTest: true,
        side: THREE.DoubleSide,
      });

      if (isBodySkin) skinMaterialsRef.current.push(mat);
      if (isScrotum) scrotumMaterialRef.current = mat;
      mat.userData.materialKey = materialKey;
      mat.userData.isBodySkin = isBodySkin;

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: stateTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.stateWidth = { value: texWidth };
        const femaleUniform = { value: femaleFactorRef.current };
        shader.uniforms.uFemaleFactor = femaleUniform;
        femaleUniformsRef.current.push(femaleUniform);
        shader.uniforms.uIsMuscle = { value: materialKey === 'muscular' ? 1.0 : 0.0 };
        shader.uniforms.uIsSkin = { value: appliesSurface ? 1.0 : 0.0 };
        shader.uniforms.uSysType = { value: spec.sysType };

        shader.vertexShader = `
          attribute float partIndex;
          uniform sampler2D partState;
          uniform sampler2D selectionState;
          uniform float stateWidth;
          varying float vPartVisible;
          varying float vPartSelected;
          varying float vPartGhost;
          varying vec3 vWorldNormal;
          varying vec3 vViewDir;
          varying vec3 vModelPos;
          ${FEMALE_ANTHROPOMETRY_GLSL}

          vec3 applyAllFemale(vec3 p, float factor, float isMuscle) {
            vec3 m = applyFemaleMorph(p, factor, isMuscle);
            if (uIsSkin > 0.5) {
              m = applyFemaleSurface(m, factor);
            }
            return m;
          }

          ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          transformed = applyAllFemale(transformed, uFemaleFactor, uIsMuscle);
          vModelPos = transformed;
          vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);
          vec4 stateVec = texture2D(partState, stateUv);
          transformed += stateVec.xyz;
          vPartVisible = stateVec.w;
          vec4 selVec = texture2D(selectionState, stateUv);
          vPartSelected = selVec.r;
          vPartGhost = selVec.g;
          `
        );

        // Recompute normals after morph for smooth shading and pass view direction for Fresnel
        shader.vertexShader = shader.vertexShader.replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
          // GPU normal correction through the morph Jacobian approximation.
          float eps = 0.0005;
          vec3 posBase = applyAllFemale(position, uFemaleFactor, uIsMuscle);
          vec3 posDx = applyAllFemale(position + vec3(eps, 0.0, 0.0), uFemaleFactor, uIsMuscle);
          vec3 posDy = applyAllFemale(position + vec3(0.0, eps, 0.0), uFemaleFactor, uIsMuscle);
          vec3 posDz = applyAllFemale(position + vec3(0.0, 0.0, eps), uFemaleFactor, uIsMuscle);
          mat3 jacobian = mat3(
            (posDx - posBase) / eps,
            (posDy - posBase) / eps,
            (posDz - posBase) / eps
          );
          if (uFemaleFactor > 0.001) {
            objectNormal = normalize(inverse(transpose(jacobian)) * objectNormal);
          }
          `
        );

        shader.vertexShader = shader.vertexShader.replace(
          '#include <worldpos_vertex>',
          `#include <worldpos_vertex>
          vWorldNormal = normalize((modelMatrix * vec4(transformedNormal, 0.0)).xyz);
          vViewDir = normalize(cameraPosition - (modelMatrix * vec4(transformed, 1.0)).xyz);
          `
        );

        shader.fragmentShader = `
          varying float vPartVisible;
          varying float vPartSelected;
          varying float vPartGhost;
          varying vec3 vWorldNormal;
          varying vec3 vViewDir;
          varying vec3 vModelPos;
          uniform float uSysType;

          // Procedural 3D noise for organic micro-texture
          float hashV(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          float noise3D(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(mix(hashV(i+vec3(0,0,0)), hashV(i+vec3(1,0,0)), f.x),
                  mix(hashV(i+vec3(0,1,0)), hashV(i+vec3(1,1,0)), f.x), f.y),
              mix(mix(hashV(i+vec3(0,0,1)), hashV(i+vec3(1,0,1)), f.x),
                  mix(hashV(i+vec3(0,1,1)), hashV(i+vec3(1,1,1)), f.x), f.y), f.z);
          }
          ${shader.fragmentShader}
        `;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <clipping_planes_fragment>',
          `#include <clipping_planes_fragment>
          if (vPartVisible < 0.5) discard;
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>

          // ---- Per-System Organic Micro-Texture ----
          if (uSysType > 0.5 && uSysType < 1.5) {
            // Muscle: striated fascicle grain along longitudinal axis
            float fascicle = sin(vModelPos.y * 580.0 + noise3D(vModelPos * 95.0) * 3.5) * 0.055;
            diffuseColor.rgb += vec3(fascicle * 0.4, fascicle * 0.08, fascicle * 0.06);
            // Subtle inter-fascicular connective tissue variation
            float fascia = noise3D(vModelPos * 280.0) * 0.04;
            diffuseColor.rgb *= (1.0 - fascia * 0.5);
          } else if (uSysType > 1.5 && uSysType < 2.5) {
            // Bone: cortical grain + Haversian osteon micro-texture
            float boneGrain = noise3D(vModelPos * 320.0) * 0.10;
            float osteon = sin(vModelPos.y * 700.0) * 0.03;
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.93 + boneGrain + osteon), 0.7);
          } else if (uSysType > 2.5 && uSysType < 3.5) {
            // Arterial/Cardiac: smooth elastic tunica intima sheen
            float tunica = noise3D(vModelPos * 200.0) * 0.05;
            diffuseColor.rgb += vec3(tunica * 0.25, tunica * 0.04, tunica * 0.03);
          } else if (uSysType > 3.5 && uSysType < 4.5) {
            // Venous: subtle blue-purple depth variation
            float venousVar = noise3D(vModelPos * 180.0) * 0.04;
            diffuseColor.rgb += vec3(-venousVar * 0.05, venousVar * 0.03, venousVar * 0.12);
          } else if (uSysType > 4.5 && uSysType < 5.5) {
            // Nervous: fine myelinated axon bundles
            float myelin = sin(vModelPos.y * 1200.0 + noise3D(vModelPos * 160.0) * 2.0) * 0.04;
            diffuseColor.rgb += vec3(myelin * 0.35, myelin * 0.30, myelin * 0.05);
          }

          // ---- Fresnel Rim Light for silhouette depth & realism ----
          float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), normalize(vViewDir)), 0.0), 3.0);
          vec3 rimColor = vec3(0.22, 0.55, 0.75);
          diffuseColor.rgb += rimColor * fresnel * 0.15;

          // ---- Subsurface Scattering Approximation for tissue translucency ----
          if (uSysType > 0.5 && uSysType < 1.5) {
            // Muscle SSS: warm red sub-surface glow at grazing angles
            diffuseColor.rgb += vec3(0.18, 0.04, 0.02) * fresnel * 0.35;
          } else if (uSysType > 5.5) {
            // Skin SSS: soft warm translucency
            diffuseColor.rgb += vec3(0.20, 0.08, 0.04) * fresnel * 0.25;
          }

          // ---- Ghost and Selection Effects ----
          if (vPartGhost > 0.5) {
            diffuseColor.a *= 0.14;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.3, 0.4), 0.5);
          }
          if (vPartSelected > 0.5) {
            vec3 highlightGlow = vec3(0.12, 0.88, 0.95);
            // Preserve surface shading: a flat cyan fill hides the very
            // contours the learner is trying to inspect.
            diffuseColor.rgb = mix(diffuseColor.rgb, highlightGlow, 0.52);
            diffuseColor.a = 1.0;
          }
          `
        );
      };

      materials.push(mat);
      return mat;
    };

    const materialKeys = [
      ...ANATOMICAL_SYSTEMS.map((s) => s.id),
      'skin',
      'genital-skin',
      'scrotum',
      'hair',
      'lip',
      'mucosa',
      'mucosa-light',
      'vestibule',
      'areola',
      'nipple',
      'orifice',
    ];

    const systemMaterials = new Map<string, THREE.MeshStandardMaterial>(
      materialKeys.map((key) => [key, createSystemMaterial(key)])
    );

    // Instantiate procedural anatomical structures (such as female reproductive and mammary parts)
    parts.forEach((p, idx) => {
      if (p.chunk !== -1) return;
      const g = getHighDetailGeometry(p);
      if (!g) return;

      g.setAttribute('partIndex', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(idx), 1));
      g.boundingBox = bounds[idx].clone();
      g.computeBoundingSphere();

      const pickMesh = new THREE.Mesh(g);
      pickMesh.matrixAutoUpdate = false;
      pickers[idx] = pickMesh;
      geometries.push(g);

      const materialKey = getPartMaterialKey(p);
      const mat = systemMaterials.get(materialKey) || systemMaterials.get(p.system) || systemMaterials.get('reproductive')!;
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = materialKey === 'skin' ? 1 : materialKey === 'scrotum' ? 2 : 0;
      scene.add(mesh);
    });

    // Stream and merge chunks
    const abortCtrl = new AbortController();
    let loadedChunks = 0;

    const streamChunk = async (ci: number) => {
      try {
        const buffer = await loadChunk(ci, manifest, abortCtrl.signal);
        if (disposed) return;

        const systemGroups = new Map<string, THREE.BufferGeometry[]>();

        parts.forEach((p, idx) => {
          if (p.chunk !== ci) return;

          const g = new THREE.BufferGeometry();
          const pos = new Float32Array(buffer, p.positions, p.vertexCount * 3);
          g.setAttribute('position', new THREE.BufferAttribute(pos, 3));

          const norm = new Int16Array(buffer, p.normals, p.vertexCount * 3);
          g.setAttribute('normal', new THREE.BufferAttribute(norm, 3, true));

          const ind = new Uint32Array(buffer, p.indices, p.indexCount);
          g.setIndex(new THREE.BufferAttribute(ind, 1));

          g.setAttribute('partIndex', new THREE.BufferAttribute(new Float32Array(p.vertexCount).fill(idx), 1));
          g.boundingBox = bounds[idx].clone();
          g.computeBoundingSphere();

          const pickMesh = new THREE.Mesh(g);
          pickMesh.matrixAutoUpdate = false;
          pickers[idx] = pickMesh;
          geometries.push(g);

          const materialKey = getPartMaterialKey(p);
          const list = systemGroups.get(materialKey) ?? [];
          list.push(g);
          systemGroups.set(materialKey, list);
        });

        systemGroups.forEach((geomList, materialKey) => {
          const merged = mergeGeometries(geomList, false);
          if (merged) {
            geometries.push(merged);
            const mesh = new THREE.Mesh(merged, systemMaterials.get(materialKey));
            mesh.frustumCulled = false;
            mesh.renderOrder = materialKey === 'skin' ? 1 : materialKey === 'scrotum' ? 2 : 0;
            scene.add(mesh);
          }
        });

        loadedChunks++;
        const pct = Math.round((loadedChunks / manifest.chunks.length) * 100);
        setLoadProgress(pct);
        dirtyRef.current = true;
      } catch (err: any) {
        if (!disposed && err.name !== 'AbortError') {
          console.error(err);
        }
      }
    };

    (async () => {
      setLoading(true);
      const concurrency = 4;
      let cursor = 0;
      const workers = Array.from({ length: concurrency }, async () => {
        while (cursor < manifest.chunks.length) {
          const ci = cursor++;
          await streamChunk(ci);
        }
      });
      await Promise.all(workers);
      if (!disposed) {
        setLoading(false);
        dirtyRef.current = true;
      }
    })();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      dirtyRef.current = true;
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    // Adaptive Raycasting & Picking with Proximity Cone
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitPt = new THREE.Vector3();
    const wBox = new THREE.Box3();

    // Tap selection callback from AnatomyTouchController
    controller.onSelectHit = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      let selectedIdx = -1;
      let minDistance = Infinity;

      // 1. Direct Triangle Intersection
      for (let i = 0; i < parts.length; i++) {
        if (stateData[i * 4 + 3] < 0.5) continue;
        const mesh = pickers[i];
        if (!mesh) continue;

        wBox.copy(bounds[i]).translate(mesh.position);
        if (raycaster.ray.intersectBox(wBox, hitPt)) {
          const hits = raycaster.intersectObject(mesh, false);
          if (hits[0] && hits[0].distance < minDistance) {
            minDistance = hits[0].distance;
            selectedIdx = i;
          }
        }
      }

      // 2. Proximity Picking for Slender / Small Structures (Nerves, Vessels, Small bones)
      // If direct ray hit missed by a few pixels, check nearest bounding box center within screen-space tolerance
      if (selectedIdx < 0) {
        let nearestScreenDist = 28; // 28px touch tolerance
        const projCenter = new THREE.Vector3();

        for (let i = 0; i < parts.length; i++) {
          if (stateData[i * 4 + 3] < 0.5) continue;
          const c = centers[i].clone().add(new THREE.Vector3(stateData[i*4], stateData[i*4+1], stateData[i*4+2]));
          projCenter.copy(c).project(camera);

          if (projCenter.z < -1 || projCenter.z > 1) continue;

          const screenX = (projCenter.x + 1) * rect.width * 0.5;
          const screenY = (1 - projCenter.y) * rect.height * 0.5;
          const d = Math.hypot(screenX - (clientX - rect.left), screenY - (clientY - rect.top));

          if (d < nearestScreenDist) {
            nearestScreenDist = d;
            selectedIdx = i;
          }
        }
      }

      if (selectedIdx >= 0) {
        selectPart(parts[selectedIdx].id);
      }
    };

    // Lightweight Mouse Hover with Zero React Re-Renders
    const onMouseMove = (e: MouseEvent) => {
      // Never process hover on touch events to preserve 60fps touch drag
      const rect = renderer.domElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      pointer.x = (x / rect.width) * 2 - 1;
      pointer.y = -(y / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      let foundIndex = -1;
      let closestDist = Infinity;

      for (let i = 0; i < parts.length; i++) {
        if (stateData[i * 4 + 3] < 0.5) continue;
        const mesh = pickers[i];
        if (!mesh) continue;

        wBox.copy(bounds[i]).translate(mesh.position);
        if (raycaster.ray.intersectBox(wBox, hitPt)) {
          const hits = raycaster.intersectObject(mesh, false);
          if (hits[0] && hits[0].distance < closestDist) {
            closestDist = hits[0].distance;
            foundIndex = i;
          }
        }
      }

      const tipEl = tooltipRef.current;
      if (tipEl) {
        if (foundIndex >= 0) {
          tipEl.style.display = 'flex';
          tipEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY - 45}px, 0)`;
          const nameSpan = tipEl.querySelector('.tooltip-name');
          if (nameSpan) nameSpan.textContent = parts[foundIndex].name;
          renderer.domElement.style.cursor = 'pointer';
        } else {
          tipEl.style.display = 'none';
          renderer.domElement.style.cursor = 'grab';
        }
      }
    };
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Render Loop
    const clock = new THREE.Clock();
    const renderLoop = () => {
      if (disposed) return;
      animId = requestAnimationFrame(renderLoop);

      const dt = Math.min(clock.getDelta(), 0.05);
      const isControllerMoving = controller.update(dt);

      // Smoothly interpolate female morph factor on GPU
      const targetFactor = biologicalSexRef.current === 'female' ? 1.0 : 0.0;
      const diff = targetFactor - femaleFactorRef.current;
      let morphChanged = false;
      if (Math.abs(diff) > 0.001) {
        femaleFactorRef.current += diff * Math.min(1.0, dt * 7.5);
        femaleUniformsRef.current.forEach((u) => {
          u.value = femaleFactorRef.current;
        });
        morphChanged = true;
      }

      if (dirtyRef.current || isControllerMoving || morphChanged) {
        renderer.render(scene, camera);
        dirtyRef.current = false;
      }
    };
    renderLoop();

    // Cleanup
    return () => {
      disposed = true;
      femaleUniformsRef.current = [];
      abortCtrl.abort();
      cancelAnimationFrame(animId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      controller.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      stateTexture.dispose();
      selectionTexture.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [manifest]);

  // Update GPU state textures and material presentation on layer, sex,
  // selection, isolation or explosion changes.
  useEffect(() => {
    if (!manifest || !stateDataRef.current || !selectionDataRef.current || !stateTextureRef.current) return;

    const parts = manifest.parts;
    const stateData = stateDataRef.current;
    const selData = selectionDataRef.current;
    const centers = centersRef.current;
    const pickers = pickersRef.current;

    const visibleSet = new Set(visibleSystems);
    const selectedId = selectedPartId;
    const sexFactor = biologicalSex === 'female' ? 1.0 : 0.0;
    const origBounds = originalBoundsRef.current;
    const bounds = boundsRef.current;
    const isSurfaceMode = displayMode === 'surface';

    // Intact surface view: opaque skin. Any explicit cutaway or systemic view:
    // translucent skin so deeper structures remain legible.
    const hasDeepSystems = visibleSystems.some((s) => s !== 'integumentary' && s !== 'sensory');
    const skinOpacity = isSurfaceMode ? 1.0 : hasDeepSystems ? 0.16 : 1.0;
    skinOpacityRef.current = skinOpacity;
    skinMaterialsRef.current.forEach((material) => {
      material.opacity = skinOpacity;
      material.depthWrite = skinOpacity > 0.9;
    });

    // The scrotum is opaque in the intact surface view but slightly translucent
    // when the reproductive viscera are explicitly displayed, so the testes and
    // epididymides remain visible within the sac.
    const scrotumMaterial = scrotumMaterialRef.current;
    if (scrotumMaterial) {
      const scrotumOpacity = isSurfaceMode
        ? 0.98
        : visibleSystems.includes('reproductive')
          ? 0.42
          : 0.98;
      scrotumMaterial.opacity = scrotumOpacity;
      scrotumMaterial.transparent = scrotumOpacity < 0.99;
      scrotumMaterial.depthWrite = scrotumOpacity >= 0.99;
      scrotumMaterial.needsUpdate = true;
    }

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (origBounds[i] && bounds[i]) {
        bounds[i].copy(morphBoundingBox(origBounds[i], sexFactor, part.system === 'muscular'));
        centers[i].copy(bounds[i].getCenter(new THREE.Vector3()));
      }

      const isSelected = part.id === selectedId;
      const sexMatch = isPartVisibleForSex(part.id, biologicalSex);
      const external = isExternalGenitalPart(part.id);
      const systemActive =
        visibleSet.has(part.system) || (external && visibleSet.has('reproductive'));

      let isVisible = false;
      let isGhost = false;

      if (sexMatch) {
        if (isolated) {
          isVisible = isSelected;
        } else {
          const layerVisible = isSurfaceMode
            ? isSurfacePart(part) && systemActive
            : systemActive;
          // These structures are sculpted into the continuous body skin for
          // the intact surface. They remain selectable/searchable and appear
          // as standalone meshes when explicitly inspected.
          const hiddenSurfaceDetail = SKIN_INTEGRATED_SURFACE_PARTS.has(part.id) && !isSelected;
          isVisible = layerVisible && !hiddenSurfaceDetail;
          if (ghostOthers && selectedId && isVisible) {
            isGhost = !isSelected;
          }
        }
      }

      // Explosion is a dissection aid; it is disabled on the intact surface.
      let dx = 0, dy = 0, dz = 0;
      if (!isSurfaceMode && explosionFactor > 0.001) {
        const c = centers[i];
        const radAngle = Math.atan2(c.x, c.z);
        const distFromCenter = Math.hypot(c.x, c.z);
        const sysIndex = ANATOMICAL_SYSTEMS.findIndex((s) => s.id === part.system);
        const sysRadialShift = (sysIndex / ANATOMICAL_SYSTEMS.length) * Math.PI * 2;

        const radialPush = (0.2 + distFromCenter * 0.8) * explosionFactor;
        dx = Math.sin(radAngle + sysRadialShift * 0.3) * radialPush;
        dy = (c.y - 0.88) * explosionFactor * 0.35;
        dz = Math.cos(radAngle + sysRadialShift * 0.3) * radialPush;
      }

      // Update stateData texture: [dx, dy, dz, isVisible (0/1)]
      stateData[i * 4 + 0] = dx;
      stateData[i * 4 + 1] = dy;
      stateData[i * 4 + 2] = dz;
      stateData[i * 4 + 3] = isVisible ? 1.0 : 0.0;

      // Update selectionData texture: [isSelected (0/255), isGhost (0/255), 0, 0]
      selData[i * 4 + 0] = isSelected && isVisible ? 255 : 0;
      selData[i * 4 + 1] = isGhost ? 255 : 0;

      // Update pick mesh position
      const pickMesh = pickers[i];
      if (pickMesh) {
        pickMesh.position.set(dx, dy, dz);
        pickMesh.updateMatrix();
      }
    }

    stateTextureRef.current.needsUpdate = true;
    if (selectionTextureRef.current) {
      selectionTextureRef.current.needsUpdate = true;
    }
    dirtyRef.current = true;
  }, [manifest, visibleSystems, displayMode, selectedPartId, isolated, ghostOthers, explosionFactor, biologicalSex]);

  // Handle standard view changes
  useEffect(() => {
    if (!touchControllerRef.current) return;
    touchControllerRef.current.setStandardView(activeView);
    dirtyRef.current = true;
  }, [activeView]);

  // Handle camera reset trigger
  useEffect(() => {
    if (!touchControllerRef.current || cameraResetNonce === 0) return;
    touchControllerRef.current.transitionTo(
      new THREE.Vector3(0, 0.88, 3.1),
      new THREE.Vector3(0, 0.865, 0),
      850
    );
    dirtyRef.current = true;
  }, [cameraResetNonce]);

  // Handle fast discrete zoom in
  useEffect(() => {
    if (!touchControllerRef.current || zoomInNonce === 0) return;
    touchControllerRef.current.zoomIn(0.70); // 30% faster zoom in step
    dirtyRef.current = true;
  }, [zoomInNonce]);

  // Handle fast discrete zoom out
  useEffect(() => {
    if (!touchControllerRef.current || zoomOutNonce === 0) return;
    touchControllerRef.current.zoomOut(1.42); // 42% faster zoom out step
    dirtyRef.current = true;
  }, [zoomOutNonce]);

  // Handle structure selection camera focusing
  useEffect(() => {
    if (!selectedPartId || !manifest || !touchControllerRef.current) return;
    const partIdx = manifest.parts.findIndex((p) => p.id === selectedPartId);
    if (partIdx < 0) return;

    const box = boundsRef.current[partIdx];
    if (box) {
      const part = manifest.parts[partIdx];
      const angle = getPreferredFocusAngle(part.id, part.system);
      touchControllerRef.current.focusBoundingBox(box, angle, 950);
      dirtyRef.current = true;
    }
  }, [selectedPartId, manifest]);

  // Handle explicit focusTarget
  useEffect(() => {
    if (!focusTarget || !touchControllerRef.current) return;
    const target = new THREE.Vector3(...focusTarget.position);
    const eye = focusTarget.eyePosition
      ? new THREE.Vector3(...focusTarget.eyePosition)
      : target.clone().add(new THREE.Vector3(0.2, 0.1, focusTarget.distance || 0.45));
    touchControllerRef.current.transitionTo(eye, target, 900);
    dirtyRef.current = true;
  }, [focusTarget]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" ref={containerRef}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#090d16]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-500">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
            <Loader2 className="w-8 h-8 text-teal-400 absolute animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold tracking-wide text-slate-100 mb-1">
            IMMERSA
          </h2>
          <p className="text-xs uppercase tracking-widest text-teal-400/80 mb-4 font-mono">
            Streaming Anatomical Atlas
          </p>
          <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <span className="mt-2 text-xs font-mono text-slate-400">
            {loadProgress}% Loaded
          </span>
        </div>
      )}

      {/* Anatomical Hover Tooltip (Direct DOM Ref - Zero React Re-Renders) */}
      <div
        ref={tooltipRef}
        style={{ display: 'none' }}
        className="pointer-events-none fixed top-0 left-0 z-30 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-teal-500/30 text-xs font-medium text-slate-200 shadow-xl shadow-black/40 -translate-x-1/2 transition-opacity duration-75 items-center gap-1.5"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
        <span className="tooltip-name" />
      </div>
    </div>
  );
};
