import type { Part, ClinicalProfile } from '../types/anatomy';

/**
 * Male external genital additions and male-specific clinical content.
 *
 * BodyParts3D contains the corpora, glans, testes, epididymides, deferent
 * ducts, seminal vesicles, prostate and urethra, but it has no scrotal sac and
 * no explicit urethral meatus. Those two surface structures are generated here
 * so the intact male surface is complete and the penile urethra visibly opens
 * at the tip of the glans.
 */

export const MALE_ADDITIONAL_PARTS: Part[] = [
  {
    id: 'M_SCROTUM',
    name: 'Scrotum',
    conceptId: 'FMA18252',
    system: 'reproductive',
    chunk: -1,
    positions: 0,
    normals: 0,
    indices: 0,
    vertexCount: 1680,
    indexCount: 4800,
    bounds: [[-0.033, 0.747, 0.041], [0.034, 0.814, 0.080]],
  },
  {
    id: 'M_URETHRA_MEATUS',
    name: 'External Urethral Orifice (Male)',
    conceptId: 'FMA19665',
    system: 'urinary',
    chunk: -1,
    positions: 0,
    normals: 0,
    indices: 0,
    vertexCount: 120,
    indexCount: 300,
    bounds: [[-0.003, 0.798, 0.101], [0.003, 0.802, 0.101]],
  },
];

/** BodyParts3D mesh IDs that must never appear on the female reference model. */
export const MALE_BINARY_SPECIFIC_IDS = [
  'FJ2056', // deep dorsal vein of penis
  'FJ2208', // superficial dorsal vein of penis
  'FJ3132', // corpus cavernosum
  'FJ3133', // corpus spongiosum
  'FJ3134', // glans penis
  'FJ3135', // left deferent duct
  'FJ3136', // left epididymis
  'FJ3137', // left seminal vesicle
  'FJ3138', // left testis
  'FJ3139', // prostate
  'FJ3140', // right deferent duct
  'FJ3141', // right epididymis
  'FJ3142', // right testis
  'FJ3143', // right seminal vesicle
  'FJ3426', // left superficial dorsal vein of penis
  'FJ3496', // left dorsal artery of penis
  'FJ3497', // left dorsal artery of penis (branch)
  'FJ3532', // left testicular artery
  'FJ3533', // left testicular vein
  'FJ3592', // right dorsal artery of penis
  'FJ3593', // right dorsal artery of penis (branch)
  'FJ3617', // right testicular artery
  'FJ3618', // right testicular vein
  'FJ3637', // right superficial dorsal vein of penis
  'FJ3148', // male urethra
  'FJ2815', // male pubic hair patch (wrong surface pattern for the female model)
];

export const MALE_CLINICAL_PROFILES: Record<string, ClinicalProfile> = {
  FJ3134: {
    id: 'FJ3134',
    canonicalName: 'Glans Penis',
    latinName: 'Glans penis',
    commonName: 'Head of the Penis',
    system: 'reproductive',
    region: 'External Male Genitalia',
    parentStructure: 'Penis',
    primaryFunction:
      'Expanded, highly innervated distal end of the corpus spongiosum; contains the external urethral orifice and is covered by the prepuce in uncircumcised individuals.',
    arterialSupply: 'Dorsal arteries of the penis and deep artery of the penis (internal pudendal artery branches).',
    venousDrainage: 'Deep and superficial dorsal veins of the penis.',
    innervation: 'Dorsal nerve of the penis (pudendal nerve, S2-S4) and cavernous nerves.',
    relations: ['Proximal: corona glandis and shaft of the penis', 'Distal: external urethral meatus', 'Covered by prepuce unless circumcised'],
    clinicalNotes:
      'The glans is the site of the urethral meatus. Balanitis, phimosis, paraphimosis and penile carcinoma are important clinical considerations. The glans is a mucosal surface, not keratinised skin.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', 'OpenStax Anatomy and Physiology 2e, Ch. 27.1.'],
  },
  FJ3132: {
    id: 'FJ3132',
    canonicalName: 'Corpus Cavernosum of the Penis',
    latinName: 'Corpus cavernosum penis',
    commonName: 'Erectile Body',
    system: 'reproductive',
    region: 'External Male Genitalia / Penile Root',
    parentStructure: 'Penis',
    primaryFunction: 'Paired erectile columns that fill with blood to produce penile rigidity during erection.',
    arterialSupply: 'Deep arteries of the penis (helicine arteries).',
    venousDrainage: 'Cavernous veins into the deep dorsal vein and internal pudendal veins.',
    innervation: 'Cavernous nerves (pelvic plexus) and dorsal nerve of the penis.',
    relations: ['Dorsal to the corpus spongiosum', 'Enclosed by tunica albuginea', 'Proximal crura attach to the ischiopubic rami'],
    clinicalNotes: 'Erectile dysfunction may result from vascular, neurogenic, hormonal or psychogenic causes. Priapism is a prolonged painful erection requiring urgent management.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', "Gray's Anatomy (42nd ed.)."],
  },
  FJ3133: {
    id: 'FJ3133',
    canonicalName: 'Corpus Spongiosum of the Penis',
    latinName: 'Corpus spongiosum penis',
    commonName: 'Spongy Body',
    system: 'reproductive',
    region: 'External Male Genitalia / Penile Root',
    parentStructure: 'Penis',
    primaryFunction: 'Midline erectile column surrounding the male urethra; expands distally as the glans penis.',
    arterialSupply: 'Bulbourethral artery and dorsal arteries of the penis.',
    venousDrainage: 'Bulbar and spongiosal veins.',
    innervation: 'Cavernous nerves and pudendal nerve branches.',
    relations: ['Ventral to the corpora cavernosa', 'Contains the penile urethra', 'Proximal bulb of the penis lies in the superficial perineal pouch'],
    clinicalNotes: 'Urethral injury during pelvic trauma can involve the bulbar or membranous urethra; the spongiosum protects the penile urethra.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', 'OpenStax Anatomy and Physiology 2e, Ch. 27.1.'],
  },
  FJ3139: {
    id: 'FJ3139',
    canonicalName: 'Prostate',
    latinName: 'Prostata',
    commonName: 'Prostate Gland',
    system: 'reproductive',
    region: 'Lesser Pelvis / Retropubic Space',
    parentStructure: 'Male Accessory Sex Glands',
    primaryFunction:
      'Walnut-sized fibromuscular gland inferior to the bladder that surrounds the prostatic urethra and contributes approximately 20-30% of seminal fluid volume.',
    arterialSupply: 'Prostatic branches of the inferior vesical and internal pudendal arteries.',
    venousDrainage: 'Prostatic venous plexus into the internal iliac veins (communicates with the vertebral venous plexus).',
    innervation: 'Prostatic plexus from the inferior hypogastric plexus (sympathetic and parasympathetic).',
    relations: [
      'Superior: bladder neck and seminal vesicles',
      'Anterior: pubic symphysis and retropubic space',
      'Posterior: rectum and rectovesical pouch, palpable on digital rectal examination',
      'Lateral: levator ani and neurovascular bundles',
    ],
    clinicalNotes:
      'Benign prostatic hyperplasia commonly causes lower urinary tract symptoms. Prostate cancer is screened with PSA and digital rectal examination; the neurovascular bundles posterolateral to the gland are critical for erectile function.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', 'OpenStax Anatomy and Physiology 2e, Ch. 27.1.', 'Cleveland Clinic. Prostate.'],
  },
  FJ3138: {
    id: 'FJ3138',
    canonicalName: 'Left Testis',
    latinName: 'Testis sinister',
    commonName: 'Left Testicle',
    system: 'reproductive',
    region: 'Scrotum / Spermatic Cord',
    parentStructure: 'Male Gonads',
    primaryFunction: 'Produces spermatozoa in the seminiferous tubules and secretes testosterone from Leydig cells.',
    arterialSupply: 'Left testicular artery from the abdominal aorta.',
    venousDrainage: 'Pampiniform plexus, forming the left testicular vein which drains into the left renal vein.',
    innervation: 'Testicular plexus (T10-T11 sympathetic afferents); somatic scrotal branches from the ilioinguinal and genitofemoral nerves.',
    relations: ['Covered by tunica vaginalis', 'Epididymis lies posterolateral', 'Suspended by the spermatic cord', 'Usually hangs slightly lower than the right testis'],
    clinicalNotes:
      'Adult testes average 4-7 cm in length and 20-25 mL in volume. Testicular torsion is a surgical emergency; pain relief does not exclude torsion. Testicular cancer usually presents as a painless mass.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', 'OpenStax Anatomy and Physiology 2e, Ch. 27.1.'],
  },
  FJ3142: {
    id: 'FJ3142',
    canonicalName: 'Right Testis',
    latinName: 'Testis dexter',
    commonName: 'Right Testicle',
    system: 'reproductive',
    region: 'Scrotum / Spermatic Cord',
    parentStructure: 'Male Gonads',
    primaryFunction: 'Spermatogenesis and testosterone production.',
    arterialSupply: 'Right testicular artery from the abdominal aorta.',
    venousDrainage: 'Pampiniform plexus; right testicular vein drains into the inferior vena cava.',
    innervation: 'Testicular plexus and scrotal branches.',
    relations: ['Epididymis posterolateral', 'Suspended by the spermatic cord', 'Tunica vaginalis covers the anterior surface'],
    clinicalNotes: 'The right testis usually lies slightly higher than the left. Examine for masses, hydrocele, varicocele and tenderness.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', 'OpenStax Anatomy and Physiology 2e, Ch. 27.1.'],
  },
  FJ3136: {
    id: 'FJ3136',
    canonicalName: 'Left Epididymis',
    latinName: 'Epididymis sinistra',
    commonName: 'Left Epididymis',
    system: 'reproductive',
    region: 'Scrotum / Posterior Testis',
    parentStructure: 'Male Duct System',
    primaryFunction: 'Coiled duct in which sperm mature, acquire motility and are stored before ejaculation.',
    arterialSupply: 'Testicular artery and epididymal branches.',
    venousDrainage: 'Pampiniform plexus.',
    innervation: 'Testicular plexus (T10-T11).',
    relations: ['Head, body and tail applied to the posterolateral testis', 'Tail continues as the deferent duct', 'Covered by tunica vaginalis except posteriorly'],
    clinicalNotes: 'Epididymitis causes scrotal pain and swelling, often infectious. Epididymal obstruction can cause obstructive azoospermia.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', "Gray's Anatomy (42nd ed.)."],
  },
  FJ3141: {
    id: 'FJ3141',
    canonicalName: 'Right Epididymis',
    latinName: 'Epididymis dextra',
    commonName: 'Right Epididymis',
    system: 'reproductive',
    region: 'Scrotum / Posterior Testis',
    parentStructure: 'Male Duct System',
    primaryFunction: 'Sperm maturation and storage.',
    arterialSupply: 'Testicular artery branches.',
    venousDrainage: 'Pampiniform plexus.',
    innervation: 'Testicular plexus.',
    relations: ['Posterolateral to the right testis', 'Tail continues as the right deferent duct'],
    clinicalNotes: 'Differentiate epididymitis from testicular torsion; torsion requires urgent detorsion.',
    references: ['Merck Manual. Structure of the Male Reproductive System.'],
  },
  FJ3135: {
    id: 'FJ3135',
    canonicalName: 'Left Deferent Duct (Vas Deferens)',
    latinName: 'Ductus deferens sinister',
    commonName: 'Left Vas Deferens',
    system: 'reproductive',
    region: 'Scrotum / Inguinal Canal / Pelvis',
    parentStructure: 'Male Duct System',
    primaryFunction: 'Muscular duct that transports sperm from the epididymis to the ejaculatory duct during emission.',
    arterialSupply: 'Artery to the deferent duct (superior vesical artery branch).',
    venousDrainage: 'Deferential veins.',
    innervation: 'Sympathetic inferior hypogastric plexus (emission).',
    relations: ['Ascends in the spermatic cord', 'Passes through the inguinal canal', 'Crosses the ureter and ends in the ampulla of the deferent duct', 'Joins the seminal vesicle duct to form the ejaculatory duct'],
    clinicalNotes: 'Vasectomy divides the deferent duct for contraception. It is a firm, cord-like structure palpable in the spermatic cord.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', 'OpenStax Anatomy and Physiology 2e, Ch. 27.1.'],
  },
  FJ3140: {
    id: 'FJ3140',
    canonicalName: 'Right Deferent Duct (Vas Deferens)',
    latinName: 'Ductus deferens dexter',
    commonName: 'Right Vas Deferens',
    system: 'reproductive',
    region: 'Scrotum / Inguinal Canal / Pelvis',
    parentStructure: 'Male Duct System',
    primaryFunction: 'Transports sperm from the right epididymis to the ejaculatory duct.',
    arterialSupply: 'Artery to the deferent duct.',
    venousDrainage: 'Deferential veins.',
    innervation: 'Sympathetic inferior hypogastric plexus.',
    relations: ['Ascends in the right spermatic cord', 'Passes through the right inguinal canal', 'Crosses the right ureter'],
    clinicalNotes: 'Vasectomy is performed bilaterally. Congenital absence of the deferent duct occurs in cystic fibrosis and may cause azoospermia.',
    references: ['Merck Manual. Structure of the Male Reproductive System.'],
  },
  FJ3137: {
    id: 'FJ3137',
    canonicalName: 'Left Seminal Vesicle',
    latinName: 'Vesicula seminalis sinistra',
    commonName: 'Left Seminal Vesicle',
    system: 'reproductive',
    region: 'Pelvic Cavity / Posterior Bladder',
    parentStructure: 'Male Accessory Sex Glands',
    primaryFunction: 'Secretes fructose-rich seminal fluid that nourishes and supports sperm; contributes most of the seminal volume.',
    arterialSupply: 'Inferior vesical and middle rectal artery branches.',
    venousDrainage: 'Seminal vesicle veins into the internal iliac veins.',
    innervation: 'Inferior hypogastric plexus (sympathetic emission).',
    relations: ['Posterior to the bladder', 'Lateral to the ampulla of the deferent duct', 'Anterior to the rectum', 'Duct joins the deferent duct to form the ejaculatory duct'],
    clinicalNotes: 'Seminal vesiculitis can occur with prostatitis. The vesicles may be involved by prostate cancer or obstructed in ejaculatory duct obstruction.',
    references: ['Merck Manual. Structure of the Male Reproductive System.', "Gray's Anatomy (42nd ed.)."],
  },
  FJ3143: {
    id: 'FJ3143',
    canonicalName: 'Right Seminal Vesicle',
    latinName: 'Vesicula seminalis dextra',
    commonName: 'Right Seminal Vesicle',
    system: 'reproductive',
    region: 'Pelvic Cavity / Posterior Bladder',
    parentStructure: 'Male Accessory Sex Glands',
    primaryFunction: 'Produces seminal fluid and joins the deferent duct to form the ejaculatory duct.',
    arterialSupply: 'Inferior vesical artery branches.',
    venousDrainage: 'Internal iliac veins.',
    innervation: 'Inferior hypogastric plexus.',
    relations: ['Posterior to the right bladder base', 'Lateral to the right deferent duct ampulla', 'Anterior to the rectum'],
    clinicalNotes: 'Palpable only on imaging; congenital bilateral absence of the seminal vesicles causes low-volume azoospermia.',
    references: ['Merck Manual. Structure of the Male Reproductive System.'],
  },
  FJ3149: {
    id: 'FJ3149',
    canonicalName: 'Urinary Bladder',
    latinName: 'Vesica urinaria',
    commonName: 'Bladder',
    system: 'urinary',
    region: 'Lesser Pelvis / Retropubic Space',
    parentStructure: 'Urinary System',
    primaryFunction: 'Muscular reservoir that stores urine and contracts during micturition.',
    arterialSupply: 'Superior and inferior vesical arteries (internal iliac branches).',
    venousDrainage: 'Vesical venous plexus into the internal iliac veins.',
    innervation: 'Pelvic splanchnic nerves (parasympathetic S2-S4; detrusor contraction) and inferior hypogastric plexus (sympathetic; relaxation).',
    relations: [
      'Anterior: pubic symphysis and retropubic space',
      'Posterior: rectum and rectovesical pouch (male); uterus and vagina (female)',
      'Superior: peritoneum and loops of bowel',
      'Inferior: prostate (male) or pelvic floor (female)',
    ],
    clinicalNotes: 'Bladder capacity is about 400-600 mL in adults. Urinary retention, cystitis and detrusor overactivity are common. The bladder is extraperitoneal anteriorly and superiorly covered by peritoneum.',
    references: ['OpenStax Anatomy and Physiology 2e, Ch. 25.', 'Merck Manual. Structure of the Male Reproductive System.'],
  },
  FJ3148: {
    id: 'FJ3148',
    canonicalName: 'Male Urethra',
    latinName: 'Urethra masculina',
    commonName: 'Male Urethra',
    system: 'urinary',
    region: 'Penis / Perineum / Pelvis',
    parentStructure: 'Urinary and Male Reproductive Systems',
    primaryFunction: 'Conveys urine from the bladder and semen during ejaculation; approximately 18-20 cm long.',
    arterialSupply: 'Internal pudendal artery branches and prostatic branches.',
    venousDrainage: 'Pudendal and prostatic venous plexuses.',
    innervation: 'Pudendal nerve (external sphincter); autonomic pelvic and hypogastric plexuses.',
    relations: ['Prostatic, membranous, bulbar and penile parts', 'Surrounded by corpus spongiosum in the penile part', 'Opens at the external urethral meatus on the glans'],
    clinicalNotes: 'The membranous urethra is the shortest and least distensible part, vulnerable to pelvic fracture urethral injury. Urethral strictures may follow trauma or infection.',
    references: ['OpenStax Anatomy and Physiology 2e, Ch. 25 & 27.1.', "Gray's Anatomy (42nd ed.)."],
  },
  M_SCROTUM: {
    id: 'M_SCROTUM',
    canonicalName: 'Scrotum',
    latinName: 'Scrotum',
    commonName: 'Scrotal Sac',
    system: 'reproductive',
    region: 'External Male Genitalia / Perineum',
    parentStructure: 'Male External Genitalia',
    primaryFunction:
      'Pigmented fibromuscular sac that encloses the testes, epididymides and distal spermatic cords. Its dartos and cremaster muscles regulate testicular temperature for spermatogenesis.',
    arterialSupply: 'External pudendal arteries, posterior scrotal branches of the internal pudendal artery and cremasteric artery.',
    venousDrainage: 'Scrotal veins into the external pudendal and pampiniform plexuses.',
    innervation: 'Anterior scrotal nerves (ilioinguinal/genitofemoral) and posterior scrotal nerves (pudendal); sympathetic supply to dartos.',
    relations: ['Anterior: penile root', 'Superior: pubic symphysis and spermatic cords', 'Contents: testes, epididymides and distal spermatic cords', 'Posterior: perineum and anus'],
    clinicalNotes:
      'The scrotum maintains the testes about 2-3 °C below core temperature. The median raphe marks the fusion line of the labioscrotal folds. Hydrocele, varicocele, epididymitis and testicular torsion are common scrotal conditions.',
    references: [
      'Merck Manual. Structure of the Male Reproductive System.',
      'OpenStax Anatomy and Physiology 2e, Ch. 27.1.',
      "Gray's Anatomy (42nd ed.). Perineum.",
    ],
  },
  M_URETHRA_MEATUS: {
    id: 'M_URETHRA_MEATUS',
    canonicalName: 'External Urethral Orifice (Male)',
    latinName: 'Ostium urethrae externum',
    commonName: 'Urethral Meatus',
    system: 'urinary',
    region: 'Glans Penis',
    parentStructure: 'Male Urethra',
    primaryFunction: 'Terminal opening of the male urethra at the tip of the glans penis; common outlet for urine and semen.',
    arterialSupply: 'Dorsal artery of the penis and terminal urethral branches.',
    venousDrainage: 'Deep dorsal vein of the penis.',
    innervation: 'Dorsal nerve of the penis (pudendal nerve).',
    relations: ['Located at the tip of the glans', 'Surrounded by the navicular fossa', 'Ventral to the corona glandis'],
    clinicalNotes: 'Hypospadias is a ventral displacement of the meatus; epispadias is dorsal. Meatal stenosis can cause a narrowed, deviated urinary stream.',
    references: ['OpenStax Anatomy and Physiology 2e, Ch. 27.1.', 'Merck Manual. Structure of the Male Reproductive System.'],
  },
};
