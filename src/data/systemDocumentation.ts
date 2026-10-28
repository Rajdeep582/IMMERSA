import { SystemId } from '../types/anatomy';
import { MedicalDocumentation } from '../types/documentation';

export const SYSTEM_DOCUMENTATION_MAP: Partial<Record<SystemId, MedicalDocumentation>> = {
  cardiac: {
    id: 'cardiac',
    type: 'system',
    canonicalName: 'Cardiovascular & Cardiac System',
    latinName: 'Systema cardiovasculare / Cor',
    commonName: 'Heart & Circulatory Pump',
    system: 'cardiac',
    region: 'Thorax / Middle Mediastinum',
    conceptId: 'FMA7101',
    overview: {
      summary: 'The cardiac system is an electromechanical pump centered on the four-chambered heart. It drives continuous dual-circuit blood circulation throughout the human body: the low-pressure pulmonary circulation for alveolar oxygenation and the high-pressure systemic circulation for systemic nutrient and oxygen delivery.',
      keyTakeaways: [
        'Four chambers: Right & Left Atria (priming chambers) and Right & Left Ventricles (primary muscular ejectors).',
        'Intrinsic electrical conduction cascade: Sinoatrial (SA) node → Atrioventricular (AV) node → Bundle of His → Purkinje network.',
        'Pumps approximately 5 liters of blood per minute at rest (~7,200 liters daily) across 60,000 miles of systemic vasculature.',
        'Coronary circulation delivers oxygen-rich blood directly to myocardium during ventricular diastole.'
      ],
      physiologicalSignificance: 'Maintains cerebral, renal, and systemic cellular perfusion pressure. Cessation of cardiac output results in loss of consciousness within 10 seconds and irreversible neuronal death within 4 to 6 minutes.'
    },
    anatomyAndLocation: {
      location: 'Situated within the middle mediastinum of the thoracic cavity, enclosed by the fibroserous pericardial sac, resting upon the central tendon of the diaphragm, posterior to the sternum and costal cartilages 3-6.',
      shapeAndDimensions: 'Conical, hollow muscular organ roughly the size of a closed adult fist. Dimensions approximately 12 cm length, 8-9 cm width, 6 cm anterior-posterior depth; average weight 280-340 g in adult males and 230-280 g in adult females.',
      surfaceProjections: 'Apex beat (point of maximal impulse) is located in the left 5th intercostal space, approximately 7-9 cm lateral to the midsternal line.',
      landmarks: [
        'Apex cordis (inferolateral tip of left ventricle)',
        'Sulcus coronarius (atrioventricular groove demarcating atria from ventricles)',
        'Sulcus interventricularis anterior et posterior (interventricular grooves housing LAD and PDA)',
        'Crux cordis (junction of interatrial, interventricular, and AV grooves posterior to heart)',
        'Crista terminalis (internal muscular ridge of right atrium)'
      ],
      anatomicalRelations: [
        { orientation: 'Anterior', description: 'Sternum, costal cartilages (left 3rd to 6th), anterior margins of lungs and pleurae.' },
        { orientation: 'Posterior', description: 'Esophagus, descending thoracic aorta, thoracic duct, azygos vein, and thoracic vertebrae T5-T8.' },
        { orientation: 'Inferior', description: 'Central tendon and muscular diaphragm.' },
        { orientation: 'Superior', description: 'Great vessels (ascending aorta, pulmonary trunk, superior vena cava).' },
        { orientation: 'Lateral', description: 'Mediastinal pleurae, phrenic nerves, and pericardiophrenic vessels flanking both lungs.' }
      ]
    },
    structureAndComposition: {
      tissueTypes: ['Specialized striated cardiac muscle (myocardium)', 'Simple squamous endothelium (endocardium)', 'Fibroelastic connective tissue (fibrous cardiac skeleton)', 'Visceral serous mesothelium (epicardium)'],
      histologicalFeatures: [
        'Branching cardiomyocyte syncytium interconnected by intercalated discs containing mechanical desmosomes and electrical gap junctions (connexon-43).',
        'Abundant sarcoplasmic mitochondria occupying 30-40% of cellular volume for continuous oxidative phosphorylation.',
        'Specialized Purkinje conducting myofibers characterized by sparse myofibrils, abundant glycogen, and rapid conduction velocities (2-4 m/s).'
      ],
      cellularMatrix: 'Dense interstitial collagen network (type I and III collagen) anchoring cardiomyocytes to the four fibrous valve rings (anuli fibrosi) which mechanically insulate the atria from the ventricles.',
      substructures: [
        'Right Atrium & Fossa Ovalis',
        'Right Ventricle & Infundibulum',
        'Left Atrium & Auricle',
        'Left Ventricle & Aortic Vestibule',
        'Tricuspid and Mitral (Bicuspid) Atrioventricular Valves',
        'Aortic and Pulmonary Semilunar Valves',
        'Sinoatrial and Atrioventricular Conduction Nodes'
      ]
    },
    functions: {
      primary: [
        'Systemic circulation: Ejection of oxygenated blood through aortic valve into the arterial tree under high hydrostatic pressure (120/80 mmHg).',
        'Pulmonary circulation: Low-pressure propulsion (25/10 mmHg) of deoxygenated blood to the pulmonary capillary beds for gas exchange.',
        'Atrial endocrine modulation: Secretion of Atrial Natriuretic Peptide (ANP) in response to atrial stretch to induce renal natriuresis and vasodilation.'
      ],
      secondary: [
        'Thermoregulatory core heat redistribution.',
        'Continuous peripheral hydrostatic capillary exchange driving interstitial fluid balance.'
      ],
      biomechanicalRole: 'Torsional wringing mechanics: Ventricular myocardium is organized in counter-directional helical layers (subepicardial left-handed helix, subendocardial right-handed helix), generating systolic apical torsion and rapid diastolic elastic recoil (suction filling).'
    },
    physiologicalMechanisms: {
      mechanismTitle: 'Cardiac Cycle & Electromechanical Coupling',
      stepByStepFlow: [
        'Spontaneous diastolic depolarization of SA node P-cells via hyperpolarization-activated cyclic nucleotide-gated (HCN4) funny current (If).',
        'Action potential propagation across atria (0.5 m/s) triggering bi-atrial contraction (atrial systole / P wave on ECG).',
        'Conduction delay at the AV node (0.05 m/s, PR segment) allowing complete ventricular diastolic filling.',
        'Rapid propagation down the Bundle of His, bundle branches, and Purkinje network (QRS complex).',
        'L-type calcium channel activation causing calcium-induced calcium release (CICR) from the sarcoplasmic reticulum via ryanodine receptor 2 (RyR2).',
        'Troponin C binding, actin-myosin cross-bridge cycling, isovolumetric contraction followed by ventricular ejection.',
        'Active calcium reuptake via SERCA2a and sodium-calcium exchanger (NCX), leading to isovolumetric relaxation (T wave).'
      ],
      regulatoryFeedback: 'Autonomic dual innervation: Sympathetic beta-1 adrenergic receptors activate Gs-protein adenylyl cyclase cascade increasing cAMP, PKA, heart rate (chronotropy), and contractility (inotropy). Parasympathetic vagal M2 muscarinic receptors open GIRK potassium channels, hyperpolarizing pacemaker cells to decrease heart rate.',
      cellularPathways: 'Excitation-Contraction Coupling (ECC) driven by voltage-gated Nav1.5 channels, Cav1.2 L-type channels, RyR2, and phospholamban-regulated SERCA2a ATPase.'
    },
    neurovascular: {
      arterialSupply: 'Left Coronary Artery (dividing into Left Anterior Descending [LAD] and Left Circumflex [LCx]) and Right Coronary Artery (giving off Acute Marginal and Posterior Descending Artery [PDA] in 85% right-dominant anatomy). Coronary perfusion occurs predominantly during ventricular diastole.',
      venousDrainage: 'Great, Middle, and Small Cardiac Veins coalescing into the Coronary Sinus, emptying directly into the posteroinferior right atrium; anterior cardiac and Thebesian veins drain directly into cardiac cavities.',
      lymphaticDrainage: 'Subepicardial and myocardial lymphatic plexuses draining via left and right cardiac lymphatic trunks to the anterior mediastinal and tracheobronchial lymph nodes.',
      innervation: {
        motor: 'Autonomic intrinsic regulation; no somatic motor innervation.',
        sensory: 'Visceral afferent nociceptive fibers travelling retrogradely with sympathetic cardiac nerves into dorsal root ganglia T1-T4/T5 (mediating anginal referred pain to chest, left arm, and jaw).',
        autonomic: 'Cardiac plexus (sympathetic postganglionic fibers from cervical and upper thoracic sympathetic ganglia; parasympathetic preganglionic fibers from the vagus nerve CN X).'
      }
    },
    relatedStructures: [
      { id: 'FJ2422', name: 'Cavity of Left Ventricle', relationship: 'Primary systemic pumping chamber' },
      { id: 'FJ1931', name: 'Descending Thoracic Aorta', relationship: 'Direct systemic arterial recipient of left ventricular stroke volume' },
      { id: 'respiratory', name: 'Respiratory System', relationship: 'Pulmonary circulation interface for blood gas exchange' },
      { id: 'nervous', name: 'Nervous System', relationship: 'Medullary cardiovascular centers regulating autonomic tone via baroreceptors' }
    ],
    pathologies: [
      {
        name: 'Atherosclerotic Coronary Artery Disease (CAD) & Myocardial Infarction',
        prevalence: 'Leading global cause of mortality (~18 million deaths/year globally).',
        pathophysiology: 'Intimal fibrofatty plaque rupture triggers platelet adhesion, acute coronary thrombosis, cessation of coronary flow, ischemic myocardial necrosis, and life-threatening ventricular arrhythmias.',
        severity: 'critical',
        typicalCourse: 'Asymptomatic progression → Angina pectoris on exertion → Acute Coronary Syndrome (STEMI/NSTEMI) → Cardiogenic shock or chronic ischemic heart failure.'
      },
      {
        name: 'Congestive Heart Failure (HFrEF / HFpEF)',
        prevalence: '>64 million individuals worldwide.',
        pathophysiology: 'Inability of the heart to pump blood at a rate commensurate with metabolizing tissue demands, leading to neurohormonal activation (RAAS, sympathetic excess), pulmonary venous congestion, and peripheral edema.',
        severity: 'critical',
        typicalCourse: 'Exertional dyspnea → Orthopnea & paroxysmal nocturnal dyspnea → Refractory biventricular decompensation.'
      },
      {
        name: 'Atrial Fibrillation (AFib)',
        prevalence: 'Most common sustained cardiac arrhythmia (2-4% adult prevalence).',
        pathophysiology: 'Disorganized atrial electrical micro-reentry circuits (frequently originating in pulmonary vein ostia) causing chaotic atrial activation, loss of atrial kick, and risk of thromboembolic stroke via left atrial appendage clot.',
        severity: 'moderate',
        typicalCourse: 'Paroxysmal episodes → Persistent AFib → Permanent atrial remodeling and elevated stroke risk.'
      }
    ],
    signsAndSymptoms: {
      hallmarkSigns: [
        'Retrosternal chest pressure / angina pectoris radiating to left arm, neck, or jaw',
        'Dyspnea on exertion, orthopnea (shortness of breath lying flat), and paroxysmal nocturnal dyspnea',
        'Peripheral bilateral pitting lower-extremity edema and elevated jugular venous pressure (JVP)',
        'Cardiac murmurs, S3 gallop (volume overload), or S4 gallop (stiff ventricle)',
        'Palpitations, pre-syncope, and lightheadedness'
      ],
      clinicalPresentation: 'Acute coronary syndrome presents with crushing substernal chest tightness, diaphoresis, nausea, and shortness of breath unrelieved by rest. Heart failure presents with fatigue, progressive exercise intolerance, fluid retention, pulmonary crackles, and abdominal distension.',
      emergencyRedFlags: [
        'Acute crushing retrosternal pain with diaphoresis and radiation',
        'Sudden loss of consciousness (syncope) during exertion or palpitation',
        'Severe acute dyspnea with pink frothy sputum (acute pulmonary edema)',
        'Profound hypotension (systolic BP < 90 mmHg) with altered mentation and cold extremities'
      ]
    },
    causesAndRiskFactors: {
      primaryCauses: ['Coronary atherosclerosis', 'Systemic arterial hypertension', 'Valvular stenosis/regurgitation', 'Congenital cardiac malformations', 'Viral myocarditis'],
      geneticFactors: ['Familial hypercholesterolemia (LDLR, APOB mutations)', 'Hypertrophic cardiomyopathy (MYH7, MYBPC3)', 'Long QT syndrome (KCNQ1, KCNH2)'],
      modifiableRisks: ['Tobacco cigarette smoking', 'Dyslipidemia (elevated LDL-C, low HDL-C)', 'Type 2 diabetes mellitus', 'Sedentary lifestyle and obesity', 'Chronic psychosocial stress'],
      environmentalTriggers: ['Ambient particulate air pollution (PM2.5)', 'Acute sympathomimetic intake (cocaine, methamphetamine)', 'Severe hypothermia or heat stroke']
    },
    diagnosisAndInvestigations: {
      physicalExam: ['12-lead Electrocardiogram (ECG) for ST elevation, ischemia, conduction blocks, and arrhythmias', 'Precordial auscultation for heart sounds (S1, S2, S3, S4, systolic/diastolic murmurs)', 'Jugular venous pulse assessment and peripheral pulse examination'],
      laboratoryWorkup: ['High-sensitivity Cardiac Troponin I/T (hs-cTn) serial testing for myocardial necrosis', 'B-type Natriuretic Peptide (BNP / NT-proBNP) for heart failure hemodynamic stress', 'Comprehensive lipid panel, HbA1c, serum creatinine, and electrolytes'],
      imagingStudies: ['Transthoracic Echocardiography (TTE) for ejection fraction, wall motion abnormalities, and valvular gradients', 'Coronary Computed Tomography Angiography (CCTA) and invasive coronary angiography', 'Cardiac Magnetic Resonance Imaging (CMR) with late gadolinium enhancement (LGE) for myocardial fibrosis'],
      specialTests: ['Cardiopulmonary Exercise Stress Testing (CPET)', 'Holter / Event ECG monitoring for episodic arrhythmias', 'Fractional Flow Reserve (FFR) during catheterization']
    },
    treatmentAndManagement: {
      pharmacotherapy: [
        'Antiplatelet therapy (Aspirin, P2Y12 inhibitors clopidogrel/ticagrelor)',
        'HMG-CoA reductase inhibitors (Statins) and PCSK9 inhibitors',
        'Beta-adrenergic blockers (Metoprolol succinate, Carvedilol, Bisoprolol)',
        'RAAS inhibitors: ARNI (Sacubitril/Valsartan), ACE inhibitors, or ARBs',
        'SGLT2 inhibitors (Dapagliflozin, Empagliflozin) for heart failure reduction',
        'Mineralocorticoid receptor antagonists (Spironolactone, Eplerenone)'
      ],
      surgicalInterventions: [
        'Percutaneous Coronary Intervention (PCI) with drug-eluting coronary stents',
        'Coronary Artery Bypass Grafting (CABG) surgery using internal mammary artery and saphenous vein grafts',
        'Transcatheter Aortic Valve Replacement (TAVR) or surgical valve repair/replacement',
        'Implantable Cardioverter-Defibrillator (ICD) and Cardiac Resynchronization Therapy (CRT)'
      ],
      conservativeCare: ['Daily weight monitoring and sodium restriction (<2,000 mg/day)', 'Fluid balance management in advanced heart failure'],
      rehabilitation: ['Supervised outpatient cardiac rehabilitation program with structured aerobic exercise conditioning']
    },
    preventionAndHealth: {
      lifestyleInterventions: ['Aerobic cardiovascular exercise (minimum 150 minutes moderate or 75 minutes vigorous exercise weekly)', 'Complete cessation of tobacco and nicotine products', 'Mediterranean-style dietary pattern rich in monounsaturated fats, whole grains, and leafy vegetables'],
      screeningProtocols: ['Routine blood pressure checks starting at age 18', 'Fasting lipid panel and cardiovascular risk assessment (ASCVD risk estimator) every 3-5 years from age 20-40, annually after 40', 'Blood glucose / HbA1c screening'],
      dietaryOrErgonomicRecommendations: ['Substitution of saturated fats with polyunsaturated/monounsaturated fatty acids', 'Daily dietary sodium reduction', 'Stress reduction through mindfulness, sufficient sleep (7-9 hours), and aerobic conditioning']
    },
    interestingFacts: [
      'The human heart beats approximately 100,000 times a day and over 2.5 billion times across an average 75-year human lifespan.',
      'Cardiomyocytes have virtually zero regenerative potential in adults; damaged tissue is replaced by non-contractile collagenous scar tissue.',
      'The heart possesses its own intrinsic nervous system (the "cardiac brain") containing approximately 40,000 intrinsic sensory neurons and local motor circuits.',
      'Coronary blood flow is unique: unlike all other organs whose perfusion peaks during ventricular systole, myocardial compression stops coronary flow during systole, meaning the heart receives its oxygenated blood almost exclusively during diastole.'
    ],
    references: [
      { title: "Gray's Anatomy: The Anatomical Basis of Clinical Practice (42nd ed.)", source: 'Elsevier Health Sciences', yearOrEdition: '2021', authoritativeBody: 'International Anatomical Advisory Board' },
      { title: 'Braunwald’s Heart Disease: A Textbook of Cardiovascular Medicine (12th ed.)', source: 'Elsevier', yearOrEdition: '2022', authoritativeBody: 'American College of Cardiology' },
      { title: 'AHA/ACC/HFSA Guideline for the Management of Heart Failure', source: 'Circulation / JACC', yearOrEdition: '2022', authoritativeBody: 'American Heart Association & American College of Cardiology' },
      { title: 'Terminology Anatomica (TA2)', source: 'FIPAT - International Federation of Associations of Anatomists', yearOrEdition: '2019', authoritativeBody: 'IFAA' }
    ],
    visualToolConfig: {
      diagramType: 'conduction',
      diagramTitle: 'Cardiac Conduction Hierarchy & Dual-Circuit Blood Circulation',
      diagramSubtitle: 'Sinoatrial pacemaker depolarization cascade, atrioventricular delay, and systemic vs pulmonary fluid flow dynamics.',
      pathologyComparison: {
        diseaseName: 'Coronary Atherosclerosis & Myocardial Infarction',
        normalState: {
          title: 'Patent Coronary Lumina & Healthy Myocardium',
          description: 'Smooth, intact endothelial lining with unobstructed lumen. Cardiomyocytes receive abundant oxygenated perfusion during ventricular diastole with normal contractility.',
          keyMarkers: ['Patent cross-sectional lumen (>95% open)', 'Intact endothelial glycocalyx barrier', 'Uncompromised wall motion on echocardiogram', 'Zero serum troponin leakage']
        },
        pathologicalState: {
          title: 'Atheromatous Plaque Rupture & Myocardial Necrosis',
          description: 'Fibrofatty intimal plaque rupture recruits platelets and thrombin, occluding coronary lumen. Downstream cardiomyocytes undergo ischemic depletion of ATP, loss of sarcomere contraction, and cellular lysis.',
          keyMarkers: ['Complete thrombotic occlusion of arterial branch', 'ST-segment elevation on surface ECG', 'Transmural ischemic necrosis with high-sensitivity troponin surge', 'Akinetic or dyskinetic ventricular wall segment']
        }
      },
      processFlow: {
        processName: 'Electromechanical Cardiac Activation Sequence',
        steps: [
          { stage: '1', title: 'SA Node Pacemaker Discharge', description: 'HCN4 funny currents initiate spontaneous diastolic depolarization reaching threshold (-40 mV).', factorOrRate: '60-100 bpm intrinsic firing rate' },
          { stage: '2', title: 'Bi-Atrial Myocardial Activation', description: 'Depolarization wavefront spreads across right and left atria via internodal pathways and Bachmann bundle.', factorOrRate: '0.8-1.0 m/s velocity (P wave)' },
          { stage: '3', title: 'AV Nodal Conduction Delay', description: 'Slow conduction through tiny, poorly coupled nodal cells pauses impulse by ~0.12 s to allow ventricular filling.', factorOrRate: '0.05 m/s velocity (PR interval)' },
          { stage: '4', title: 'Rapid His-Purkinje Propagation', description: 'Specialized Purkinje fibers rapidly distribute electrical charge to both endocardial ventricular surfaces simultaneously.', factorOrRate: '2.0-4.0 m/s velocity (QRS complex)' },
          { stage: '5', title: 'Calcium-Induced Calcium Release', description: 'L-type Ca2+ channel opening triggers massive RyR2 release from sarcoplasmic reticulum, engaging actin-myosin contraction.', factorOrRate: 'Systolic peak 120 mmHg pressure' },
          { stage: '6', title: 'Ventricular Repolarization & Diastole', description: 'Potassium channels (IKr, IKs) repolarize cardiomyocytes; SERCA2a re-sequesters calcium, allowing diastolic myocardial relaxation.', factorOrRate: 'T wave & coronary perfusion window' }
        ]
      },
      clinicalSummaryMatrix: [
        {
          category: 'Diagnostic Modality',
          items: [
            { label: '12-Lead ECG', value: 'First-line within 10 minutes for STEMI detection, arrhythmia diagnosis, and conduction analysis.' },
            { label: 'High-Sensitivity Troponin', value: 'Gold standard biomarker for acute myocardial injury; serial 0/1/3 hour testing.' },
            { label: 'Transthoracic Echo', value: 'Immediate non-invasive assessment of ejection fraction, valvular gradients, and wall motion.' },
            { label: 'Coronary Angiography', value: 'Definitive invasive gold standard for identifying coronary stenosis and delivering PCI.' }
          ]
        },
        {
          category: 'Core Pharmacotherapy',
          items: [
            { label: 'Dual Antiplatelet Therapy', value: 'Aspirin + P2Y12 inhibitor (Ticagrelor or Prasugrel) prevents stent thrombosis and recurrent ACS.' },
            { label: 'High-Intensity Statin', value: 'Atorvastatin 80mg or Rosuvastatin 40mg stabilizes coronary plaque and reduces LDL-C by >50%.' },
            { label: 'Quadruple HF Therapy', value: 'ARNI + Beta-blocker + MRA + SGLT2 inhibitor reduces cardiovascular death and hospitalizations by 73%.' }
          ]
        }
      ]
    }
  },

  skeletal: {
    id: 'skeletal',
    type: 'system',
    canonicalName: 'Skeletal System & Articulations',
    latinName: 'Systema skeletale',
    commonName: 'Human Skeleton & Bone Framework',
    system: 'skeletal',
    region: 'Whole Body / Axial & Appendicular Framework',
    conceptId: 'FMA7147',
    overview: {
      summary: 'The human skeletal system is a dynamic, highly vascularized biological framework comprising 206 named bones in adults, along with joints, ligaments, and cartilage. It is divided anatomically into the axial skeleton (80 bones: skull, vertebral column, ribs, sternum) and appendicular skeleton (126 bones: shoulder girdle, upper limbs, pelvic girdle, lower limbs).',
      keyTakeaways: [
        'Provides structural rigidity, visceral organ protection (cranium, rib cage, pelvis), and biomechanical lever arms for locomotion.',
        'Primary biological reservoir for calcium (99%) and phosphate (85%), essential for systemic mineral homeostasis.',
        'Hosts red bone marrow (hematopoiesis), generating over 200 billion red blood cells and 10 billion platelets daily.',
        'Continually remodeled throughout life by coordinated osteoclast resorption and osteoblast bone matrix synthesis.'
      ],
      physiologicalSignificance: 'Ensures upright bipedal posture and mechanical resilience against gravitational loads. Mineral reservoir buffering tightly regulates extracellular ionized calcium, preventing lethal neuromuscular tetany or cardiac arrest.'
    },
    anatomyAndLocation: {
      location: 'Spans the entire human body from the superior cranium to the distal phalanges of the feet, forming the central core of all body regions.',
      shapeAndDimensions: 'Varies by classification: Long bones (e.g., femur, humerus), Short bones (carpals, tarsals), Flat bones (parietal, scapula, sternum), Irregular bones (vertebrae, sphenoid), and Sesamoid bones (patella). Adult bone mass accounts for approximately 14-15% of total body weight (~10-12 kg).',
      surfaceProjections: 'Key palpable bony landmarks include the mastoid process, clavicle, spinous processes of vertebrae, olecranon, anterior superior iliac spine (ASIS), greater trochanter, and medial/lateral malleoli.',
      landmarks: [
        'Axial Skeleton (80 bones): Cranium, hyoid, auditory ossicles, vertebral column, sternum, ribs',
        'Appendicular Skeleton (126 bones): Clavicles, scapulae, humeri, radii, ulnae, carpals, metacarpals, phalanges, pelvic bones, femora, patellae, tibiae, fibulae, tarsals, metatarsals',
        'Diaphysis (cylindrical shaft), Epiphysis (expanded articular ends), Metaphysis (growth plate transitional zone)'
      ],
      anatomicalRelations: [
        { orientation: 'Axial Column', description: 'Central axis supporting the head, enclosing the brain and spinal cord, and articulating with the ribs.' },
        { orientation: 'Shoulder Girdle', description: 'Mobile anchor connecting upper extremities to axial skeleton via single small sternoclavicular joint.' },
        { orientation: 'Pelvic Girdle', description: 'Rigid bony ring transmitting upper body weight downward into bilateral femoral heads.' }
      ]
    },
    structureAndComposition: {
      tissueTypes: ['Cortical (compact) bone (80% of skeletal mass)', 'Trabecular (cancellous/spongy) bone (20% of skeletal mass)', 'Periosteum (dense fibrous vascular outer membrane)', 'Endosteum (cellular osteogenic inner lining)'],
      histologicalFeatures: [
        'Osteon (Haversian system): Cylindrical structural unit of concentric lamellae surrounding a central Haversian canal transmitting neurovascular vessels.',
        'Canaliculi: Microscopic fluid-filled canal networks linking osteocyte lacunae for mechanosensory signaling and nutrient diffusion.',
        'Volkmann canals: Transverse channels interconnecting Haversian canals with periosteal vasculature.'
      ],
      cellularMatrix: 'Composite material: Organic matrix (35%, primarily Type I collagen providing tensile elasticity) embedded within an inorganic ceramic matrix (65%, crystalline calcium hydroxyapatite [Ca10(PO4)6(OH)2] providing compressive strength).',
      substructures: [
        'Haversian canal & Volkmann canals',
        'Osteoblasts (bone builders), Osteoclasts (multinucleated bone resorbers), Osteocytes (resident mechanosensors)',
        'Medullary canal housing red and yellow marrow',
        'Synovial joint articular cartilage (hyaline cartilage lacking perichondrium)'
      ]
    },
    functions: {
      primary: [
        'Biomechanical support & leverage: Transmits muscular contraction forces to enable bipedal locomotion, grasping, and postural stabilization.',
        'Vital organ protection: Encloses central nervous system (skull and vertebral column) and cardiopulmonary viscera (rib cage).',
        'Hematopoiesis: Bone marrow stroma produces all myeloid and lymphoid blood cell lineages.'
      ],
      secondary: [
        'Endocrine regulation: Osteoblasts secrete osteocalcin, modulating insulin sensitivity, adiponectin, and testosterone.',
        'Heavy metal storage: Sequestering lead, arsenic, and radionuclides from systemic circulation.'
      ],
      biomechanicalRole: 'Anisotropic mechanical properties: Cortical bone exhibits superior strength under axial compression (~190 MPa) compared to tension (~130 MPa) or shear (~70 MPa). Trabecular architecture aligns precisely along lines of principal mechanical stress (Wolff’s Law).'
    },
    physiologicalMechanisms: {
      mechanismTitle: 'Bone Remodeling Cycle & Calcium Homeostasis',
      stepByStepFlow: [
        'Activation: Microdamage or mechanical unloading triggers osteocyte apoptosis and release of RANKL.',
        'Resorption: Hematopoietic monocyte precursors fuse into multinucleated osteoclasts, adhering via alpha-v-beta-3 integrins to form a sealed resorptive pit (Howship lacuna).',
        'Acidification: Osteoclast V-ATPase proton pumps secrete hydrochloric acid (dissolving hydroxyapatite) and Cathepsin K (cleaving Type I collagen).',
        'Reversal: Macrophage-like reversal cells clean bone debris and release growth factors (TGF-beta, IGF-1).',
        'Formation: Parathyroid hormone (PTH) and Wnt/beta-catenin signaling stimulate mesenchymal osteoblasts to synthesize unmineralized osteoid matrix.',
        'Mineralization: Alkaline phosphatase elevates local phosphate concentration, precipitating calcium hydroxyapatite crystals within collagen fibrils over several weeks.'
      ],
      regulatoryFeedback: 'Parathyroid Hormone (PTH) acts on osteoblasts to increase RANKL and decrease OPG, stimulating osteoclast resorption and liberating Ca2+ into plasma. Calcitonin weakly inhibits osteoclasts. Calcitriol (1,25-(OH)2 vitamin D) enhances intestinal calcium absorption.',
      cellularPathways: 'RANKL / RANK / Osteoprotegerin (OPG) pathway governing osteoclast differentiation; Wnt/LRP5/beta-catenin pathway governing osteoblastogenesis.'
    },
    neurovascular: {
      arterialSupply: 'Diaphyseal nutrient arteries penetrating through nutrient foraminas; periosteal arterial networks supplying outer third of cortex; metaphyseal and epiphyseal arterial plexuses.',
      venousDrainage: 'Central longitudinal medullary veins and periosteal venules draining into systemic deep venous circulation.',
      lymphaticDrainage: 'Confined exclusively to the outer periosteum; intraosseous bone tissue lacks lymphatic channels.',
      innervation: {
        motor: 'Vasomotor autonomic sympathetic fibers innervating intraosseous vascular smooth muscle.',
        sensory: 'Dense, richly arborized nociceptive A-delta and C nerve fibers distributed within the periosteum (accounting for the severe pain of bone fractures and periostitis).',
        autonomic: 'Sympathetic nerve terminals modulating osteoblast/osteoclast activity via beta-2 adrenergic receptors.'
      }
    },
    relatedStructures: [
      { id: 'muscular', name: 'Muscular System', relationship: 'Tendon insertions convert skeletal muscle contractions into skeletal movements' },
      { id: 'FJ3157', name: 'First Lumbar Vertebra (L1)', relationship: 'Representative axial skeletal load-bearing unit' },
      { id: 'connective', name: 'Connective & Cartilage', relationship: 'Articular hyaline cartilage and ligaments stabilizing skeletal joints' },
      { id: 'urinary', name: 'Urinary System', relationship: 'Kidneys activate Vitamin D (calcitriol) and regulate renal calcium/phosphate excretion' }
    ],
    pathologies: [
      {
        name: 'Osteoporosis & Fragility Fractures',
        prevalence: 'Affects >200 million people globally, including 1 in 3 women and 1 in 5 men over age 50.',
        pathophysiology: 'Estrogen deficiency or aging decouples bone remodeling: osteoclastic bone resorption outpaces osteoblastic bone formation, resulting in microarchitectural deterioration of trabecular lattices, cortical thinning, and high fracture susceptibility.',
        severity: 'critical',
        typicalCourse: 'Silent asymptomatic loss of bone mineral density → Low-trauma fragility fracture (vertebra, femoral neck, distal radius) → Chronic disability or mortality.'
      },
      {
        name: 'Osteoarthritis (Degenerative Joint Disease)',
        prevalence: '>500 million individuals globally.',
        pathophysiology: 'Biomechanical wear and low-grade inflammation cause progressive fibrillation and loss of articular cartilage, subchondral bone sclerosis, osteophyte formation, and joint space narrowing.',
        severity: 'moderate',
        typicalCourse: 'Morning stiffness < 30 minutes → Exertional joint pain → Loss of range of motion and joint deformity.'
      },
      {
        name: 'Traumatic Fractures (Closed / Compound)',
        prevalence: 'Millions of emergency presentations annually from vehicular trauma, falls, and sports.',
        pathophysiology: 'Applied mechanical stress exceeds the ultimate tensile/shear strength of bone matrix, disrupting cortical continuity and regional neurovascular supply.',
        severity: 'critical',
        typicalCourse: 'Acute pain, hematoma formation, fibrocartilaginous callus (weeks 1-3), bony callus (weeks 3-8), cortical remodeling (months).'
      }
    ],
    signsAndSymptoms: {
      hallmarkSigns: [
        'Acute focal bone pain, severe tenderness, and localized edema over fracture sites',
        'Visible bony deformity, shortening of limb, or pathological unnatural mobility',
        'Crepitus: Palpable or audible bone-on-bone grinding sensation upon movement',
        'Loss of height and progressive thoracic kyphosis (dowager’s hump) from vertebral compression fractures',
        'Joint stiffness, effusion, and antalgic gait'
      ],
      clinicalPresentation: 'Fragility fractures often present acutely following trivial falls from standing height. Vertebral fractures can present as sudden mid-back or lower-back pain or may remain subclinical, manifesting as progressive height loss and kyphosis.',
      emergencyRedFlags: [
        'Open (compound) fracture with bone fragments protruding through broken skin (urgent infection/osteomyelitis risk)',
        'Fracture accompanied by absent distal arterial pulses or pallor (acute vascular compromise)',
        'Progressive distal sensory or motor paralysis (acute compartment syndrome or spinal cord transection)',
        'Pelvic ring disruption with hemodynamic instability (internal retroperitoneal exsanguination)'
      ]
    },
    causesAndRiskFactors: {
      primaryCauses: ['Age-related estrogen/androgen withdrawal', 'Direct high-energy mechanical impact or torsional trauma', 'Repetitive biomechanical overuse (stress fractures)', 'Nutritional calcium/vitamin D deficiency (osteomalacia/rickets)'],
      geneticFactors: ['Osteogenesis imperfecta (COL1A1, COL1A2 mutations)', 'Low peak bone mass heritability (LRP5, ESR1 genes)'],
      modifiableRisks: ['Chronic corticosteroid pharmacotherapy', 'Tobacco smoking and high alcohol intake (>3 units/day)', 'Prolonged immobility and lack of weight-bearing impact exercise', 'Extremely low body mass index (BMI < 19 kg/m2)'],
      environmentalTriggers: ['Fall-prone domestic environments for geriatric populations', 'Contact sports and occupational heavy equipment hazards']
    },
    diagnosisAndInvestigations: {
      physicalExam: ['Inspection for skeletal asymmetry, joint alignment, and limb length discrepancy', 'Palpation of anatomical landmarks for focal point tenderness and joint effusions', 'Active and passive range of motion with neurovascular assessment distal to any suspected injury'],
      laboratoryWorkup: ['Serum ionized calcium, phosphate, intact PTH, and 25-hydroxyvitamin D levels', 'Bone turnover biomarkers: Serum CTX (C-telopeptide, bone resorption) and P1NP (procollagen type 1 N-terminal propeptide, bone formation)', 'Complete blood count and serum protein electrophoresis (to rule out multiple myeloma)'],
      imagingStudies: ['Dual-energy X-ray Absorptiometry (DXA): Gold standard for bone mineral density (T-score <= -2.5 defines osteoporosis)', 'Plain digital radiography (X-ray): First-line imaging in two orthogonal planes for fractures and alignment', 'High-resolution Computed Tomography (CT): Detailed 3D assessment of complex articular and pelvic fractures', 'Magnetic Resonance Imaging (MRI): Highly sensitive for occult stress fractures, bone marrow edema, and spinal cord impingement'],
      specialTests: ['FRAX (WHO Fracture Risk Assessment Tool) 10-year probability score', 'Bone scintigraphy (technetium-99m) for active metastatic disease or osteomyelitis']
    },
    treatmentAndManagement: {
      pharmacotherapy: [
        'Antiresorptive bisphosphonates (Alendronate, Zoledronic acid IV) inhibiting osteoclast farnesyl pyrophosphate synthase',
        'RANKL inhibitor monoclonal antibody (Denosumab 60mg SC every 6 months)',
        'Anabolic bone-forming PTH analogues (Teriparatide, Abaloparatide) stimulating osteoblast matrix synthesis',
        'Sclerostin inhibitor monoclonal antibody (Romosozumab) dual action: building bone and reducing resorption',
        'Daily elemental calcium (1,000-1,200 mg) and Vitamin D3 (800-2,000 IU) supplementation'
      ],
      surgicalInterventions: [
        'Open Reduction and Internal Fixation (ORIF) with titanium plates, intramedullary nails, and compression screws',
        'Total Joint Arthroplasty (hip, knee, shoulder) for end-stage osteoarthritis or femoral neck fractures',
        'Percutaneous Kyphoplasty / Vertebroplasty for painful osteoporotic vertebral collapse',
        'External fixation for open, contaminated fractures and damage-control orthopedics'
      ],
      conservativeCare: ['Rigid immobilization with cast, splint, or orthotic bracing during bone callus formation', 'Protected weight-bearing with crutches or walker'],
      rehabilitation: ['Progressive physical therapy for joint mobilization, gait retraining, and proprioceptive balance exercises to prevent falls']
    },
    preventionAndHealth: {
      lifestyleInterventions: ['Regular weight-bearing and high-impact resistance training to stimulate osteoblast mechanotransduction', 'Targeted balance and fall-prevention training (e.g., Tai Chi) for older adults', 'Cessation of tobacco smoking and moderation of alcohol consumption'],
      screeningProtocols: ['Baseline DXA screening in all women aged 65 and older, and men aged 70 and older', 'DXA screening in postmenopausal women and men aged 50-69 with clinical risk factors (prior fracture, steroids, rheumatoid arthritis)'],
      dietaryOrErgonomicRecommendations: ['Adequate dietary protein intake (1.0-1.2 g/kg/day) to support bone collagen matrix', 'Dietary calcium from dairy products, fortified plant milks, and leafy greens', 'Safe home modifications: grab bars, eliminating throw rugs, and ensuring bright lighting']
    },
    interestingFacts: [
      'At birth, human infants have approximately 270 bones; through developmental growth, many cartilage-precursor bones fuse together (such as cranial bones and sacrum) to yield the adult total of 206.',
      'The stapes (stirrup bone) in the middle ear is the smallest bone in the human body (measuring only 3 mm), while the femur (thigh bone) is the longest and strongest, capable of supporting up to 30 times an adult’s body weight.',
      'Bone is an active piezoelectric material: mechanical stress creates microscopic electrical potentials that direct osteoblasts to deposit new bone along the lines of greatest strain.',
      'Every 7 to 10 years, an adult human skeleton has replaced virtually all of its bone mineral through the continuous remodeling cycle.'
    ],
    references: [
      { title: "Gray's Anatomy: The Anatomical Basis of Clinical Practice (42nd ed.)", source: 'Elsevier Health Sciences', yearOrEdition: '2021', authoritativeBody: 'International Anatomical Advisory Board' },
      { title: 'Clinician’s Guide to Prevention and Treatment of Osteoporosis', source: 'Osteoporosis International', yearOrEdition: '2022', authoritativeBody: 'National Osteoporosis Foundation (Bone Health & Osteoporosis Foundation)' },
      { title: 'Rockwood and Green’s Fractures in Adults (9th ed.)', source: 'Wolters Kluwer', yearOrEdition: '2020', authoritativeBody: 'Orthopaedic Trauma Association' },
      { title: 'Terminologia Anatomica (TA2)', source: 'FIPAT / IFAA', yearOrEdition: '2019', authoritativeBody: 'International Federation of Associations of Anatomists' }
    ],
    visualToolConfig: {
      diagramType: 'bone',
      diagramTitle: 'Osteon Microarchitecture & Bone Remodeling Cascade',
      diagramSubtitle: 'Haversian canal neurovascular bundle, concentric lamellae, and coordinated osteoclast resorption vs osteoblast deposition.',
      pathologyComparison: {
        diseaseName: 'Trabecular Osteoporosis vs Normal Healthy Bone Matrix',
        normalState: {
          title: 'Normal Dense Trabecular Network & Cortical Thickness',
          description: 'Thick, interconnected horizontal and vertical trabecular plates. Abundant osteocyte connectivity providing high compressive strength and load distribution.',
          keyMarkers: ['Normal DXA T-score (>= -1.0)', 'Continuous cortical shell with low porosity', 'Dense cross-linked Type I collagen', 'Thick load-bearing trabecular plates']
        },
        pathologicalState: {
          title: 'Osteoporotic Bone Architecture & Trabecular Thinning',
          description: 'Trabecular plates undergo perforation and conversion to thin, disconnected rods. Cortical bone becomes porous and brittle, leading to fragility fractures under everyday physiological stresses.',
          keyMarkers: ['Osteoporotic DXA T-score (<= -2.5)', 'Disconnected micro-trabeculae with microfractures', 'Significant loss of bone volume fraction (BV/TV)', 'Elevated fracture risk from low-energy mechanical falls']
        }
      },
      processFlow: {
        processName: 'Cellular Bone Remodeling Sequence (Basic Multicellular Unit)',
        steps: [
          { stage: '1', title: 'Osteocyte Mechanosensory Signaling', description: 'Osteocytes detect mechanical microdamage or hormonal triggers (PTH) and release RANKL.', factorOrRate: 'RANKL / OPG ratio shift' },
          { stage: '2', title: 'Osteoclast Activation & Acidification', description: 'Multinucleated osteoclasts seal onto bone surface and pump H+ and cathepsin K, excavating a resorption trench.', factorOrRate: '2-3 weeks resorption phase' },
          { stage: '3', title: 'Reversal & Growth Factor Release', description: 'Resorption ceases; macrophage-like cells smooth the cavity floor and liberate matrix-bound TGF-beta and IGF-1.', factorOrRate: 'Coupling phase' },
          { stage: '4', title: 'Osteoblast Osteoid Deposition', description: 'Differentiated osteoblasts line the cavity and secrete unmineralized Type I collagen and ground substance.', factorOrRate: 'Osteoid deposition (several months)' },
          { stage: '5', title: 'Secondary Mineralization', description: 'Alkaline phosphatase triggers calcium hydroxyapatite crystal precipitation, maturing into hardened bone.', factorOrRate: 'Hydroxyapatite crystallization' },
          { stage: '6', title: 'Quiescence & Osteocyte Differentiation', description: 'A portion of osteoblasts become entrapped within the new mineral matrix, becoming resident osteocytes.', factorOrRate: 'Restored structural strength' }
        ]
      },
      clinicalSummaryMatrix: [
        {
          category: 'Diagnostic Investigation',
          items: [
            { label: 'DXA Scan (Bone Densitometry)', value: 'Gold standard for diagnostic classification: Normal (T >= -1.0), Osteopenia (-1.0 to -2.5), Osteoporosis (<= -2.5).' },
            { label: 'Serum CTX & P1NP', value: 'Dynamic biomarkers reflecting real-time osteoclast resorption and osteoblast matrix synthesis.' },
            { label: 'Radiographs (X-ray)', value: 'Confirms cortical discontinuity, displacement, comminution, and articular involvement of acute fractures.' },
            { label: 'Magnetic Resonance (MRI)', value: 'Highest sensitivity for radiographically occult fractures and bone marrow edema/contusion.' }
          ]
        },
        {
          category: 'Evidence-Based Interventions',
          items: [
            { label: 'Bisphosphonates (Oral/IV)', value: 'First-line therapy; strongly suppresses osteoclastic resorption and reduces vertebral/hip fractures by 40-70%.' },
            { label: 'Anabolic Agents (Teriparatide)', value: 'Recombinant PTH stimulating de novo osteoblast bone formation for severe osteoporosis.' },
            { label: 'Surgical ORIF', value: 'Anatomical reduction, rigid internal fixation, and early post-operative mobilization.' }
          ]
        }
      ]
    }
  },

  nervous: {
    id: 'nervous',
    type: 'system',
    canonicalName: 'Nervous System & Neural Axis',
    latinName: 'Systema nervosum',
    commonName: 'Brain, Spinal Cord & Peripheral Nerves',
    system: 'nervous',
    region: 'Cranial Cavity, Spinal Canal & Peripheral Tissues',
    conceptId: 'FMA7157',
    overview: {
      summary: 'The nervous system is the master communication, processing, and control network of the human body. It is divided anatomically into the Central Nervous System (CNS: brain and spinal cord) and Peripheral Nervous System (PNS: 12 pairs of cranial nerves, 31 pairs of spinal nerves, and the autonomic nervous system).',
      keyTakeaways: [
        'Composed of approximately 86 billion neurons interconnected by over 100 trillion synaptic contacts, supported by 85 billion glial cells.',
        'High metabolic demand: Consumes 20% of total resting cardiac output and 20% of systemic oxygen and glucose despite accounting for only 2% of total body mass.',
        'Blood-Brain Barrier (BBB): High-resistance endothelial tight junctions protecting neural tissue from circulating toxins and pathogens.',
        'Autonomic division coordinates involuntary homeostasis via sympathetic ("fight-or-flight") and parasympathetic ("rest-and-digest") pathways.'
      ],
      physiologicalSignificance: 'Underpins all human consciousness, cognitive processing, sensory perception, motor control, emotional integration, and autonomic visceral stability. Ischemic injury produces irreversible neuronal death within minutes.'
    },
    anatomyAndLocation: {
      location: 'The CNS is housed within the protective bony neurocranium (brain) and vertebral canal (spinal cord). The PNS extends peripheral nerve trunks to every somatic and visceral tissue.',
      shapeAndDimensions: 'The adult human brain weighs roughly 1,300-1,400 grams with a volume of ~1,200-1,400 cm3. The spinal cord measures approximately 42-45 cm in length, terminating at the L1-L2 vertebral level as the conus medullaris.',
      surfaceProjections: 'Key topographic landmarks include the central sulcus of Rolando (separating motor from sensory cortex), lateral sulcus of Sylvius, external occipital protuberance (inion), and pterion (deep to which courses the anterior division of the middle meningeal artery).',
      landmarks: [
        'Cerebrum (Frontal, Parietal, Temporal, Occipital, and Insular lobes)',
        'Diencephalon (Thalamus, Hypothalamus, Epithalamus)',
        'Brainstem (Midbrain, Pons, Medulla oblongata)',
        'Cerebellum (vermis and bilateral cerebellar hemispheres)',
        'Spinal Cord with cervical and lumbosacral enlargements, conus medullaris, cauda equina',
        'Cranial Nerves I through XII'
      ],
      anatomicalRelations: [
        { orientation: 'Enveloping Meninges', description: 'Dura mater (outer tough pachymeninx), arachnoid mater (web-like with subarachnoid CSF space), and pia mater (intimately adhering leptomeninx).' },
        { orientation: 'Ventricles & CSF', description: 'Four fluid-filled ventricles (lateral, third, fourth) containing ~150 mL of circulating cerebrospinal fluid produced by the choroid plexuses.' }
      ]
    },
    structureAndComposition: {
      tissueTypes: ['Gray matter (unmyelinated neuronal cell bodies, dendrites, synapses, and capillaries)', 'White matter (myelinated axon bundles forming projection, commissural, and association tracts)', 'Neuroglia (astrocytes, oligodendrocytes, microglia, ependymal cells, Schwann cells)'],
      histologicalFeatures: [
        'Neurons: Specialized excitable cells featuring dendritic arborizations, soma with Nissl substance, axon hillock (trigger zone), and telodendria terminating at chemical synapses.',
        'Myelin sheath: Lipoprotein insulating layer formed by oligodendrocytes in the CNS and Schwann cells in the PNS, interrupted by nodes of Ranvier enabling rapid saltatory conduction (up to 120 m/s).',
        'Astrocytic end-feet: Covering >99% of cerebral microvascular capillaries, inducing tight junction claudin-5 expression in the blood-brain barrier.'
      ],
      cellularMatrix: 'Extremely sparse fibrous stroma; neural parenchymal cells are suspended in a specialized extracellular matrix enriched with hyaluronic acid, chondroitin sulfate proteoglycans (perineuronal nets), and tenascins.',
      substructures: [
        'Cerebral cortex (6-layered neocortex)',
        'Basal ganglia (Caudate nucleus, Putamen, Globus pallidus, Subthalamic nucleus, Substantia nigra)',
        'Limbic system (Hippocampus, Amygdala, Cingulate gyrus)',
        'Internal capsule (anterior limb, genu, posterior limb carrying corticospinal tract)',
        'Cranial nerve nuclei and reticular activating system in brainstem'
      ]
    },
    functions: {
      primary: [
        'Electrochemical signal transduction: Generation and propagation of all-or-none action potentials down axonal membranes.',
        'Sensory processing: Transduction, integration, and conscious perception of somatosensory, visual, auditory, gustatory, and vestibular inputs.',
        'Motor execution: Pyramidal (corticospinal) and extrapyramidal pathways controlling voluntary movement, posture, and motor coordination.'
      ],
      secondary: [
        'Higher cognitive functions: Language (Broca’s and Wernicke’s areas), executive reasoning, memory consolidation, and affective integration.',
        'Autonomic visceral homeostasis: Medullary respiratory and cardiovascular control centers regulating blood pressure, heart rate, and gastrointestinal motility.'
      ],
      biomechanicalRole: 'CSF buoyancy: The brain weighs ~1,400 g in air, but submerged in cerebrospinal fluid its effective net weight drops to ~25-50 g, preventing mechanical deformation under its own gravitational mass.'
    },
    physiologicalMechanisms: {
      mechanismTitle: 'Neuronal Action Potential & Synaptic Neurotransmission',
      stepByStepFlow: [
        'Resting membrane potential is maintained at approximately -70 mV by Na+/K+-ATPase pumps and potassium leak channels.',
        'Excitatory postsynaptic potentials (EPSPs) summate at the axon hillock; reaching threshold (-55 mV) opens voltage-gated Nav1.2/1.6 sodium channels.',
        'Rapid sodium influx causes explosive depolarization up to +30 mV, followed by rapid sodium channel inactivation.',
        'Voltage-gated Kv potassium channels open, driving rapid potassium efflux and membrane repolarization (with transient hyperpolarization).',
        'Action potential reaches presynaptic terminal, triggering voltage-gated Cav2.1/2.2 calcium channel opening.',
        'Calcium influx promotes SNARE-mediated synaptic vesicle fusion (synaptotagmin, syntaxin, SNAP-25, VAMP/synaptobrevin).',
        'Neurotransmitter exocytosis into synaptic cleft (e.g., Glutamate, GABA, Acetylcholine, Dopamine) and postsynaptic receptor binding.'
      ],
      regulatoryFeedback: 'Neurotransmitter termination occurs via active reuptake transporters (e.g., EAAT, DAT, SERT, NET) and enzymatic degradation (acetylcholinesterase, monoamine oxidase, COMT). Autoreceptors on presynaptic terminals provide negative feedback inhibition.',
      cellularPathways: 'Long-Term Potentiation (LTP) and synaptic plasticity mediated by NMDA and AMPA glutamate receptor trafficking; CaMKII signaling cascade.'
    },
    neurovascular: {
      arterialSupply: 'Dual arterial systems forming the Circle of Willis (Anterior circulation: Internal Carotid Arteries dividing into Anterior and Middle Cerebral Arteries; Posterior circulation: Vertebral Arteries uniting to form the Basilar Artery, branching into Posterior Cerebral Arteries).',
      venousDrainage: 'Cerebral cortical veins draining into Dural Venous Sinuses (Superior Sagittal, Inferior Sagittal, Straight, Transverse, and Sigmoid Sinuses), coalescing into the Internal Jugular Veins.',
      lymphaticDrainage: 'Glymphatic system: Astrocytic aquaporin-4 (AQP4) water channels drive convective bulk flow of CSF along periarterial spaces through the brain parenchyma, clearing metabolic solutes (including amyloid-beta and tau) during sleep into deep cervical lymph nodes.',
      innervation: {
        motor: 'Somatic motor efferents innervating skeletal muscles; visceral motor (sympathetic and parasympathetic) innervating smooth muscle, cardiac muscle, and glands.',
        sensory: 'General somatic afferents (touch, pain, temperature, proprioception) and special sensory afferents.',
        autonomic: 'Sympathetic outflow from thoracolumbar spinal cord (T1-L2); parasympathetic outflow from craniosacral axis (CN III, VII, IX, X and S2-S4).'
      }
    },
    relatedStructures: [
      { id: 'sensory', name: 'Sensory Organs', relationship: 'Sensory receptors transduce environmental stimuli directly into cranial/peripheral nerve signals' },
      { id: 'muscular', name: 'Muscular System', relationship: 'Neuromuscular junction transmits motor commands via acetylcholine' },
      { id: 'cardiac', name: 'Cardiovascular & Cardiac System', relationship: 'Autonomic nervous system modulates heart rate, cardiac contractility, and vascular resistance' },
      { id: 'endocrine', name: 'Endocrine System', relationship: 'Hypothalamus coordinates neural and endocrine regulation via pituitary gland' }
    ],
    pathologies: [
      {
        name: 'Acute Ischemic Stroke & Intracerebral Hemorrhage',
        prevalence: 'Second leading cause of death worldwide (~5.5 million deaths annually).',
        pathophysiology: 'Thromboembolic arterial occlusion (or vessel rupture) causes immediate focal cerebral ischemia, energy failure, cytotoxic edema, glutamate excitotoxicity, and neuronal infarction within minutes.',
        severity: 'critical',
        typicalCourse: 'Sudden onset focal neurological deficit (BE-FAST: balance, eyes, face, arm, speech) → Infarction core expansion if untreated → Permanent disability or death.'
      },
      {
        name: 'Alzheimer’s Disease & Neurodegenerative Dementias',
        prevalence: '>55 million individuals affected worldwide.',
        pathophysiology: 'Extracellular accumulation of amyloid-beta 42 senile plaques and intracellular hyperphosphorylated tau neurofibrillary tangles lead to progressive synaptic loss, hippocampal atrophy, and severe cognitive impairment.',
        severity: 'critical',
        typicalCourse: 'Short-term memory deficits → Executive dysfunction and language impairment → Total dependence.'
      },
      {
        name: 'Multiple Sclerosis (MS)',
        prevalence: '~2.8 million individuals globally (predominantly young adult females).',
        pathophysiology: 'Autoimmune-mediated inflammatory demyelination and axonal degeneration in the CNS, driven by autoreactive T-cells and B-cells crossing the blood-brain barrier.',
        severity: 'moderate',
        typicalCourse: 'Relapsing-remitting episodes of optic neuritis, sensory paresthesias, or motor weakness → Progressive disability.'
      }
    ],
    signsAndSymptoms: {
      hallmarkSigns: [
        'Sudden focal neurological deficits: Unilateral facial droop, hemiparesis, or sensory numbness',
        'Aphasia (expressive Broca’s or receptive Wernicke’s) and dysarthria (slurred speech)',
        'Seizure activity, altered mental status, and progressive memory loss',
        'Tremor (resting tremor in Parkinson’s, intention tremor in cerebellar lesions)',
        'Ataxia, gait instability, and loss of proprioceptive balance (positive Romberg sign)'
      ],
      clinicalPresentation: 'Acute ischemic stroke manifests as sudden-onset painless weakness or numbness of the face, arm, or leg, especially on one side of the body, coupled with confusion, difficulty speaking, vision loss, or balance disturbance.',
      emergencyRedFlags: [
        'Sudden severe "thunderclap" headache (maximal intensity within seconds, suspicious for subarachnoid hemorrhage)',
        'Sudden hemiparesis, facial droop, or aphasia (acute stroke: "Time is Brain")',
        'Status epilepticus: Continuous seizure activity lasting >5 minutes without regaining consciousness',
        'Fixed dilated pupil with progressive coma (uncal herniation and brainstem compression)'
      ]
    },
    causesAndRiskFactors: {
      primaryCauses: ['Cerebrovascular thromboembolism and atherosclerosis', 'Autoimmune demyelinating cascades', 'Traumatic brain injury (concussion, contusion, diffuse axonal injury)', 'Genetic neurodegenerative proteopathies'],
      geneticFactors: ['Apolipoprotein E epsilon-4 allele (APOE-e4) for sporadic Alzheimer’s', 'Huntingtin gene (HTT) CAG trinucleotide repeat expansion', 'Amyotrophic lateral sclerosis (SOD1, C9orf72 mutations)'],
      modifiableRisks: ['Arterial hypertension (single greatest risk factor for ischemic and hemorrhagic stroke)', 'Diabetes mellitus and hypercholesterolemia', 'Cigarette smoking and obstructive sleep apnea', 'Physical inactivity and social isolation'],
      environmentalTriggers: ['Neurotoxin exposures (lead, organophosphates, carbon monoxide)', 'Central nervous system viral infections (herpes simplex encephalitis, enterovirus)']
    },
    diagnosisAndInvestigations: {
      physicalExam: ['Complete neurological examination: Cranial nerves I-XII, motor bulk and strength (0-5 scale), deep tendon reflexes, sensory pinprick/vibration, cerebellar coordination (finger-to-nose, rapid alternating movements), and gait analysis', 'Glasgow Coma Scale (GCS) and NIH Stroke Scale (NIHSS) scoring'],
      laboratoryWorkup: ['Lumbar puncture and CSF analysis (opening pressure, cell count, protein, glucose, oligoclonal bands for MS)', 'Serum metabolic panel, glucose, B12/folate, thyroid function, and rapid toxicological drug screens'],
      imagingStudies: ['Non-contrast Head CT: First-line immediate test to rule out acute intracerebral hemorrhage prior to thrombolysis', 'Brain MRI with Diffusion-Weighted Imaging (DWI): Gold standard for detecting hyperacute ischemic infarction within minutes of onset', 'CT / MR Angiography of head and neck: Visualizing large vessel occlusions (LVO) and carotid stenosis', 'Functional MRI (fMRI) and Positron Emission Tomography (PET) for metabolic and amyloid/tau imaging'],
      specialTests: ['Electroencephalography (EEG) for seizure localization and encephalopathy evaluation', 'Electromyography (EMG) and Nerve Conduction Studies (NCS) for peripheral neuropathies']
    },
    treatmentAndManagement: {
      pharmacotherapy: [
        'Intravenous thrombolysis with recombinant tissue plasminogen activator (Alteplase / Tenecteplase) within 4.5 hours of acute ischemic stroke onset',
        'Disease-Modifying Therapies (DMTs) for Multiple Sclerosis (Ocrelizumab, Natalizumab, Fingolimod)',
        'Dopaminergic replacement (Levodopa/Carbidopa) and dopamine agonists for Parkinson’s disease',
        'Antiseizure medications (Levetiracetam, Lamotrigine, Valproic acid, Carbamazepine)',
        'Cholinesterase inhibitors (Donepezil, Rivastigmine) and NMDA antagonists (Memantine) for dementia'
      ],
      surgicalInterventions: [
        'Mechanical Endovascular Thrombectomy (EVT) for large vessel stroke occlusions within up to 24 hours',
        'Surgical clipping or endovascular coiling of intracranial cerebral aneurysms',
        'Deep Brain Stimulation (DBS) for advanced Parkinson’s disease and refractory tremor',
        'Decompressive hemicraniectomy for malignant middle cerebral artery infarction or refractory intracranial hypertension'
      ],
      conservativeCare: ['Neuro-intensive care monitoring: maintaining cerebral perfusion pressure (CPP = MAP - ICP)', 'Strict glycemic control and normothermia in acute brain injury'],
      rehabilitation: ['Multidisciplinary neurorehabilitation: Physical therapy, occupational therapy, and speech-language pathology']
    },
    preventionAndHealth: {
      lifestyleInterventions: ['Rigorous management of blood pressure (target < 130/80 mmHg) to prevent cerebrovascular disease', 'Cognitive reserve enrichment through lifelong learning, bilingualism, and social engagement', 'Regular aerobic exercise promoting neurogenesis via brain-derived neurotrophic factor (BDNF)'],
      screeningProtocols: ['Blood pressure screening starting at age 18', 'Carotid duplex ultrasound screening in patients with transient ischemic attacks (TIAs) or neck bruits', 'Cognitive screening (MoCA / MMSE) in adults over 65 presenting with memory complaints'],
      dietaryOrErgonomicRecommendations: ['MIND diet (Mediterranean-DASH Diet Intervention for Neurodegenerative Delay) rich in berries, leafy greens, and omega-3 fatty acids', 'Protective helmet use during cycling and contact sports to prevent traumatic brain injury', 'Sleep hygiene: 7-8 hours of uninterrupted sleep to support glymphatic clearance']
    },
    interestingFacts: [
      'The human brain has roughly 86 billion neurons, each connected to an average of 7,000 synaptic connections, creating more potential neural computational states than the estimated number of elementary particles in the observable universe.',
      'Information travels along myelinated nerve fibers at speeds up to 120 meters per second (over 270 miles per hour / 430 km/h).',
      'The brain itself lacks nociceptors (pain-sensitive nerve endings); neurosurgeons can operate directly on the awake brain while patients talk and perform cognitive tasks with only local scalp anesthesia.',
      'During deep non-REM slow-wave sleep, glial cells shrink by approximately 60%, drastically expanding interstitial space to allow cerebrospinal fluid to flush through brain tissue in a biological "dishwasher" cycle.'
    ],
    references: [
      { title: "Principles of Neural Science (6th ed.)", source: 'McGraw-Hill', yearOrEdition: '2021', authoritativeBody: 'Kandel, Koester, Mack, Siegelbaum' },
      { title: "Gray's Anatomy: The Anatomical Basis of Clinical Practice (42nd ed.)", source: 'Elsevier Health Sciences', yearOrEdition: '2021', authoritativeBody: 'International Anatomical Advisory Board' },
      { title: 'AHA/ASA Guidelines for the Early Management of Patients With Acute Ischemic Stroke', source: 'Stroke', yearOrEdition: '2019', authoritativeBody: 'American Heart Association / American Stroke Association' },
      { title: 'Terminologia Neuroanatomica (TNA)', source: 'FIPAT / IFAA', yearOrEdition: '2017', authoritativeBody: 'International Federation of Associations of Anatomists' }
    ],
    visualToolConfig: {
      diagramType: 'neural',
      diagramTitle: 'Cerebral Functional Mapping & Synaptic Neurotransmission Cascade',
      diagramSubtitle: 'Neocortical functional division, axonal action potential propagation, and presynaptic vesicular exocytosis.',
      pathologyComparison: {
        diseaseName: 'Ischemic Stroke vs Normal Cerebral Perfusion',
        normalState: {
          title: 'Normal Cerebral Blood Flow & Astrocytic Coupling',
          description: 'Cerebral blood flow is tightly autoregulated between 50-60 mL/100g/min. Continuous glucose and oxygen delivery sustains neuronal membrane resting potentials and ATP synthesis.',
          keyMarkers: ['Patent cerebral arterial conduits', 'Intact blood-brain barrier tight junctions', 'Normal diffusion on brain MRI (no hyperintensity)', 'Baseline neurological function (NIHSS = 0)']
        },
        pathologicalState: {
          title: 'Acute Thromboembolic Occlusion & Ischemic Penumbra',
          description: 'Sudden arterial occlusion drops perfusion below 10-12 mL/100g/min, causing rapid cellular ATP depletion, failure of Na+/K+ pumps, cytotoxic intracellular swelling, and irreversible infarction core.',
          keyMarkers: ['Intracranial arterial cut-off on CTA/MRA', 'Restricted diffusion (bright DWI / dark ADC) on MRI', 'Cytotoxic neuronal edema and glutamate excitotoxicity', 'Severe focal neurological deficits']
        }
      },
      processFlow: {
        processName: 'Axonal Action Potential & Chemical Synaptic Transmission',
        steps: [
          { stage: '1', title: 'Resting Membrane Potential', description: 'Na+/K+ ATPase and K+ leak channels maintain negative interior charge (-70 mV).', factorOrRate: '-70 mV baseline' },
          { stage: '2', title: 'Threshold Depolarization', description: 'Summated EPSPs at axon hillock reach -55 mV threshold, triggering voltage-gated Nav channels.', factorOrRate: 'All-or-none threshold' },
          { stage: '3', title: 'Saltatory Conduction', description: 'Action potential jumps rapidly between unmyelinated nodes of Ranvier along the axon.', factorOrRate: 'Up to 120 m/s' },
          { stage: '4', title: 'Presynaptic Calcium Influx', description: 'Depolarization opens voltage-gated Cav channels, causing localized microdomain calcium surge.', factorOrRate: 'Cav2.1/Cav2.2 activation' },
          { stage: '5', title: 'SNARE Vesicle Exocytosis', description: 'Synaptotagmin senses calcium and triggers SNARE pin fusion, expelling neurotransmitters into cleft.', factorOrRate: '<1 millisecond latency' },
          { stage: '6', title: 'Postsynaptic Activation & Clearance', description: 'Transmitters bind ionotropic/metabotropic receptors; active reuptake transporters clear cleft.', factorOrRate: 'EAAT / DAT / SERT reuptake' }
        ]
      },
      clinicalSummaryMatrix: [
        {
          category: 'Diagnostic Workup',
          items: [
            { label: 'Non-contrast Head CT', value: 'Immediate rule-out for intracranial hemorrhage prior to deciding on thrombolysis.' },
            { label: 'MRI with DWI / ADC', value: 'Gold standard for early ischemic stroke detection within minutes of symptom onset.' },
            { label: 'Lumbar Puncture (CSF)', value: 'Essential for diagnosing subarachnoid hemorrhage, meningitis, encephalitis, and multiple sclerosis.' },
            { label: 'CT Angiography (CTA)', value: 'Identifies treatable large vessel occlusions (ICA, MCA M1/M2, Basilar artery).' }
          ]
        },
        {
          category: 'Therapeutic Arsenal',
          items: [
            { label: 'IV Thrombolysis (tPA/TNK)', value: 'Restores microvascular patency if administered within 4.5 hours of ischemic stroke.' },
            { label: 'Endovascular Thrombectomy', value: 'Direct catheter mechanical clot retrieval; effective up to 24 hours in selected patients.' },
            { label: 'Levodopa / Carbidopa', value: 'Gold standard dopamine replacement therapy for Parkinsonian motor symptoms.' }
          ]
        }
      ]
    }
  }
};

