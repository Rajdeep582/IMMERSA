# Assets, sources and licences

## 3D geometry — BodyParts3D 4.0

| | |
|---|---|
| Source | https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html (`isa_BP3D_4.0_obj_99.zip`, `partof_BP3D_4.0_obj_99.zip`, part lists, element lists, inclusion relations) |
| Owner | The Database Center for Life Science (DBCLS), Japan |
| Licence | **CC BY 4.0** per the current licence page (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). The OBJ file headers still carry the earlier notice "CC BY-SA 2.1 Japan". Both permit redistribution of adapted material with attribution; if the SA terms are taken to apply, the derived glTF files in `public/models` are shared under the same licence. |
| Required attribution | "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International" (shown in-app under Sources and in every structure's references) |
| Modifications | Converted mm/z-up → metres/y-up; per-element meshes simplified for the body view with meshoptimizer (absolute error 0.12–0.7 mm by system); full-resolution meshes kept unsimplified; positions quantised (14-bit) and normals (8-bit) via KHR_mesh_quantization; EXT_meshopt_compression |
| Identifiers | Each mesh carries its FMA concept id and English name from the BodyParts3D header |

## 3D geometry (female) — HuBMAP HRA 3D Reference Object Library

| | |
|---|---|
| Source | https://github.com/hubmapconsortium/ccf-3d-reference-object-library (VH_Female v1.2, v1.3, v1.4 GLB files); labels and ontology ids from `v2.0/models/asct-b-3d-models-crosswalk.csv` in https://github.com/hubmapconsortium/ccf-releases |
| Licence | **CC BY 4.0** (repository LICENSE) |
| Attribution | "3D Reference Object Library, HuBMAP Human Reference Atlas" (shown in-app under Sources and in references) |
| Files used | Skin, mammary glands, uterus, ovaries, uterine tubes, vagina, uterine/ovarian ligaments, pelvis, vertebrae, knee bones/ligaments/muscles, eye muscles/nerves, Allen brain, spinal cord, heart + heart vessels, blood vasculature, lungs, trachea, main bronchi, larynx, liver, gallbladder, biliary tree and ducts, pancreas, small and large intestine, kidneys, ureters, bladder, spleen, thymus, palatine tonsils, reference lymph node, eyes |
| Excluded | Placenta (pregnancy-specific), small-intestine measurement helper, extraction-site and landmark-marker files |
| Modifications | Node transforms baked; duplicate node names deduplicated (organ-specific files first); vertices welded; inward-facing surfaces re-oriented (148 by signed volume, 65 open patches by centroid test) and rendered double-sided; angle-weighted vertex normals; body re-centred on the skin bounding box; body-view simplification (0.1–0.4 mm, meshes under 3k–40k tris by system kept full-resolution — all digestive and muscular meshes); quantisation + meshopt; display names derived from node names with typo fixes (e.g. "opthalmic" → "ophthalmic") |
| Not co-registered | The female (Visible Human Female) and male (BodyParts3D) bodies are different individuals. Structures missing from one model are never borrowed from the other. |

## 3D geometry (nerves, both models) — Z-Anatomy

Z-Anatomy, the libre 3D atlas of anatomy (Lluís Vinent), CC BY-SA 4.0, https://github.com/Z-Anatomy/Models-of-human-anatomy — itself built on BodyParts3D.
Used: the peripheral-nervous-system collection of `Startup.blend` (≈250 bevelled curves: cranial nerves, brachial/lumbar/sacral plexuses with branches, intercostal nerves, sympathetic trunks, spinal roots, cauda equina) and, for the male model only, the spinal-cord white matter, anterior/posterior horns, eight descending tracts and spinal ganglia.
Also used: the paired chains of sympathetic-trunk ganglia (both models) and the spinal dura mater (male).
Modifications: curves evaluated to tube meshes in Blender; registered to the male BodyParts3D skeleton with a thin-plate spline on ~70 matched bones including every vertebra C1–L5 (median residual < 1 mm; the cord sits in the vertebral canal behind the discs and meets the BodyParts3D medulla); warped to the female HRA body with a second spline on ~540 landmarks (shared organs/vessels, vertebrae, pelvis, lower-limb bones, skin-derived arm/foot/torso points) plus 30 stiff spinal-cord centreline and brainstem landmarks, so warped roots meet the female HRA spinal cord (centreline offset ≤ 1.3 mm along its length); nerve tubes thickened by 0.5 mm along their normals toward real calibre; welded, simplified for the body view, quantised + meshopt.
**Licence of derived files:** the nerve and spinal-cord meshes inside `public/models/*/nervous.glb` (node names starting `Z_`) and `public/models/*/hi/nervous__grp-nervous-peripheral-nervous-system.glb` are derivative works and are shared under **CC BY-SA 4.0**. Attribution: “Z-Anatomy — The libre 3D atlas of anatomy — CC BY-SA 4.0 (models derived from BodyParts3D, DBCLS)”.
Accuracy notes: paths are an atlas reconstruction, not one individual's dissection; in the female model they are spline-warped from the male atlas, so courses follow her skeleton and body outline but are not her own nerves. **Phrenic nerves (constructed, not from Z-Anatomy):** Z-Anatomy has no phrenic nerve. Each phrenic nerve is built from the male model's own structures along the textbook course (scalenus anterior anterior surface lateral→medial, between subclavian artery and vein, lateral to brachiocephalic vein/SVC on the right or over the aortic arch on the left, along the heart border to the diaphragm), as a 2.2 mm tube, then warped to the female body. Registry nodes carry `constructed: true`. Ansa cervicalis, cutaneous cervical-plexus branches, splanchnic nerves and autonomic plexuses are not in the source and are not drawn.

## Terminology — Foundational Model of Anatomy (FMA)

University of Washington, CC BY 3.0. Used through BodyParts3D for structure ids and names. FMA ids link to `https://bioregistry.io/fma:<id>`.

## Educational text — OpenStax Anatomy and Physiology 2e

OpenStax / Rice University, CC BY 4.0, https://openstax.org/details/books/anatomy-and-physiology-2e.
Learning pages (`src/learn/topics/*.ts`) and structure study cards (`src/learn/study*.ts`, `src/data/curated.ts`) are short, original paraphrases of standard textbook anatomy, cited per entry by OpenStax section title (section numbers differ between 2e printings) and cross-checked against StatPearls (NCBI Bookshelf; linked, not copied). Structures without a written card get one assembled from registry facts (side, hierarchy, contents) plus the nearest ancestor's notes, and the card says so.

## Corrections

- Male: BodyParts3D FMA13884 “Wall of ventricle” (FJ2428) is the cardiac ventricular wall; the registry build had filed it under the brain’s ventricular system, so it appeared inside the nervous system. It is now part of Heart › Chambers and valves (mesh moved to the cardiovascular files).

## Navigation hierarchy

Region/side groupings (e.g. "Left upper limb › Forearm") are generated in `scripts/build_registry.py` from FMA names, FMA is_a ancestors and mesh positions, for navigation. They are not FMA part_of relations; the leaf structures and their names are FMA terms.

## Known gaps — male model (not approximated or invented)

- BodyParts3D has no spinal cord or peripheral nerves beyond the orbit; these now come from Z-Anatomy (above), plus the constructed phrenic nerves. Cutaneous cervical-plexus branches and autonomic plexuses are still absent.
- No lung surfaces (bronchial tree + pulmonary vessels only); no lymph vessels or nodes.
- Male body only; female anatomy is the separate female model (different individual, not co-registered).
- Skin is one surface: epidermis/dermis/hypodermis, follicles and glands not separated.
- Hip bone is one mesh per side; bony landmarks are not segmented, so none are labelled in 3D.
- No microscopic/histological models. The camera stops at a 2.2 cm minimum distance in the body view (6 mm in the inspector) instead of magnifying beyond the data.
- "Adjacent in model" lists are computed from bounding boxes, not anatomical relations.

## Known gaps — female model

- Skeleton limited to vertebrae C1–L6 (this individual has six lumbar vertebrae), pelvis, femur, patella, tibia and fibula. No skull, ribs, sternum, upper-limb or foot bones.
- Muscles limited to extra-ocular muscles and rectus femoris with quadriceps tendon.
- No stomach, oesophagus, oral cavity or endocrine glands; vessels cover orbit, thorax, abdomen and pelvis only. Peripheral nerves are the warped Z-Anatomy atlas nerves (see above), not HRA geometry.
- Landmark surfaces (impressions, entheses, condyles, hila) are thin patches over organ/bone surfaces.

## Not bundled

Nothing proprietary is used. No models, textures, code or UI from Complete Anatomy, BioDigital or Visible Body.
- Surface micro-texture (bump, albedo cavities, roughness variation, grazing-angle shading) is procedural shader noise, not scanned tissue texture. It is applied identically to both models and fades out at a distance.
