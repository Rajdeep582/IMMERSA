import { os, sp } from '../../data/references';
import type { Topic } from '../types';

export const CARDIORESP_TOPICS: Topic[] = [
  {
    id: 'cardiovascular',
    title: 'Cardiovascular system',
    system: 'cardiovascular',
    tagline: 'The heart and blood vessels that pump blood to deliver oxygen and nutrients and remove wastes.',
    focus: { male: 'sys:cardiovascular', female: 'sys:cardiovascular' },
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'p', text: 'A closed circuit: the [[Heart]] in the middle mediastinum pumps about **5 L of blood per minute** at rest through arteries, capillaries and veins.' },
          { t: 'figure', caption: 'Heart and modelled vessels. Arteries red, veins blue (pulmonary vessels follow oxygen content).', target: { male: 'sys:cardiovascular', female: 'sys:cardiovascular' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          { t: 'table', head: ['Vessel', 'Wall', 'Role'], rows: [['**Arteries**', 'Thick, elastic and muscular', 'Carry blood **away** from the heart under high pressure'], ['**Arterioles**', 'Mostly smooth muscle', 'Control resistance and blood pressure'], ['**Capillaries**', 'Single layer of endothelium', 'Exchange gases, nutrients, wastes'], ['**Veins**', 'Thin, with valves', 'Return blood **to** the heart; hold ~60–70% of blood volume']] },
          { t: 'layers', title: 'Layers of an artery wall (inside → out)', layers: [{ name: 'Tunica intima', note: 'endothelium' }, { name: 'Tunica media', note: 'smooth muscle and elastic fibres' }, { name: 'Tunica externa (adventitia)', note: 'connective tissue' }] },
        ],
      },
      {
        id: 'function',
        title: 'How blood circulates',
        blocks: [
          {
            t: 'flow',
            title: 'Two circuits in series',
            loop: true,
            steps: [
              { label: 'Right heart', note: 'receives deoxygenated blood' },
              { label: 'Pulmonary circuit', note: 'lungs: CO₂ out, O₂ in' },
              { label: 'Left heart', note: 'receives oxygenated blood' },
              { label: 'Systemic circuit', note: 'aorta → body tissues → venae cavae' },
            ],
          },
          { t: 'bullets', items: ['**Blood pressure** = cardiac output × peripheral resistance.', 'The **coronary arteries** (first branches of the aorta) supply the heart muscle itself.'] },
        ],
      },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Atherosclerosis** — fatty plaques narrow arteries; underlies heart attack and most strokes.', '**Hypertension** — persistently raised pressure; damages heart, kidneys, brain and eyes.', '**Deep vein thrombosis** — clot in a deep leg vein; may embolise to the lungs.', '**Aneurysm** — localised dilatation of an artery, e.g. abdominal aorta.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Arteries **away**, veins **toward** the heart — regardless of oxygen content.', 'Pulmonary arteries carry **deoxygenated** blood; pulmonary veins carry **oxygenated** blood.', 'Capillaries are the only exchange vessels.'] }] },
    ],
    quiz: [
      { q: 'Which vessels carry oxygenated blood to the left atrium?', a: 'The **pulmonary veins**.' },
      { q: 'Which layer of an artery wall contains smooth muscle?', a: 'The **tunica media**.' },
    ],
    refs: [os('20.1 Structure and Function of Blood Vessels'), os('20.5 Circulatory Pathways'), sp('Physiology, Cardiovascular')],
  },

  {
    id: 'heart',
    title: 'Heart',
    system: 'cardiovascular',
    parent: 'cardiovascular',
    tagline: 'A four-chambered muscular pump that drives both the pulmonary and systemic circulations.',
    focus: { male: 'Heart', female: 'Heart' },
    match: /heart|atrium|ventricle(?! of brain)|valve|cusp|papillary|coronary|cardiac|aorta|pulmonary trunk|vena cava|septum/i,
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'bullets', items: ['Fist-sized (~250–350 g), in the **middle mediastinum** behind the sternum, about two-thirds left of the midline.', 'The **apex** points down, forward and left (5th intercostal space, midclavicular line).', 'Enclosed in the **pericardium** (fibrous + serous layers).'] },
          { t: 'figure', caption: 'Heart chambers, valves and great vessels.', target: { male: 'Heart', female: 'Heart' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          { t: 'layers', title: 'Heart wall (outside → in)', layers: [{ name: 'Epicardium', note: 'visceral layer of serous pericardium' }, { name: 'Myocardium', note: 'cardiac muscle — thickest in the left ventricle' }, { name: 'Endocardium', note: 'endothelium lining chambers and valves' }] },
          { t: 'table', head: ['Valve', 'Between', 'Cusps'], rows: [['**Tricuspid**', 'Right atrium → right ventricle', '3'], ['**Pulmonary**', 'Right ventricle → pulmonary trunk', '3 (semilunar)'], ['**Mitral (bicuspid)**', 'Left atrium → left ventricle', '2'], ['**Aortic**', 'Left ventricle → aorta', '3 (semilunar)']] },
          { t: 'bullets', items: ['**Chordae tendineae** and **papillary muscles** stop the AV valves from everting.', 'Coronary arteries: **left** (anterior interventricular + circumflex) and **right** (usually gives the posterior interventricular).'] },
        ],
      },
      {
        id: 'function',
        title: 'How it works',
        blocks: [
          {
            t: 'flow',
            title: 'Path of blood through the heart',
            steps: [
              { label: 'Venae cavae' },
              { label: 'Right atrium' },
              { label: 'Tricuspid valve' },
              { label: 'Right ventricle' },
              { label: 'Pulmonary valve → lungs' },
              { label: 'Pulmonary veins → left atrium' },
              { label: 'Mitral valve' },
              { label: 'Left ventricle' },
              { label: 'Aortic valve → aorta' },
            ],
          },
          {
            t: 'flow',
            title: 'Conduction system',
            steps: [
              { label: 'SA node', note: 'pacemaker, right atrium (60–100/min)' },
              { label: 'AV node', note: 'brief delay lets ventricles fill' },
              { label: 'Bundle of His' },
              { label: 'Bundle branches', note: 'left and right' },
              { label: 'Purkinje fibres', note: 'ventricles contract apex → base' },
            ],
          },
          { t: 'bullets', items: ['**Systole** = contraction, **diastole** = relaxation.', 'Heart sounds: **S1** = AV valves close; **S2** = semilunar valves close.', '**Cardiac output** = heart rate × stroke volume (≈ 70 × 70 mL ≈ 5 L/min).'] },
        ],
      },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Myocardial infarction** — coronary occlusion; the LAD (“widow-maker”) supplies much of the left ventricle.', '**Valve disease** — stenosis (fails to open) or regurgitation (fails to close) produces murmurs.', '**Heart failure** — the heart cannot meet the body’s needs; fluid backs up into lungs or tissues.', '**Atrial fibrillation** — chaotic atrial activity; risk of clot and stroke.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Right side → lungs; left side → body.', '“**Try Pulling My Aorta**”: tricuspid, pulmonary, mitral, aortic (order of flow).', 'SA node is the natural pacemaker; AV node delays.', 'Left ventricle wall is about three times thicker than the right.'] }] },
    ],
    quiz: [
      { q: 'Which valve lies between the left atrium and left ventricle?', a: 'The **mitral (bicuspid)** valve.' },
      { q: 'What causes the first heart sound?', a: 'Closure of the **atrioventricular (tricuspid and mitral) valves**.' },
      { q: 'Name the natural pacemaker of the heart.', a: 'The **sinoatrial (SA) node**.' },
    ],
    refs: [os('19.1 Heart Anatomy'), os('19.2 Cardiac Muscle and Electrical Activity'), os('19.3 Cardiac Cycle'), sp('Anatomy, Thorax, Heart')],
  },

  {
    id: 'respiratory',
    title: 'Respiratory system',
    system: 'respiratory',
    tagline: 'The airways and lungs that bring oxygen into the blood and remove carbon dioxide.',
    focus: { male: 'sys:respiratory', female: 'sys:respiratory' },
    match: /lung|bronch|trachea|larynx|laryn|epiglott|pleura|alveol|cricoid|thyroid cartilage|arytenoid|corniculate|segment/i,
    minutes: 6,
    sections: [
      {
        id: 'overview',
        title: 'What it is and where it is',
        blocks: [
          { t: 'bullets', items: ['**Upper tract**: nose, nasal cavity, pharynx, [[Larynx]].', '**Lower tract**: [[Trachea]], bronchi, bronchioles and the **lungs** in the thoracic cavity, each wrapped in **pleura**.'] },
          { t: 'figure', caption: 'Larynx, trachea, bronchial tree and lungs.', target: { male: 'sys:respiratory', female: 'sys:respiratory' } },
        ],
      },
      {
        id: 'structure',
        title: 'Structure and major components',
        blocks: [
          { t: 'flow', title: 'The airway tree', steps: [{ label: 'Trachea', note: 'C-shaped cartilage rings' }, { label: 'Main bronchi', note: 'right is wider, shorter, more vertical' }, { label: 'Lobar bronchi', note: '3 right, 2 left' }, { label: 'Segmental bronchi', note: 'bronchopulmonary segments' }, { label: 'Bronchioles' }, { label: 'Alveoli', note: '~300–500 million' }] },
          { t: 'table', head: ['', 'Right lung', 'Left lung'], rows: [['Lobes', '3 (upper, middle, lower)', '2 (upper, lower)'], ['Fissures', 'Oblique + horizontal', 'Oblique only'], ['Special features', '—', 'Cardiac notch, lingula']] },
          { t: 'layers', title: 'Pleura', layers: [{ name: 'Parietal pleura', note: 'lines the chest wall — pain-sensitive' }, { name: 'Pleural cavity', note: 'thin film of fluid, negative pressure' }, { name: 'Visceral pleura', note: 'covers the lung surface' }] },
        ],
      },
      {
        id: 'function',
        title: 'How breathing works',
        blocks: [
          { t: 'steps', items: ['**Inspiration** — the diaphragm contracts and flattens, external intercostals lift the ribs; chest volume rises, pressure falls, air flows in.', '**Expiration** — at rest, passive elastic recoil; forced expiration uses internal intercostals and abdominal muscles.', '**Gas exchange** — O₂ and CO₂ diffuse across the thin alveolar–capillary membrane down their partial-pressure gradients.'] },
          { t: 'callout', tone: 'remember', text: 'Breathing rhythm is set by centres in the **medulla and pons**, driven mainly by blood **CO₂** (via pH).' },
        ],
      },
      { id: 'clinical', title: 'Clinical significance', blocks: [{ t: 'bullets', items: ['**Aspiration** of foreign bodies usually goes to the **right main bronchus**.', '**Asthma** — reversible airway narrowing; **COPD** — mostly irreversible airflow limitation (smoking).', '**Pneumothorax** — air in the pleural cavity collapses the lung.', '**Pneumonia** — infection filling alveoli with exudate.'] }] },
      { id: 'key', title: 'Key points to remember', blocks: [{ t: 'bullets', items: ['Right lung **3 lobes**, left lung **2 lobes**.', 'Trachea divides at the **carina** (about T4–T5, sternal angle).', 'Diaphragm (phrenic nerve, C3–C5) is the main muscle of inspiration.'] }] },
    ],
    quiz: [
      { q: 'Why do inhaled objects usually lodge in the right main bronchus?', a: 'It is **wider, shorter and more vertical** than the left.' },
      { q: 'How many lobes does the left lung have?', a: '**Two** (upper and lower).' },
    ],
    refs: [os('22.1 Organs and Structures of the Respiratory System'), os('22.2 The Lungs'), os('22.3 The Process of Breathing'), sp('Anatomy, Thorax, Lungs')],
  },
];
