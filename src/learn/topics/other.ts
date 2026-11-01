import { os, sp } from '../../data/references';
import type { Topic } from '../types';

export const OTHER_TOPICS: Topic[] = [
  {
    id: 'endocrine',
    title: 'Endocrine system',
    system: 'endocrine',
    tagline: 'Glands that release hormones into the blood to regulate growth, metabolism, reproduction and stress responses.',
    focus: { male: 'sys:endocrine', female: 'sys:endocrine' },
    match: /pituitary|thyroid gland|parathyroid|adrenal|suprarenal|pineal|islet/i,
    minutes: 5,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'p', text: 'Ductless glands scattered through the body; hormones travel in the blood and act on cells with matching **receptors**.' }, { t: 'figure', caption: 'Endocrine glands present in the model.', target: { male: 'sys:endocrine', female: 'sys:endocrine' } }] },
      { id: 'structure', title: 'Major glands', blocks: [{ t: 'table', head: ['Gland', 'Location', 'Key hormones'], rows: [['**Hypothalamus**', 'Floor of the diencephalon', 'Releasing hormones; ADH and oxytocin (made here)'], ['[[Pituitary gland|**Pituitary**]]', 'Sella turcica of the sphenoid', 'GH, TSH, ACTH, FSH, LH, prolactin; stores ADH, oxytocin'], ['**Thyroid**', 'Front of the neck (C5–T1)', 'T3, T4; calcitonin'], ['**Parathyroids**', 'Back of the thyroid (usually 4)', 'Parathyroid hormone (raises Ca²⁺)'], ['[[Adrenal gland|**Adrenals**]]', 'On top of the kidneys', 'Cortex: cortisol, aldosterone, androgens; medulla: adrenaline'], ['**Pancreatic islets**', 'Pancreas', 'Insulin, glucagon'], ['[[Pineal body|**Pineal**]]', 'Epithalamus', 'Melatonin'], ['**Gonads**', 'Ovaries / testes', 'Oestrogen, progesterone / testosterone']] }] },
      { id: 'function', title: 'How hormones are controlled', blocks: [{ t: 'flow', title: 'Negative feedback axis (e.g. thyroid)', loop: true, steps: [{ label: 'Hypothalamus', note: 'TRH' }, { label: 'Anterior pituitary', note: 'TSH' }, { label: 'Thyroid', note: 'T3/T4' }, { label: 'Target tissues', note: '↑ metabolism; T3/T4 inhibit TRH and TSH' }] }, { t: 'callout', tone: 'remember', text: 'Most hormone levels are held steady by **negative feedback**; oxytocin in labour is a classic **positive** feedback example.' }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Diabetes mellitus** — type 1 (insulin deficiency) vs type 2 (insulin resistance).', '**Hypo-/hyperthyroidism** — slowed vs accelerated metabolism (e.g. Hashimoto’s vs Graves’ disease).', '**Cushing’s syndrome** (excess cortisol) and **Addison’s disease** (adrenal insufficiency).'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Hypothalamus controls the pituitary — the “master gland”.', 'Adrenal cortex layers (outer → inner): **glomerulosa** (aldosterone), **fasciculata** (cortisol), **reticularis** (androgens) — “salt, sugar, sex”.', 'Insulin lowers blood glucose; glucagon raises it.'] }] },
    ],
    quiz: [{ q: 'Which adrenal cortical zone produces aldosterone?', a: 'The **zona glomerulosa**.' }, { q: 'Where is the pituitary gland located?', a: 'In the **sella turcica** of the sphenoid bone.' }],
    refs: [os('17.1 An Overview of the Endocrine System'), os('17.3 The Pituitary Gland and Hypothalamus'), sp('Physiology, Endocrine Hormones')],
  },

  {
    id: 'lymphatic',
    title: 'Lymphatic and immune organs',
    system: 'lymphatic',
    tagline: 'Vessels and organs that return tissue fluid to the blood and host immune defences.',
    focus: { male: 'sys:lymphatic', female: 'sys:lymphatic' },
    match: /spleen|thymus|tonsil|lymph/i,
    minutes: 4,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'bullets', items: ['**Primary organs**: red bone marrow and **thymus** (where lymphocytes mature).', '**Secondary organs**: lymph nodes, [[Spleen]], tonsils, Peyer’s patches (where immune responses start).', 'Lymph vessels drain into the **thoracic duct** (most of the body) and **right lymphatic duct**, then into the venous angles at the base of the neck.'] }, { t: 'figure', caption: 'Spleen, thymus, tonsils and lymph nodes as modelled.', target: { male: 'sys:lymphatic', female: 'sys:lymphatic' } }] },
      { id: 'structure', title: 'Structure', blocks: [{ t: 'table', head: ['Organ', 'Where', 'Role'], rows: [['Thymus', 'Anterior mediastinum', 'T-cell maturation; largest in childhood'], ['Spleen', 'Left upper quadrant, ribs 9–11', 'Filters blood; removes old red cells; immune responses'], ['Lymph nodes', 'Clusters in neck, axilla, groin, along vessels', 'Filter lymph; activate lymphocytes'], ['Tonsils', 'Pharynx', 'First-line sampling of inhaled/ingested antigens']] }] },
      { id: 'function', title: 'How it works', blocks: [{ t: 'flow', title: 'Lymph flow', steps: [{ label: 'Tissue fluid', note: 'leaks from capillaries (~3 L/day)' }, { label: 'Lymphatic capillaries' }, { label: 'Lymph vessels + nodes', note: 'filtered, immune surveillance' }, { label: 'Lymphatic trunks' }, { label: 'Thoracic / right lymphatic duct' }, { label: 'Subclavian–jugular venous junction' }] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Lymphadenopathy** — enlarged nodes from infection or cancer spread.', '**Splenic rupture** — after left upper quadrant trauma; risk of severe bleeding.', '**Lymphoedema** — swelling when lymph drainage is blocked (e.g. after node removal).'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Primary: bone marrow, thymus. Secondary: nodes, spleen, MALT.', 'Thoracic duct drains everything except the right upper quadrant of the body.', 'Spleen sits under ribs 9–11 on the left.'] }] },
    ],
    quiz: [{ q: 'Where do T lymphocytes mature?', a: 'In the **thymus**.' }],
    refs: [os('21.1 Anatomy of the Lymphatic and Immune Systems'), sp('Anatomy, Lymphatic System')],
  },

  {
    id: 'sensory',
    title: 'Eye and special senses',
    system: 'sensory',
    tagline: 'Specialised sense organs — the eye for vision and the ear for hearing and balance.',
    focus: { male: 'sys:sensory', female: 'sys:sensory' },
    match: /eye|cornea|lens|iris|retina|sclera|choroid|vitreous|ciliary|conjunctiva|lacrimal|ear/i,
    minutes: 5,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'bullets', items: ['Each **eyeball** (~24 mm) sits in the bony orbit, cushioned by fat and moved by six extra-ocular muscles.', 'Other special senses: hearing and balance (inner ear), taste (tongue), smell (olfactory epithelium).'] }, { t: 'figure', caption: 'Eye structures in the model.', target: { male: 'sys:sensory', female: 'sys:sensory' } }] },
      { id: 'structure', title: 'Structure of the eye', blocks: [{ t: 'layers', title: 'Three tunics (outside → in)', layers: [{ name: 'Fibrous tunic', note: '[[Sclera]] (white) + [[Cornea]] (clear front)' }, { name: 'Vascular tunic (uvea)', note: 'choroid, ciliary body, [[Iris]]' }, { name: 'Neural tunic', note: '**retina** — rods and cones' }] }, { t: 'bullets', items: ['[[Lens]] behind the iris, held by suspensory ligaments.', '**Aqueous humour** (front) and **vitreous body** (back) fill the chambers.', '**Fovea** — cones only, sharpest vision; **optic disc** — blind spot where the optic nerve leaves.'] }] },
      { id: 'function', title: 'How vision works', blocks: [{ t: 'flow', title: 'Path of light', steps: [{ label: 'Cornea', note: 'most refraction' }, { label: 'Aqueous humour' }, { label: 'Pupil', note: 'iris controls size' }, { label: 'Lens', note: 'fine focus (accommodation)' }, { label: 'Vitreous body' }, { label: 'Retina', note: 'photoreceptors → optic nerve' }] }, { t: 'bullets', items: ['**Rods** — dim light, no colour; **cones** — colour and detail.', 'Fibres from the nasal half of each retina cross at the **optic chiasm**.'] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Glaucoma** — raised intraocular pressure damages the optic nerve.', '**Cataract** — clouding of the lens.', '**Pituitary tumour** pressing on the chiasm → **bitemporal hemianopia**.', '**Retinal detachment** — flashes, floaters, curtain over vision; urgent.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Cornea does most focusing; lens fine-tunes.', 'Fovea = sharpest vision; optic disc = blind spot.', 'Chiasm lesion → loss of both outer (temporal) visual fields.'] }] },
    ],
    quiz: [{ q: 'Which visual field defect follows compression of the optic chiasm?', a: '**Bitemporal hemianopia**.' }],
    refs: [os('14.1 Sensory Perception'), sp('Anatomy, Head and Neck, Eye')],
  },

  {
    id: 'integumentary',
    title: 'Skin (integumentary system)',
    system: 'integumentary',
    tagline: 'The body’s largest organ: a protective, sensing, temperature-regulating covering.',
    focus: { male: 'sys:integumentary', female: 'sys:integumentary' },
    match: /skin|hair|nail/i,
    minutes: 4,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'p', text: 'Covers the whole body (~1.5–2 m², ~16% of body weight). In the model it is a single outer surface; its layers are not separate meshes.' }, { t: 'figure', caption: 'Skin surface (shown translucent by default).', target: { male: 'sys:integumentary', female: 'sys:integumentary' } }] },
      { id: 'structure', title: 'Structure', blocks: [{ t: 'layers', title: 'Layers (outside → in)', layers: [{ name: 'Epidermis', note: 'keratinised stratified squamous epithelium — no blood vessels; layers basale → spinosum → granulosum → (lucidum) → corneum' }, { name: 'Dermis', note: 'papillary + reticular layers: collagen, vessels, nerves, hair follicles, glands' }, { name: 'Hypodermis', note: 'subcutaneous fat and loose connective tissue (not strictly skin)' }] }, { t: 'bullets', items: ['Accessory structures: hair, nails, **sweat glands** (eccrine, apocrine), **sebaceous glands**.', 'Cells: keratinocytes, **melanocytes** (pigment), Langerhans cells (immune), Merkel cells (touch).'] }] },
      { id: 'function', title: 'Main functions', blocks: [{ t: 'steps', items: ['**Protection** — barrier to microbes, water loss, UV and injury.', '**Thermoregulation** — sweating and changes in skin blood flow.', '**Sensation** — touch, pressure, pain, temperature receptors.', '**Vitamin D synthesis** — UV converts a cholesterol precursor.', '**Excretion and absorption** in small amounts.'] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Burns** — depth (superficial, partial, full thickness) and area (“rule of nines”) guide treatment.', '**Skin cancer** — basal cell (commonest), squamous cell, **melanoma** (most dangerous; ABCDE signs).', '**Pressure ulcers** — over bony points in immobile patients.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Epidermis has **no blood vessels**; it is nourished from the dermis.', 'Rule of nines: head 9%, each arm 9%, front trunk 18%, back 18%, each leg 18%, perineum 1%.'] }] },
    ],
    quiz: [{ q: 'Which epidermal layer contains dividing stem cells?', a: 'The **stratum basale**.' }],
    refs: [os('5.1 Layers of the Skin'), os('5.3 Functions of the Integumentary System'), sp('Anatomy, Skin (Integument)')],
  },
];
