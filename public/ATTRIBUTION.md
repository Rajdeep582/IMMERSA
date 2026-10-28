# Anatomy data attribution and model basis

## Male reference geometry

BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimetres/Z-up to metres/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with a 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colours. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Female reference model

The host atlas is male-only. The female model is an **educational reference assembly**, not a female cadaveric scan:

- The shared body mesh is transformed with smooth anthropometric female proportions (stature, biacromial breadth, thorax, waist, gynecoid pelvic flare, subpubic arch, femoral convergence and reduced muscle volume).
- The male external genital surface is removed in the female surface shader.
- The uterus, cervix, ovaries, uterine tubes, vagina, urethra, clitoris, labia, vestibule, orifices and mammary surface structures are explicit procedural meshes placed in the pelvic and perineal regions.
- The skeletal and muscular templates retain male-reference coverage. The female pelvis is an anthropometric transformation, not a female CT/MRI segmentation.
- The external genital meshes are simplified educational representations. Individual variation in labial size, clitoral anatomy, hymen, pigmentation and hair distribution is not fully represented.

## Clinical and educational references consulted

- OpenStax, *Anatomy and Physiology 2e*, Ch. 27.1 (Male Reproductive System) and Ch. 27.2 (Female Reproductive System). https://openstax.org/books/anatomy-and-physiology-2e
- Merck Manual (Consumer Version), *Structure of the Male Reproductive System*. https://www.merckmanuals.com/home/men-s-health-issues/biology-of-the-male-reproductive-system/structure-of-the-male-reproductive-system
- Cleveland Clinic, *Female Reproductive System*; *Vulva*; *Clitoris*; *Uterus*; *Ovaries*; *Fallopian Tubes*; *Gynecoid Pelvis*.
- U.S. National Library of Medicine, *The Visible Human Project*. https://www.nlm.nih.gov/research/visible/visible_human.html
- Terminologia Anatomica (TA2), FIPAT; Foundational Model of Anatomy (FMA).
- Gray's Anatomy, 42nd edition (anatomical basis and relationships).

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

That HuBMAP female asset is **not** part of the current release. The current female pelvic anatomy is generated procedurally as described above.

## Known limitations

- The female skeleton and musculature share the male BodyParts3D template; only proportional transformation is applied.
- The male scrotum, female vulva and female pelvic viscera are procedural approximations, intended for education and orientation rather than surgical simulation.
- The female urethra is modelled at a schematic length within a male-derived pelvis; the clinically cited length is 3.5–4 cm, while the rendered course is necessarily shaped by the shared pelvic template.
- The model does not represent every anatomical variant, and no model can replace cadaveric, imaging or clinical training.

This interface is an educational visualization, not a medical device.
