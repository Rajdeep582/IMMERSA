# Immersa — interactive 3D human anatomy explorer

Browser-based anatomy explorer with two switchable bodies:

- **Male** — BodyParts3D (2,234 separately segmented meshes, FMA-identified)
- **Female** — HuBMAP Human Reference Atlas 3D reference organs of the Visible Human Female (882 meshes, UBERON/FMA-identified)
React 19 + TypeScript (strict) + Vite + Three.js via React Three Fiber.

## Run

```bash
npm ci          # install exact locked dependencies
npm run dev     # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production build), `npm run preview` (serve `dist/`), `npm test` (Vitest), `npm run typecheck`.

## What is in the box

| Area | Implementation |
|---|---|
| Male model | 2,234 BodyParts3D meshes → 1,659 FMA structures, 172 navigation groups, 12 systems (`public/data/male`) |
| Female model | 882 HRA meshes → 972 nodes incl. reproductive organs, mammary glands, ~280 brain regions, 29 spinal-cord segments, landmark surfaces (`public/data/female`) |
| Body toggle | Male/Female switch in the top bar (also `?body=female`); camera pose kept, selection mapped to the equivalent structure |
| LOD | Male body view 1.62 M tris / 14.3 MB, full res 6.68 M / 37 MB. Female body view 0.50 M / 3.7 MB, full res 5.27 M / 23 MB. Full-res regional chunks load on demand |
| Camera | Custom spherical rig (`src/engine/cameraRig.ts`): time-based damping, pointer-anchored dolly, inertia, interruptible/retargetable cinematic flights with zoom arc, adaptive near/far |
| Input | Mouse, wheel, trackpad pinch (ctrl+wheel), touch orbit / pinch-at-midpoint / two-finger pan, keyboard (`src/engine/rigInput.ts`) |
| Layers | Per-system opacity, dissection presets, per-structure hide/fade, isolate / ghost-others, exploded group view |
| Picking | BVH-accelerated raycast with ring sampling for thin structures; click the same spot again to drill through overlapping structures; screen-space outline + floating label on the selection |
| Inspector | Second independent WebGL viewport with own camera, full-resolution mesh, neighbour context, wireframe |
| Guided | 4 scroll-scrubbed journeys (spine → L1, heart, brain, upper limb), reversible, interruptible |
| Adaptive quality | Device tiering + runtime DPR controller, demand-driven rendering (no frames when idle) |

## Data pipeline

`scripts/` rebuilds `public/data` and `public/models` from the original BodyParts3D download:

```bash
# 1. Download from https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html into raw/bp3d/:
#    isa_BP3D_4.0_obj_99.zip (unzipped), isa_/partof_ *_parts_list_e.txt, *_element_parts.txt, *_inclusion_relation_list.txt
python3 scripts/scan_headers.py            # -> raw/bp3d/fj_meta.json
python3 scripts/build_registry.py
node scripts/build_meshes.mjs                 # writes public/models/male (move its manifest.json to public/data/male/)
# Female: clone hubmapconsortium/ccf-3d-reference-object-library and the v2.0 crosswalk from ccf-releases into raw/hra/
node scripts/build_female.mjs                 # writes public/data/female + public/models/female
# pipeline deps: meshoptimizer @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions
```

See `ASSETS.md` for licences, attribution and known anatomical gaps.

Educational visualization — not a diagnostic or clinical tool.
