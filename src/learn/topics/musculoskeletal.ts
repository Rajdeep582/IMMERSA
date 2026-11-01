import { os, sp } from '../../data/references';
import type { Topic } from '../types';

export const MSK_TOPICS: Topic[] = [
  {
    id: 'skeletal',
    title: 'Skeletal system',
    system: 'skeletal',
    tagline: 'The living framework of bone, cartilage and ligaments that supports, protects and moves the body.',
    focus: { male: 'sys:skeletal', female: 'sys:skeletal' },
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'The adult skeleton has about **206 bones**, plus cartilages and ligaments, extending through the whole body.' },
          { t: 'figure', caption: 'Skeleton as modelled (the female model includes the vertebral column, pelvis and lower limbs).', target: { male: 'sys:skeletal', female: 'sys:skeletal' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          {
            t: 'tree',
            title: 'Divisions of the skeleton',
            root: {
              label: 'Skeleton (≈206)',
              children: [
                { label: 'Axial (80)', note: 'skull · vertebral column · thoracic cage · hyoid · ossicles' },
                { label: 'Appendicular (126)', note: 'pectoral and pelvic girdles · upper and lower limbs' },
              ],
            },
          },
          {
            t: 'table',
            head: ['Bone shape', 'Examples'],
            rows: [
              ['**Long**', '[[Femur]], [[Humerus]], phalanges'],
              ['**Short**', 'Carpals, tarsals'],
              ['**Flat**', 'Skull vault, [[Sternum]], ribs, [[Scapula]]'],
              ['**Irregular**', 'Vertebrae, facial bones'],
              ['**Sesamoid**', '[[Patella]]'],
            ],
          },
          {
            t: 'bullets',
            items: [
              '**Compact bone** forms the dense outer shell; **spongy (cancellous) bone** fills ends of long bones and holds red marrow.',
              'A long bone has a **diaphysis** (shaft), **epiphyses** (ends) and, in children, **growth plates**.',
              'Joints: **fibrous** (sutures), **cartilaginous** (intervertebral discs) and **synovial** (freely movable, e.g. knee).',
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Main functions',
        blocks: [
          {
            t: 'steps',
            items: [
              '**Support** — shapes the body and carries its weight.',
              '**Protection** — skull, ribs and vertebrae shield the brain, thoracic organs and spinal cord.',
              '**Movement** — bones act as levers for muscles at joints.',
              '**Mineral storage** — reservoir of calcium and phosphate.',
              '**Blood cell formation** — red marrow (haematopoiesis).',
            ],
          },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**Osteoporosis** — reduced bone mass; fragility fractures of hip, wrist and vertebrae.',
              '**Fractures** heal through haematoma → soft callus → hard callus → remodelling.',
              '**Osteoarthritis** — wear of articular cartilage in synovial joints.',
            ],
          },
        ],
      },
      {
        id: 'key',
        title: 'Key points to remember',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**206 bones**: 80 axial, 126 appendicular.',
              'Five functions: support, protection, movement, mineral storage, blood cell formation.',
              'The **femur** is the longest and strongest bone; the **stapes** is the smallest.',
            ],
          },
        ],
      },
    ],
    quiz: [
      { q: 'How many bones are in the axial skeleton?', a: '**80**.' },
      { q: 'What type of bone is the patella?', a: 'A **sesamoid** bone (it develops within the quadriceps tendon).' },
    ],
    refs: [os('6.1 The Functions of the Skeletal System'), os('7.1 Divisions of the Skeletal System'), sp('Anatomy, Bones')],
  },

  {
    id: 'vertebral-column',
    title: 'Vertebral column',
    system: 'skeletal',
    parent: 'skeletal',
    tagline: 'The flexible, weight-bearing column of vertebrae and discs that protects the spinal cord.',
    focus: { male: 'Vertebral column', female: 'Vertebral column' },
    match: /vertebra|atlas|axis|sacrum|coccyx|intervertebral|disk|disc/i,
    minutes: 5,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'Runs in the midline of the back from the skull to the pelvis: **7 cervical, 12 thoracic, 5 lumbar** vertebrae, the **sacrum** (5 fused) and the **coccyx**.' },
          { t: 'figure', caption: 'Vertebral column — select any vertebra or disc.', target: { male: 'Vertebral column', female: 'Vertebral column' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          {
            t: 'bullets',
            items: [
              'A typical vertebra: **body** (weight-bearing), **vertebral arch** (pedicles + laminae) enclosing the **vertebral foramen**, plus spinous and transverse processes.',
              '[[Intervertebral discs]] — outer **anulus fibrosus** and inner **nucleus pulposus**.',
              'Adult curves: **cervical and lumbar lordosis**, **thoracic and sacral kyphosis**.',
            ],
          },
          {
            t: 'table',
            title: 'Regional features',
            head: ['Region', 'Identifying features'],
            rows: [
              ['Cervical', '**Transverse foramina** (vertebral arteries); bifid spines; [[Atlas]] (no body) and [[Axis]] (dens)'],
              ['Thoracic', '**Costal facets** for ribs; long, downward spines'],
              ['Lumbar', 'Large kidney-shaped bodies; short, thick spines'],
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Main functions',
        blocks: [
          { t: 'steps', items: ['Supports the head and transmits body weight to the pelvis.', 'Protects the spinal cord and nerve roots.', 'Allows flexion, extension, lateral bending and rotation.', 'Provides attachment for back muscles and ribs.'] },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**Disc herniation** — usually posterolateral at **L4–L5 or L5–S1**, compressing the nerve root below (e.g. L5 or S1) → sciatica.',
              '**Scoliosis** — lateral curvature with rotation.',
              '**Spinal stenosis** — narrowing of the canal; leg pain on walking relieved by bending forward.',
            ],
          },
        ],
      },
      {
        id: 'key',
        title: 'Key points to remember',
        blocks: [{ t: 'bullets', items: ['**7-12-5-5-4**: cervical, thoracic, lumbar, sacral, coccygeal (coccyx 3–5).', 'Atlas–occipital = “yes” nod; atlas–axis = “no” rotation.', 'Transverse foramina only in cervical vertebrae.'] }],
      },
    ],
    quiz: [
      { q: 'Which vertebra has no body?', a: 'The **atlas (C1)**.' },
      { q: 'What passes through the transverse foramina?', a: 'The **vertebral arteries** (usually C6–C1).' },
    ],
    refs: [os('7.3 The Vertebral Column'), sp('Anatomy, Back, Vertebral Column')],
  },

  {
    id: 'skull',
    title: 'Skull',
    system: 'skeletal',
    parent: 'skeletal',
    tagline: 'The bony skeleton of the head that encloses the brain and houses the sense organs.',
    focus: { male: 'Skull' },
    match: /skull|cranium|frontal bone|parietal|occipital bone|temporal bone|sphenoid|ethmoid|maxilla|mandible|zygomatic|nasal bone|lacrimal bone|palatine|vomer/i,
    minutes: 4,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'p', text: 'The skull sits on the atlas and is made of **22 bones**: **8 cranial** (protect the brain) and **14 facial**. The [[Mandible]] is the only movable bone.' }, { t: 'figure', caption: 'Skull bones (male model).', target: { male: 'Skull' } }] },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          { t: 'table', head: ['Group', 'Bones'], rows: [['Cranial (8)', '[[Frontal bone|Frontal]], 2 [[Parietal bone|parietal]], 2 [[Temporal bone|temporal]], [[Occipital bone|occipital]], [[Sphenoid bone|sphenoid]], ethmoid'], ['Facial (14)', '2 maxillae, 2 zygomatic, 2 nasal, 2 lacrimal, 2 palatine, 2 inferior nasal conchae, vomer, mandible']] },
          { t: 'bullets', items: ['Bones of the vault meet at **sutures**: coronal, sagittal, lambdoid, squamous.', 'The **pterion** (where frontal, parietal, temporal and sphenoid meet) overlies the middle meningeal artery.'] },
        ],
      },
      { id: 'function', title: 'Main functions', blocks: [{ t: 'bullets', items: ['Protects the brain and special sense organs.', 'Forms the openings of the airway and digestive tract.', 'Anchors muscles of facial expression and chewing.'] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Pterion fracture** may tear the middle meningeal artery → **extradural haematoma**.', '**Basal skull fracture** signs: bruising behind the ear (Battle sign), “raccoon eyes”, CSF leak from nose or ear.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['**8 cranial + 14 facial = 22** bones.', 'Mandible is the only movable skull bone (temporomandibular joint).', 'Pterion = thinnest, most vulnerable point of the lateral skull.'] }] },
    ],
    quiz: [{ q: 'Which four bones meet at the pterion?', a: 'Frontal, parietal, temporal and sphenoid.' }],
    refs: [os('7.2 The Skull'), sp('Anatomy, Head and Neck, Skull')],
  },

  {
    id: 'muscular',
    title: 'Muscular system',
    system: 'muscular',
    tagline: 'Skeletal muscles that move the skeleton, hold posture and generate heat.',
    focus: { male: 'sys:muscular', female: 'sys:muscular' },
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'More than **600 skeletal muscles** (about 40% of body weight) attach to bones by **tendons** and cross joints.' },
          { t: 'figure', caption: 'Muscles in this model (the female model contains the rectus femoris and extra-ocular muscles).', target: { male: 'sys:muscular', female: 'sys:muscular' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          { t: 'table', head: ['Muscle tissue', 'Location', 'Control', 'Appearance'], rows: [['**Skeletal**', 'Attached to bones', 'Voluntary', 'Striated, multinucleate'], ['**Cardiac**', 'Heart wall', 'Involuntary', 'Striated, intercalated discs'], ['**Smooth**', 'Walls of hollow organs, vessels', 'Involuntary', 'Non-striated, spindle-shaped']] },
          { t: 'layers', title: 'Connective tissue wrappings (outside → in)', layers: [{ name: 'Epimysium', note: 'surrounds the whole muscle' }, { name: 'Perimysium', note: 'surrounds each **fascicle**' }, { name: 'Endomysium', note: 'surrounds each **muscle fibre** (cell)' }] },
          { t: 'bullets', items: ['**Origin** = the more fixed attachment; **insertion** = the attachment that moves.', 'Each fibre contains myofibrils of repeating **sarcomeres** — actin (thin) and myosin (thick) filaments.'] },
        ],
      },
      {
        id: 'function',
        title: 'How contraction works',
        blocks: [
          {
            t: 'flow',
            title: 'Excitation–contraction coupling',
            steps: [
              { label: 'Motor neuron fires', note: 'ACh released at the neuromuscular junction' },
              { label: 'Muscle fibre depolarises', note: 'action potential runs down T-tubules' },
              { label: 'Ca²⁺ released', note: 'from the sarcoplasmic reticulum' },
              { label: 'Cross-bridges form', note: 'Ca²⁺ binds troponin, exposing actin sites' },
              { label: 'Filaments slide', note: 'myosin pulls actin, using ATP' },
            ],
          },
          { t: 'bullets', items: ['**Agonist** (prime mover) produces the movement; **antagonist** opposes it; **synergists** assist.', 'Muscles also maintain **posture**, stabilise joints and generate **heat** (e.g. shivering).'] },
        ],
      },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Myasthenia gravis** — antibodies against ACh receptors → fatigable weakness (ptosis, double vision).', '**Muscular dystrophies** — inherited loss of muscle proteins (e.g. dystrophin in Duchenne).', '**Strains** — tears in muscle fibres, common in hamstrings.', '**Rhabdomyolysis** — muscle breakdown releasing myoglobin that can damage the kidneys.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Three muscle types: **skeletal, cardiac, smooth**.', 'Calcium + ATP drive the **sliding filament** mechanism.', 'Muscle → fascicle → fibre → myofibril → sarcomere.'] }] },
    ],
    quiz: [
      { q: 'Which ion triggers contraction by binding troponin?', a: '**Calcium (Ca²⁺)**.' },
      { q: 'What surrounds an individual fascicle?', a: 'The **perimysium**.' },
    ],
    refs: [os('10.2 Skeletal Muscle'), os('11.1 Interactions of Skeletal Muscles, Their Fascicle Arrangement, and Their Lever Systems'), sp('Physiology, Skeletal Muscle')],
  },
];
