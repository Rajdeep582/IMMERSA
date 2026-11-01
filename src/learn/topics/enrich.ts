import { os, sp } from '../../data/references';
import type { Section, Topic } from '../types';

/**
 * Exam-oriented depth added to every guide: relations, applied anatomy, memory aids and a rapid
 * revision box. Inserted after "Clinical significance" and before "Key points".
 * Facts follow standard MBBS texts (Gray's Anatomy for Students, Moore's Clinically Oriented Anatomy,
 * Snell's Clinical Anatomy, BD Chaurasia) and the OpenStax / StatPearls chapters cited on each page.
 */
export const ENRICH: Record<string, Section[]> = {
  nervous: [
    {
      id: 'applied',
      title: 'Applied neuroanatomy',
      blocks: [
        {
          t: 'compare',
          title: 'Upper vs lower motor neuron lesion',
          cols: ['Upper motor neuron', 'Lower motor neuron'],
          rows: [
            ['Site', 'Cortex, internal capsule, brainstem or cord tracts', 'Anterior horn cell, root, plexus, peripheral nerve'],
            ['Tone', '**Increased** (spastic, clasp-knife)', '**Decreased** (flaccid)'],
            ['Power', 'Weak (pyramidal pattern)', 'Weak (in that nerve/root distribution)'],
            ['Reflexes', '**Brisk**, clonus', '**Reduced / absent**'],
            ['Plantar', '**Extensor** (Babinski +)', 'Flexor or absent'],
            ['Wasting / fasciculation', 'Little wasting (disuse only); no fasciculation', '**Marked wasting; fasciculations**'],
          ],
        },
        {
          t: 'table',
          title: 'Key dermatomes — the landmarks examined clinically',
          head: ['Root', 'Skin area'],
          rows: [
            ['C5', 'Lateral arm (regimental badge region)'],
            ['C6', '**Thumb** and lateral forearm'],
            ['C7', '**Middle finger**'],
            ['C8', '**Little finger** and medial hand'],
            ['T4', '**Nipple**'],
            ['T10', '**Umbilicus**'],
            ['L1', 'Inguinal region'],
            ['L4', 'Medial leg, medial malleolus'],
            ['L5', 'Dorsum of foot, **great toe**'],
            ['S1', 'Lateral foot, sole and heel'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Deep tendon reflex roots',
          phrase: '1, 2 buckle my shoe · 3, 4 kick the door · 5, 6 pick up sticks · 7, 8 lay them straight',
          items: [
            ['S1–2', '**Ankle** jerk (buckle my shoe)'],
            ['L3–4', '**Knee** jerk (kick the door)'],
            ['C5–6', '**Biceps** and brachioradialis (pick up sticks)'],
            ['C7–8', '**Triceps** (lay them straight)'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'terms',
          items: [
            ['Nucleus', 'Cluster of neuron cell bodies **inside the CNS**.'],
            ['Ganglion', 'Cluster of neuron cell bodies **outside the CNS** (e.g. dorsal root ganglion).'],
            ['Tract', 'Bundle of axons **within the CNS** (e.g. corticospinal tract).'],
            ['Nerve', 'Bundle of axons **outside the CNS**, wrapped in epi-, peri- and endoneurium.'],
            ['Decussation', 'Crossing of fibres to the opposite side (e.g. pyramids of the medulla).'],
            ['Plexus', 'Network where ventral rami mix before forming named nerves.'],
          ],
        },
        { t: 'callout', tone: 'pitfall', text: '**Nucleus vs ganglion** and **tract vs nerve** are the same things on opposite sides of the CNS boundary — a favourite one-mark question.' },
        {
          t: 'highyield',
          items: [
            '31 pairs of spinal nerves: 8 cervical, 12 thoracic, 5 lumbar, 5 sacral, 1 coccygeal (C1–C7 nerves exit **above** their vertebra; C8 and below exit **below**).',
            'Myelin: **oligodendrocytes** in the CNS (one cell, many axons), **Schwann cells** in the PNS (one cell, one internode).',
            'Babinski sign = UMN lesion (normal in infants under ~1 year).',
          ],
        },
      ],
    },
  ],

  brain: [
    {
      id: 'blood',
      title: 'Blood supply and stroke syndromes',
      blocks: [
        {
          t: 'flow',
          title: 'Circle of Willis — how the two arterial systems connect',
          steps: [
            { label: 'Internal carotid arteries', note: 'anterior circulation' },
            { label: 'Anterior cerebral arteries', note: 'joined by the anterior communicating artery' },
            { label: 'Posterior communicating arteries', note: 'link carotid to vertebrobasilar' },
            { label: 'Posterior cerebral arteries', note: 'terminal branches of the basilar' },
            { label: 'Basilar artery', note: 'formed by the two vertebral arteries' },
          ],
          loop: true,
        },
        {
          t: 'table',
          title: 'Which artery — which deficit',
          head: ['Artery', 'Territory', 'Typical deficit (contralateral unless stated)'],
          rows: [
            ['**Anterior cerebral**', 'Medial frontal and parietal lobes', 'Weakness and sensory loss of the **leg** > arm; urinary incontinence'],
            ['**Middle cerebral**', 'Lateral hemisphere, internal capsule (lenticulostriate)', '**Face and arm** > leg weakness/sensory loss; **aphasia** (dominant side) or neglect (non-dominant); homonymous hemianopia'],
            ['**Posterior cerebral**', 'Occipital lobe, inferior temporal lobe, thalamus', '**Homonymous hemianopia with macular sparing**'],
            ['Basilar / vertebral', 'Brainstem, cerebellum', 'Cranial nerve palsies with crossed long-tract signs; ataxia; “locked-in” syndrome'],
          ],
        },
        { t: 'callout', tone: 'tip', title: 'Memory aid', text: 'Draw the motor homunculus: the **leg hangs over the medial surface** (ACA), the **face and hand sit on the lateral convexity** (MCA).' },
      ],
    },
    {
      id: 'areas',
      title: 'Functional areas and meninges',
      blocks: [
        {
          t: 'table',
          title: 'Brodmann areas worth knowing',
          head: ['Area', 'Function', 'Lesion'],
          rows: [
            ['4', 'Primary motor cortex (precentral gyrus)', 'Contralateral UMN weakness'],
            ['3, 1, 2', 'Primary somatosensory (postcentral gyrus)', 'Contralateral sensory loss'],
            ['44, 45', '**Broca’s area** (inferior frontal gyrus, dominant)', 'Expressive (non-fluent) aphasia'],
            ['22 (posterior)', '**Wernicke’s area** (superior temporal gyrus, dominant)', 'Receptive (fluent) aphasia'],
            ['41, 42', 'Primary auditory cortex', 'Unilateral lesion → little hearing loss (bilateral input)'],
            ['17', 'Primary visual cortex (calcarine sulcus)', 'Homonymous field defect'],
          ],
        },
        {
          t: 'compare',
          title: 'Broca vs Wernicke aphasia',
          cols: ['Broca (expressive)', 'Wernicke (receptive)'],
          rows: [
            ['Speech', 'Slow, effortful, telegraphic', 'Fluent but meaningless (word salad, neologisms)'],
            ['Comprehension', 'Largely preserved', 'Impaired'],
            ['Insight', 'Frustrated — aware of deficit', 'Often unaware'],
            ['Artery', 'Superior division of MCA', 'Inferior division of MCA'],
          ],
        },
        {
          t: 'layers',
          title: 'Meninges — outside to inside',
          layers: [
            { name: 'Skull', note: 'Inner table; **extradural** space is only potential' },
            { name: 'Dura mater', note: 'Periosteal + meningeal layers; folds = falx cerebri, tentorium; dural venous sinuses between the layers' },
            { name: 'Subdural space', note: 'Potential space crossed by **bridging veins**' },
            { name: 'Arachnoid mater', note: 'Arachnoid granulations return CSF to the venous sinuses' },
            { name: 'Subarachnoid space', note: 'Contains **CSF** and the cerebral arteries' },
            { name: 'Pia mater', note: 'Adheres to the brain surface, follows every sulcus' },
          ],
        },
        {
          t: 'compare',
          title: 'Intracranial haemorrhage',
          cols: ['Extradural', 'Subdural', 'Subarachnoid'],
          rows: [
            ['Source', '**Middle meningeal artery** (pterion fracture)', '**Bridging veins**', 'Ruptured **berry aneurysm** (or trauma)'],
            ['CT shape', 'Biconvex (lentiform); limited by sutures', 'Crescent; crosses sutures', 'Blood in sulci and basal cisterns'],
            ['Classic story', 'Head injury → **lucid interval** → rapid decline', 'Elderly / alcohol / anticoagulants; may be chronic', '“Worst headache of my life” (thunderclap), neck stiffness'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'flow',
          title: 'CSF circulation (~500 mL made per day; ~150 mL in the system)',
          steps: [
            { label: 'Choroid plexus', note: 'lateral, third and fourth ventricles' },
            { label: 'Lateral ventricles' },
            { label: 'Interventricular foramina (of Monro)' },
            { label: 'Third ventricle' },
            { label: 'Cerebral aqueduct (of Sylvius)' },
            { label: 'Fourth ventricle' },
            { label: 'Median (Magendie) + lateral (Luschka) apertures' },
            { label: 'Subarachnoid space → arachnoid granulations → dural venous sinuses' },
          ],
        },
        { t: 'callout', tone: 'tip', title: 'Memory aid', text: 'Luschka = Lateral (two), Magendie = Median (one).' },
        {
          t: 'highyield',
          items: [
            '**Aqueductal stenosis** → hydrocephalus of the lateral and third ventricles only.',
            'Pterion (frontal, parietal, temporal, sphenoid) overlies the **anterior branch of the middle meningeal artery**.',
            'Internal capsule (posterior limb) carries the corticospinal tract — a small lacunar infarct here causes pure motor hemiplegia.',
            'Dominant hemisphere (language) is the left in >90% of right-handers.',
          ],
        },
      ],
    },
  ],

  'spinal-cord': [
    {
      id: 'tracts',
      title: 'Tracts and lesions',
      blocks: [
        {
          t: 'compare',
          title: 'The three tracts every exam asks about',
          cols: ['Dorsal column–medial lemniscus', 'Spinothalamic (anterolateral)', 'Lateral corticospinal'],
          rows: [
            ['Carries', 'Fine touch, vibration, **proprioception**', '**Pain and temperature** (crude touch)', 'Voluntary motor commands'],
            ['Direction', 'Ascending', 'Ascending', 'Descending'],
            ['Crosses', 'In the **medulla** (internal arcuate fibres)', 'At the **spinal level** of entry (within 1–2 segments, anterior white commissure)', 'In the **medullary pyramids**'],
            ['Lesion in cord', 'Ipsilateral loss below', 'Contralateral loss below', 'Ipsilateral UMN weakness below'],
          ],
        },
        {
          t: 'table',
          title: 'Classic cord syndromes',
          head: ['Syndrome', 'Damaged', 'Picture'],
          rows: [
            ['**Brown-Séquard** (hemisection)', 'One half of the cord', '**Ipsilateral** weakness + loss of vibration/proprioception; **contralateral** loss of pain/temperature'],
            ['**Syringomyelia**', 'Central cavity (crossing spinothalamic fibres)', '“**Cape-like**” loss of pain/temperature over shoulders/arms; touch preserved; later LMN wasting of hands'],
            ['**Anterior cord**', 'Anterior spinal artery territory', 'Bilateral paralysis and pain/temperature loss; **dorsal columns spared**'],
            ['**Subacute combined degeneration** (B12)', 'Dorsal columns + lateral corticospinal tracts', 'Loss of vibration/proprioception + UMN signs (with absent ankle jerks from neuropathy)'],
            ['**Tabes dorsalis** (syphilis)', 'Dorsal columns and roots', 'Sensory ataxia, positive Romberg, lightning pains'],
            ['**Poliomyelitis**', 'Anterior horn cells', 'Asymmetric pure **LMN** paralysis'],
            ['**ALS / MND**', 'Corticospinal tracts + anterior horn cells', 'Mixed **UMN and LMN** signs, no sensory loss'],
          ],
        },
        {
          t: 'relations',
          title: 'Where the cord ends',
          center: 'Conus medullaris',
          sides: {
            superior: 'Lumbosacral enlargement (origin of the lumbosacral plexus)',
            inferior: '**Filum terminale** → coccyx; **cauda equina** roots fill the dural sac to **S2**',
            anterior: 'Vertebral body of **L1–L2** in adults (L3 at birth)',
            posterior: 'Laminae and ligamentum flavum — crossed by a lumbar puncture needle at **L3/L4 or L4/L5**',
          },
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        { t: 'callout', tone: 'clinical', title: 'Red flag', text: '**Cauda equina syndrome** — saddle anaesthesia, bladder/bowel dysfunction, bilateral leg symptoms → emergency MRI and decompression.' },
        { t: 'callout', tone: 'pitfall', text: 'Spinal cord **segment** ≠ vertebral **level**: in the lower thoracic region the segment lies 2–3 levels higher than the vertebra of the same number.' },
        {
          t: 'highyield',
          items: [
            'Lumbar puncture layers: skin → supraspinous ligament → interspinous ligament → **ligamentum flavum** (“give”) → epidural space → dura/arachnoid → CSF.',
            'Anterior spinal artery (one) supplies the anterior two-thirds; two posterior spinal arteries supply the dorsal columns.',
            'Artery of Adamkiewicz (great radicular, usually left, T9–T12) — at risk in aortic surgery.',
          ],
        },
      ],
    },
  ],

  'cranial-nerves': [
    {
      id: 'memory',
      title: 'Memory aids',
      blocks: [
        {
          t: 'mnemonic',
          title: 'Names, in order I–XII',
          phrase: 'Oh Oh Oh To Touch And Feel Very Good Velvet, Such Heaven',
          items: [
            ['I', 'Olfactory'],
            ['II', 'Optic'],
            ['III', 'Oculomotor'],
            ['IV', 'Trochlear'],
            ['V', 'Trigeminal'],
            ['VI', 'Abducens'],
            ['VII', 'Facial'],
            ['VIII', 'Vestibulocochlear'],
            ['IX', 'Glossopharyngeal'],
            ['X', 'Vagus'],
            ['XI', 'Spinal accessory'],
            ['XII', 'Hypoglossal'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Sensory, motor or both',
          phrase: 'Some Say Marry Money But My Brother Says Big Brains Matter More',
          items: [
            ['S', 'I, II — sensory'],
            ['M', 'III, IV, VI — motor'],
            ['B', 'V, VII — both'],
            ['S', 'VIII — sensory'],
            ['B', 'IX, X — both'],
            ['M', 'XI, XII — motor'],
          ],
          note: 'Parasympathetic fibres travel in **III, VII, IX and X** (“1973”).',
        },
      ],
    },
    {
      id: 'foramina',
      title: 'Exits from the skull',
      blocks: [
        {
          t: 'table',
          title: 'Skull foramina',
          head: ['Opening', 'Nerve(s)', 'Also transmits'],
          rows: [
            ['Cribriform plate (ethmoid)', 'I', '—'],
            ['Optic canal', 'II', 'Ophthalmic artery'],
            ['Superior orbital fissure', 'III, IV, V1, VI', 'Superior ophthalmic vein'],
            ['Foramen rotundum', 'V2', '—'],
            ['Foramen ovale', 'V3', 'Accessory meningeal artery, lesser petrosal nerve'],
            ['Internal acoustic meatus', 'VII, VIII', 'Labyrinthine artery (VII leaves the skull via the **stylomastoid foramen**)'],
            ['Jugular foramen', 'IX, X, XI', 'Internal jugular vein (sigmoid sinus)'],
            ['Hypoglossal canal', 'XII', '—'],
            ['Foramen spinosum', '(meningeal branch of V3)', '**Middle meningeal artery**'],
          ],
        },
        { t: 'callout', tone: 'tip', title: 'Memory aid', text: '“**Standing Room Only**” — V1, V2, V3 leave through the Superior orbital fissure, foramen Rotundum, foramen Ovale.' },
        {
          t: 'table',
          title: 'Where the nuclei sit (approximately)',
          head: ['Level', 'Nerves'],
          rows: [
            ['Forebrain', 'I, II'],
            ['Midbrain', 'III, IV'],
            ['Pons', 'V, VI, VII, VIII (V nuclei extend through the whole brainstem)'],
            ['Medulla', 'IX, X, XI (cranial part), XII'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'compare',
          title: 'Facial weakness: where is the lesion?',
          cols: ['UMN (e.g. stroke)', 'LMN (e.g. Bell’s palsy)'],
          rows: [
            ['Forehead', '**Spared** — upper face has bilateral cortical supply', '**Involved** — whole half of the face'],
            ['Side', 'Contralateral to the lesion', 'Ipsilateral to the lesion'],
            ['Extras', 'Often with arm weakness', 'May have hyperacusis (stapedius), loss of taste anterior 2/3 (chorda tympani)'],
          ],
        },
        {
          t: 'highyield',
          items: [
            '**IV** is the only nerve to leave the **dorsal** brainstem and the only one whose fibres fully decussate; longest intracranial course.',
            '**VI** palsy is a common “false localising sign” of raised intracranial pressure.',
            '**III** palsy from an aneurysm (posterior communicating artery) affects the **pupil early** — parasympathetic fibres lie superficially.',
            'Tongue deviates **towards** a damaged XII; uvula deviates **away** from a damaged X.',
            'Corneal reflex: afferent V1, efferent VII.  Gag reflex: afferent IX, efferent X.  Pupillary light reflex: afferent II, efferent III.',
          ],
        },
      ],
    },
  ],

  'peripheral-nerves': [
    {
      id: 'injuries',
      title: 'Nerve injuries — the clinical pictures',
      blocks: [
        {
          t: 'table',
          title: 'Upper limb',
          head: ['Nerve (roots)', 'Common site of injury', 'Sign'],
          rows: [
            ['**Axillary** (C5–6)', 'Surgical neck of humerus; shoulder dislocation', 'Weak abduction (deltoid); numb “regimental badge” patch'],
            ['**Radial** (C5–T1)', '**Spiral groove** (mid-shaft humerus fracture); “Saturday night palsy”', '**Wrist drop**; numb dorsal first web space'],
            ['**Median** (C5–T1)', 'Wrist (**carpal tunnel**) or supracondylar fracture', 'Wrist: thenar wasting, numb lateral 3½ digits. Elbow: “hand of benediction” on making a fist'],
            ['**Ulnar** (C8–T1)', 'Medial epicondyle; wrist (Guyon’s canal)', '**Claw hand** (ring + little fingers), interossei wasting, **Froment’s sign**'],
            ['**Long thoracic** (C5–7)', 'Axillary surgery', '**Winged scapula** (serratus anterior)'],
            ['**Musculocutaneous** (C5–7)', 'Rare (penetrating injury)', 'Weak elbow flexion and supination'],
          ],
        },
        {
          t: 'compare',
          title: 'Brachial plexus birth / traction injuries',
          cols: ['Erb–Duchenne (upper)', 'Klumpke (lower)'],
          rows: [
            ['Roots', '**C5–C6** (upper trunk)', '**C8–T1** (lower trunk)'],
            ['Mechanism', 'Head pushed away from the shoulder', 'Arm pulled upwards (abducted)'],
            ['Posture', '“**Waiter’s tip**” — adducted, medially rotated arm, extended elbow, pronated forearm', '**Claw hand**; ± Horner’s syndrome (T1 sympathetic fibres)'],
          ],
        },
        {
          t: 'table',
          title: 'Lower limb',
          head: ['Nerve (roots)', 'Common site of injury', 'Sign'],
          rows: [
            ['**Common fibular** (L4–S2)', '**Neck of fibula** (fracture, tight cast, leg crossing)', '**Foot drop** (high-stepping gait); numb dorsum of foot'],
            ['**Superior gluteal** (L4–S1)', 'Misplaced gluteal injection; hip surgery', '**Positive Trendelenburg** — pelvis drops on the opposite side when standing on the affected leg'],
            ['**Femoral** (L2–4)', 'Pelvic surgery, haematoma', 'Weak knee extension, lost knee jerk'],
            ['**Sciatic** (L4–S3)', 'Posterior hip dislocation; badly placed injection', 'Weak hamstrings and everything below the knee'],
            ['**Tibial** (L4–S3)', 'Tarsal tunnel', 'Numb sole; weak toe flexion'],
            ['**Obturator** (L2–4)', 'Pelvic surgery, obturator hernia', 'Weak adduction; numb medial thigh'],
          ],
        },
      ],
    },
    {
      id: 'memory',
      title: 'Memory aids',
      blocks: [
        {
          t: 'mnemonic',
          title: 'Branches of the posterior cord',
          phrase: 'STAR',
          items: [
            ['S', 'Upper and lower Subscapular nerves'],
            ['T', 'Thoracodorsal nerve (latissimus dorsi)'],
            ['A', 'Axillary nerve'],
            ['R', 'Radial nerve'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Hand muscles supplied by the median nerve',
          phrase: 'LOAF',
          items: [
            ['L', 'Lateral two Lumbricals'],
            ['O', 'Opponens pollicis'],
            ['A', 'Abductor pollicis brevis'],
            ['F', 'Flexor pollicis brevis (superficial head)'],
          ],
          note: 'Every other intrinsic hand muscle is supplied by the **ulnar** nerve.',
        },
        {
          t: 'mnemonic',
          title: 'Musculocutaneous nerve supplies',
          phrase: 'BBC',
          items: [
            ['B', 'Biceps brachii'],
            ['B', 'Brachialis'],
            ['C', 'Coracobrachialis'],
          ],
        },
        { t: 'callout', tone: 'remember', text: 'Pelvic floor and external sphincters: **pudendal nerve (S2, S3, S4)** — “S2, 3, 4 keeps the pelvic floor off the floor”.' },
      ],
    },
  ],

  autonomic: [
    {
      id: 'compare',
      title: 'Sympathetic vs parasympathetic',
      blocks: [
        {
          t: 'compare',
          title: 'Side by side',
          cols: ['Sympathetic', 'Parasympathetic'],
          rows: [
            ['Outflow', '**Thoracolumbar** (lateral horn T1–L2)', '**Craniosacral** (CN III, VII, IX, X; S2–S4)'],
            ['Ganglia', 'Near the cord — paravertebral chain or prevertebral (coeliac, mesenteric)', 'In or near the target organ wall'],
            ['Pre-/postganglionic', 'Short pre, long post', 'Long pre, short post'],
            ['Postganglionic transmitter', '**Noradrenaline** (except sweat glands → ACh)', '**Acetylcholine** (muscarinic)'],
            ['Effect', 'Fight or flight: ↑HR, bronchodilation, mydriasis, ↓gut activity', 'Rest and digest: ↓HR, bronchoconstriction, miosis, ↑secretions and peristalsis'],
          ],
        },
        {
          t: 'table',
          title: 'Cranial parasympathetic ganglia',
          head: ['Ganglion', 'Preganglionic nerve', 'Target'],
          rows: [
            ['Ciliary', 'III', 'Sphincter pupillae, ciliary muscle'],
            ['Pterygopalatine', 'VII (greater petrosal)', 'Lacrimal gland, nasal glands'],
            ['Submandibular', 'VII (chorda tympani)', 'Submandibular and sublingual glands'],
            ['Otic', 'IX (lesser petrosal)', 'Parotid gland'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'mnemonic',
          title: 'Parasympathetic (cholinergic) excess — e.g. organophosphate poisoning',
          phrase: 'SLUDGE',
          items: [
            ['S', 'Salivation'],
            ['L', 'Lacrimation'],
            ['U', 'Urination'],
            ['D', 'Defecation'],
            ['G', 'GI cramps'],
            ['E', 'Emesis'],
          ],
          note: 'Plus miosis, bradycardia and bronchorrhoea; treated with atropine (± pralidoxime).',
        },
        { t: 'callout', tone: 'clinical', title: 'Horner’s syndrome', text: 'Interruption of the cervical sympathetic chain → **ptosis**, **miosis**, **anhidrosis** (± apparent enophthalmos) on the same side — e.g. Pancoast tumour at the lung apex.' },
        { t: 'callout', tone: 'pitfall', text: 'The **adrenal medulla** receives **preganglionic** sympathetic fibres directly — it behaves like a postganglionic neuron releasing adrenaline into the blood.' },
        {
          t: 'highyield',
          items: [
            'Sweat glands: sympathetic but **cholinergic**.',
            'Visceral pain travels with sympathetic fibres → referred to the dermatomes of those segments (heart → T1–T4, appendix → T10).',
            'Erection is **parasympathetic** (pelvic splanchnics); emission is **sympathetic** — “Point and Shoot”.',
          ],
        },
      ],
    },
  ],

  skeletal: [
    {
      id: 'classes',
      title: 'Bones and joints at a glance',
      blocks: [
        {
          t: 'table',
          title: 'Bone classification',
          head: ['Type', 'Example', 'Note'],
          rows: [
            ['Long', 'Femur, humerus, phalanges', 'Shaft (diaphysis) + ends (epiphyses); growth at the epiphyseal plate'],
            ['Short', 'Carpals, tarsals', 'Cube-like; mostly spongy bone'],
            ['Flat', 'Skull vault, sternum, scapula, ribs', 'Red marrow in adults (sternum, ilium sampled)'],
            ['Irregular', 'Vertebrae, hip bone', 'Complex shapes'],
            ['Sesamoid', '**Patella**, pisiform', 'Develop within tendons'],
            ['Pneumatic', 'Maxilla, frontal, sphenoid, ethmoid', 'Air sinuses'],
          ],
        },
        {
          t: 'table',
          title: 'Synovial joint types',
          head: ['Type', 'Movement', 'Example'],
          rows: [
            ['Hinge', 'Flexion/extension', 'Elbow (humero-ulnar), interphalangeal'],
            ['Pivot', 'Rotation', 'Atlanto-axial, proximal radio-ulnar'],
            ['Ball and socket', 'All planes', 'Shoulder, hip'],
            ['Saddle', 'Biaxial + some rotation', '**1st carpometacarpal** (thumb)'],
            ['Condyloid (ellipsoid)', 'Biaxial', 'Radiocarpal (wrist), metacarpophalangeal'],
            ['Plane', 'Gliding', 'Acromioclavicular, intercarpal'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Carpal bones (proximal row lateral → medial, then distal row lateral → medial)',
          phrase: 'Some Lovers Try Positions That They Can’t Handle',
          items: [
            ['S', 'Scaphoid'],
            ['L', 'Lunate'],
            ['T', 'Triquetrum'],
            ['P', 'Pisiform'],
            ['T', 'Trapezium (thumb side)'],
            ['T', 'Trapezoid'],
            ['C', 'Capitate'],
            ['H', 'Hamate'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Tarsal bones',
          phrase: 'Tiger Cubs Need MILC',
          items: [
            ['T', 'Talus'],
            ['C', 'Calcaneus'],
            ['N', 'Navicular'],
            ['M', 'Medial cuneiform'],
            ['I', 'Intermediate cuneiform'],
            ['L', 'Lateral cuneiform'],
            ['C', 'Cuboid'],
          ],
        },
      ],
    },
    {
      id: 'fractures',
      title: 'Applied: classic fractures',
      blocks: [
        {
          t: 'table',
          head: ['Fracture', 'Why it matters'],
          rows: [
            ['**Scaphoid**', 'Tender anatomical snuffbox; blood enters distally → **avascular necrosis of the proximal pole**'],
            ['**Neck of femur** (intracapsular)', 'Disrupts the **medial circumflex femoral artery** → avascular necrosis of the head'],
            ['**Surgical neck of humerus**', 'Axillary nerve and posterior circumflex humeral artery'],
            ['**Mid-shaft humerus**', 'Radial nerve in the spiral groove → wrist drop'],
            ['**Supracondylar humerus** (children)', 'Brachial artery and median nerve; risk of Volkmann’s ischaemic contracture'],
            ['**Colles**', 'Distal radius, dorsal displacement — “dinner-fork” deformity'],
            ['**Clavicle**', 'Commonest fracture; usually junction of middle and lateral thirds'],
            ['**Fibular neck**', 'Common fibular nerve → foot drop'],
          ],
        },
        {
          t: 'highyield',
          items: [
            '206 bones in the adult: **80 axial**, **126 appendicular**.',
            'Clavicle — first bone to ossify; femur — largest and strongest; stapes — smallest.',
            'Epiphyseal plate injuries in children (Salter–Harris) can stop growth.',
          ],
        },
      ],
    },
  ],

  'vertebral-column': [
    {
      id: 'regional',
      title: 'Telling vertebrae apart',
      blocks: [
        {
          t: 'compare',
          title: 'Typical vertebra by region',
          cols: ['Cervical', 'Thoracic', 'Lumbar'],
          rows: [
            ['Body', 'Small, oval', 'Heart-shaped, **costal facets**', 'Large, kidney-shaped'],
            ['Foramen transversarium', '**Yes** (vertebral artery C6–C1)', 'No', 'No'],
            ['Spinous process', 'Short, **bifid** (C3–C6)', 'Long, slopes down', 'Short, thick, hatchet-shaped'],
            ['Facet orientation', 'Oblique', 'Coronal → rotation', 'Sagittal → flexion/extension'],
          ],
        },
        {
          t: 'table',
          title: 'Atypical vertebrae',
          head: ['Vertebra', 'Distinctive feature'],
          rows: [
            ['C1 atlas', 'No body, no spinous process; ring with lateral masses'],
            ['C2 axis', '**Dens** (odontoid process) — pivot for rotation'],
            ['C7 vertebra prominens', 'Long non-bifid spinous process — first easily felt spine'],
            ['Sacrum', '5 fused vertebrae; promontory, sacral hiatus'],
            ['Coccyx', '3–5 (usually 4) fused rudimentary vertebrae'],
          ],
        },
        {
          t: 'table',
          title: 'Surface landmarks on the back',
          head: ['Landmark', 'Level'],
          rows: [
            ['Vertebra prominens', 'C7'],
            ['Root of the spine of the scapula', 'T3'],
            ['Inferior angle of the scapula', 'T7'],
            ['Highest point of the iliac crests (Tuffier’s line)', '**L4** spinous process'],
            ['Posterior superior iliac spines (dimples)', '**S2** — end of the dural sac'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        { t: 'callout', tone: 'tip', title: 'Memory aid', text: 'Count **7-12-5-5-4** — breakfast at 7, lunch at 12, dinner at 5 (cervical, thoracic, lumbar), then 5 sacral and ~4 coccygeal.' },
        { t: 'callout', tone: 'pitfall', text: 'A posterolateral **L4/L5 disc** prolapse compresses the **L5** root (the one passing to the next foramen), not L4 → weak great-toe extension, numb dorsum of foot.' },
        {
          t: 'highyield',
          items: [
            'Primary curves (present at birth): **thoracic and sacral** kyphoses. Secondary: **cervical** (head control, ~3 months) and **lumbar** (walking, ~12 months) lordoses.',
            'Intervertebral disc = annulus fibrosus (outer) + nucleus pulposus (notochord remnant).',
            'Ligamentum flavum (yellow, elastic) joins the laminae — the “give” felt in epidural/spinal needles.',
          ],
        },
      ],
    },
  ],

  skull: [
    {
      id: 'applied',
      title: 'Applied anatomy',
      blocks: [
        {
          t: 'table',
          title: 'Fontanelles and sutures',
          head: ['Feature', 'Where', 'Closes'],
          rows: [
            ['Anterior fontanelle', 'Junction of sagittal, coronal and frontal sutures (diamond)', '~18–24 months'],
            ['Posterior fontanelle', 'Sagittal meets lambdoid (triangle)', 'By ~2–3 months'],
            ['Coronal suture', 'Frontal ↔ parietals', 'Adult life'],
            ['Sagittal suture', 'Between parietals', 'Adult life'],
            ['Lambdoid suture', 'Parietals ↔ occipital', 'Adult life'],
          ],
        },
        {
          t: 'relations',
          title: 'The pterion — the weakest point of the lateral skull',
          center: 'Pterion',
          sides: {
            superior: 'Parietal bone',
            anterior: 'Frontal bone and greater wing of sphenoid',
            inferior: 'Squamous temporal bone',
            medial: 'Anterior branch of the **middle meningeal artery** (inner surface) → extradural haematoma when fractured',
          },
        },
        {
          t: 'table',
          title: 'Cranial fossae',
          head: ['Fossa', 'Holds', 'Key openings'],
          rows: [
            ['Anterior', 'Frontal lobes', 'Cribriform plate (I)'],
            ['Middle', 'Temporal lobes, pituitary (sella turcica)', 'Optic canal, superior orbital fissure, rotundum, ovale, spinosum'],
            ['Posterior', 'Cerebellum, brainstem', 'Foramen magnum, internal acoustic meatus, jugular foramen, hypoglossal canal'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'mnemonic',
          title: 'The 8 cranial bones (6 kinds)',
          phrase: 'PEST OF 6',
          items: [
            ['P', 'Parietal (×2)'],
            ['E', 'Ethmoid'],
            ['S', 'Sphenoid'],
            ['T', 'Temporal (×2)'],
            ['O', 'Occipital'],
            ['F', 'Frontal'],
          ],
          note: '22 skull bones in total: 8 cranial + 14 facial (mandible the only movable one).',
        },
        {
          t: 'highyield',
          items: [
            'Basal skull fracture: **raccoon eyes**, **Battle’s sign** (mastoid bruising), CSF rhinorrhoea/otorrhoea.',
            'A bulging anterior fontanelle suggests raised intracranial pressure; a sunken one, dehydration.',
            'Pituitary sits in the sella turcica directly below the **optic chiasm**.',
          ],
        },
      ],
    },
  ],

  muscular: [
    {
      id: 'types',
      title: 'Muscle tissue and terminology',
      blocks: [
        {
          t: 'compare',
          title: 'Three kinds of muscle',
          cols: ['Skeletal', 'Cardiac', 'Smooth'],
          rows: [
            ['Appearance', 'Striated, long multinucleate fibres', 'Striated, branched, 1–2 central nuclei, **intercalated discs**', 'Non-striated, spindle cells, one nucleus'],
            ['Control', 'Voluntary (somatic)', 'Involuntary, intrinsic pacemaker', 'Involuntary (autonomic, hormones)'],
            ['Regeneration', 'Limited (satellite cells)', 'Very poor (scar after infarction)', 'Good'],
          ],
        },
        {
          t: 'terms',
          items: [
            ['Origin / insertion', 'The usually fixed (proximal) attachment / the moving attachment.'],
            ['Agonist (prime mover)', 'Main muscle producing a movement.'],
            ['Antagonist', 'Opposes the movement and relaxes to allow it.'],
            ['Synergist', 'Assists the agonist or stabilises intermediate joints.'],
            ['Motor unit', 'One motor neuron + all the fibres it supplies.'],
            ['Compartment', 'Group of muscles in a fascial envelope sharing nerve supply and function.'],
          ],
        },
      ],
    },
    {
      id: 'memory',
      title: 'Memory aids',
      blocks: [
        {
          t: 'mnemonic',
          title: 'Rotator cuff',
          phrase: 'SITS',
          items: [
            ['S', 'Supraspinatus — starts abduction (first ~15°); most often torn'],
            ['I', 'Infraspinatus — lateral rotation'],
            ['T', 'Teres minor — lateral rotation (axillary nerve)'],
            ['S', 'Subscapularis — medial rotation (only anterior cuff muscle)'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Pes anserinus (medial tibia), anterior → posterior',
          phrase: 'Say Grace before Tea',
          items: [
            ['S', 'Sartorius (femoral nerve)'],
            ['G', 'Gracilis (obturator nerve)'],
            ['T', 'Semitendinosus (tibial part of sciatic)'],
          ],
        },
        { t: 'callout', tone: 'clinical', title: 'Compartment syndrome', text: 'Rising pressure in a closed fascial compartment (fractures, crush, tight casts) → **pain out of proportion**, pain on passive stretch; pulses may be present until late. Treatment: urgent **fasciotomy**.' },
        {
          t: 'highyield',
          items: [
            'Myasthenia gravis: antibodies to **acetylcholine receptors** → fatigable weakness, ptosis; thymoma association.',
            'Quadriceps: femoral nerve. Hamstrings: tibial part of sciatic (short head of biceps femoris: common fibular).',
            'Diaphragm: phrenic nerve **C3, C4, C5** (“keeps the diaphragm alive”).',
          ],
        },
      ],
    },
  ],

  cardiovascular: [
    {
      id: 'vessels',
      title: 'Vessels: structure and key anatomy',
      blocks: [
        {
          t: 'compare',
          title: 'Artery vs vein',
          cols: ['Artery', 'Vein'],
          rows: [
            ['Wall', 'Thick **tunica media** (smooth muscle, elastic)', 'Thin media; relatively thick adventitia'],
            ['Lumen', 'Narrow, round', 'Wide, often collapsed'],
            ['Valves', 'None (except at heart outflow)', '**Valves** in limb veins prevent backflow'],
            ['Pressure', 'High, pulsatile', 'Low; aided by the muscle pump'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Branches of the aortic arch (right → left)',
          phrase: 'ABC’s',
          items: [
            ['A', 'Arch gives…'],
            ['B', 'Brachiocephalic trunk (→ right subclavian + right common carotid)'],
            ['C', 'Left common Carotid'],
            ['S', 'Left Subclavian'],
          ],
        },
        {
          t: 'table',
          title: 'Fetal shunts and their adult remnants',
          head: ['Fetal structure', 'Function', 'Adult remnant'],
          rows: [
            ['Foramen ovale', 'RA → LA, bypasses lungs', '**Fossa ovalis**'],
            ['Ductus arteriosus', 'Pulmonary trunk → aorta', '**Ligamentum arteriosum**'],
            ['Ductus venosus', 'Umbilical vein → IVC, bypasses liver', '**Ligamentum venosum**'],
            ['Umbilical vein', 'Oxygenated blood from placenta', '**Ligamentum teres** (round ligament of liver)'],
            ['Umbilical arteries', 'Deoxygenated blood to placenta', '**Medial umbilical ligaments**'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'table',
          title: 'Portosystemic anastomoses (open up in portal hypertension)',
          head: ['Site', 'Portal side', 'Systemic side', 'Result'],
          rows: [
            ['Lower oesophagus', 'Left gastric vein', 'Oesophageal (azygos) veins', '**Oesophageal varices** (haematemesis)'],
            ['Umbilicus', 'Paraumbilical veins', 'Superficial epigastric veins', '**Caput medusae**'],
            ['Anorectal junction', 'Superior rectal vein', 'Middle/inferior rectal veins', 'Rectal varices'],
            ['Retroperitoneum', 'Colic veins', 'Lumbar/renal veins', 'Retroperitoneal collaterals'],
          ],
        },
        {
          t: 'highyield',
          items: [
            'Pulse points: radial, brachial (cubital fossa), carotid (anterior border of SCM at the thyroid cartilage), femoral (mid-inguinal point), popliteal, posterior tibial (behind medial malleolus), dorsalis pedis (lateral to EHL tendon).',
            'Left recurrent laryngeal nerve hooks under the **arch of the aorta** (ligamentum arteriosum) — hoarseness with aortic aneurysm or left hilar tumours.',
            'Abdominal aorta bifurcates at **L4** (level of the umbilicus/iliac crests).',
          ],
        },
      ],
    },
  ],

  heart: [
    {
      id: 'relations',
      title: 'Relations and surface anatomy',
      blocks: [
        {
          t: 'relations',
          title: 'What touches the heart',
          center: 'Heart in the middle mediastinum',
          sides: {
            anterior: 'Sternum, costal cartilages 3–6, thymus remnant; mostly the **right ventricle**',
            posterior: '**Left atrium** (most posterior chamber) → oesophagus and descending aorta',
            inferior: 'Central tendon of the diaphragm (mainly right ventricle)',
            lateral: 'Lungs and pleura; **phrenic nerves** run on the pericardium',
            superior: 'Great vessels — aorta, pulmonary trunk, SVC',
          },
        },
        {
          t: 'table',
          title: 'Auscultation areas',
          head: ['Valve', 'Where to listen'],
          rows: [
            ['Aortic', '2nd right intercostal space, sternal edge'],
            ['Pulmonary', '2nd left intercostal space, sternal edge'],
            ['Tricuspid', '4th–5th left intercostal space, lower left sternal edge'],
            ['Mitral', '5th left intercostal space, midclavicular line (apex)'],
          ],
        },
        { t: 'callout', tone: 'tip', title: 'Memory aid', text: '“**All Physicians Take Money**” — aortic, pulmonary, tricuspid, mitral, moving from the upper right across and down to the apex.' },
      ],
    },
    {
      id: 'coronary',
      title: 'Coronary supply and conduction',
      blocks: [
        {
          t: 'table',
          title: 'Coronary arteries',
          head: ['Artery', 'Supplies', 'Infarct shows in ECG leads'],
          rows: [
            ['**Right coronary**', 'Right atrium, right ventricle, inferior wall, **SA node (~60%)**, **AV node (~80–90%)**', 'II, III, aVF (inferior)'],
            ['**Left anterior descending**', 'Anterior left ventricle, **anterior 2/3 of the septum**, apex', 'V1–V4 (anterior/septal)'],
            ['**Circumflex**', 'Lateral and posterior left ventricle, left atrium', 'I, aVL, V5–V6 (lateral)'],
          ],
        },
        {
          t: 'flow',
          title: 'Conduction pathway',
          steps: [
            { label: 'SA node', note: 'pacemaker, junction of SVC and right atrium (~60–100/min)' },
            { label: 'Atrial muscle' },
            { label: 'AV node', note: 'delay lets the ventricles fill' },
            { label: 'Bundle of His' },
            { label: 'Right and left bundle branches', note: 'down the septum' },
            { label: 'Purkinje fibres', note: 'apex fires first → blood squeezed upwards' },
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        { t: 'callout', tone: 'pitfall', text: '“Dominance” refers to which artery gives the **posterior interventricular (descending)** artery — the right coronary in about 70% of people — not to which supplies more muscle.' },
        {
          t: 'highyield',
          items: [
            'S1 = closure of mitral + tricuspid (start of systole); S2 = closure of aortic + pulmonary (end of systole).',
            'Apex beat: left **5th intercostal space, midclavicular line**.',
            'Enlarged left atrium (mitral stenosis) can compress the oesophagus (dysphagia) or left recurrent laryngeal nerve (hoarseness — Ortner’s syndrome).',
            'Coronary arteries fill mainly in **diastole**.',
          ],
        },
      ],
    },
  ],

  respiratory: [
    {
      id: 'lungs',
      title: 'Lungs and pleura',
      blocks: [
        {
          t: 'compare',
          title: 'Right vs left lung',
          cols: ['Right lung', 'Left lung'],
          rows: [
            ['Lobes', '**3** (upper, middle, lower)', '**2** (upper with **lingula**, lower)'],
            ['Fissures', 'Oblique + horizontal', 'Oblique only'],
            ['Segments', '10 bronchopulmonary segments', '8–10 (some fused)'],
            ['Main bronchus', '**Wider, shorter, more vertical** → aspirated objects go right', 'Narrower, longer, more horizontal'],
            ['Special', 'Shorter (liver below)', '**Cardiac notch**; longer, narrower'],
          ],
        },
        {
          t: 'table',
          title: 'Surface marking of lung and pleura (lower borders)',
          head: ['Line', 'Lung', 'Pleura'],
          rows: [
            ['Midclavicular', 'Rib **6**', 'Rib **8**'],
            ['Midaxillary', 'Rib **8**', 'Rib **10**'],
            ['Paravertebral', 'Rib **10**', 'Rib **12**'],
          ],
        },
        { t: 'callout', tone: 'tip', title: 'Memory aid', text: 'Lungs **6-8-10**, pleura **8-10-12** — the pleura always reaches two ribs lower (the costodiaphragmatic recess).' },
        { t: 'callout', tone: 'tip', title: 'Hilum', text: '“**RALS**” — the pulmonary artery lies Right Anterior, Left Superior to the main bronchus at the hilum.' },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        { t: 'callout', tone: 'clinical', title: 'Chest drain / pleural tap', text: 'Insert in the **“triangle of safety”** (lateral border of pectoralis major, anterior border of latissimus dorsi, 5th intercostal space) and **just above the upper border of a rib** — the intercostal vein, artery and nerve (**VAN**) run in the costal groove below each rib.' },
        {
          t: 'highyield',
          items: [
            'Trachea bifurcates at about the **sternal angle (T4/T5)**; the **carina** is very sensitive (cough reflex).',
            'Aspiration when supine → posterior segment of the right upper lobe or superior segment of the right lower lobe.',
            'Pancoast tumour (apex) → Horner’s syndrome and T1 root (ulnar-side hand) symptoms.',
            'Parietal pleura is pain-sensitive (intercostal and phrenic nerves); visceral pleura is not.',
          ],
        },
      ],
    },
  ],

  digestive: [
    {
      id: 'peritoneum',
      title: 'Peritoneum and gut divisions',
      blocks: [
        {
          t: 'mnemonic',
          title: 'Retroperitoneal organs',
          phrase: 'SAD PUCKER',
          items: [
            ['S', 'Suprarenal (adrenal) glands'],
            ['A', 'Aorta and IVC'],
            ['D', 'Duodenum (2nd–4th parts)'],
            ['P', 'Pancreas (except the tail)'],
            ['U', 'Ureters'],
            ['C', 'Colon — ascending and descending'],
            ['K', 'Kidneys'],
            ['E', 'Esophagus (abdominal part)'],
            ['R', 'Rectum (middle and lower parts)'],
          ],
        },
        {
          t: 'table',
          title: 'Foregut, midgut, hindgut',
          head: ['Division', 'Extent', 'Artery', 'Pain referred to'],
          rows: [
            ['**Foregut**', 'Oesophagus → 2nd part of duodenum (major papilla); liver, gallbladder, pancreas, spleen (vascular)', '**Coeliac trunk** (T12)', 'Epigastrium'],
            ['**Midgut**', 'Rest of duodenum → proximal 2/3 of transverse colon', '**Superior mesenteric** (L1)', 'Periumbilical'],
            ['**Hindgut**', 'Distal 1/3 transverse colon → upper anal canal (pectinate line)', '**Inferior mesenteric** (L3)', 'Suprapubic'],
          ],
        },
        {
          t: 'layers',
          title: 'Gut wall — lumen outwards',
          layers: [
            { name: 'Mucosa', note: 'Epithelium, lamina propria, muscularis mucosae' },
            { name: 'Submucosa', note: 'Vessels, glands; **Meissner’s (submucosal) plexus** — secretion' },
            { name: 'Muscularis externa', note: 'Inner circular + outer longitudinal; **Auerbach’s (myenteric) plexus** between them — motility' },
            { name: 'Serosa / adventitia', note: 'Visceral peritoneum on intraperitoneal parts; adventitia on retroperitoneal parts and oesophagus' },
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        { t: 'callout', tone: 'pitfall', text: 'The **pectinate line** divides the anal canal: above it — visceral (painless), portal drainage, internal haemorrhoids, adenocarcinoma, internal iliac nodes; below it — somatic (painful), systemic drainage, external haemorrhoids, squamous carcinoma, **superficial inguinal nodes**.' },
        {
          t: 'highyield',
          items: [
            '**McBurney’s point**: one-third of the way from the ASIS to the umbilicus — base of the appendix.',
            'Hirschsprung disease: absent myenteric and submucosal ganglia (failed neural crest migration) in the distal colon.',
            'Iron absorbed in the duodenum; **B12 and bile salts in the terminal ileum**.',
          ],
        },
      ],
    },
  ],

  stomach: [
    {
      id: 'relations',
      title: 'Relations and blood supply',
      blocks: [
        {
          t: 'relations',
          title: 'Stomach bed (structures behind the stomach)',
          center: 'Stomach',
          sides: {
            anterior: 'Left lobe of liver, anterior abdominal wall, diaphragm',
            posterior: '**Lesser sac**, pancreas, left kidney and adrenal, **splenic artery**, transverse mesocolon',
            superior: 'Left dome of diaphragm; oesophagus enters at the cardia (T11)',
            lateral: 'Spleen (via gastrosplenic ligament)',
            inferior: 'Transverse colon (greater omentum hangs from the greater curvature)',
          },
        },
        {
          t: 'table',
          title: 'Arteries — all from the coeliac trunk',
          head: ['Artery', 'Origin', 'Runs along'],
          rows: [
            ['Left gastric', 'Coeliac trunk', 'Lesser curvature (upper)'],
            ['Right gastric', 'Hepatic artery (proper/common)', 'Lesser curvature (lower)'],
            ['Right gastro-omental', 'Gastroduodenal', 'Greater curvature (lower)'],
            ['Left gastro-omental', 'Splenic', 'Greater curvature (upper)'],
            ['Short gastrics', 'Splenic', 'Fundus'],
          ],
        },
        {
          t: 'table',
          title: 'Gastric cells',
          head: ['Cell', 'Where', 'Secretes'],
          rows: [
            ['Parietal (oxyntic)', 'Body, fundus', '**HCl** and **intrinsic factor** (B12 absorption)'],
            ['Chief', 'Body, fundus', '**Pepsinogen**, gastric lipase'],
            ['G cells', '**Antrum**', 'Gastrin'],
            ['Mucous neck cells', 'Throughout', 'Mucus + bicarbonate'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'highyield',
          items: [
            'Posterior **gastric** ulcer can erode the **splenic artery**; posterior **duodenal** ulcer → **gastroduodenal artery**.',
            'Loss of parietal cells (pernicious anaemia, gastrectomy) → **B12 deficiency**.',
            'Pyloric stenosis in infants: projectile non-bilious vomiting, palpable “olive”, hypochloraemic metabolic alkalosis.',
          ],
        },
      ],
    },
  ],

  liver: [
    {
      id: 'applied',
      title: 'Applied anatomy',
      blocks: [
        {
          t: 'relations',
          title: 'Porta hepatis / hepatoduodenal ligament',
          center: 'Portal triad',
          sides: {
            anterior: '**Common bile duct** (right) and **hepatic artery proper** (left)',
            posterior: '**Portal vein** (behind both) — and behind it the epiploic foramen (into the lesser sac)',
          },
        },
        { t: 'callout', tone: 'clinical', title: 'Pringle manoeuvre', text: 'Compressing the hepatoduodenal ligament (free edge of the lesser omentum) controls hepatic arterial and portal inflow during liver bleeding.' },
        {
          t: 'relations',
          title: 'Hepatocystic (Calot’s) triangle — operating zone of cholecystectomy',
          center: 'Calot’s triangle',
          sides: {
            medial: 'Common hepatic duct',
            inferior: 'Cystic duct',
            superior: 'Inferior surface of the liver',
            lateral: 'Contains the **cystic artery** (usually from the right hepatic artery) and Lund’s lymph node',
          },
        },
        {
          t: 'flow',
          title: 'Bile route',
          steps: [
            { label: 'Hepatocytes → bile canaliculi' },
            { label: 'Right and left hepatic ducts' },
            { label: 'Common hepatic duct', note: '+ cystic duct (to and from gallbladder)' },
            { label: 'Common bile duct', note: 'behind the head of the pancreas' },
            { label: 'Hepatopancreatic ampulla (of Vater)', note: '+ main pancreatic duct' },
            { label: 'Major duodenal papilla', note: 'sphincter of Oddi, 2nd part of duodenum' },
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'highyield',
          items: [
            'Liver has **8 Couinaud segments** (each with its own portal pedicle and hepatic venous drainage) → segmental resection. The caudate lobe (segment I) drains directly into the IVC.',
            'Portal vein = **superior mesenteric vein + splenic vein**, formed behind the neck of the pancreas; carries ~75% of liver blood flow.',
            'Pancreatic head cancer → painless obstructive jaundice with a palpable gallbladder (**Courvoisier’s law**).',
            'Gallbladder pain refers to the right shoulder tip (phrenic nerve, C3–C5) — **Murphy’s sign** on inspiration.',
          ],
        },
      ],
    },
  ],

  intestines: [
    {
      id: 'compare',
      title: 'Telling the parts apart',
      blocks: [
        {
          t: 'compare',
          title: 'Jejunum vs ileum',
          cols: ['Jejunum', 'Ileum'],
          rows: [
            ['Position', 'Upper left of the infracolic compartment', 'Lower right, pelvis'],
            ['Wall / lumen', 'Thicker, wider, more vascular (redder)', 'Thinner, narrower'],
            ['Plicae circulares', 'Tall and crowded', 'Low, sparse or absent distally'],
            ['Arterial arcades', '1–2, with **long vasa recta**', 'Many (3–5), with **short vasa recta**'],
            ['Mesenteric fat', 'Less', 'More'],
            ['Lymphoid tissue', 'Few nodules', '**Peyer’s patches**'],
          ],
        },
        {
          t: 'compare',
          title: 'Small vs large intestine',
          cols: ['Small intestine', 'Large intestine'],
          rows: [
            ['Length', '~6 m', '~1.5 m'],
            ['Surface', 'Villi and plicae (absorption)', 'No villi; crypts with goblet cells'],
            ['Features', 'Mesentery (jejunum, ileum)', '**Taeniae coli, haustra, appendices epiploicae**'],
            ['Main job', 'Digestion and absorption', 'Water and salt absorption, faeces formation'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'mnemonic',
          title: 'Meckel’s diverticulum — the rule of 2s',
          phrase: 'Twos everywhere',
          items: [
            ['2%', 'of the population'],
            ['2 ft', '(~60 cm) proximal to the ileocaecal valve, on the antimesenteric border'],
            ['2 in', 'long (~5 cm)'],
            ['2 types', 'of ectopic tissue — gastric and pancreatic'],
            ['2 yrs', 'usually presents before age 2 (painless rectal bleeding)'],
          ],
          note: 'Remnant of the vitello-intestinal (omphalomesenteric) duct.',
        },
        {
          t: 'highyield',
          items: [
            'Duodenojejunal flexure (ligament of Treitz) separates **upper and lower GI bleeding**.',
            'Taeniae coli converge on the base of the appendix.',
            'Caecum and sigmoid are the commonest sites of colonic volvulus.',
          ],
        },
      ],
    },
  ],

  urinary: [
    {
      id: 'applied',
      title: 'Applied anatomy',
      blocks: [
        {
          t: 'relations',
          title: 'Kidneys in the posterior abdomen',
          center: 'Kidney',
          sides: {
            superior: 'Adrenal gland; ribs 11–12 and the diaphragm (pleura behind the upper pole)',
            anterior: 'Right: liver, duodenum (2nd part), hepatic flexure. Left: stomach, spleen, pancreas tail, jejunum, splenic flexure',
            posterior: 'Diaphragm, **psoas major**, quadratus lumborum, transversus abdominis; subcostal, iliohypogastric and ilioinguinal nerves',
            medial: 'Hilum at **L1** (transpyloric plane): renal Vein, Artery, Pelvis — anterior to posterior',
            inferior: 'Lower pole near the iliac crest (right kidney sits slightly lower — pushed down by the liver)',
          },
        },
        { t: 'callout', tone: 'tip', title: 'Memory aid', text: 'Hilum from front to back: **VAP** (vein, artery, pelvis). Ureter vs uterine artery/vas: “**water under the bridge**”.' },
        {
          t: 'compare',
          title: 'Urethra: male vs female',
          cols: ['Male', 'Female'],
          rows: [
            ['Length', '~18–20 cm', '~4 cm'],
            ['Parts', 'Pre-prostatic, **prostatic**, **membranous** (narrowest, least distensible), spongy', 'Single short canal opening in the vestibule'],
            ['Clinical', 'Catheterisation follows two curves; membranous part torn in pelvic fractures', 'Short length → more **urinary tract infections**'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'flow',
          title: 'Path of filtrate through the nephron',
          steps: [
            { label: 'Glomerulus + Bowman’s capsule', note: 'filtration (~180 L/day)' },
            { label: 'Proximal convoluted tubule', note: 'reabsorbs ~65% of Na⁺/water, all glucose and amino acids' },
            { label: 'Loop of Henle', note: 'countercurrent multiplier — concentrates the medulla' },
            { label: 'Distal convoluted tubule', note: 'fine-tuning; thiazides act here' },
            { label: 'Collecting duct', note: 'ADH inserts aquaporins → concentrated urine' },
          ],
        },
        {
          t: 'highyield',
          items: [
            'Kidneys lie **T12–L3**; left renal vein crosses **in front of the aorta**, below the SMA (nutcracker compression).',
            'Ureter narrows at the PUJ, pelvic brim and vesicoureteric junction — where stones stick.',
            'Bladder trigone (ureteric orifices + internal urethral orifice) is smooth — derived from mesonephric ducts.',
          ],
        },
      ],
    },
  ],

  reproductive: [
    {
      id: 'applied',
      title: 'Applied anatomy',
      blocks: [
        {
          t: 'compare',
          title: 'Gonadal vessels and lymph',
          cols: ['Ovary', 'Testis'],
          rows: [
            ['Artery', 'Ovarian artery from the **abdominal aorta** (L2)', 'Testicular artery from the **abdominal aorta** (L2)'],
            ['Vein', 'Right → IVC; **left → left renal vein**', 'Right → IVC; **left → left renal vein** (left varicocele commoner)'],
            ['Lymph', '**Para-aortic** nodes', '**Para-aortic** nodes (scrotal skin → superficial inguinal)'],
            ['Ligament / cord', 'Suspensory ligament of ovary carries the vessels', 'Spermatic cord through the inguinal canal'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Path of sperm',
          phrase: 'SEVEN UP',
          items: [
            ['S', 'Seminiferous tubules'],
            ['E', 'Epididymis'],
            ['V', 'Vas deferens'],
            ['E', 'Ejaculatory duct'],
            ['N', '(Nothing)'],
            ['U', 'Urethra'],
            ['P', 'Penis'],
          ],
        },
        {
          t: 'relations',
          title: 'Uterus in the female pelvis',
          center: 'Uterus (anteverted, anteflexed)',
          sides: {
            anterior: 'Urinary bladder; **vesicouterine pouch**',
            posterior: 'Rectum; **rectouterine pouch (of Douglas)** — lowest point of the peritoneal cavity when upright',
            lateral: 'Broad ligament with uterine tubes, round ligament, ovarian ligament; uterine artery crosses **above the ureter** near the cervix',
            inferior: 'Cervix in the vaginal vault; supported by cardinal and uterosacral ligaments and the levator ani',
          },
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'highyield',
          items: [
            'Spermatic cord: **3 arteries** (testicular, cremasteric, artery to the vas), **nerves** (genital branch of genitofemoral, sympathetic fibres; the ilioinguinal nerve runs **beside** the cord in the canal), plus the vas deferens, pampiniform plexus and lymphatics.',
            'Ectopic pregnancy is commonest in the **ampulla** of the uterine tube; fertilisation normally occurs there too.',
            'Uterine artery from the **internal iliac**; ovarian artery from the aorta — they anastomose in the broad ligament.',
          ],
        },
      ],
    },
  ],

  endocrine: [
    {
      id: 'applied',
      title: 'Applied anatomy',
      blocks: [
        {
          t: 'relations',
          title: 'Thyroid gland',
          center: 'Thyroid',
          sides: {
            anterior: 'Infrahyoid (strap) muscles, sternocleidomastoid',
            posterior: '**Parathyroid glands** (usually 4); **recurrent laryngeal nerves** in the tracheo-oesophageal groove',
            medial: 'Larynx, trachea (**isthmus over rings 2–4**), pharynx, oesophagus',
            lateral: 'Carotid sheath (common carotid, internal jugular vein, vagus)',
          },
        },
        { t: 'callout', tone: 'clinical', title: 'Thyroidectomy', text: 'The **recurrent laryngeal nerve** lies near the inferior thyroid artery (hoarseness if injured); the **external laryngeal nerve** runs with the superior thyroid artery (weak high-pitched voice). Removing parathyroids → hypocalcaemia (tetany).' },
        {
          t: 'compare',
          title: 'Anterior vs posterior pituitary',
          cols: ['Anterior (adenohypophysis)', 'Posterior (neurohypophysis)'],
          rows: [
            ['Origin', '**Rathke’s pouch** (oral ectoderm)', 'Down-growth of the diencephalon (neural)'],
            ['Control', 'Hypothalamic releasing hormones via the **portal system**', 'Axons from supraoptic/paraventricular nuclei'],
            ['Hormones', 'FSH, LH, ACTH, TSH, prolactin, GH', '**ADH**, **oxytocin** (made in the hypothalamus)'],
          ],
        },
        {
          t: 'mnemonic',
          title: 'Anterior pituitary hormones',
          phrase: 'FLAT PiG',
          items: [
            ['F', 'FSH'],
            ['L', 'LH'],
            ['A', 'ACTH'],
            ['T', 'TSH'],
            ['P', 'Prolactin'],
            ['G', 'Growth hormone'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'highyield',
          items: [
            'Pituitary adenoma pressing on the optic chiasm → **bitemporal hemianopia**.',
            'Adrenal: 3 arteries, 1 vein (right → IVC, left → left renal vein).',
            'Thyroid develops from the floor of the pharynx (foramen caecum) — thyroglossal cyst moves up on tongue protrusion.',
            'Parathyroids: superior from the 4th pharyngeal pouch, inferior from the 3rd (with the thymus) — inferior ones are more variable in position.',
          ],
        },
      ],
    },
  ],

  lymphatic: [
    {
      id: 'applied',
      title: 'Applied anatomy',
      blocks: [
        {
          t: 'mnemonic',
          title: 'The spleen in odd numbers',
          phrase: '1, 3, 5, 7, 9, 11',
          items: [
            ['1 × 3 × 5', 'inches in size'],
            ['7', 'ounces in weight (~150–200 g)'],
            ['9–11', 'lies beneath the left ribs 9 to 11'],
          ],
          note: 'Its long axis follows the 10th rib; a normal spleen is not palpable below the costal margin.',
        },
        {
          t: 'flow',
          title: 'Thoracic duct',
          steps: [
            { label: 'Cisterna chyli', note: 'L1–L2, right of the aorta' },
            { label: 'Aortic hiatus', note: 'T12, with the aorta and azygos vein' },
            { label: 'Posterior mediastinum', note: 'crosses to the left around T5' },
            { label: 'Left venous angle', note: 'junction of left internal jugular and subclavian veins' },
          ],
        },
        {
          t: 'table',
          title: 'Lymph drainage worth memorising',
          head: ['Region', 'Drains to'],
          rows: [
            ['Breast', '**Axillary nodes** (~75%), internal thoracic (parasternal) nodes'],
            ['Testis', 'Para-aortic nodes'],
            ['Scrotum, lower anal canal, vulva', 'Superficial inguinal nodes'],
            ['Tongue tip', 'Submental nodes'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        { t: 'callout', tone: 'clinical', title: 'After splenectomy', text: 'Risk of overwhelming infection with **encapsulated bacteria** (pneumococcus, meningococcus, *Haemophilus influenzae* b) → vaccinate and consider antibiotic prophylaxis.' },
        {
          t: 'highyield',
          items: [
            '**Waldeyer’s ring**: pharyngeal (adenoid), tubal, palatine and lingual tonsils.',
            'Right lymphatic duct drains the right side of the head, neck, thorax and right upper limb; the thoracic duct drains everything else.',
            'Virchow’s node (left supraclavicular) enlarges with abdominal cancers (Troisier’s sign).',
          ],
        },
      ],
    },
  ],

  sensory: [
    {
      id: 'eye',
      title: 'The eye and visual pathway',
      blocks: [
        {
          t: 'layers',
          title: 'Coats of the eyeball — outside to inside',
          layers: [
            { name: 'Fibrous coat', note: '**Sclera** (white, posterior 5/6) + **cornea** (transparent, main refracting surface)' },
            { name: 'Vascular coat (uvea)', note: '**Choroid**, **ciliary body** (accommodation, aqueous production), **iris** (pupil size)' },
            { name: 'Neural coat', note: '**Retina** — rods (dim light) and cones (colour, concentrated in the fovea); optic disc = blind spot' },
          ],
        },
        {
          t: 'flow',
          title: 'Aqueous humour circulation',
          steps: [
            { label: 'Ciliary processes', note: 'secrete aqueous' },
            { label: 'Posterior chamber' },
            { label: 'Pupil' },
            { label: 'Anterior chamber' },
            { label: 'Trabecular meshwork' },
            { label: 'Canal of Schlemm → episcleral veins', note: 'blocked drainage → raised pressure (glaucoma)' },
          ],
        },
        {
          t: 'table',
          title: 'Visual pathway lesions',
          head: ['Lesion site', 'Field defect'],
          rows: [
            ['Optic nerve', 'Blindness of that eye'],
            ['**Optic chiasm** (e.g. pituitary tumour)', '**Bitemporal hemianopia**'],
            ['Optic tract', 'Contralateral homonymous hemianopia'],
            ['Meyer’s loop (temporal lobe)', 'Contralateral **superior** quadrantanopia (“pie in the sky”)'],
            ['Parietal optic radiation', 'Contralateral **inferior** quadrantanopia (“pie on the floor”)'],
            ['Occipital cortex (PCA stroke)', 'Contralateral homonymous hemianopia **with macular sparing**'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'highyield',
          items: [
            'Extraocular muscles: **LR6 SO4**, the rest III. Superior oblique is tested with the eye looking **down and in** (it depresses the adducted eye).',
            'Ossicles: **malleus → incus → stapes** (stapes footplate in the oval window); stapedius (VII) damps loud sound.',
            'Pupillary light reflex: II in, III out (Edinger–Westphal → ciliary ganglion).',
            'Central retinal artery occlusion → sudden painless loss of vision with a “cherry-red spot”.',
          ],
        },
      ],
    },
  ],

  integumentary: [
    {
      id: 'applied',
      title: 'Applied anatomy',
      blocks: [
        {
          t: 'mnemonic',
          title: 'Epidermal layers (superficial → deep)',
          phrase: 'Come, Let’s Get Sun Burned',
          items: [
            ['C', 'Stratum corneum — dead keratinised cells'],
            ['L', 'Stratum lucidum — only in thick skin (palms, soles)'],
            ['G', 'Stratum granulosum — keratohyalin granules'],
            ['S', 'Stratum spinosum — desmosomes, Langerhans cells'],
            ['B', 'Stratum basale — stem cells, **melanocytes**, Merkel cells'],
          ],
        },
        {
          t: 'table',
          title: 'Burns — rule of nines (adult)',
          head: ['Region', '% body surface'],
          rows: [
            ['Head and neck', '9'],
            ['Each upper limb', '9'],
            ['Front of trunk', '18'],
            ['Back of trunk', '18'],
            ['Each lower limb', '18'],
            ['Perineum', '1'],
          ],
        },
        {
          t: 'table',
          title: 'Burn depth',
          head: ['Depth', 'Appearance', 'Pain', 'Healing'],
          rows: [
            ['Superficial (epidermal)', 'Red, dry, no blisters', 'Painful', 'Days, no scar'],
            ['Superficial partial thickness', 'Blisters, moist pink, blanches', 'Very painful', '~2 weeks'],
            ['Deep partial thickness', 'Blotchy red/white, does not blanch well', 'Less painful', 'Weeks; scars — often grafted'],
            ['Full thickness', 'White, leathery or charred', '**Painless** (nerve endings destroyed)', 'Needs grafting'],
          ],
        },
      ],
    },
    {
      id: 'revision',
      title: 'Rapid revision',
      blocks: [
        {
          t: 'highyield',
          items: [
            '**Langer’s (cleavage) lines** — incisions along them heal with finer scars.',
            'Skin colour differences come from melanin **amount and type**, not melanocyte number.',
            'Children’s rule of nines differs — the head is relatively larger (use a Lund–Browder chart).',
          ],
        },
      ],
    },
  ],
};

/** New regional guides that pull the musculoskeletal and nerve content together the way exams test it. */
export const REGIONAL_TOPICS: Topic[] = [
  {
    id: 'upper-limb',
    title: 'Upper limb — applied anatomy',
    system: 'muscular',
    parent: 'muscular',
    tagline: 'Compartments, spaces, joints and the nerve injuries that define upper-limb clinical anatomy.',
    focus: { male: 'Right biceps brachii' },
    match: /deltoid|biceps|triceps|brachialis|pectoralis|latissimus|rotator|supraspinatus|infraspinatus|teres|subscapularis|forearm|hand|carpal|humerus|radius|ulna|scapula|clavicle/i,
    minutes: 9,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'The upper limb is built for **mobility**: a shoulder girdle attached to the trunk only at the **sternoclavicular joint**, a highly mobile shoulder, a hinged elbow, a rotating forearm and a dexterous hand.' },
          { t: 'figure', caption: 'Biceps brachii — anterior compartment of the arm.', target: { male: 'Right biceps brachii' } },
          {
            t: 'table',
            title: 'Regions and their nerves',
            head: ['Compartment', 'Main action', 'Nerve'],
            rows: [
              ['Anterior arm', 'Elbow flexion', 'Musculocutaneous'],
              ['Posterior arm', 'Elbow extension', 'Radial'],
              ['Anterior forearm', 'Wrist/finger flexion, pronation', 'Median (+ ulnar for FCU and medial half of FDP)'],
              ['Posterior forearm', 'Wrist/finger extension, supination', 'Radial (posterior interosseous)'],
              ['Hand (intrinsics)', 'Fine movements', 'Ulnar (most), median (LOAF)'],
            ],
          },
        ],
      },
      {
        id: 'structure',
        title: 'Spaces and tunnels',
        blocks: [
          {
            t: 'relations',
            title: 'Cubital fossa — contents lateral → medial (“TAN”)',
            center: 'Cubital fossa',
            sides: {
              superior: 'Imaginary line between the humeral epicondyles',
              lateral: 'Brachioradialis; **biceps Tendon** is the most lateral content (radial nerve deep to brachioradialis)',
              medial: 'Pronator teres; **median Nerve** is the most medial content',
              anterior: 'Roof: bicipital aponeurosis and median cubital vein (venepuncture)',
              inferior: 'Apex where brachioradialis meets pronator teres',
              posterior: 'Floor: brachialis and supinator; **brachial Artery** between tendon and nerve',
            },
          },
          {
            t: 'table',
            title: 'Carpal tunnel vs anatomical snuffbox',
            head: ['', 'Carpal tunnel', 'Anatomical snuffbox'],
            rows: [
              ['Boundaries', 'Carpal bones (floor) + **flexor retinaculum** (roof)', 'Lateral: APL + EPB tendons. Medial: EPL tendon'],
              ['Contents', '**Median nerve** + 9 tendons (FDS ×4, FDP ×4, FPL)', '**Radial artery** on the floor (scaphoid, trapezium); cephalic vein begins here'],
              ['Clinical', 'Carpal tunnel syndrome: thenar wasting, night paraesthesia (lateral 3½ digits); **palmar cutaneous branch spared** (passes superficial to the retinaculum)', 'Tenderness = **scaphoid fracture** until proven otherwise'],
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Joints and movements',
        blocks: [
          {
            t: 'table',
            head: ['Movement', 'Main muscles', 'Nerve'],
            rows: [
              ['Shoulder abduction 0–15°', 'Supraspinatus', 'Suprascapular'],
              ['Shoulder abduction 15–90°', 'Deltoid', 'Axillary'],
              ['Abduction > 90°', 'Trapezius + serratus anterior (rotate the scapula)', 'CN XI + long thoracic'],
              ['Elbow flexion', 'Biceps, brachialis, brachioradialis', 'Musculocutaneous, radial'],
              ['Supination', 'Biceps (strongest), supinator', 'Musculocutaneous, radial'],
              ['Pronation', 'Pronator teres, pronator quadratus', 'Median (AIN for quadratus)'],
            ],
          },
          { t: 'callout', tone: 'remember', text: 'The shoulder (glenohumeral joint) trades stability for mobility — it dislocates most often **anteroinferiorly**, endangering the **axillary nerve**.' },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'compare',
            title: 'Claw hand vs hand of benediction',
            cols: ['Ulnar claw (lesion at wrist)', 'Hand of benediction (median lesion at elbow)'],
            rows: [
              ['When seen', 'At rest', 'When trying to make a **fist**'],
              ['Fingers affected', 'Ring and little fingers clawed (MCP extended, IP flexed)', 'Index and middle fingers stay extended'],
              ['Why', 'Lumbricals 3–4 and interossei paralysed', 'FDS and lateral FDP paralysed'],
            ],
          },
          { t: 'callout', tone: 'pitfall', title: 'Ulnar paradox', text: 'A **distal** (wrist) ulnar lesion causes a **worse** claw than a proximal (elbow) lesion — a high lesion also paralyses the medial FDP, so the fingers cannot flex at the IP joints.' },
        ],
      },
      {
        id: 'key',
        title: 'Key points to remember',
        blocks: [
          {
            t: 'highyield',
            items: [
              'Axillary (surgical neck), radial (spiral groove), ulnar (medial epicondyle), median (supracondylar / carpal tunnel).',
              'Musculocutaneous = **BBC**; median in the hand = **LOAF**; posterior cord = **STAR**.',
              'Rotator cuff = **SITS**; supraspinatus most often torn (painful arc 60–120°).',
              'Cubital fossa lateral → medial: Tendon, Artery, Nerve.',
            ],
          },
        ],
      },
    ],
    quiz: [],
    refs: [os('11.5 Muscles of the Pectoral Girdle and Upper Limbs'), os('8.2 Bones of the Upper Limb'), sp('Anatomy, Shoulder and Upper Limb, Brachial Plexus'), sp('Carpal Tunnel Syndrome')],
  },
  {
    id: 'lower-limb',
    title: 'Lower limb — applied anatomy',
    system: 'muscular',
    parent: 'muscular',
    tagline: 'Weight-bearing anatomy: hip and knee, the femoral triangle, compartments and common nerve injuries.',
    focus: { male: 'Right rectus femoris', female: 'Right rectus femoris' },
    match: /glute|femoris|vastus|sartorius|gracilis|adductor|hamstring|semitendinosus|semimembranosus|gastrocnemius|soleus|tibialis|fibularis|peroneus|femur|tibia|fibula|patella|hip bone/i,
    minutes: 9,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'The lower limb is built for **stability and locomotion**: a deep hip socket, a strong ligament-braced knee and an arched foot transmit body weight to the ground.' },
          { t: 'figure', caption: 'Rectus femoris — the part of quadriceps that crosses both hip and knee.', target: { male: 'Right rectus femoris', female: 'Right rectus femoris' } },
          {
            t: 'table',
            title: 'Compartments and nerves',
            head: ['Compartment', 'Main action', 'Nerve'],
            rows: [
              ['Anterior thigh', 'Knee extension (quadriceps)', 'Femoral'],
              ['Medial thigh', 'Hip adduction', 'Obturator'],
              ['Posterior thigh', 'Hip extension, knee flexion (hamstrings)', 'Sciatic (tibial part)'],
              ['Anterior leg', 'Dorsiflexion, toe extension', 'Deep fibular'],
              ['Lateral leg', 'Eversion', 'Superficial fibular'],
              ['Posterior leg', 'Plantarflexion, toe flexion', 'Tibial'],
            ],
          },
        ],
      },
      {
        id: 'structure',
        title: 'Spaces and tunnels',
        blocks: [
          {
            t: 'relations',
            title: 'Femoral triangle',
            center: 'Femoral triangle',
            sides: {
              superior: 'Base: **inguinal ligament**',
              lateral: 'Medial border of **sartorius**',
              medial: 'Medial border of **adductor longus**',
              posterior: 'Floor: iliopsoas, pectineus, adductor longus',
              anterior: 'Roof: fascia lata with the saphenous opening (great saphenous vein joins the femoral vein)',
            },
          },
          {
            t: 'mnemonic',
            title: 'Femoral triangle contents, lateral → medial',
            phrase: 'NAVEL',
            items: [
              ['N', 'Femoral Nerve (outside the femoral sheath)'],
              ['A', 'Femoral Artery — pulse at the mid-inguinal point'],
              ['V', 'Femoral Vein — central line access just medial to the pulse'],
              ['E', 'Empty space (femoral canal) — site of femoral hernia'],
              ['L', 'Lymphatics (node of Cloquet)'],
            ],
          },
          {
            t: 'mnemonic',
            title: 'Tarsal tunnel (behind the medial malleolus), anterior → posterior',
            phrase: 'Tom, Dick And Very Nervous Harry',
            items: [
              ['T', 'Tibialis posterior'],
              ['D', 'Flexor digitorum longus'],
              ['A', 'Posterior tibial artery'],
              ['V', 'Posterior tibial vein'],
              ['N', 'Tibial nerve'],
              ['H', 'Flexor hallucis longus'],
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Hip and knee',
        blocks: [
          {
            t: 'table',
            title: 'Knee stabilisers',
            head: ['Structure', 'Prevents', 'Test'],
            rows: [
              ['**Anterior cruciate**', 'Anterior displacement of the tibia on the femur', 'Anterior drawer, Lachman'],
              ['**Posterior cruciate**', 'Posterior displacement of the tibia', 'Posterior drawer, sag sign'],
              ['Medial collateral', 'Valgus stress (attached to the medial meniscus)', 'Valgus stress test'],
              ['Lateral collateral', 'Varus stress', 'Varus stress test'],
              ['Menisci', 'Load sharing, congruity', 'McMurray; joint-line tenderness'],
            ],
          },
          { t: 'callout', tone: 'clinical', title: 'Unhappy triad', text: 'A blow to the lateral side of the knee can tear the **ACL, MCL and medial meniscus** together (the medial meniscus is fixed to the MCL).' },
          { t: 'callout', tone: 'remember', title: 'Trendelenburg sign', text: 'Gluteus medius and minimus (superior gluteal nerve) hold the pelvis level when standing on one leg. If they fail, the pelvis **drops on the opposite (unsupported) side**.' },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'table',
            head: ['Situation', 'Structure at risk'],
            rows: [
              ['Intramuscular gluteal injection', 'Sciatic nerve → use the **upper outer quadrant** (or ventrogluteal site)'],
              ['Fibular neck fracture / tight cast', 'Common fibular nerve → foot drop'],
              ['Intracapsular femoral neck fracture', 'Medial circumflex femoral artery → avascular necrosis'],
              ['Posterior hip dislocation (dashboard injury)', 'Sciatic nerve; limb short, flexed, adducted, medially rotated'],
              ['Varicose veins', 'Incompetent valves in the great/small saphenous veins and perforators'],
            ],
          },
          { t: 'callout', tone: 'pitfall', text: 'Femoral **hernia** emerges **below and lateral** to the pubic tubercle; inguinal hernia **above and medial** to it.' },
        ],
      },
      {
        id: 'key',
        title: 'Key points to remember',
        blocks: [
          {
            t: 'highyield',
            items: [
              'Femoral triangle lateral → medial: **NAVEL**.',
              'Tarsal tunnel: **Tom, Dick And Very Nervous Harry**.',
              'Pes anserinus: **Say Grace before Tea**.',
              'Knee jerk L3–L4 (femoral); ankle jerk S1–S2 (tibial).',
              'Great saphenous vein passes **in front of the medial malleolus** (cut-down site); small saphenous vein behind the lateral malleolus.',
            ],
          },
        ],
      },
    ],
    quiz: [],
    refs: [os('11.6 Appendicular Muscles of the Pelvic Girdle and Lower Limbs'), os('8.4 Bones of the Lower Limb'), sp('Anatomy, Bony Pelvis and Lower Limb, Femoral Triangle'), sp('Anatomy, Bony Pelvis and Lower Limb, Knee')],
  },
];
