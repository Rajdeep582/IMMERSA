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
| Modifications | Node transforms baked; duplicate node names deduplicated (organ-specific files first); vertices welded; inward-facing surfaces re-oriented (148 meshes); body re-centred on the skin bounding box; body-view simplification (0.15–0.6 mm); quantisation + meshopt; display names derived from node names with typo fixes (e.g. "opthalmic" → "ophthalmic") |
| Not co-registered | The female (Visible Human Female) and male (BodyParts3D) bodies are different individuals. Structures missing from one model are never borrowed from the other. |

## Terminology — Foundational Model of Anatomy (FMA)

University of Washington, CC BY 3.0. Used through BodyParts3D for structure ids and names. FMA ids link to `https://bioregistry.io/fma:<id>`.

## Educational text — OpenStax Anatomy and Physiology 2e

OpenStax / Rice University, CC BY 4.0, https://openstax.org/details/books/anatomy-and-physiology-2e.
Curated summaries (`src/data/curated.ts`, ~80 entries) are short paraphrases of standard textbook anatomy and cite the section number they rely on. Structures without a curated entry show only registry facts (name, FMA id, hierarchy, mesh statistics).

## Navigation hierarchy

Region/side groupings (e.g. "Left upper limb › Forearm") are generated in `scripts/build_registry.py` from FMA names, FMA is_a ancestors and mesh positions, for navigation. They are not FMA part_of relations; the leaf structures and their names are FMA terms.

## Known gaps — male model (not approximated or invented)

- Spinal cord not modelled (only a ~3.5 cm upper-cervical segment of the central canal); no spinal nerves/roots. Peripheral nerves limited to optic nerves and orbital branches of CN III, IV and V1.
- No lung surfaces (bronchial tree + pulmonary vessels only); no lymph vessels or nodes.
- Male body only; female anatomy is the separate female model (different individual, not co-registered).
- Skin is one surface: epidermis/dermis/hypodermis, follicles and glands not separated.
- Hip bone is one mesh per side; bony landmarks are not segmented, so none are labelled in 3D.
- No microscopic/histological models. The camera stops at a 2.2 cm minimum distance in the body view (6 mm in the inspector) instead of magnifying beyond the data.
- "Adjacent in model" lists are computed from bounding boxes, not anatomical relations.

## Known gaps — female model

- Skeleton limited to vertebrae C1–L6 (this individual has six lumbar vertebrae), pelvis, femur, patella, tibia and fibula. No skull, ribs, sternum, upper-limb or foot bones.
- Muscles limited to extra-ocular muscles and rectus femoris with quadriceps tendon.
- No stomach, oesophagus, oral cavity or endocrine glands; no peripheral or spinal nerves beyond the optic nerves; vessels cover orbit, thorax, abdomen and pelvis only.
- Landmark surfaces (impressions, entheses, condyles, hila) are thin patches over organ/bone surfaces.

## Not bundled

Nothing proprietary is used. No models, textures, code or UI from Complete Anatomy, BioDigital or Visible Body.
