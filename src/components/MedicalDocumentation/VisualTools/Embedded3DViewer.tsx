import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAnatomyStore } from '../../../store/useAnatomyStore';
import { createStandalonePartGeometry } from '../../../services/modelLoader';
import { ANATOMICAL_SYSTEMS } from '../../../data/systems';
import { getPartMaterialKey } from '../../../data/anatomyCatalog';
import { RotateCcw, Box, Compass, Sparkles, Eye } from 'lucide-react';

interface Embedded3DViewerProps {
  partId?: string;
  systemId?: string;
  canonicalName: string;
}

function getPartInspectionColor(part: { id: string; system: string }): string {
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
  return ANATOMICAL_SYSTEMS.find((s) => s.id === part.system)?.color || '#14b8a6';
}

export const Embedded3DViewer: React.FC<Embedded3DViewerProps> = ({
  partId,
  systemId,
  canonicalName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const manifest = useAnatomyStore((s) => s.manifest);
  const biologicalSex = useAnatomyStore((s) => s.biologicalSex);

  const [loading, setLoading] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dimensions, setDimensions] = useState<{ x: number; y: number; z: number } | null>(null);

  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Determine active part: either explicitly provided, or find a key representative part for the system
  const targetPart = React.useMemo(() => {
    if (!manifest) return null;
    if (partId) {
      return manifest.parts.find((p) => p.id === partId) || null;
    }
    if (systemId) {
      // Find prominent representative organ for this system
      const systemParts = manifest.parts.filter((p) => p.system === systemId);
      return systemParts[0] || null;
    }
    return null;
  }, [manifest, partId, systemId]);

  useEffect(() => {
    if (!containerRef.current || !targetPart || !manifest) return;
    const container = containerRef.current;
    let disposed = false;
    let animId = 0;

    setLoading(true);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x090e1a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.001,
      20
    );
    camera.position.set(0.12, 0.08, 0.28);
    cameraRef.current = camera;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.minDistance = 0.015;
    controls.maxDistance = 5;
    controlsRef.current = controls;

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff5ea, 2.5);
    key.position.set(2, 3, 2);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fill.position.set(-2, 1, 1.5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x14b8a6, 2.0);
    rim.position.set(0, -2, -2.5);
    scene.add(rim);

    // Load Mesh
    (async () => {
      try {
        const geom = await createStandalonePartGeometry(targetPart, manifest, biologicalSex);
        if (disposed) return;

        geom.computeBoundingBox();
        const bbox = geom.boundingBox || new THREE.Box3();
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        geom.center(); // Center at origin for inspection turntable

        const size = new THREE.Vector3();
        bbox.getSize(size);
        setDimensions({
          x: Math.round(size.x * 1000) / 10,
          y: Math.round(size.y * 1000) / 10,
          z: Math.round(size.z * 1000) / 10,
        });

        const colorHex = getPartInspectionColor(targetPart);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colorHex),
          roughness: 0.42,
          metalness: 0.08,
          wireframe,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geom, mat);
        scene.add(mesh);
        meshRef.current = mesh;

        // Auto-fit camera
        const maxDim = Math.max(size.x, size.y, size.z, 0.02);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.8;
        cameraZ = Math.max(cameraZ, 0.05);

        camera.position.set(cameraZ * 0.7, cameraZ * 0.4, cameraZ * 1.1);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();

        setLoading(false);
      } catch (err) {
        console.error('Failed to load standalone 3D geometry:', err);
        setLoading(false);
      }
    })();

    // Animation Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.autoRotate = autoRotate;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [targetPart, manifest, biologicalSex]);

  // Update wireframe live
  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframe;
    }
  }, [wireframe]);

  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-4 md:p-6 shadow-xl space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Box className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-100 tracking-tight">
              Interactive 3D Turntable Inspection
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full 360° stereotactic mesh inspection for <span className="text-teal-300 font-semibold">{canonicalName}</span>
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              autoRotate
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{autoRotate ? 'Turntable Active' : 'Turntable Paused'}</span>
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              wireframe
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[320px] md:h-[400px] rounded-xl overflow-hidden border border-slate-800/80 bg-[#070b14] flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-2">
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-teal-300">Rendering high-resolution 3D mesh...</span>
          </div>
        )}

        {/* Bounding Box Dimensions Badge */}
        {dimensions && !loading && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[10px] font-mono text-slate-400 shadow-lg">
            <span>Dimensions: </span>
            <span className="text-teal-300 font-semibold">{dimensions.x} × {dimensions.y} × {dimensions.z} mm</span>
          </div>
        )}

        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800/80 text-[10px] text-slate-500 font-mono">
          Drag to orbit · Scroll to zoom
        </div>
      </div>
    </div>
  );
};

