import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAnatomyStore } from '../../store/useAnatomyStore';
import { createStandalonePartGeometry } from '../../services/modelLoader';
import { getAnatomicalProfile } from '../../data/clinicalProfiles';
import { ANATOMICAL_SYSTEMS } from '../../data/systems';
import { getPartMaterialKey } from '../../data/anatomyCatalog';
import { ANATOMICAL_SURFACE_SHADER_CHUNKS } from '../../services/highDetailAnatomy';
import type { AnatomicalLandmark } from '../../types/anatomy';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Box,
  MapPin,
  Sparkles,
  Info,
  X,
  Compass,
  BookOpen
} from 'lucide-react';

interface InspectionViewportProps {
  isModal?: boolean;
  onClose?: () => void;
}

function getInspectionColor(part: { id: string; system: string }): string {
  const materialKey = getPartMaterialKey(part as any);
  const overrides: Record<string, string> = {
    skin: '#d7a589',
    'genital-skin': '#c99078',
    scrotum: '#b57f6d',
    hair: '#2b211b',
    lip: '#a96363',
    mucosa: '#9d5960',
    'mucosa-light': '#b06c73',
    vestibule: '#6b3f47',
    areola: '#985a57',
    nipple: '#ad6b65',
    orifice: '#3a2228',
  };
  if (overrides[materialKey]) return overrides[materialKey];
  return ANATOMICAL_SYSTEMS.find((s) => s.id === part.system)?.color || '#cbd5e1';
}

export const InspectionViewport: React.FC<InspectionViewportProps> = ({
  isModal = false,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const manifest = useAnatomyStore((s) => s.manifest);
  const selectedPartId = useAnatomyStore((s) => s.selectedPartId);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);
  const selectPart = useAnatomyStore((s) => s.selectPart);
  const setInspectModalOpen = useAnatomyStore((s) => s.setInspectModalOpen);
  const openDocumentation = useAnatomyStore((s) => s.openDocumentation);

  const [loading, setLoading] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [selectedLandmark, setSelectedLandmark] = useState<AnatomicalLandmark | null>(null);
  const [dimensions, setDimensions] = useState<{ x: number; y: number; z: number } | null>(null);

  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const landmarkGroupRef = useRef<THREE.Group | null>(null);

  const currentPart = manifest?.parts.find((p) => p.id === selectedPartId);
  const profile = currentPart
    ? getAnatomicalProfile(currentPart.id, currentPart.name, currentPart.system)
    : null;

  // Setup Independent Three.js Inspection Scene
  useEffect(() => {
    if (!containerRef.current || !currentPart || !manifest) return;
    const container = containerRef.current;
    let disposed = false;
    let animId = 0;

    setLoading(true);
    setSelectedLandmark(null);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0a0f1d, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / container.clientHeight,
      0.001,
      20
    );
    camera.position.set(0.12, 0.08, 0.28);
    cameraRef.current = camera;

    // OrbitControls tuned with gentle sensitivity and damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.55; // Controlled, non-aggressive rotation
    controls.zoomSpeed = 1.35;   // Fast, responsive zoom in inspection window
    controls.minDistance = 0.015;
    controls.maxDistance = 4;
    controlsRef.current = controls;

    // Studio Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff5ea, 2.8);
    key.position.set(1.5, 2.5, 2.0);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x38bdf8, 1.5);
    fill.position.set(-2, 1, 1.5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x14b8a6, 2.2);
    rim.position.set(0, -2, -2.5);
    scene.add(rim);

    // Load geometry
    const landmarkGroup = new THREE.Group();
    scene.add(landmarkGroup);
    landmarkGroupRef.current = landmarkGroup;

    (async () => {
      try {
        const geom = await createStandalonePartGeometry(currentPart, manifest, biologicalSex);
        if (disposed) return;

        // Center geometry around local origin
        geom.computeBoundingBox();
        const bbox = geom.boundingBox!;
        const center = bbox.getCenter(new THREE.Vector3());
        geom.translate(-center.x, -center.y, -center.z);

        const size = bbox.getSize(new THREE.Vector3());
        setDimensions({
          x: Math.round(size.x * 1000), // mm
          y: Math.round(size.y * 1000),
          z: Math.round(size.z * 1000),
        });

        // PBR Material with micro-anatomical texturing shader
        const isBone = currentPart.system === 'skeletal';
        const isMuscle = currentPart.system === 'muscular';
        const isVascular = currentPart.system === 'arterial' || currentPart.system === 'cardiac';

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(getInspectionColor(currentPart)),
          metalness: isBone ? 0.05 : 0.06,
          roughness: isBone ? 0.6 : 0.5,
          side: THREE.DoubleSide,
        });

        mat.onBeforeCompile = (shader) => {
          shader.vertexShader = `
            ${ANATOMICAL_SURFACE_SHADER_CHUNKS.vertexPars}
            ${shader.vertexShader}
          `;
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            ${ANATOMICAL_SURFACE_SHADER_CHUNKS.vertexMain}
            `
          );

          let microMod = '';
          if (isBone) microMod = ANATOMICAL_SURFACE_SHADER_CHUNKS.fragmentBoneMod;
          else if (isMuscle) microMod = ANATOMICAL_SURFACE_SHADER_CHUNKS.fragmentMuscleMod;
          else if (isVascular) microMod = ANATOMICAL_SURFACE_SHADER_CHUNKS.fragmentVascularMod;

          shader.fragmentShader = `
            ${ANATOMICAL_SURFACE_SHADER_CHUNKS.fragmentPars}
            ${shader.fragmentShader}
          `;
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            ${microMod}
            `
          );
        };

        const mesh = new THREE.Mesh(geom, mat);
        scene.add(mesh);
        meshRef.current = mesh;

        // Calculate framing distance
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const dist = (maxDim / 2) / Math.tan(fov / 2) * 1.5;
        camera.position.set(dist * 0.4, dist * 0.25, dist * 0.9);
        controls.target.set(0, 0, 0);
        controls.update();

        // Add 3D Anatomical Landmark Pins
        if (profile?.landmarks && profile.landmarks.length > 0) {
          profile.landmarks.forEach((lm) => {
            const pinGeom = new THREE.SphereGeometry(maxDim * 0.025, 16, 16);
            const pinMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
            const pin = new THREE.Mesh(pinGeom, pinMat);

            // Scale landmark coordinates to match model size
            pin.position.set(
              lm.position[0] * (size.x / 0.08),
              lm.position[1] * (size.y / 0.08),
              lm.position[2] * (size.z / 0.08)
            );
            pin.userData = { landmark: lm };

            // Outer pulse ring
            const ringGeom = new THREE.RingGeometry(maxDim * 0.035, maxDim * 0.045, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
            const ringMesh = new THREE.Mesh(ringGeom, ringMat);
            ringMesh.lookAt(camera.position);
            pin.add(ringMesh);

            landmarkGroup.add(pin);
          });
        }

        setLoading(false);
      } catch (e) {
        console.error('Inspection geometry loading error:', e);
        setLoading(false);
      }
    })();

    // Raycast landmark pins on click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePinClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(landmarkGroup.children, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.landmark) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.landmark) {
          setSelectedLandmark(obj.userData.landmark);
        }
      }
    };
    renderer.domElement.addEventListener('click', handlePinClick);

    // Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    // Animation Loop
    const render = () => {
      if (disposed) return;
      animId = requestAnimationFrame(render);

      if (controls.autoRotate) {
        controls.update();
      }

      // Billboard landmark rings towards camera
      landmarkGroup.children.forEach((child) => {
        const ring = child.children[0];
        if (ring) {
          ring.lookAt(camera.position);
        }
      });

      renderer.render(scene, camera);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('click', handlePinClick);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [currentPart, manifest, biologicalSex]);

  // Update wireframe mode
  useEffect(() => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.wireframe = wireframe;
    }
  }, [wireframe]);

  // Update auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.5;
    }
  }, [autoRotate]);

  // Update landmark visibility
  useEffect(() => {
    if (landmarkGroupRef.current) {
      landmarkGroupRef.current.visible = showLandmarks;
    }
  }, [showLandmarks]);

  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!currentPart) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
        <Compass className="w-10 h-10 mb-3 text-slate-600 stroke-1" />
        <p className="text-sm font-medium text-slate-400">No Structure Selected</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Select any anatomical structure in the main 3D viewport or search to inspect its isolated 3D geometry and landmarks.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col w-full h-full bg-[#090d18] rounded-xl overflow-hidden border border-slate-800 shadow-2xl ${isModal ? 'p-1' : ''}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <div className="truncate">
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider truncate">
              {currentPart.name}
            </h3>
            <p className="text-[10px] text-teal-400/90 font-mono">
              FMA ID: {currentPart.conceptId} &bull; {currentPart.system}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              wireframe ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Wireframe Mesh"
          >
            <Box className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              autoRotate ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Turntable Rotation"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              showLandmarks ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Anatomical Landmarks"
          >
            <MapPin className="w-4 h-4" />
          </button>

          <button
            onClick={resetCamera}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (onClose) onClose();
              setInspectModalOpen(false);
              openDocumentation({ partId: currentPart.id });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-colors"
            title="Open comprehensive medical documentation page for this structure"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Know More</span>
          </button>

          {!isModal ? (
            <button
              onClick={() => setInspectModalOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors"
              title="Expand Inspection Viewport"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs transition-colors"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative flex-1 w-full h-full min-h-[220px]" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin mb-2" />
            <span className="text-xs text-slate-400 font-mono">Extracting 3D Geometry...</span>
          </div>
        )}

        {/* Physical Dimension Overlay */}
        {dimensions && !loading && (
          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded bg-slate-900/85 border border-slate-800 backdrop-blur-md text-[10px] font-mono text-slate-400 z-10 flex gap-2">
            <span>W: <b className="text-slate-200">{dimensions.x}</b> mm</span>
            <span>H: <b className="text-slate-200">{dimensions.y}</b> mm</span>
            <span>D: <b className="text-slate-200">{dimensions.z}</b> mm</span>
          </div>
        )}

        {/* Floating Landmark Detail Card if clicked */}
        {selectedLandmark && (
          <div className="absolute top-3 left-3 right-3 p-3 rounded-lg bg-slate-900/95 border border-cyan-500/40 backdrop-blur-md shadow-xl text-left z-20 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs mb-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{selectedLandmark.name}</span>
              </div>
              <button
                onClick={() => setSelectedLandmark(null)}
                className="text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">
              {selectedLandmark.description}
            </p>
            {selectedLandmark.clinicalSignificance && (
              <p className="text-[10px] text-amber-300/90 leading-normal border-t border-slate-800/80 pt-1">
                <b>Clinical Note:</b> {selectedLandmark.clinicalSignificance}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Landmark Quick-Select Bar */}
      {profile?.landmarks && profile.landmarks.length > 0 && (
        <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-10">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0 mr-1">
            Landmarks:
          </span>
          {profile.landmarks.map((lm) => (
            <button
              key={lm.id}
              onClick={() => setSelectedLandmark(lm)}
              className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
                selectedLandmark?.id === lm.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 border border-slate-700/40'
              }`}
            >
              {lm.name.split('(')[0].trim()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

