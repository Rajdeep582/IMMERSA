import { os, sp } from '../../data/references';
import type { Topic } from '../types';

export const VISCERAL_TOPICS: Topic[] = [
  {
    id: 'digestive',
    title: 'Digestive system',
    system: 'digestive',
    tagline: 'The alimentary canal and accessory organs that break food down, absorb nutrients and eliminate waste.',
    focus: { male: 'sys:digestive', female: 'sys:digestive' },
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'bullets', items: ['**Alimentary canal** (~7–9 m): mouth → pharynx → [[Esophagus|oesophagus]] → [[Stomach]] → small intestine → large intestine → anus.', '**Accessory organs**: teeth, tongue, salivary glands, [[Liver]], [[Gallbladder]], [[Pancreas]].'] },
          { t: 'figure', caption: 'Digestive organs in the model.', target: { male: 'sys:digestive', female: 'sys:digestive' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          { t: 'layers', title: 'Wall of the gut tube (inside → out)', layers: [{ name: 'Mucosa', note: 'epithelium, lamina propria, muscularis mucosae' }, { name: 'Submucosa', note: 'vessels, glands, submucosal (Meissner) plexus' }, { name: 'Muscularis externa', note: 'inner circular + outer longitudinal; myenteric (Auerbach) plexus' }, { name: 'Serosa / adventitia', note: 'visceral peritoneum, or connective tissue' }] },
        ],
      },
      {
        id: 'function',
        title: 'How digestion works',
        blocks: [
          { t: 'flow', title: 'Six processes', steps: [{ label: 'Ingestion' }, { label: 'Propulsion', note: 'swallowing, peristalsis' }, { label: 'Mechanical digestion', note: 'chewing, churning, segmentation' }, { label: 'Chemical digestion', note: 'enzymes, bile' }, { label: 'Absorption', note: 'mainly small intestine' }, { label: 'Defecation' }] },
          { t: 'table', head: ['Organ', 'Main job'], rows: [['Stomach', 'Stores food, acid + pepsin begin protein digestion'], ['Small intestine', 'Completes digestion; absorbs most nutrients'], ['Liver', 'Makes **bile**, processes absorbed nutrients, detoxifies'], ['Pancreas', 'Digestive enzymes and bicarbonate into the duodenum'], ['Large intestine', 'Absorbs water and electrolytes; forms faeces']] },
        ],
      },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Peptic ulcer** — often *H. pylori* or NSAIDs.', '**Gallstones** — biliary colic; may block the bile or pancreatic ducts.', '**Appendicitis** — periumbilical pain moving to the right iliac fossa.', '**Colorectal cancer** — screening detects polyps early.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Four wall layers: **mucosa, submucosa, muscularis externa, serosa**.', 'Most absorption happens in the **small intestine**; water reclaimed in the colon.', 'Enteric nervous system can run the gut independently.'] }] },
    ],
    quiz: [{ q: 'Which organ produces bile?', a: 'The **liver** (the gallbladder stores and concentrates it).' }, { q: 'Where does most nutrient absorption occur?', a: 'In the **small intestine**.' }],
    refs: [os('23.1 Overview of the Digestive System'), os('23.2 Digestive System Processes and Regulation'), sp('Physiology, Digestion')],
  },

  {
    id: 'stomach',
    title: 'Stomach',
    system: 'digestive',
    parent: 'digestive',
    tagline: 'A muscular J-shaped sac that stores food and begins protein digestion with acid and pepsin.',
    focus: { male: 'Stomach', female: 'Stomach' },
    match: /stomach|gastric|pylor|cardia|fundus of stomach/i,
    minutes: 3,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'p', text: 'Lies in the **left upper quadrant** (epigastric and left hypochondriac regions), between the oesophagus and the duodenum, below the left dome of the diaphragm.' }, { t: 'figure', caption: 'Stomach.', target: { male: 'Stomach', female: 'Stomach' } }] },
      { id: 'structure', title: 'Structure', blocks: [{ t: 'bullets', items: ['Regions: **cardia, fundus, body, pyloric part** (antrum, canal, pyloric sphincter).', '**Lesser curvature** (right/upper) and **greater curvature** (left/lower).', 'Extra **oblique** muscle layer; mucosal folds called **rugae**.', 'Gastric glands: **parietal cells** (HCl, intrinsic factor), **chief cells** (pepsinogen), G cells (gastrin).'] }] },
      { id: 'function', title: 'How it works', blocks: [{ t: 'steps', items: ['Stores a meal and releases it slowly into the duodenum.', 'Churning mixes food with gastric juice into **chyme**.', 'Acid (pH 1.5–3.5) kills microbes and activates pepsin.', '**Intrinsic factor** enables vitamin B12 absorption in the terminal ileum.'] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Peptic ulcer disease** and gastritis.', '**Pernicious anaemia** — autoimmune loss of parietal cells → B12 deficiency.', '**Pyloric stenosis** in infants — projectile vomiting.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Parietal cells: **HCl + intrinsic factor**; chief cells: **pepsinogen**.', 'Three muscle layers (oblique, circular, longitudinal).'] }] },
    ],
    quiz: [{ q: 'Which gastric cells secrete intrinsic factor?', a: '**Parietal cells**.' }],
    refs: [os('23.4 The Stomach'), sp('Anatomy, Abdomen and Pelvis, Stomach')],
  },

  {
    id: 'liver',
    title: 'Liver, gallbladder and pancreas',
    system: 'digestive',
    parent: 'digestive',
    tagline: 'Accessory glands that make bile and digestive enzymes and regulate metabolism.',
    focus: { male: 'Liver', female: 'Liver' },
    match: /liver|hepat|gallbladder|biliary|bile|cystic|pancrea|ampulla|segment|lobe|caudate|quadrate|impression/i,
    minutes: 5,
    sections: [
      { id: 'overview', title: 'What they are and where they are', blocks: [{ t: 'bullets', items: ['[[Liver]] — largest internal organ (~1.5 kg), **right upper quadrant** under the diaphragm.', '[[Gallbladder]] — pear-shaped sac on the underside of the liver.', '[[Pancreas]] — behind the stomach (retroperitoneal); head in the duodenal C-loop, tail near the spleen.'] }, { t: 'figure', caption: 'Liver, gallbladder, biliary tree and pancreas.', target: { male: 'Liver', female: 'Liver' } }] },
      { id: 'structure', title: 'Structure', blocks: [{ t: 'bullets', items: ['Liver lobes: right, left, caudate, quadrate; surgically **8 Couinaud segments**.', 'Dual blood supply: **hepatic portal vein (~75%)** and **hepatic artery (~25%)**; drained by hepatic veins into the IVC.', 'Functional unit: the **hepatic lobule** with a portal triad (portal vein, hepatic artery, bile duct) at each corner.'] }, { t: 'flow', title: 'Bile flow', steps: [{ label: 'Hepatocytes' }, { label: 'Right & left hepatic ducts' }, { label: 'Common hepatic duct' }, { label: '+ cystic duct (gallbladder)' }, { label: 'Common bile duct' }, { label: 'Hepatopancreatic ampulla', note: 'joins pancreatic duct' }, { label: 'Duodenum', note: 'major duodenal papilla' }] }] },
      { id: 'function', title: 'Main functions', blocks: [{ t: 'table', head: ['Organ', 'Functions'], rows: [['Liver', 'Bile production; glucose, fat and protein metabolism; plasma proteins (albumin, clotting factors); detoxification; storage (glycogen, iron, vitamins A, D, B12)'], ['Gallbladder', 'Stores and concentrates bile; contracts after fatty meals (CCK)'], ['Pancreas', '**Exocrine** (~99%): enzymes + bicarbonate. **Endocrine**: islets — insulin (β), glucagon (α)']] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Cirrhosis** — scarring from alcohol, viral hepatitis or fatty liver; portal hypertension.', '**Jaundice** — yellow skin from raised bilirubin (pre-hepatic, hepatic or obstructive).', '**Cholecystitis** — right upper quadrant pain, positive Murphy sign.', '**Pancreatitis** — gallstones and alcohol are the commonest causes; epigastric pain to the back.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Portal vein brings nutrient-rich blood from the gut to the liver.', 'Bile emulsifies fat; it contains no digestive enzymes.', 'Pancreas = exocrine + endocrine gland.'] }] },
    ],
    quiz: [{ q: 'What fraction of liver blood comes from the hepatic portal vein?', a: 'About **75%**.' }, { q: 'Which hormone makes the gallbladder contract?', a: '**Cholecystokinin (CCK)**.' }],
    refs: [os('23.5 Accessory Organs in Digestion: The Liver, Pancreas, and Gallbladder'), sp('Anatomy, Abdomen and Pelvis, Liver')],
  },

  {
    id: 'intestines',
    title: 'Small and large intestine',
    system: 'digestive',
    parent: 'digestive',
    tagline: 'The long tube where nutrients are absorbed (small intestine) and water is reclaimed (large intestine).',
    focus: { male: 'grp:digestive/large-intestine', female: 'grp:digestive/large-intestine' },
    match: /intestin|duoden|jejun|ileum|colon|caecum|cecum|appendix|rectum|sigmoid|flexure|anal/i,
    minutes: 5,
    sections: [
      { id: 'overview', title: 'What they are and where they are', blocks: [{ t: 'bullets', items: ['**Small intestine** (~6 m): [[Duodenum]] (C-shaped, mostly retroperitoneal) → jejunum → ileum, coiled in the central abdomen.', '**Large intestine** (~1.5 m): caecum + [[Appendix]] → ascending, transverse, descending and sigmoid colon → rectum → anal canal, framing the small intestine.'] }, { t: 'figure', caption: 'Large intestine framing the small intestine.', target: { male: 'grp:digestive/large-intestine', female: 'grp:digestive/large-intestine' } }] },
      { id: 'structure', title: 'Structure', blocks: [{ t: 'table', head: ['Feature', 'Small intestine', 'Large intestine'], rows: [['Surface area boosters', '**Circular folds, villi, microvilli**', 'None (no villi)'], ['Outer muscle', 'Continuous longitudinal layer', '**Taeniae coli** (3 bands) → **haustra**'], ['Other', 'Peyer’s patches (ileum)', '**Omental appendices** (fat tags)']] }, { t: 'table', title: 'Jejunum vs ileum', head: ['Jejunum', 'Ileum'], rows: [['Wider, thicker wall, redder', 'Narrower, thinner wall, paler'], ['Long vasa recta, few arcades', 'Short vasa recta, many arcades'], ['Tall, numerous circular folds', 'Fewer folds; Peyer’s patches']] }] },
      { id: 'function', title: 'How they work', blocks: [{ t: 'steps', items: ['**Duodenum** receives chyme, bile and pancreatic juice.', '**Jejunum and ileum** finish digestion and absorb nutrients; the terminal ileum absorbs **vitamin B12 and bile salts**.', '**Colon** absorbs water and electrolytes; gut bacteria ferment fibre and make vitamin K.', '**Rectum** stores faeces until defecation.'] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Appendicitis** — McBurney’s point (⅓ from ASIS to umbilicus).', '**Diverticular disease** — out-pouchings, usually sigmoid colon.', '**Crohn’s disease** (any part, often terminal ileum) vs **ulcerative colitis** (rectum upward, continuous).', '**Bowel obstruction** — colicky pain, distension, vomiting.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Duodenum → jejunum → ileum; caecum → colon → rectum → anus.', 'Large intestine signs: **taeniae coli, haustra, omental appendices**.', 'B12 absorbed in the **terminal ileum**.'] }] },
    ],
    quiz: [{ q: 'Name three features that distinguish the colon from the small intestine.', a: '**Taeniae coli, haustra and omental appendices**.' }, { q: 'Where are vitamin B12 and bile salts absorbed?', a: 'In the **terminal ileum**.' }],
    refs: [os('23.6 The Small and Large Intestines'), sp('Anatomy, Abdomen and Pelvis, Large Intestine'), sp('Anatomy, Abdomen and Pelvis, Small Intestine')],
  },

  {
    id: 'urinary',
    title: 'Urinary system',
    system: 'urinary',
    tagline: 'Kidneys, ureters, bladder and urethra: filter blood, balance fluids and remove waste as urine.',
    focus: { male: 'sys:urinary', female: 'sys:urinary' },
    match: /kidney|renal|ureter|bladder|urethra|calyx|pyramid|cortex|nephron/i,
    minutes: 6,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'bullets', items: ['Paired [[Kidney|kidneys]] — retroperitoneal, **T12–L3**; the right sits slightly lower (liver above).', '[[Ureter|Ureters]] (~25–30 cm) carry urine to the [[Urinary bladder]] in the pelvis; the **urethra** drains it (≈4 cm female, ≈20 cm male).'] }, { t: 'figure', caption: 'Kidneys, ureters and bladder.', target: { male: 'sys:urinary', female: 'sys:urinary' } }] },
      { id: 'structure', title: 'Structure', blocks: [{ t: 'layers', title: 'Kidney, outside → in', layers: [{ name: 'Renal capsule (+ perirenal fat, renal fascia)', note: 'protection' }, { name: 'Cortex', note: 'glomeruli and convoluted tubules' }, { name: 'Medulla', note: '8–18 **renal pyramids** (loops of Henle, collecting ducts)' }, { name: 'Calyces → renal pelvis', note: 'collect urine → ureter' }] }, { t: 'bullets', items: ['Functional unit: the **nephron** (~1 million per kidney).', 'At the hilum, front to back: **renal vein, renal artery, renal pelvis**.'] }] },
      { id: 'function', title: 'How urine is formed', blocks: [{ t: 'flow', title: 'Nephron pathway', steps: [{ label: 'Glomerulus', note: '**filtration** (~180 L/day)' }, { label: 'Proximal tubule', note: 'reabsorbs ~65% of filtrate, all glucose' }, { label: 'Loop of Henle', note: 'builds the medullary gradient' }, { label: 'Distal tubule', note: 'fine-tunes Na⁺, K⁺, Ca²⁺' }, { label: 'Collecting duct', note: 'ADH controls water → ~1.5 L urine/day' }] }, { t: 'bullets', items: ['Other roles: blood pressure (**renin**), red cell production (**erythropoietin**), activates **vitamin D**, acid–base balance.'] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Kidney stones** lodge at 3 narrowings: pelviureteric junction, pelvic brim, vesicoureteric junction — loin-to-groin pain.', '**Urinary tract infection** — commoner in females (short urethra).', '**Chronic kidney disease** — diabetes and hypertension are the leading causes.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Filtration → reabsorption → secretion → excretion.', '~180 L filtered, ~1.5 L excreted per day.', 'Kidney hormones: **renin, erythropoietin, calcitriol**.'] }] },
    ],
    quiz: [{ q: 'Name the three sites where ureteric stones commonly lodge.', a: 'Pelviureteric junction, pelvic brim (crossing iliac vessels), vesicoureteric junction.' }, { q: 'Which hormone increases water reabsorption in the collecting duct?', a: '**ADH (antidiuretic hormone)**.' }],
    refs: [os('25.1 Internal and External Anatomy of the Kidney'), os('25.3 Physiology of Urine Formation'), sp('Anatomy, Abdomen and Pelvis, Kidney')],
  },

  {
    id: 'reproductive',
    title: 'Reproductive system',
    system: 'reproductive',
    tagline: 'Organs that produce gametes and sex hormones and, in females, support pregnancy.',
    focus: { male: 'sys:reproductive', female: 'sys:reproductive' },
    match: /uter|ovar|tube|vagin|cervix|mammary|nipple|lactiferous|testis|epididym|prostate|seminal|deferent|penis|scrot|broad ligament|round ligament/i,
    minutes: 6,
    sections: [
      { id: 'overview', title: 'What it is and where it is', blocks: [{ t: 'bullets', items: ['**Female**: [[Ovary|ovaries]], uterine tubes, [[Uterus]], [[Vagina]] in the pelvis; mammary glands on the anterior chest wall.', '**Male**: testes in the scrotum, ducts (epididymis, ductus deferens, ejaculatory duct), accessory glands (seminal vesicles, prostate, bulbourethral) and penis.'] }, { t: 'figure', caption: 'Reproductive organs of the selected model.', target: { male: 'sys:reproductive', female: 'sys:reproductive' } }] },
      { id: 'structure', title: 'Structure', blocks: [{ t: 'table', head: ['Female', 'Male equivalent / role'], rows: [['Ovary — oocytes, oestrogen, progesterone', 'Testis — sperm, testosterone'], ['Uterine tube — fertilisation (ampulla)', 'Ductus deferens — sperm transport'], ['Uterus — implantation and pregnancy', '—'], ['Vagina — birth canal', 'Penis — copulation']] }, { t: 'layers', title: 'Uterine wall (inside → out)', layers: [{ name: 'Endometrium', note: 'shed during menstruation' }, { name: 'Myometrium', note: 'smooth muscle — labour contractions' }, { name: 'Perimetrium', note: 'peritoneal covering' }] }] },
      { id: 'function', title: 'How it works', blocks: [{ t: 'flow', title: 'Hormonal control (both sexes)', steps: [{ label: 'Hypothalamus', note: 'GnRH' }, { label: 'Anterior pituitary', note: 'FSH and LH' }, { label: 'Gonads', note: 'gametes + sex steroids' }, { label: 'Feedback', note: 'steroids regulate GnRH/FSH/LH' }] }, { t: 'bullets', items: ['Menstrual cycle ≈ 28 days: follicular phase → **ovulation** (LH surge, ~day 14) → luteal phase.', 'Fertilisation usually occurs in the **ampulla** of the uterine tube.'] }] },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Ectopic pregnancy** — implantation outside the uterus, most often the uterine tube; can rupture.', '**Cervical cancer** — linked to HPV; screening and vaccination.', '**Benign prostatic hyperplasia** — urinary hesitancy and frequency in older men.', '**Breast cancer** — most often in the upper outer quadrant.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['GnRH → FSH/LH → gonads.', 'Fertilisation in the **ampulla**; implantation in the **uterine body**.', 'Uterine wall: endometrium, myometrium, perimetrium.'] }] },
    ],
    quiz: [{ q: 'Where does fertilisation usually take place?', a: 'In the **ampulla of the uterine tube**.' }, { q: 'Which pituitary surge triggers ovulation?', a: 'The **LH surge**.' }],
    refs: [os('27.1 Anatomy and Physiology of the Testicular Reproductive System'), os('27.2 Anatomy and Physiology of the Ovarian Reproductive System'), sp('Anatomy, Abdomen and Pelvis, Uterus')],
  },
];
