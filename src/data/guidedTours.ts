import { GuidedTour } from '../types/anatomy';

export const GUIDED_TOURS: GuidedTour[] = [
  {
    id: 'axial-skeleton-l1',
    title: 'The Axial Spine & L1 Lumbar Vertebra',
    shortDesc: 'A cinematic journey through the vertebral column down to the crucial L1 biomechanical junction.',
    icon: 'Bone',
    steps: [
      {
        id: 'step-1-full-body',
        title: 'Macroscopic Overview',
        subtitle: 'The Human Form in Anatomical Position',
        cameraPose: {
          position: [0, 0.95, 3.8],
          target: [0, 0.85, 0],
          fov: 34
        },
        visibleSystems: ['skeletal', 'muscular', 'nervous', 'cardiac', 'arterial'],
        explanation: 'The adult human body integrates 206 articulated bones, over 600 skeletal muscles, and thousands of meters of neural and vascular conduits into a self-regulating biomechanical system.',
        clinicalHighlight: 'Standard anatomical position: standing erect, facing forward, feet together, arms at sides with palms supine.'
      },
      {
        id: 'step-2-skeletal-cage',
        title: 'Axial Skeletal Framework',
        subtitle: 'Isolating the Rigid Biomechanical Core',
        cameraPose: {
          position: [0.6, 1.1, 2.5],
          target: [0, 1.0, 0],
          fov: 32
        },
        visibleSystems: ['skeletal'],
        explanation: 'Removing soft tissues reveals the axial skeleton: skull, vertebral column, ribs, and sternum. It houses the central nervous system and provides stable anchoring for locomotion.',
        clinicalHighlight: 'The vertebral column possesses four physiological curves (cervical lordosis, thoracic kyphosis, lumbar lordosis, sacral kyphosis) optimizing bipedal shock absorption.'
      },
      {
        id: 'step-3-thoracolumbar-junction',
        title: 'The Thoracolumbar Junction',
        subtitle: 'Transition from Rigid Cage to Flexible Lumbar Curve',
        cameraPose: {
          position: [-0.4, 1.05, 1.2],
          target: [0, 1.04, 0],
          fov: 28
        },
        visibleSystems: ['skeletal', 'nervous'],
        explanation: 'Approaching the lower thoracic cage and upper lumbar spine. Notice how the coronal facet orientations of the thoracic vertebrae transition into the sagittal facet orientations of the lumbar spine.',
        clinicalHighlight: 'The T12-L1 junction represents an abrupt mechanical fulcrum between the stiff rib-cage and mobile lumbar spine, predisposing this level to severe trauma.'
      },
      {
        id: 'step-4-l1-focus',
        title: 'First Lumbar Vertebra (L1)',
        subtitle: 'High-Resolution Landmark Inspection',
        targetStructureId: 'FJ3157',
        cameraPose: {
          position: [0.18, 1.06, 0.45],
          target: [0, 1.045, -0.01],
          fov: 24
        },
        visibleSystems: ['skeletal'],
        isolate: true,
        explanation: 'Targeting L1 in extreme detail: observe the massive kidney-shaped vertebral body anteriorly, short robust pedicles, and the quadrangular spinous process projecting horizontally backward.',
        clinicalHighlight: 'At this precise anatomical level, the spinal cord terminates into the conus medullaris (L1-L2 disc), continuing downward as the cauda equina.',
        recommendedAction: 'inspect'
      }
    ]
  },
  {
    id: 'cardiovascular-engine',
    title: 'The Cardiovascular Engine & Great Vessels',
    shortDesc: 'Trace systemic blood flow from the heart chambers through the descending thoracic and abdominal aorta.',
    icon: 'Heart',
    steps: [
      {
        id: 'cardio-step-1',
        title: 'Thoracic Mediastinum',
        subtitle: 'The Chest Cavity & Pericardial Space',
        cameraPose: {
          position: [0, 1.25, 2.0],
          target: [0, 1.22, 0],
          fov: 30
        },
        visibleSystems: ['cardiac', 'arterial', 'venous', 'skeletal'],
        explanation: 'Nestled between the pleural cavities in the middle mediastinum, the heart acts as the central circulatory pump.',
        clinicalHighlight: 'Pericardial sac provides fibrous non-distensible containment; acute fluid accumulation can precipitate life-threatening cardiac tamponade.'
      },
      {
        id: 'cardio-step-2',
        title: 'The Four Cardiac Chambers',
        subtitle: 'Synchronized Dual-Circuit Pumping',
        targetStructureId: 'FJ2422',
        cameraPose: {
          position: [0.15, 1.28, 0.7],
          target: [0.02, 1.24, 0.02],
          fov: 25
        },
        visibleSystems: ['cardiac', 'arterial', 'venous'],
        isolate: true,
        explanation: 'Targeting the Left Ventricle (FJ2422) and adjacent atria. The thick muscular left ventricular wall contracts to generate the systemic blood pressure wave (120 mmHg systolic).',
        clinicalHighlight: 'Aortic and mitral valve competence prevent retrograde regurgitation, ensuring unidirectional forward cardiac output (5 L/min at rest).',
        recommendedAction: 'inspect'
      },
      {
        id: 'cardio-step-3',
        title: 'The Systemic Aortic Highway',
        subtitle: 'Thoracic and Abdominal Aorta Pathway',
        targetStructureId: 'FJ1931',
        cameraPose: {
          position: [-0.3, 1.15, 0.95],
          target: [0, 1.1, -0.02],
          fov: 28
        },
        visibleSystems: ['arterial', 'skeletal'],
        explanation: 'Following blood out of the aortic root, through the aortic arch, and down the descending thoracic aorta anterior to the vertebral bodies, piercing the diaphragm at T12.',
        clinicalHighlight: 'High shear stresses at the aortic isthmus make this region vulnerable to traumatic rupture in rapid deceleration motor vehicle accidents.'
      }
    ]
  },
  {
    id: 'central-nervous-system',
    title: 'Central Nervous Axis: Brain to Cauda Equina',
    shortDesc: 'Follow the central neural pathway from the cerebral cortex through the brainstem and spinal cord.',
    icon: 'Activity',
    steps: [
      {
        id: 'cns-step-1',
        title: 'The Encephalon (Brain)',
        subtitle: 'Cranial Vault & Master Regulator',
        cameraPose: {
          position: [0.35, 1.68, 1.1],
          target: [0, 1.62, 0],
          fov: 26
        },
        visibleSystems: ['nervous', 'skeletal'],
        explanation: 'Enclosed within the neurocranium, the brain coordinates sensory perception, voluntary movement, cognition, and vegetative autonomic control.',
        clinicalHighlight: 'Cerebrospinal fluid (CSF) cushions the brain within the subarachnoid space; raised ICP compromises cerebral perfusion.'
      },
      {
        id: 'cns-step-2',
        title: 'Spinal Cord & Cervical Roots',
        subtitle: 'Neural Conduction Highway in the Vertebral Canal',
        cameraPose: {
          position: [0.4, 1.42, 0.8],
          target: [0, 1.4, -0.02],
          fov: 24
        },
        visibleSystems: ['nervous', 'skeletal'],
        explanation: 'Emerging from the foramen magnum, the medulla oblongata transitions into the spinal cord, giving off 31 paired spinal nerve roots passing through intervertebral foramina.',
        clinicalHighlight: 'C1-C4 cervical plexus innervates the neck and diaphragm (phrenic nerve C3-C5); C5-T1 brachial plexus innervates the entire upper extremity.'
      },
      {
        id: 'cns-step-3',
        title: 'Conus Medullaris & Lumbar Roots',
        subtitle: 'Termination of the Cord at L1-L2 Level',
        targetStructureId: 'FJ3157',
        cameraPose: {
          position: [-0.25, 1.08, 0.65],
          target: [0, 1.05, -0.02],
          fov: 22
        },
        visibleSystems: ['nervous', 'skeletal'],
        explanation: 'At the L1 vertebra, the spinal cord tapers into the conus medullaris. Below this, only the cauda equina (horse tail) nerve roots descend through the lumbar subarachnoid cistern.',
        clinicalHighlight: 'Lumbar puncture (spinal tap) is performed safely below L3 (typically L3-L4 or L4-L5 interspace) because the spinal cord has already terminated safely above at L1-L2.',
        recommendedAction: 'inspect'
      }
    ]
  }
];

