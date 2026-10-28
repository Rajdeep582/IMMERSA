import { SystemDefinition, SystemId } from '../types/anatomy';

export const ANATOMICAL_SYSTEMS: SystemDefinition[] = [
  {
    id: 'skeletal',
    name: 'Skeletal System',
    category: 'Structural',
    color: '#e8dfcb',
    pbr: { metalness: 0.04, roughness: 0.58 },
    description: 'Forms the rigid architectural framework of the human body, protects delicate internal organs, facilitates biomechanical leverage, and acts as the primary reservoir for calcium and hematopoiesis (marrow blood cell production).'
  },
  {
    id: 'muscular',
    name: 'Muscular System',
    category: 'Structural',
    color: '#b5534b',
    pbr: { metalness: 0.04, roughness: 0.58 },
    description: 'Composed of over 600 skeletal muscles that convert chemical energy into mechanical force, driving locomotion, postural stabilization, and thermal homeostasis via thermogenesis.'
  },
  {
    id: 'cardiac',
    name: 'Heart & Chambers',
    category: 'Circulatory',
    color: '#c93b3b',
    pbr: { metalness: 0.1, roughness: 0.4 },
    description: 'The four-chambered electromechanical pump driving continuous dual-circuit blood circulation (pulmonary and systemic), sustaining cellular oxygenation and systemic perfusion.'
  },
  {
    id: 'arterial',
    name: 'Arterial Vasculature',
    category: 'Circulatory',
    color: '#d62828',
    pbr: { metalness: 0.15, roughness: 0.38 },
    description: 'High-pressure muscular and elastic conduits originating at the aortic root, distributing oxygenated blood and metabolic nutrients downstream to microvascular capillary beds.'
  },
  {
    id: 'venous',
    name: 'Venous Vasculature',
    category: 'Circulatory',
    color: '#3a7ca5',
    pbr: { metalness: 0.12, roughness: 0.42 },
    description: 'Low-pressure capacitance vessels utilizing valves and muscular pumps to return deoxygenated blood and metabolic waste products back toward the right atrium.'
  },
  {
    id: 'nervous',
    name: 'Nervous System',
    category: 'Neural',
    color: '#e9c46a',
    pbr: { metalness: 0.05, roughness: 0.48 },
    description: 'The master electrochemical control and communication network comprising the encephalon (brain), medulla spinalis (spinal cord), and extensive peripheral and autonomic nerve plexuses.'
  },
  {
    id: 'respiratory',
    name: 'Respiratory System',
    category: 'Visceral',
    color: '#bc6c7e',
    pbr: { metalness: 0.06, roughness: 0.55 },
    description: 'Conducting zone (larynx, trachea, bronchial tree) and respiratory zone (alveoli) responsible for rapid alveolar gas exchange of oxygen and carbon dioxide, regulating systemic pH.'
  },
  {
    id: 'digestive',
    name: 'Digestive System',
    category: 'Visceral',
    color: '#c48b52',
    pbr: { metalness: 0.08, roughness: 0.5 },
    description: 'Gastrointestinal tract extending from the esophagus to rectum, supplemented by metabolic accessory organs (liver, gallbladder, pancreas) for enzymatic digestion and nutrient assimilation.'
  },
  {
    id: 'urinary',
    name: 'Urinary System',
    category: 'Visceral',
    color: '#bf6c54',
    pbr: { metalness: 0.07, roughness: 0.46 },
    description: 'The renal-urinary axis: kidneys filtering metabolic wastes, balancing electrolyte osmolality and blood volume, with ureters transporting urine to the bladder reservoir.'
  },
  {
    id: 'lymphatic',
    name: 'Lymphatic & Immune',
    category: 'Circulatory',
    color: '#6b9080',
    pbr: { metalness: 0.05, roughness: 0.58 },
    description: 'A complex drainage and immune surveillance network of lymph nodes, spleen, and lymphatic channels that recovers interstitial fluid and filters pathogens.'
  },
  {
    id: 'endocrine',
    name: 'Endocrine System',
    category: 'Visceral',
    color: '#c99da3',
    pbr: { metalness: 0.05, roughness: 0.5 },
    description: 'Ductless glandular organs (pituitary, thyroid, adrenals, islets) secreting molecular messenger hormones directly into the bloodstream to modulate physiological development and metabolism.'
  },
  {
    id: 'reproductive',
    name: 'Reproductive System',
    category: 'Visceral',
    color: '#b58b94',
    pbr: { metalness: 0.05, roughness: 0.48 },
    description: 'Specialized gonadal and secondary structures responsible for gametogenesis, production of steroid sex hormones, and biological procreation.'
  },
  {
    id: 'integumentary',
    name: 'Integumentary Surface',
    category: 'Superficial',
    color: '#d4ab8e',
    pbr: { metalness: 0.02, roughness: 0.62, opacity: 0.22 },
    description: 'The external cutaneous boundary layer comprising epidermis and dermis, functioning as an indispensable barrier against microbiological invasion, desiccation, and trauma.'
  },
  {
    id: 'connective',
    name: 'Connective & Cartilage',
    category: 'Structural',
    color: '#90a4ae',
    pbr: { metalness: 0.08, roughness: 0.6 },
    description: 'Specialized hyaline/fibrocartilage, articular capsules, and fibroelastic ligaments maintaining joint congruity and tensile mechanical integrity.'
  },
  {
    id: 'sensory',
    name: 'Sensory Organs',
    category: 'Neural',
    color: '#90caf9',
    pbr: { metalness: 0.15, roughness: 0.35 },
    description: 'Peripheral sensory apparatus including the eyes, optic pathways, auditory cochlea, and vestibular system transducing environmental physical stimuli into neural action potentials.'
  }
];

export const ALL_SYSTEM_IDS: SystemId[] = [
  'skeletal',
  'muscular',
  'cardiac',
  'arterial',
  'venous',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'lymphatic',
  'endocrine',
  'reproductive',
  'integumentary',
  'connective',
  'sensory',
];

export const DEFAULT_ACTIVE_SYSTEMS: SystemId[] = [
  'skeletal',
  'muscular',
  'cardiac',
  'arterial',
  'venous',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'connective'
];

