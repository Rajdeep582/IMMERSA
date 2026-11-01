import { os, sp } from '../../data/references';
import type { Topic } from '../types';

export const NERVOUS_TOPICS: Topic[] = [
  {
    id: 'nervous',
    title: 'Nervous system',
    system: 'nervous',
    tagline: 'The body’s fast control network: it senses change, integrates information and commands muscles and glands.',
    focus: { male: 'sys:nervous', female: 'sys:nervous' },
    minutes: 7,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'A network of **neurons** (signalling cells) and **glia** (support cells) that carries electrical and chemical signals in milliseconds.' },
          {
            t: 'bullets',
            items: [
              '**Central nervous system (CNS)** — [[Brain]] in the cranial cavity and [[Spinal cord]] in the vertebral canal, protected by bone, **meninges** and **cerebrospinal fluid (CSF)**.',
              '**Peripheral nervous system (PNS)** — everything outside the CNS: **12 pairs of cranial nerves**, **31 pairs of spinal nerves**, their plexuses, branches and ganglia, reaching every tissue.',
            ],
          },
          { t: 'figure', caption: 'Complete nervous system in this model: brain, spinal cord, cranial nerves, plexuses and peripheral branches. Drag to rotate.', target: { male: 'sys:nervous', female: 'sys:nervous' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          {
            t: 'tree',
            title: 'Organisation of the nervous system',
            root: {
              label: 'Nervous system',
              children: [
                { label: 'CNS', children: [{ label: 'Brain', note: 'cerebrum · diencephalon · brainstem · cerebellum' }, { label: 'Spinal cord', note: '31 segments' }] },
                {
                  label: 'PNS',
                  children: [
                    { label: 'Sensory (afferent)', note: 'receptors → CNS' },
                    {
                      label: 'Motor (efferent)',
                      children: [
                        { label: 'Somatic', note: 'skeletal muscle, voluntary' },
                        { label: 'Autonomic', note: 'sympathetic · parasympathetic', children: [] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          {
            t: 'bullets',
            items: [
              '**Neuron** — dendrites receive input, the **cell body (soma)** integrates it, the **axon** conducts the action potential to the axon terminals.',
              '**Glia (CNS)** — astrocytes (support, blood–brain barrier), **oligodendrocytes** (myelin), microglia (immune defence), ependymal cells (line ventricles, help make CSF).',
              '**Glia (PNS)** — **Schwann cells** (myelin) and satellite cells (surround ganglion cell bodies).',
              '**Grey matter** = cell bodies and synapses; **white matter** = myelinated axon tracts.',
              '**Nerve** = bundle of axons in the PNS; **tract** = bundle in the CNS. **Ganglion** = cluster of cell bodies in the PNS; **nucleus** = cluster in the CNS.',
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Main functions and how it works',
        blocks: [
          {
            t: 'steps',
            items: [
              '**Sensory input** — receptors detect a stimulus and sensory (afferent) neurons carry it to the CNS.',
              '**Integration** — interneurons in the brain or spinal cord process the input and choose a response.',
              '**Motor output** — motor (efferent) neurons activate **effectors**: skeletal muscle (somatic) or smooth muscle, cardiac muscle and glands (autonomic).',
            ],
          },
          {
            t: 'flow',
            title: 'Reflex arc (e.g. knee-jerk)',
            steps: [
              { label: 'Receptor', note: 'muscle spindle stretched' },
              { label: 'Sensory neuron', note: 'via dorsal root' },
              { label: 'Integration centre', note: 'spinal cord grey matter' },
              { label: 'Motor neuron', note: 'via ventral root' },
              { label: 'Effector', note: 'quadriceps contracts' },
            ],
          },
          {
            t: 'bullets',
            items: [
              'Signals travel along axons as **action potentials**; **myelin** makes conduction faster (saltatory conduction between nodes of Ranvier).',
              'At a **synapse**, neurotransmitters (e.g. acetylcholine, glutamate, GABA, noradrenaline) cross the cleft and excite or inhibit the next cell.',
            ],
          },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'table',
            head: ['Condition', 'What happens', 'Why it matters'],
            rows: [
              ['**Stroke**', 'Blocked (ischaemic) or ruptured (haemorrhagic) brain artery', 'Sudden focal deficit; treatment is time-critical'],
              ['**Spinal cord injury**', 'Loss of function below the injured segment', 'Lesions at or above C3–C5 can stop breathing (phrenic nerve)'],
              ['**Peripheral neuropathy**', 'Damage to peripheral nerves, most often from diabetes', 'Typical “stocking-glove” sensory loss, foot ulcers'],
              ['**Multiple sclerosis**', 'Autoimmune demyelination in the CNS', 'Relapsing visual, sensory and motor episodes'],
              ['**Guillain–Barré syndrome**', 'Acute demyelination of peripheral nerves', 'Ascending weakness; may need ventilation'],
            ],
          },
          { t: 'callout', tone: 'clinical', title: 'Lumbar puncture', text: 'CSF is sampled below the end of the spinal cord, usually at **L3–L4 or L4–L5**. A line joining the top of the iliac crests crosses about **L4**.' },
        ],
      },
      {
        id: 'key',
        title: 'Key points to remember',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**12 cranial + 31 spinal nerve pairs** (8 cervical, 12 thoracic, 5 lumbar, 5 sacral, 1 coccygeal).',
              'The adult spinal cord ends at **L1–L2** (conus medullaris); nerve roots below form the **cauda equina**.',
              'Myelin: **oligodendrocytes in the CNS**, **Schwann cells in the PNS** — only the PNS regenerates well.',
              'Sympathetic outflow is **thoracolumbar (T1–L2)**; parasympathetic is **craniosacral (CN III, VII, IX, X and S2–S4)**.',
              'Most motor and sensory pathways **cross the midline** — each hemisphere controls the opposite side of the body.',
            ],
          },
        ],
      },
    ],
    quiz: [
      { q: 'Which cells form myelin in the peripheral nervous system?', a: '**Schwann cells** (oligodendrocytes do this in the CNS).' },
      { q: 'At which vertebral level does the adult spinal cord usually end?', a: 'At **L1–L2** (conus medullaris).' },
      { q: 'Name the five parts of a reflex arc in order.', a: 'Receptor → sensory neuron → integration centre → motor neuron → effector.' },
      { q: 'How many pairs of spinal nerves are there?', a: '**31** — 8 cervical, 12 thoracic, 5 lumbar, 5 sacral, 1 coccygeal.' },
    ],
    refs: [os('12.1 Basic Structure and Function of the Nervous System'), os('12.2 Nervous Tissue'), os('13.4 The Peripheral Nervous System'), sp('Neuroanatomy, Central Nervous System'), sp('Neuroanatomy, Peripheral Nervous System')],
  },

  {
    id: 'brain',
    title: 'Brain',
    system: 'nervous',
    parent: 'nervous',
    tagline: 'The control centre of the CNS: perception, movement, memory, language, emotion and vital reflexes.',
    focus: { male: 'grp:nervous/brain', female: 'grp:nervous/brain' },
    match: /^grp:nervous\/brain|cerebr|cerebell|thalam|hypothal|pons|medulla|midbrain|gyrus|lobe|ventricle|hippocamp|callosum|putamen|caudate|colliculus|amygdal/i,
    minutes: 7,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'The brain (about **1.3–1.4 kg** in adults) fills the **cranial cavity** and is continuous with the spinal cord at the **foramen magnum**.' },
          { t: 'figure', caption: 'Brain regions as modelled — select a lobe, nucleus or ventricle to read about it.', target: { male: 'grp:nervous/brain', female: 'grp:nervous/brain' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          {
            t: 'table',
            head: ['Part', 'Main components', 'Core role'],
            rows: [
              ['**Cerebrum**', 'Two hemispheres joined by the [[Corpus callosum]]; cortex folded into gyri and sulci', 'Conscious thought, perception, voluntary movement'],
              ['**Diencephalon**', '[[Thalamus]], [[Hypothalamus]], epithalamus (pineal)', 'Sensory relay; homeostasis and pituitary control'],
              ['**Brainstem**', '[[Midbrain]], [[Pons]], [[Medulla oblongata]]', 'Vital centres (breathing, heart rate); nuclei of CN III–XII'],
              ['**Cerebellum**', 'Two hemispheres and the vermis', 'Coordination, balance, motor learning'],
            ],
          },
          {
            t: 'table',
            title: 'Lobes of the cerebral cortex',
            head: ['Lobe', 'Key areas', 'Function'],
            rows: [
              ['**Frontal**', '[[Precentral gyrus]] (primary motor cortex); **Broca’s area** (usually left)', 'Voluntary movement, speech production, planning, personality'],
              ['**Parietal**', '[[Postcentral gyrus]] (primary somatosensory cortex)', 'Touch, body position, spatial awareness'],
              ['**Temporal**', 'Primary auditory cortex; **Wernicke’s area**; [[Hippocampus]] (medial)', 'Hearing, language comprehension, memory'],
              ['**Occipital**', 'Primary visual cortex (around the calcarine sulcus)', 'Vision'],
            ],
          },
          {
            t: 'layers',
            title: 'Meninges (outside → in)',
            layers: [
              { name: 'Dura mater', note: 'tough outer layer; forms dural venous sinuses, falx cerebri and tentorium cerebelli' },
              { name: 'Arachnoid mater', note: 'delicate middle layer; **subarachnoid space** below it holds CSF' },
              { name: 'Pia mater', note: 'thin layer adherent to the brain surface' },
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Main functions and how it works',
        blocks: [
          {
            t: 'flow',
            title: 'CSF circulation',
            steps: [
              { label: 'Choroid plexus', note: 'secretes ~500 mL/day' },
              { label: '[[Lateral ventricle|Lateral ventricles]]' },
              { label: 'Third ventricle', note: 'via interventricular foramina' },
              { label: 'Cerebral aqueduct' },
              { label: 'Fourth ventricle' },
              { label: 'Subarachnoid space', note: 'via median and lateral apertures' },
              { label: 'Arachnoid granulations', note: 'drain to venous sinuses' },
            ],
          },
          {
            t: 'bullets',
            items: [
              '**Contralateral control** — the left hemisphere controls and senses the right side of the body, and vice versa.',
              '**Blood supply** — internal carotid and vertebral arteries join in the **circle of Willis** at the base of the brain.',
              'The **blood–brain barrier** (tight junctions of brain capillaries, supported by astrocytes) limits what enters brain tissue.',
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
              '**Middle cerebral artery stroke** — contralateral weakness and sensory loss of face and arm; aphasia if the dominant hemisphere is affected.',
              '**Extradural haematoma** — usually a torn middle meningeal artery after temporal skull fracture; a “lucid interval” may precede rapid deterioration.',
              '**Subdural haematoma** — torn bridging veins; often slow, especially in older adults.',
              '**Hydrocephalus** — CSF builds up when its flow or absorption is blocked.',
              '**Parkinson’s disease** — loss of dopamine neurons in the substantia nigra of the midbrain: tremor, rigidity, slow movement.',
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
              'Four parts: **cerebrum, diencephalon, brainstem, cerebellum**.',
              'Motor cortex = **precentral gyrus**; sensory cortex = **postcentral gyrus** (separated by the central sulcus).',
              'Speech: **Broca = production** (frontal), **Wernicke = comprehension** (temporal).',
              'CSF: made by **choroid plexus**, absorbed by **arachnoid granulations**; total volume about **150 mL**.',
              'Breathing and heart-rate centres sit in the **medulla oblongata**.',
            ],
          },
        ],
      },
    ],
    quiz: [
      { q: 'Which gyrus contains the primary motor cortex?', a: 'The **precentral gyrus** of the frontal lobe.' },
      { q: 'Trace CSF from the lateral ventricles to the fourth ventricle.', a: 'Lateral ventricles → interventricular foramina → third ventricle → cerebral aqueduct → fourth ventricle.' },
      { q: 'Damage to which area causes fluent speech with poor comprehension?', a: '**Wernicke’s area** (posterior temporal lobe).' },
    ],
    refs: [os('13.2 The Central Nervous System'), os('13.3 Circulation and the Central Nervous System'), sp('Neuroanatomy, Brain'), sp('Physiology, Cerebral Spinal Fluid')],
  },

  {
    id: 'spinal-cord',
    title: 'Spinal cord',
    system: 'nervous',
    parent: 'nervous',
    tagline: 'The CNS highway between brain and body, and the integration centre for spinal reflexes.',
    focus: { male: 'grp:nervous/spinal-cord', female: 'grp:nervous/spinal-cord' },
    match: /^grp:nervous\/spinal-cord|spinal cord|segment|cauda equina|root of spinal/i,
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          {
            t: 'bullets',
            items: [
              'Extends from the **foramen magnum** (continuous with the medulla) to about **L1–L2**, inside the vertebral canal — roughly **42–45 cm** long.',
              'Tapers into the **conus medullaris**; the **filum terminale** anchors it to the coccyx.',
              'Below the conus, lumbar and sacral roots descend as the [[Cauda equina]].',
            ],
          },
          { t: 'figure', caption: 'Spinal cord segments with spinal nerve roots and the cauda equina.', target: { male: 'grp:nervous/spinal-cord', female: 'grp:nervous/spinal-cord' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**31 segments**, each giving a pair of spinal nerves.',
              '**Cervical enlargement** (C4–T1) and **lumbar enlargement** (L2–S3) supply the limbs.',
              '**Grey matter** (central “butterfly”): **dorsal horn** = sensory, **ventral horn** = motor, **lateral horn** (T1–L2) = sympathetic neurons.',
              '**White matter** columns (dorsal, lateral, ventral) carry ascending and descending tracts.',
              '**Dorsal root** (sensory, with the dorsal root ganglion) + **ventral root** (motor) → mixed **spinal nerve**.',
            ],
          },
          {
            t: 'table',
            title: 'Major tracts',
            head: ['Tract', 'Carries', 'Crosses midline'],
            rows: [
              ['**Dorsal column–medial lemniscus**', 'Fine touch, vibration, proprioception', 'In the medulla'],
              ['**Spinothalamic**', 'Pain and temperature', 'Within 1–2 segments of entry'],
              ['**Lateral corticospinal**', 'Voluntary motor commands', 'Pyramidal decussation (medulla)'],
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Main functions and how it works',
        blocks: [
          {
            t: 'steps',
            items: [
              '**Conduction** — sensory information ascends to the brain; motor commands descend to ventral-horn motor neurons.',
              '**Reflex integration** — stretch and withdrawal reflexes are completed within the cord, without waiting for the brain.',
              '**Autonomic output** — sympathetic (T1–L2) and sacral parasympathetic (S2–S4) neurons start here.',
            ],
          },
          {
            t: 'table',
            title: 'Deep tendon reflexes and their roots',
            head: ['Reflex', 'Root level'],
            rows: [
              ['Biceps', 'C5–C6'],
              ['Triceps', 'C7'],
              ['Knee (patellar)', 'L3–L4'],
              ['Ankle (Achilles)', 'S1'],
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
              '**Brown-Séquard syndrome** (hemisection) — same-side loss of motor function and fine touch; opposite-side loss of pain and temperature.',
              '**Cauda equina syndrome** — saddle anaesthesia, bladder/bowel dysfunction and leg weakness; a surgical emergency.',
              '**Upper vs lower motor neuron lesions** — UMN: spasticity, brisk reflexes, upgoing plantar; LMN: flaccid weakness, wasting, absent reflexes.',
            ],
          },
          { t: 'callout', tone: 'remember', text: 'Vertebral and cord levels do not match below the neck — the cord is shorter than the column, so lower segments lie higher than their numbered vertebrae.' },
        ],
      },
      {
        id: 'key',
        title: 'Key points to remember',
        blocks: [
          {
            t: 'bullets',
            items: [
              'Ends at **L1–L2**; lumbar puncture at **L3–L4/L4–L5** avoids the cord.',
              '**Dorsal = sensory, ventral = motor** (roots and horns).',
              'Pain/temperature cross early; fine touch and motor tracts cross in the **medulla**.',
              'Reflexes: **C5–6 biceps, C7 triceps, L3–4 knee, S1 ankle**.',
            ],
          },
        ],
      },
    ],
    quiz: [
      { q: 'A hemisection of the cord on the right causes loss of pain sensation on which side?', a: 'The **left** (contralateral) side — the spinothalamic tract has already crossed.' },
      { q: 'Which horn of grey matter contains sympathetic neurons, and at which levels?', a: 'The **lateral horn**, from **T1 to L2**.' },
      { q: 'Which root level is tested by the ankle reflex?', a: '**S1**.' },
    ],
    refs: [os('13.2 The Central Nervous System'), os('14.2 Central Processing'), sp('Neuroanatomy, Spinal Cord'), sp('Cauda Equina Syndrome')],
  },

  {
    id: 'cranial-nerves',
    title: 'Cranial nerves',
    system: 'nervous',
    parent: 'peripheral-nerves',
    tagline: 'Twelve pairs of nerves that leave the brain directly and serve the head, neck and (via the vagus) the viscera.',
    focus: { male: 'grp:nervous/pns/cranial-nerves', female: 'grp:nervous/pns/cranial-nerves' },
    match: /cranial-nerves|olfactory nerve|optic nerve|oculomotor|trochlear|trigeminal|abducens|facial nerve|vestibul|cochlear|glossopharyngeal|vagus|accessory nerve|hypoglossal|alveolar|lingual nerve|mental nerve|buccal nerve|chorda tympani|maxillary nerve|ophthalmic nerve|mandibular nerve|ciliary|nasociliary|frontal nerve|lacrimal nerve|supra-orbital|supratrochlear|infratrochlear|ethmoidal/i,
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What they are and where they are',
        blocks: [
          { t: 'p', text: 'Cranial nerves are numbered **I–XII** from front to back in the order they leave the brain. I and II connect to the forebrain; **III–XII arise from the brainstem**.' },
          { t: 'figure', caption: 'Cranial nerves in this model (click a nerve to open its study card).', target: { male: 'grp:nervous/pns/cranial-nerves', female: 'grp:nervous/pns/cranial-nerves' } },
        ],
      },
      {
        id: 'structure',
        title: 'The twelve nerves',
        blocks: [
          {
            t: 'table',
            head: ['No.', 'Nerve', 'Type', 'Main function', 'Bedside test'],
            rows: [
              ['I', '[[Olfactory nerve (I)|Olfactory]]', 'Sensory', 'Smell', 'Identify a familiar smell, each nostril'],
              ['II', '[[Optic nerve (II)|Optic]]', 'Sensory', 'Vision', 'Acuity, visual fields, pupil light reflex (afferent)'],
              ['III', '[[Oculomotor nerve (III)|Oculomotor]]', 'Motor (+ parasympathetic)', 'Most eye movements, lid elevation, pupil constriction', 'Eye movements, pupil reflex (efferent)'],
              ['IV', '[[Trochlear nerve (IV)|Trochlear]]', 'Motor', 'Superior oblique (looks down and in)', 'Look down with the eye adducted'],
              ['V', '[[Trigeminal nerve (V)|Trigeminal]]', 'Both', 'Facial sensation (V1, V2, V3); chewing muscles (V3)', 'Light touch in 3 areas; clench jaw; corneal reflex (afferent)'],
              ['VI', '[[Abducens nerve (VI)|Abducens]]', 'Motor', 'Lateral rectus (abducts the eye)', 'Look laterally'],
              ['VII', '[[Facial nerve (VII)|Facial]]', 'Both (+ parasympathetic)', 'Facial expression; taste anterior ⅔ tongue; tears and saliva', 'Raise eyebrows, close eyes tightly, smile'],
              ['VIII', '[[Vestibulocochlear nerve (VIII)|Vestibulocochlear]]', 'Sensory', 'Hearing and balance', 'Whisper test, Rinne and Weber'],
              ['IX', '[[Glossopharyngeal nerve (IX)|Glossopharyngeal]]', 'Both (+ parasympathetic)', 'Taste/sensation posterior ⅓ tongue; parotid gland; gag (afferent)', 'Gag reflex'],
              ['X', '[[Vagus nerve (X)|Vagus]]', 'Both (+ parasympathetic)', 'Pharynx and larynx muscles; thoracic and abdominal viscera', 'Say “ah” — uvula stays central'],
              ['XI', '[[Accessory nerve (XI)|Accessory]]', 'Motor', 'Sternocleidomastoid and trapezius', 'Shrug shoulders, turn head against resistance'],
              ['XII', '[[Hypoglossal nerve (XII)|Hypoglossal]]', 'Motor', 'Tongue muscles', 'Protrude tongue — deviates toward a weak side'],
            ],
          },
          {
            t: 'table',
            title: 'Where they leave the skull',
            head: ['Opening', 'Nerves'],
            rows: [
              ['Cribriform plate', 'I'],
              ['Optic canal', 'II'],
              ['Superior orbital fissure', 'III, IV, V1, VI'],
              ['Foramen rotundum / foramen ovale', 'V2 / V3'],
              ['Internal acoustic meatus', 'VII, VIII (VII exits the skull at the stylomastoid foramen)'],
              ['Jugular foramen', 'IX, X, XI'],
              ['Hypoglossal canal', 'XII'],
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'How they work',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**Purely sensory:** I, II, VIII. **Purely motor:** III, IV, VI, XI, XII. **Mixed:** V, VII, IX, X.',
              '**Parasympathetic carriers:** III (pupil, lens), VII (lacrimal, submandibular, sublingual glands), IX (parotid), X (heart, lungs, gut to the left colic flexure).',
              'The **trigeminal** has three divisions: **ophthalmic (V1)**, **maxillary (V2)** — both sensory — and **mandibular (V3)**, which also supplies the muscles of mastication.',
            ],
          },
          { t: 'callout', tone: 'tip', title: 'Eye-muscle shortcut', text: '“**LR6 SO4**, the rest 3”: lateral rectus = VI, superior oblique = IV, all other extraocular muscles = III.' },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**Bell’s palsy (CN VII, lower motor neuron)** — the whole half of the face is weak, including the forehead. A **stroke (upper motor neuron)** spares the forehead.',
              '**Oculomotor palsy (CN III)** — eye “down and out”, ptosis, and a dilated pupil if the outer parasympathetic fibres are compressed (e.g. aneurysm).',
              '**Recurrent laryngeal nerve injury (CN X)** — hoarse voice; at risk in thyroid surgery. The left nerve loops under the aortic arch, the right under the subclavian artery.',
              '**Trigeminal neuralgia (CN V)** — brief, severe, electric facial pain, usually V2/V3.',
              '**Hypoglossal lesion (CN XII)** — the protruded tongue points **toward** the damaged side.',
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
              'Order: **Olfactory, Optic, Oculomotor, Trochlear, Trigeminal, Abducens, Facial, Vestibulocochlear, Glossopharyngeal, Vagus, Accessory, Hypoglossal**.',
              'Pupil light reflex: **afferent II, efferent III**. Corneal reflex: **afferent V1, efferent VII**.',
              'The vagus is the longest cranial nerve and carries most parasympathetic outflow.',
              'Taste: anterior ⅔ of the tongue **VII** (chorda tympani), posterior ⅓ **IX**.',
            ],
          },
        ],
      },
    ],
    quiz: [
      { q: 'Which cranial nerve supplies the lateral rectus?', a: '**CN VI (abducens)**.' },
      { q: 'A patient cannot wrinkle the forehead on the left and the whole left face droops. UMN or LMN?', a: '**Lower motor neuron** CN VII lesion (e.g. Bell’s palsy) — UMN lesions spare the forehead.' },
      { q: 'Which nerves pass through the jugular foramen?', a: '**IX, X and XI**.' },
    ],
    refs: [os('13.4 The Peripheral Nervous System'), os('16.3 The Cranial Nerve Exam'), sp('Neuroanatomy, Cranial Nerve'), sp('Bell Palsy')],
  },

  {
    id: 'peripheral-nerves',
    title: 'Spinal nerves and plexuses',
    system: 'nervous',
    parent: 'nervous',
    tagline: 'The 31 pairs of spinal nerves, the plexuses they form and the major nerves of the trunk and limbs.',
    focus: { male: 'grp:nervous/peripheral-nervous-system', female: 'grp:nervous/peripheral-nervous-system' },
    match: /grp:nervous\/peripheral|grp:nervous\/pns|plexus|nerve|rami|cord of brachial|trunk of brachial|division of/i,
    minutes: 8,
    sections: [
      {
        id: 'overview',
        title: 'What they are and where they are',
        blocks: [
          {
            t: 'bullets',
            items: [
              'Each **spinal nerve** forms where a dorsal (sensory) and ventral (motor) root join, and leaves the vertebral canal through an **intervertebral foramen**.',
              'It divides at once into a **dorsal ramus** (deep back muscles and skin of the back) and a **ventral ramus** (front and sides of the trunk, and the limbs).',
              'Ventral rami of the neck, arm and leg regions interweave into **plexuses**; those of **T2–T11** stay separate as the [[Intercostal nerves]].',
            ],
          },
          { t: 'figure', caption: 'Peripheral nerves: brachial and lumbosacral plexuses with their branches, intercostal nerves and sympathetic trunk.', target: { male: 'grp:nervous/peripheral-nervous-system', female: 'grp:nervous/peripheral-nervous-system' } },
        ],
      },
      {
        id: 'structure',
        title: 'Plexuses and their branches',
        blocks: [
          {
            t: 'table',
            head: ['Plexus', 'Roots', 'Key branches'],
            rows: [
              ['**Cervical**', 'C1–C4', '[[Phrenic nerve|**Phrenic nerve (C3–C5)**]] to the diaphragm; ansa cervicalis; skin of neck'],
              ['[[Brachial plexus|**Brachial**]]', 'C5–T1', '[[Musculocutaneous nerve|Musculocutaneous]], [[Axillary nerve|axillary]], [[Radial nerve|radial]], [[Median nerve|median]], [[Ulnar nerve|ulnar]]'],
              ['[[Lumbar plexus|**Lumbar**]]', 'L1–L4', '[[Femoral nerve|Femoral]], [[Obturator nerve|obturator]], [[Iliohypogastric nerve|iliohypogastric]], [[Ilio-inguinal nerve|ilio-inguinal]], [[Genitofemoral nerve|genitofemoral]]'],
              ['[[Sacral plexus|**Sacral**]]', 'L4–S4', '[[Sciatic nerve|Sciatic]] (→ tibial + common fibular), pudendal, gluteal nerves'],
            ],
          },
          {
            t: 'flow',
            title: 'Brachial plexus, proximal → distal',
            steps: [
              { label: 'Roots', note: 'C5, C6, C7, C8, T1' },
              { label: 'Trunks', note: 'superior · middle · inferior' },
              { label: 'Divisions', note: 'anterior · posterior' },
              { label: 'Cords', note: 'lateral · posterior · medial (named around the axillary artery)' },
              { label: 'Terminal branches', note: 'musculocutaneous · axillary · radial · median · ulnar' },
            ],
          },
          { t: 'callout', tone: 'tip', title: 'Mnemonic', text: '“**Read That Damn Cadaver Book**” — the first letters give the order: roots, trunks, divisions, cords, branches.' },
        ],
      },
      {
        id: 'function',
        title: 'Major nerves and what they do',
        blocks: [
          {
            t: 'table',
            head: ['Nerve', 'Roots', 'Main motor supply', 'Skin area'],
            rows: [
              ['[[Axillary nerve|Axillary]]', 'C5–C6', 'Deltoid, teres minor', 'Over the lower deltoid (“regimental badge”)'],
              ['[[Musculocutaneous nerve|Musculocutaneous]]', 'C5–C7', 'Biceps, brachialis, coracobrachialis', 'Lateral forearm'],
              ['[[Radial nerve|Radial]]', 'C5–T1', 'Triceps; wrist and finger extensors', 'Back of arm/forearm; radial dorsum of hand'],
              ['[[Median nerve|Median]]', 'C6–T1', 'Most forearm flexors; thenar muscles', 'Palmar lateral 3½ digits'],
              ['[[Ulnar nerve|Ulnar]]', 'C8–T1', 'Most small hand muscles; FCU, medial FDP', 'Medial 1½ digits'],
              ['[[Femoral nerve|Femoral]]', 'L2–L4', 'Quadriceps, iliacus, sartorius', 'Anterior thigh; medial leg (saphenous)'],
              ['[[Obturator nerve|Obturator]]', 'L2–L4', 'Thigh adductors', 'Medial thigh'],
              ['[[Sciatic nerve|Sciatic]]', 'L4–S3', 'Hamstrings; everything below the knee via its branches', 'Most of leg and foot'],
              ['[[Tibial nerve|Tibial]]', 'L4–S3', 'Calf muscles, sole of foot', 'Sole'],
              ['[[Common fibular nerve|Common fibular]]', 'L4–S2', 'Ankle and toe extensors, foot evertors', 'Lateral leg, dorsum of foot'],
            ],
          },
          {
            t: 'table',
            title: 'Dermatome landmarks',
            head: ['Level', 'Skin area'],
            rows: [
              ['C6', 'Thumb'],
              ['C7', 'Middle finger'],
              ['C8', 'Little finger'],
              ['T4', 'Nipple'],
              ['T10', 'Umbilicus'],
              ['L1', 'Inguinal region'],
              ['L4', 'Medial leg and knee'],
              ['L5', 'Dorsum of foot, big toe'],
              ['S1', 'Lateral foot and sole'],
            ],
          },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'table',
            head: ['Injury', 'Typical cause', 'Classic sign'],
            rows: [
              ['**Axillary nerve**', 'Shoulder dislocation; surgical-neck fracture', 'Weak abduction, numb badge area'],
              ['**Radial nerve**', 'Mid-shaft humerus fracture (radial groove)', '**Wrist drop**'],
              ['**Median nerve**', '**Carpal tunnel syndrome**; supracondylar fracture', 'Night tingling of lateral fingers; thenar wasting'],
              ['**Ulnar nerve**', 'Elbow (medial epicondyle) or wrist injury', '**Claw hand**, weak finger spreading'],
              ['**Common fibular**', 'Fracture or pressure at the fibular neck', '**Foot drop**, high-stepping gait'],
              ['**Sciatic nerve**', 'Posterior hip dislocation; misplaced buttock injection', 'Weak knee flexion and all movement below the knee'],
            ],
          },
          { t: 'callout', tone: 'clinical', title: 'Safe gluteal injection', text: 'Use the **upper outer quadrant** of the buttock to stay clear of the sciatic nerve.' },
        ],
      },
      {
        id: 'key',
        title: 'Key points to remember',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**C3, 4, 5 keep the diaphragm alive** (phrenic nerve).',
              'Brachial plexus **C5–T1**; lumbar **L1–L4**; sacral **L4–S4**.',
              'Radial = **extensors** (wrist drop); median = **carpal tunnel**; ulnar = **claw hand**; common fibular = **foot drop**.',
              'The sciatic nerve is the **largest nerve** in the body and splits into tibial and common fibular nerves, usually above the knee.',
              'Intercostal nerves run in the **costal groove** below each rib (vein–artery–nerve, top to bottom).',
            ],
          },
        ],
      },
    ],
    quiz: [
      { q: 'A fracture through the middle of the humerus causes wrist drop. Which nerve?', a: 'The **radial nerve**, which lies in the radial groove.' },
      { q: 'Name the brachial plexus terminal branches.', a: 'Musculocutaneous, axillary, radial, median and ulnar.' },
      { q: 'Which dermatome lies at the umbilicus?', a: '**T10**.' },
      { q: 'Foot drop after a blow to the side of the knee suggests injury to which nerve?', a: 'The **common fibular nerve** at the fibular neck.' },
    ],
    refs: [os('13.4 The Peripheral Nervous System'), sp('Anatomy, Shoulder and Upper Limb, Brachial Plexus'), sp('Anatomy, Bony Pelvis and Lower Limb, Sciatic Nerve'), sp('Carpal Tunnel Syndrome')],
  },

  {
    id: 'autonomic',
    title: 'Autonomic nervous system',
    system: 'nervous',
    parent: 'nervous',
    tagline: 'Involuntary control of heart, smooth muscle and glands through two balancing divisions.',
    focus: { male: 'grp:nervous/pns/autonomic-nervous-system', female: 'grp:nervous/pns/autonomic-nervous-system' },
    match: /autonomic|sympathetic/i,
    minutes: 5,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          {
            t: 'bullets',
            items: [
              'The motor division that runs internal organs **without conscious control**.',
              'Uses a **two-neuron chain**: a preganglionic neuron in the CNS synapses in an autonomic ganglion with a postganglionic neuron that reaches the target.',
              'The [[Sympathetic trunk]] — a chain of ganglia — runs on each side of the vertebral column from the neck to the coccyx.',
            ],
          },
          { t: 'figure', caption: 'Sympathetic trunks beside the vertebral column (with the vagus nerves as the main parasympathetic pathway).', target: { male: 'grp:nervous/pns/autonomic-nervous-system', female: 'grp:nervous/pns/autonomic-nervous-system' } },
        ],
      },
      {
        id: 'structure',
        title: 'Two divisions compared',
        blocks: [
          {
            t: 'table',
            head: ['', 'Sympathetic', 'Parasympathetic'],
            rows: [
              ['Origin', '**Thoracolumbar** — lateral horn T1–L2', '**Craniosacral** — CN III, VII, IX, X; S2–S4'],
              ['Ganglia', 'Near the spine: sympathetic trunk, prevertebral (coeliac, mesenteric)', 'Near or in the target organ'],
              ['Fibre length', 'Short pre-, long postganglionic', 'Long pre-, short postganglionic'],
              ['Transmitters', 'ACh → **noradrenaline** (ACh at sweat glands)', 'ACh → **ACh** (muscarinic receptors)'],
              ['Overall effect', '“**Fight or flight**”', '“**Rest and digest**”'],
            ],
          },
        ],
      },
      {
        id: 'function',
        title: 'Effects on organs',
        blocks: [
          {
            t: 'table',
            head: ['Organ', 'Sympathetic', 'Parasympathetic'],
            rows: [
              ['Pupil', 'Dilates (mydriasis)', 'Constricts (miosis)'],
              ['Heart', '↑ rate and force', '↓ rate'],
              ['Airways', 'Bronchodilation', 'Bronchoconstriction, ↑ secretions'],
              ['Gut', '↓ motility and secretion', '↑ motility and secretion'],
              ['Bladder', 'Relaxes wall, holds urine', 'Contracts wall, empties bladder'],
              ['Liver', 'Glycogen breakdown → ↑ glucose', '—'],
            ],
          },
          { t: 'callout', tone: 'remember', text: 'The **adrenal medulla** acts like a modified sympathetic ganglion: preganglionic fibres stimulate it to release **adrenaline** into the blood.' },
        ],
      },
      {
        id: 'clinical',
        title: 'Clinical significance',
        blocks: [
          {
            t: 'bullets',
            items: [
              '**Horner syndrome** — ptosis, miosis and loss of facial sweating on one side, from interrupted sympathetic supply (e.g. apical lung tumour, carotid dissection).',
              '**Vasovagal syncope** — a surge of vagal activity slows the heart and drops blood pressure, causing fainting.',
              'Drugs act on these pathways: **beta-blockers** slow the heart; **atropine** blocks muscarinic receptors (raises heart rate, dries secretions).',
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
              'Sympathetic **T1–L2**, parasympathetic **cranial nerves III, VII, IX, X + S2–S4**.',
              'All preganglionic fibres release **acetylcholine**.',
              'The vagus carries about three-quarters of parasympathetic outflow.',
            ],
          },
        ],
      },
    ],
    quiz: [
      { q: 'Which neurotransmitter do most sympathetic postganglionic fibres release?', a: '**Noradrenaline** (sweat glands are the main exception — acetylcholine).' },
      { q: 'List the three signs of Horner syndrome.', a: 'Ptosis, miosis and anhidrosis on the affected side.' },
    ],
    refs: [os('15.1 Divisions of the Autonomic Nervous System'), sp('Physiology, Autonomic Nervous System'), sp('Horner Syndrome')],
  },
];
