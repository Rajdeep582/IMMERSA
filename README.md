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
| Male model | 2,234 BodyParts3D meshes → 1,659 FMA structures, 172 navigation groups, 12 systems, + 258 Z-Anatomy nerve/spinal-cord meshes (`public/data/male`) |
| Female model | 882 HRA meshes → 972 nodes incl. reproductive organs, mammary glands, ~280 brain regions, 29 spinal-cord segments, landmark surfaces, + 249 Z-Anatomy peripheral-nerve meshes warped to this body (`public/data/female`) |
| Body toggle | Male/Female switch in the top bar (also `?body=female`); camera pose kept, selection mapped to the equivalent structure |
| LOD | Male body view 1.62 M tris / 14.3 MB, full res 6.68 M / 37 MB. Female body view 2.55 M / 13 MB (coarse HRA meshes kept full-res), full res 5.27 M / 23 MB. Full-res regional chunks load on demand |
| Camera | Custom spherical rig (`src/engine/cameraRig.ts`): time-based damping, pointer-anchored dolly, inertia, interruptible/retargetable cinematic flights with zoom arc, adaptive near/far |
| Input | Mouse, wheel, trackpad pinch (ctrl+wheel), touch orbit / pinch-at-midpoint / two-finger pan, keyboard (`src/engine/rigInput.ts`) |
| Layers | Per-system opacity, dissection presets, per-structure hide/fade, isolate / ghost-others, exploded group view |
| Picking | BVH-accelerated raycast with ring sampling for thin structures; click the same spot again to drill through overlapping structures; screen-space outline + floating label on the selection |
| Inspector | Second independent WebGL viewport with own camera, full-resolution mesh, neighbour context, wireframe |
| Guided | 4 scroll-scrubbed journeys (spine → L1, heart, brain, upper limb), reversible, interruptible |
| Learn pages | `#/learn` hub + 23 study guides (12 systems + brain, spinal cord, cranial nerves, spinal nerves & plexuses, autonomic NS, vertebral column, skull, heart, stomach, liver/pancreas, intestines). Fixed order: what & where → structure → function → clinical → key points → self-test → references. Live isolated 3D figure, diagrams (flows, trees, layers, tables), keyword highlighting, structure links into 3D, text size, light/dark reading theme (`src/learn/`) |
| Study card | Selecting any structure shows an isolated 3D view plus a structured card (location, structure, function, clinical, key points, nerve/blood supply) and a link to its guide. ~130 hand-written cards (all major nerves, key organs) + earlier curated entries; every other structure gets a card assembled from the hierarchy and labelled as such |
| Nervous system | Brain, spinal cord (male: Z-Anatomy white matter, horns, tracts, spinal ganglia, dura), cranial nerves I–XII, phrenic nerves (C3–C5), brachial / lumbar / sacral plexuses with named branches to the digits, intercostal nerves, sympathetic trunks with ganglia, spinal roots and cauda equina — in both models. Colour-coded: cranial amber, spinal/plexus yellow, sympathetic green |
| Adaptive quality | Device tiering (iPad detected via touch-Mac UA, Apple GPUs → high tier), demand-driven rendering (no frames when idle) |
| Draw-call batching | Units merged per system + material in a worker (`mergeUnits`); per-unit mask texture drops units that are selected / hovered / sliced / fading, which then draw on their own. ~1,000 → ~50 draw calls, CPU render ~40 → ~7 ms. Disable with `?batch=0` |
| Sharp rendering | Adaptive DPR only while moving (floor ≥ 1×); 160 ms after interaction stops the frame re-renders at full device DPR (up to 2×) |
| Loading | Priority queue (skin → skeleton → nerves → organs → vessels/muscle), concurrency per tier, selected/isolated systems jump the queue; shader variants precompiled (`compileAsync`) during download; BVH built in idle time; meshopt decode on worker pool sized to CPU cores |
| Offline cache | Service worker (`public/sw.js`, production only) caches models / data / assets cache-first, versioned per build — repeat visits load from disk |

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
# Nerves (both models): Z-Anatomy Startup.blend from github.com/Z-Anatomy/Models-of-human-anatomy (Z-Anatomy.zip)
pip install bpy==5.1.2 scipy numpy
python3 scripts/za/export.py && python3 scripts/za/export_cord.py      # curves → tube meshes (needs bpy)
node scripts/za/dump_skin.mjs <male skin hi glb> skin_m.f32 ; node scripts/za/dump_skin.mjs <female skin hi glb> skin_f.f32
python3 scripts/za/tps_male.py && python3 scripts/za/tps_female.py   # landmark registration
python3 scripts/za/export_extra.py                                        # sympathetic ganglia, spinal dura
node scripts/za/dump_units.mjs male phrenic_lm.json "Right scalenus anterior" ... && python3 scripts/za/phrenic.py   # constructed phrenic nerves
python3 scripts/za/cordcheck.py && python3 scripts/za/apply.py && node scripts/za/build_nerves.mjs   # append to nervous.glb + registry/manifest
node scripts/za/fix_misfiled.mjs                                          # male: move FMA13884 ventricular wall from brain to heart
# pipeline deps: meshoptimizer @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions
```

See `ASSETS.md` for licences, attribution and known anatomical gaps.

Educational visualization — not a diagnostic or clinical tool.
