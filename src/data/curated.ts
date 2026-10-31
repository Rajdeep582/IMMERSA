import type { CuratedEntry } from './types';
import { os } from './references';
import { Registry, canonicalName } from './registry';

/**
 * Hand-written educational summaries. Keys are laterality-neutral lowercase names
 * (see Registry.neutralKey) so one entry serves the left and right structures.
 * Content is restricted to standard textbook anatomy and cites its source section.
 * Anything not listed here shows only registry facts (name, FMA id, hierarchy, mesh data).
 */
const C: Record<string, CuratedEntry> = {
  // ---------- Skeletal ----------
  'vertebral column': {
    summary:
      'The flexible axial column of the trunk. In adults it typically comprises 7 cervical, 12 thoracic and 5 lumbar vertebrae, the sacrum (5 fused vertebrae) and the coccyx.',
    function: 'Supports the head and trunk, transmits body weight to the pelvis, protects the spinal cord and provides attachment for muscles of the back.',
    relations: 'Adult curvatures: cervical and lumbar curves are concave posteriorly (lordosis); thoracic and sacrococcygeal curves are concave anteriorly (kyphosis).',
    refs: [os('7.3 The Vertebral Column')],
  },
  'lumbar vertebrae': {
    summary: 'The five vertebrae of the lower back (L1–L5), the largest unfused vertebrae of the column.',
    function: 'Bear the greatest axial load of the movable column; their thick bodies and short, stout processes resist compression.',
    relations: 'Characterised by large, kidney-shaped bodies, hatchet-shaped spinous processes and the absence of transverse foramina and rib facets.',
    refs: [os('7.3 The Vertebral Column')],
  },
  'first lumbar vertebra': {
    summary: 'L1, the most superior lumbar vertebra, lying between the twelfth thoracic vertebra (T12) and L2.',
    function: 'Weight-bearing segment at the thoracolumbar junction, where the rib-bearing thoracic column meets the mobile lumbar column.',
    relations:
      'Articulates with T12 and L2 through intervertebral discs and paired facet (zygapophysial) joints. In adults the spinal cord usually ends around the L1–L2 level.',
    clinical: 'The thoracolumbar junction is a common site of vertebral compression fractures.',
    refs: [os('7.3 The Vertebral Column'), os('13.2 The Central Nervous System')],
  },
  'cervical vertebrae': {
    summary: 'The seven vertebrae of the neck (C1–C7), the smallest vertebrae of the column.',
    function: 'Support and move the head.',
    relations: 'Each has a transverse foramen in its transverse process; the vertebral arteries pass through these foramina (normally C6–C1) on their way to the brain.',
    refs: [os('7.3 The Vertebral Column')],
  },
  atlas: {
    summary: 'C1, the first cervical vertebra: a ring of bone with no vertebral body and no spinous process.',
    function: 'Supports the skull. Its superior articular facets form the atlanto-occipital joints, allowing the nodding ("yes") movement.',
    relations: 'Pivots around the dens of the axis (C2) at the atlanto-axial joint, allowing head rotation ("no").',
    refs: [os('7.3 The Vertebral Column')],
  },
  axis: {
    summary: 'C2, the second cervical vertebra, recognised by the dens (odontoid process) projecting upward from its body.',
    function: 'The dens acts as the pivot about which the atlas and skull rotate.',
    refs: [os('7.3 The Vertebral Column')],
  },
  'thoracic vertebrae': {
    summary: 'The twelve vertebrae of the chest region (T1–T12).',
    function: 'Articulate with the ribs and form the posterior wall of the thoracic cage.',
    relations: 'Distinguished by costal facets for the heads of the ribs and by long spinous processes that angle downward.',
    refs: [os('7.3 The Vertebral Column')],
  },
  sacrum: {
    summary: 'A triangular bone formed by fusion of the five sacral vertebrae.',
    function: 'Transmits the weight of the body from the vertebral column to the pelvis.',
    relations: 'Articulates with the hip bones at the sacroiliac joints, with L5 above and the coccyx below.',
    refs: [os('7.3 The Vertebral Column'), os('8.3 The Pelvic Girdle and Pelvis')],
  },
  'intervertebral discs': {
    summary: 'Fibrocartilaginous pads between adjacent vertebral bodies, each with an outer anulus fibrosus and an inner gel-like nucleus pulposus.',
    function: 'Absorb shock and allow limited movement between vertebrae.',
    clinical: 'A herniated disc occurs when the nucleus pulposus protrudes through a weakened anulus and may compress a spinal nerve.',
    refs: [os('7.3 The Vertebral Column')],
  },
  skull: {
    summary: 'The skeleton of the head. Excluding the ear ossicles, it is composed of 22 bones: 8 cranial bones and 14 facial bones.',
    function: 'Encloses and protects the brain, houses the sense organs and supports the openings of the respiratory and digestive tracts.',
    relations: 'In this model the cranium, facial skeleton, mandible and teeth are separate selectable meshes.',
    refs: [os('7.2 The Skull')],
  },
  mandible: {
    summary: 'The lower jaw, the only movable bone of the skull.',
    function: 'Holds the lower teeth and provides attachment for the muscles of mastication.',
    relations: 'Articulates with the temporal bones at the temporomandibular joints.',
    refs: [os('7.2 The Skull')],
  },
  'thoracic cage': {
    summary: 'The bony cage of the chest formed by the 12 pairs of ribs with their costal cartilages, the sternum and the thoracic vertebrae.',
    function: 'Protects the heart and lungs and supports the movements of breathing.',
    relations: 'Ribs 1–7 (true ribs) attach to the sternum through their own costal cartilages; ribs 8–10 (false ribs) attach indirectly; ribs 11–12 are floating ribs.',
    refs: [os('7.4 The Thoracic Cage')],
  },
  sternum: {
    summary: 'The breastbone: an elongated flat bone in the anterior midline of the thorax, formed by the manubrium, body and xiphoid process.',
    function: 'Anchors the costal cartilages of the upper ribs and the clavicles.',
    refs: [os('7.4 The Thoracic Cage')],
  },
  clavicle: {
    summary: 'The collarbone, an S-shaped bone forming the anterior part of the pectoral girdle.',
    function: 'Acts as a strut holding the upper limb away from the trunk; it is the only bony link between the upper limb and the axial skeleton.',
    relations: 'Articulates medially with the manubrium of the sternum and laterally with the acromion of the scapula.',
    clinical: 'One of the most commonly fractured bones, often after a fall onto the outstretched arm.',
    refs: [os('8.1 The Pectoral Girdle')],
  },
  scapula: {
    summary: 'The shoulder blade, a flat triangular bone on the posterior thoracic wall forming the posterior part of the pectoral girdle.',
    function: 'Provides the glenoid cavity for the shoulder joint and extensive attachments for muscles that move the arm.',
    relations: 'Articulates with the clavicle (acromioclavicular joint) and the humerus (glenohumeral joint).',
    refs: [os('8.1 The Pectoral Girdle')],
  },
  humerus: {
    summary: 'The single bone of the arm (brachium).',
    function: 'Transmits forces between the shoulder and the elbow and anchors many arm and forearm muscles.',
    relations: 'Its head articulates with the glenoid cavity of the scapula; distally it articulates with the radius and ulna at the elbow.',
    refs: [os('8.2 Bones of the Upper Limb')],
  },
  radius: {
    summary: 'The lateral bone of the forearm (on the thumb side in anatomical position).',
    function: 'Rotates around the ulna during pronation and supination and forms the main forearm contribution to the wrist joint.',
    refs: [os('8.2 Bones of the Upper Limb')],
  },
  ulna: {
    summary: 'The medial bone of the forearm (on the little-finger side in anatomical position).',
    function: 'Forms the main hinge articulation of the elbow with the humerus.',
    refs: [os('8.2 Bones of the Upper Limb')],
  },
  'carpal bones': {
    summary: 'The eight short bones of the wrist arranged in two rows of four.',
    function: 'Allow the wide range of wrist movements and transmit force between hand and forearm.',
    relations: 'Proximal row: scaphoid, lunate, triquetrum, pisiform. Distal row: trapezium, trapezoid, capitate, hamate.',
    refs: [os('8.2 Bones of the Upper Limb')],
  },
  'hip bone': {
    summary: 'The large bone of the pelvic girdle (os coxae), formed by the fusion of the ilium, ischium and pubis.',
    function: 'Transfers body weight between the vertebral column and the lower limb and protects pelvic organs.',
    relations: 'The three components meet at the acetabulum, which receives the head of the femur. In this model each hip bone is a single mesh; the ilium, ischium and pubis are not separated.',
    refs: [os('8.3 The Pelvic Girdle and Pelvis')],
  },
  femur: {
    summary: 'The thigh bone, the longest and strongest bone of the body.',
    function: 'Supports body weight and serves as a lever for the powerful muscles of the hip and knee.',
    relations: 'Its head articulates with the acetabulum of the hip bone; distally its condyles articulate with the tibia and the patella at the knee.',
    refs: [os('8.4 Bones of the Lower Limb')],
  },
  patella: {
    summary: 'The kneecap, the largest sesamoid bone, embedded in the tendon of the quadriceps femoris.',
    function: 'Protects the anterior knee and increases the leverage of the quadriceps.',
    refs: [os('8.4 Bones of the Lower Limb')],
  },
  tibia: {
    summary: 'The shin bone, the larger and medial bone of the leg.',
    function: 'Carries body weight from the femur to the foot.',
    relations: 'Articulates with the femur at the knee and with the talus at the ankle; its distal medial projection is the medial malleolus.',
    refs: [os('8.4 Bones of the Lower Limb')],
  },
  fibula: {
    summary: 'The slender lateral bone of the leg.',
    function: 'Carries little body weight; it serves mainly for muscle attachment and forms the lateral malleolus of the ankle.',
    refs: [os('8.4 Bones of the Lower Limb')],
  },
  calcaneus: {
    summary: 'The heel bone, the largest tarsal bone.',
    function: 'Transmits body weight to the ground and is the insertion of the calcaneal (Achilles) tendon.',
    refs: [os('8.4 Bones of the Lower Limb')],
  },

  // ---------- Muscular ----------
  'biceps brachii': {
    summary: 'A two-headed muscle on the anterior arm.',
    function: 'Flexes the forearm at the elbow and is a powerful supinator of the forearm.',
    relations: 'Long head arises from the supraglenoid tubercle and short head from the coracoid process of the scapula; inserts on the radial tuberosity.',
    innervation: 'Musculocutaneous nerve.',
    refs: [os('11.5 Muscles of the Pectoral Girdle and Upper Limbs')],
  },
  'triceps brachii': {
    summary: 'The three-headed muscle of the posterior arm.',
    function: 'The main extensor of the forearm at the elbow.',
    relations: 'Inserts on the olecranon of the ulna.',
    innervation: 'Radial nerve.',
    refs: [os('11.5 Muscles of the Pectoral Girdle and Upper Limbs')],
  },
  deltoid: {
    summary: 'The thick, triangular muscle that forms the rounded contour of the shoulder.',
    function: 'The prime mover of arm abduction; its anterior (clavicular) and posterior (spinal) parts also flex and extend the arm.',
    relations: 'Arises from the lateral clavicle, acromion and spine of the scapula; inserts on the deltoid tuberosity of the humerus.',
    innervation: 'Axillary nerve.',
    refs: [os('11.5 Muscles of the Pectoral Girdle and Upper Limbs')],
  },
  'pectoralis major': {
    summary: 'The large fan-shaped muscle of the upper chest.',
    function: 'Flexes, adducts and medially rotates the arm.',
    relations: 'Arises from the clavicle, sternum and costal cartilages and inserts on the humerus.',
    innervation: 'Medial and lateral pectoral nerves.',
    refs: [os('11.5 Muscles of the Pectoral Girdle and Upper Limbs')],
  },
  trapezius: {
    summary: 'A broad, flat, diamond-shaped muscle of the upper back and neck.',
    function: 'Elevates, retracts and depresses the scapula depending on which fibres contract; also extends the head.',
    innervation: 'Accessory nerve (cranial nerve XI).',
    refs: [os('11.5 Muscles of the Pectoral Girdle and Upper Limbs')],
  },
  diaphragm: {
    summary: 'The dome-shaped musculotendinous sheet separating the thoracic and abdominal cavities.',
    function: 'The principal muscle of inspiration: contraction flattens the dome and enlarges the thoracic cavity.',
    innervation: 'Phrenic nerves.',
    refs: [os('11.4 Axial Muscles of the Abdominal Wall and Thorax'), os('22.3 The Process of Breathing')],
  },
  sternocleidomastoid: {
    summary: 'A prominent strap-like muscle on each side of the neck.',
    function: 'Acting alone, it tilts the head toward the same side and rotates the face to the opposite side; acting together, the two flex the neck.',
    relations: 'Arises from the manubrium and medial clavicle and inserts on the mastoid process of the temporal bone.',
    innervation: 'Accessory nerve (cranial nerve XI).',
    refs: [os('11.3 Axial Muscles of the Head, Neck, and Back')],
  },
  'gluteus maximus': {
    summary: 'The largest and most superficial gluteal muscle, forming most of the buttock.',
    function: 'Extends and laterally rotates the thigh at the hip, for example when climbing stairs or rising from sitting.',
    innervation: 'Inferior gluteal nerve.',
    refs: [os('11.6 Appendicular Muscles of the Pelvic Girdle and Lower Limbs')],
  },
  gastrocnemius: {
    summary: 'The two-headed superficial muscle of the posterior leg (calf).',
    function: 'Plantar flexes the foot and assists in flexing the knee.',
    relations: 'Joins the soleus to form the calcaneal (Achilles) tendon.',
    innervation: 'Tibial nerve.',
    refs: [os('11.6 Appendicular Muscles of the Pelvic Girdle and Lower Limbs')],
  },
  'calcaneal tendon': {
    summary: 'The Achilles tendon, the thickest and strongest tendon of the body.',
    function: 'Transmits the pull of the gastrocnemius and soleus to the calcaneus for plantar flexion.',
    refs: [os('11.6 Appendicular Muscles of the Pelvic Girdle and Lower Limbs')],
  },
  'rectus femoris': {
    summary: 'The only part of the quadriceps femoris that crosses both the hip and the knee.',
    function: 'Extends the leg at the knee and assists flexion of the thigh at the hip.',
    innervation: 'Femoral nerve.',
    refs: [os('11.6 Appendicular Muscles of the Pelvic Girdle and Lower Limbs')],
  },

  // ---------- Nervous ----------
  brain: {
    summary: 'The part of the central nervous system within the cranial cavity.',
    function: 'Integrates sensory information, controls movement and underlies cognition, emotion and memory.',
    relations: 'In this model: cerebral hemispheres (selected gyri and lobes), diencephalon, brainstem, cerebellum and the ventricular system.',
    refs: [os('13.2 The Central Nervous System')],
  },
  cerebellum: {
    summary: 'The "little brain" at the back of the skull, posterior to the brainstem.',
    function: 'Coordinates movement and posture by comparing intended motor commands with sensory feedback; important for motor learning.',
    refs: [os('13.2 The Central Nervous System')],
  },
  pons: {
    summary: 'The part of the brainstem between the midbrain and the medulla oblongata.',
    function: 'Relays information between the cerebrum and cerebellum and contains nuclei that help regulate breathing.',
    refs: [os('13.2 The Central Nervous System')],
  },
  'medulla oblongata': {
    summary: 'The lowest part of the brainstem, continuous with the spinal cord.',
    function: 'Contains centres that regulate heart rate, blood vessel diameter and breathing.',
    refs: [os('13.2 The Central Nervous System')],
  },
  midbrain: {
    summary: 'The uppermost part of the brainstem.',
    function: 'Its superior and inferior colliculi are relay and reflex centres for vision and hearing respectively.',
    refs: [os('13.2 The Central Nervous System')],
  },
  thalamus: {
    summary: 'A paired mass of grey matter forming most of the diencephalon.',
    function: 'The main relay for sensory information travelling to the cerebral cortex.',
    refs: [os('13.2 The Central Nervous System')],
  },
  hypothalamus: {
    summary: 'The inferior part of the diencephalon.',
    function: 'Regulates homeostasis (body temperature, thirst, hunger) and controls the pituitary gland.',
    refs: [os('13.2 The Central Nervous System'), os('17.3 The Pituitary Gland and Hypothalamus')],
  },
  hippocampus: {
    summary: 'A curved structure in the medial temporal lobe, part of the limbic system.',
    function: 'Essential for forming new long-term declarative memories.',
    refs: [os('13.2 The Central Nervous System')],
  },
  'corpus callosum': {
    summary: 'The largest commissure of the brain: a broad band of white-matter fibres.',
    function: 'Connects the left and right cerebral hemispheres.',
    refs: [os('13.2 The Central Nervous System')],
  },
  'precentral gyrus': {
    summary: 'The gyrus immediately anterior to the central sulcus of the frontal lobe.',
    function: 'Location of the primary motor cortex, which initiates voluntary movement.',
    refs: [os('13.2 The Central Nervous System')],
  },
  'postcentral gyrus': {
    summary: 'The gyrus immediately posterior to the central sulcus in the parietal lobe.',
    function: 'Location of the primary somatosensory cortex.',
    refs: [os('13.2 The Central Nervous System')],
  },
  'optic nerve': {
    summary: 'Cranial nerve II.',
    function: 'Carries visual information from the retina to the brain.',
    relations: 'The two optic nerves meet at the optic chiasm.',
    refs: [os('13.4 The Peripheral Nervous System')],
  },
  'optic chiasm': {
    summary: 'The X-shaped junction of the two optic nerves inferior to the hypothalamus.',
    function: 'Fibres from the nasal half of each retina cross here, so each optic tract carries information from the opposite visual field.',
    refs: [os('14.1 Sensory Perception')],
  },
  'lateral ventricle': {
    summary: 'A C-shaped cavity within each cerebral hemisphere filled with cerebrospinal fluid.',
    function: 'Part of the ventricular system in which choroid plexus produces cerebrospinal fluid.',
    relations: 'Communicates with the third ventricle through the interventricular foramen.',
    refs: [os('13.3 Circulation and the Central Nervous System')],
  },

  // ---------- Cardiovascular ----------
  heart: {
    summary: 'The muscular four-chambered pump of the cardiovascular system, located in the mediastinum.',
    function: 'The right side pumps blood to the lungs (pulmonary circuit); the left side pumps blood to the rest of the body (systemic circuit).',
    relations: 'Selected chambers, valve leaflets, papillary muscles and coronary vessels are modelled as separate structures.',
    refs: [os('19.1 Heart Anatomy')],
  },
  'cavity of left ventricle': {
    summary: 'The lumen of the left ventricle.',
    function: 'The left ventricle ejects oxygenated blood into the aorta; its wall is the thickest of the four chambers.',
    refs: [os('19.1 Heart Anatomy')],
  },
  'cavity of right ventricle': {
    summary: 'The lumen of the right ventricle.',
    function: 'The right ventricle pumps deoxygenated blood into the pulmonary trunk.',
    refs: [os('19.1 Heart Anatomy')],
  },
  'arch of aorta': {
    summary: 'The curved segment of the aorta between the ascending and descending aorta.',
    relations: 'Gives rise to the brachiocephalic trunk, the left common carotid artery and the left subclavian artery.',
    refs: [os('20.5 Circulatory Pathways')],
  },
  'inferior vena cava': {
    summary: 'The large vein returning blood from the lower body.',
    function: 'Drains the lower limbs, pelvis and abdomen into the right atrium.',
    refs: [os('20.5 Circulatory Pathways')],
  },
  'coronary vessels': {
    summary: 'The arteries and veins of the heart wall itself.',
    function: 'Coronary arteries arising from the base of the aorta supply the myocardium; cardiac veins drain mostly into the coronary sinus.',
    clinical: 'Narrowing of coronary arteries can cause myocardial ischaemia.',
    refs: [os('19.1 Heart Anatomy')],
  },
  'great saphenous vein': {
    summary: 'The long superficial vein running along the medial side of the leg and thigh.',
    relations: 'Drains into the femoral vein near the groin.',
    clinical: 'Frequently harvested for coronary artery bypass grafting.',
    refs: [os('20.5 Circulatory Pathways')],
  },

  // ---------- Respiratory ----------
  trachea: {
    summary: 'The windpipe: a tube extending from the larynx to its division into the main bronchi.',
    function: 'Conducts air to and from the lungs.',
    relations: 'Its wall is supported by C-shaped rings of hyaline cartilage that are open posteriorly, next to the oesophagus.',
    refs: [os('22.1 Organs and Structures of the Respiratory System')],
  },
  'bronchial tree': {
    summary: 'The branching system of airways from the main bronchi to the smallest bronchioles.',
    function: 'Conducts air to the respiratory zone of the lungs.',
    relations: 'Only the conducting tree is modelled in this dataset; lung parenchyma surfaces are not included.',
    refs: [os('22.1 Organs and Structures of the Respiratory System')],
  },
  epiglottis: {
    summary: 'A leaf-shaped elastic-cartilage flap at the entrance of the larynx.',
    function: 'Folds over the laryngeal inlet during swallowing so that food and liquid are directed into the oesophagus.',
    refs: [os('22.1 Organs and Structures of the Respiratory System')],
  },
  'thyroid cartilage': {
    summary: 'The largest cartilage of the larynx.',
    function: 'Shields the vocal folds; its anterior prominence forms the "Adam\'s apple".',
    refs: [os('22.1 Organs and Structures of the Respiratory System')],
  },
  larynx: {
    summary: 'The cartilaginous structure connecting the pharynx to the trachea.',
    function: 'Regulates airflow, protects the lower airway during swallowing and produces voice.',
    refs: [os('22.1 Organs and Structures of the Respiratory System')],
  },

  // ---------- Digestive ----------
  esophagus: {
    summary: 'A muscular tube connecting the pharynx to the stomach.',
    function: 'Propels swallowed food to the stomach by peristalsis.',
    relations: 'Passes through the diaphragm at the oesophageal hiatus.',
    refs: [os('23.3 The Mouth, Pharynx, and Esophagus')],
  },
  stomach: {
    summary: 'A J-shaped expansion of the alimentary canal in the upper left abdomen.',
    function: 'Stores food temporarily, mixes it with gastric juice and begins protein digestion.',
    refs: [os('23.4 The Stomach')],
  },
  liver: {
    summary: 'The largest gland of the body, in the upper right abdomen beneath the diaphragm.',
    function: 'Produces bile and performs many metabolic, storage and detoxification functions.',
    relations: 'In this model the liver is divided into hepatovenous (functional) segments.',
    refs: [os('23.6 Accessory Organs in Digestion: The Liver, Pancreas, and Gallbladder')],
  },
  gallbladder: {
    summary: 'A small sac on the inferior surface of the liver.',
    function: 'Stores and concentrates bile, releasing it into the duodenum via the cystic and common bile ducts.',
    refs: [os('23.6 Accessory Organs in Digestion: The Liver, Pancreas, and Gallbladder')],
  },
  pancreas: {
    summary: 'An elongated gland lying behind the stomach.',
    function: 'Exocrine part secretes digestive enzymes into the duodenum; pancreatic islets secrete hormones including insulin and glucagon.',
    refs: [os('23.6 Accessory Organs in Digestion: The Liver, Pancreas, and Gallbladder')],
  },
  duodenum: {
    summary: 'The first and shortest part of the small intestine, curving around the head of the pancreas.',
    function: 'Receives chyme from the stomach together with bile and pancreatic juice.',
    refs: [os('23.5 The Small and Large Intestines')],
  },
  appendix: {
    summary: 'A narrow, blind-ended tube attached to the caecum.',
    function: 'Contains lymphoid tissue.',
    clinical: 'Inflammation of the appendix (appendicitis) is a common cause of acute abdominal pain.',
    refs: [os('23.5 The Small and Large Intestines')],
  },
  tongue: {
    summary: 'A muscular organ on the floor of the mouth.',
    function: 'Manipulates food for chewing and swallowing, carries taste buds and is essential for speech.',
    refs: [os('23.3 The Mouth, Pharynx, and Esophagus')],
  },

  // ---------- Urinary ----------
  kidney: {
    summary: 'A bean-shaped retroperitoneal organ on each side of the vertebral column.',
    function: 'Filters blood to form urine and regulates fluid, electrolyte and acid–base balance.',
    refs: [os('25.3 Gross Anatomy of the Kidney')],
  },
  ureter: {
    summary: 'A muscular tube carrying urine from each kidney to the urinary bladder.',
    function: 'Moves urine by peristalsis.',
    refs: [os('25.2 Gross Anatomy of Urine Transport')],
  },
  'urinary bladder': {
    summary: 'A hollow muscular organ in the pelvis.',
    function: 'Stores urine until it is expelled through the urethra.',
    refs: [os('25.2 Gross Anatomy of Urine Transport')],
  },


  // ---------- Female reproductive (HRA female model) ----------
  uterus: {
    summary: 'A hollow, pear-shaped muscular organ in the female pelvis, between the urinary bladder and the rectum.',
    function: 'Site of implantation and development of the embryo and fetus; its endometrium is shed during menstruation when pregnancy does not occur.',
    relations: 'Regions: fundus (above the openings of the uterine tubes), body, and cervix projecting into the vagina. The wall comprises perimetrium, myometrium and endometrium.',
    refs: [os('27 The Reproductive System')],
  },
  'fundus of uterus': {
    summary: 'The rounded upper part of the uterus above the entry points of the uterine tubes.',
    refs: [os('27 The Reproductive System')],
  },
  'body of uterus': {
    summary: 'The main central portion of the uterus, between the fundus and the cervix.',
    refs: [os('27 The Reproductive System')],
  },
  cervix: {
    summary: 'The narrow lower portion of the uterus that projects into the vagina.',
    relations: 'Its canal opens into the uterine cavity at the internal os and into the vagina at the external os.',
    refs: [os('27 The Reproductive System')],
  },
  ovary: {
    summary: 'The paired female gonad, an almond-sized organ on each side of the uterus.',
    function: 'Produces oocytes and the hormones estrogen and progesterone.',
    relations: 'Held in place by the ovarian ligament (to the uterus), the suspensory ligament (to the pelvic wall) and the mesovarium (to the broad ligament).',
    refs: [os('27 The Reproductive System')],
  },
  'ovaries and uterine tubes': {
    summary: 'The paired ovaries and the uterine (fallopian) tubes that connect the region of each ovary to the uterus.',
    function: 'The tubes capture the ovulated oocyte and are the usual site of fertilisation.',
    refs: [os('27 The Reproductive System')],
  },
  'ampulla of uterine tube': {
    summary: 'The wide, longest middle portion of the uterine tube.',
    function: 'The most common site of fertilisation.',
    refs: [os('27 The Reproductive System')],
  },
  'fimbria of uterine tube': {
    summary: 'The finger-like projections at the free end of the uterine tube, beside the ovary.',
    function: 'Sweep the ovulated oocyte into the tube.',
    refs: [os('27 The Reproductive System')],
  },
  'uterine tube infundibulum': {
    summary: 'The funnel-shaped lateral end of the uterine tube, fringed by fimbriae.',
    refs: [os('27 The Reproductive System')],
  },
  'isthmus of fallopian tube': {
    summary: 'The narrow medial portion of the uterine tube next to the uterus.',
    refs: [os('27 The Reproductive System')],
  },
  vagina: {
    summary: 'A muscular canal extending from the cervix of the uterus to the exterior of the body.',
    function: 'Receives the penis during intercourse, serves as the birth canal and passes menstrual flow.',
    refs: [os('27 The Reproductive System')],
  },
  'broad ligament': {
    summary: 'A double fold of peritoneum extending from the sides of the uterus to the pelvic walls.',
    function: 'Supports the uterus, uterine tubes and ovaries; its subdivisions include the mesosalpinx and mesovarium.',
    refs: [os('27 The Reproductive System')],
  },
  'round ligament of uterus': {
    summary: 'A cord-like ligament running from the uterus through the inguinal canal to the labia majora.',
    function: 'Helps hold the uterus in its anteverted position.',
    refs: [os('27 The Reproductive System')],
  },
  'mammary gland': {
    summary: 'The milk-producing gland within the breast.',
    function: 'Produces milk after childbirth (lactation); milk travels from the lobes through lactiferous ducts and sinuses to the nipple.',
    relations: 'Glandular lobes are embedded in adipose tissue and supported by suspensory ligaments; the nipple is surrounded by the areola.',
    refs: [os('27 The Reproductive System')],
  },
  nipple: {
    summary: 'The projection at the centre of the areola through which the lactiferous ducts open.',
    refs: [os('27 The Reproductive System')],
  },
  'main lactiferous ducts': {
    summary: 'Ducts that drain milk from each lobe of the mammary gland toward the nipple.',
    refs: [os('27 The Reproductive System')],
  },
  'spinal cord': {
    summary: 'The part of the central nervous system within the vertebral canal, continuous with the medulla oblongata.',
    function: 'Conducts signals between brain and body and contains reflex circuits.',
    relations: 'Divided into cervical, thoracic, lumbar and sacral segments, each giving rise to a pair of spinal nerves. In adults it usually ends around the L1–L2 vertebral level.',
    refs: [os('13.2 The Central Nervous System')],
  },
  'left ventricle': {
    summary: 'The chamber of the heart that receives oxygenated blood from the left atrium.',
    function: 'Ejects oxygenated blood into the aorta; its wall is the thickest of the four chambers.',
    refs: [os('19.1 Heart Anatomy')],
  },
  'right ventricle': {
    summary: 'The chamber of the heart that receives deoxygenated blood from the right atrium.',
    function: 'Pumps blood into the pulmonary trunk toward the lungs.',
    refs: [os('19.1 Heart Anatomy')],
  },
  lungs: {
    summary: 'The paired organs of gas exchange within the thoracic cavity.',
    relations: 'The right lung has three lobes and the left lung two (with the lingula). Each lung is divided into bronchopulmonary segments supplied by segmental bronchi.',
    refs: [os('22.1 Organs and Structures of the Respiratory System')],
  },

  // ---------- Endocrine / lymphoid ----------
  'pituitary gland': {
    summary: 'A small gland suspended from the hypothalamus, sitting in the sella turcica of the sphenoid bone.',
    function: 'Its anterior and posterior lobes release hormones that regulate many other endocrine glands and body processes.',
    refs: [os('17.3 The Pituitary Gland and Hypothalamus')],
  },
  'adrenal gland': {
    summary: 'A gland resting on the superior pole of each kidney (suprarenal gland).',
    function: 'The cortex secretes corticosteroids; the medulla secretes epinephrine and norepinephrine.',
    refs: [os('17.6 The Adrenal Glands')],
  },
  'pineal body': {
    summary: 'A small gland in the roof of the diencephalon (pineal gland).',
    function: 'Secretes melatonin, which is involved in circadian rhythms.',
    refs: [os('17.7 The Pineal Gland')],
  },
  spleen: {
    summary: 'The largest lymphoid organ, in the upper left abdomen.',
    function: 'Filters blood, removes aged red blood cells and mounts immune responses to blood-borne pathogens.',
    refs: [os('21.1 Anatomy of the Lymphatic and Immune Systems')],
  },
  'lobe of thymus': {
    summary: 'One of the two lobes of the thymus, located in the anterior mediastinum.',
    function: 'The thymus is where T lymphocytes mature; it is largest in childhood.',
    refs: [os('21.1 Anatomy of the Lymphatic and Immune Systems')],
  },

  // ---------- Sense organs / skin ----------
  lens: {
    summary: 'The transparent, biconvex structure behind the iris.',
    function: 'Fine-focuses light onto the retina by changing shape (accommodation).',
    refs: [os('14.1 Sensory Perception')],
  },
  cornea: {
    summary: 'The transparent anterior part of the outer layer of the eye.',
    function: 'Provides most of the eye\'s focusing power.',
    refs: [os('14.1 Sensory Perception')],
  },
  iris: {
    summary: 'The coloured, muscular ring around the pupil.',
    function: 'Controls the amount of light entering the eye by changing pupil diameter.',
    refs: [os('14.1 Sensory Perception')],
  },
  'optic part of retina': {
    summary: 'The light-sensitive inner layer at the back of the eye.',
    function: 'Photoreceptors (rods and cones) convert light into neural signals carried by the optic nerve.',
    refs: [os('14.1 Sensory Perception')],
  },
  skin: {
    summary: 'The largest organ of the body, consisting of the epidermis and dermis; the hypodermis (subcutaneous tissue) lies beneath it.',
    function: 'Protects against injury, pathogens and water loss, helps regulate body temperature and contains sensory receptors.',
    relations: 'Represented here as a single outer surface. Epidermis, dermis, hypodermis, glands and hair follicles are not modelled as separate geometry.',
    refs: [os('5.1 Layers of the Skin')],
  },
};

const BY_CANON = new Map(Object.entries(C).map(([k, v]) => [canonicalName(k), v]));

export function curatedFor(name: string): CuratedEntry | undefined {
  return C[name.toLowerCase()] ?? C[Registry.neutralKey(name)] ?? BY_CANON.get(canonicalName(name)) ?? BY_CANON.get(canonicalName(Registry.neutralKey(name)));
}

export const CURATED_KEYS = Object.keys(C);
