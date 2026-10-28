import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

import { FEMALE_PARTS, FEMALE_CLINICAL_PROFILES } from '../src/data/femaleAnatomy.ts';
import { MALE_ADDITIONAL_PARTS, MALE_CLINICAL_PROFILES } from '../src/data/maleAnatomy.ts';
import {
  FEMALE_SPECIFIC_PARTS,
  MALE_SPECIFIC_PARTS,
  isPartVisibleForSex,
} from '../src/data/anatomyCatalog.ts';
import { getHighDetailGeometry } from '../src/services/highDetailAnatomy.ts';
import { applyFemaleMorph, applyFemaleSurface } from '../src/utils/anthropometry.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const atlas = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/models/atlas.json'), 'utf8'));
const allParts = [...atlas.parts, ...FEMALE_PARTS, ...MALE_ADDITIONAL_PARTS];
const byId = new Map(allParts.map((part) => [part.id, part]));

let failures = 0;
const check = (condition, message) => {
  if (!condition) {
    failures++;
    console.error(`FAIL  ${message}`);
  }
};
const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;
const v3 = (bounds, index) => new THREE.Vector3(...bounds[index]);

// 1. Identity and model-ownership invariants.
check(byId.size === allParts.length, 'Every anatomical part ID is unique');
for (const id of MALE_SPECIFIC_PARTS) {
  check(!FEMALE_SPECIFIC_PARTS.has(id), `${id} cannot belong to both reference models`);
}
for (const part of FEMALE_PARTS) {
  check(isPartVisibleForSex(part.id, 'female'), `${part.id} must be visible on the female model`);
  check(!isPartVisibleForSex(part.id, 'male'), `${part.id} must be hidden on the male model`);
  check(!!FEMALE_CLINICAL_PROFILES[part.id], `${part.id} has a curated female clinical profile`);
}
for (const part of MALE_ADDITIONAL_PARTS) {
  check(!!MALE_CLINICAL_PROFILES[part.id], `${part.id} has a curated male clinical profile`);
}

// 2. Geometry must be finite and its declared bounds must agree with the mesh.
for (const part of [...FEMALE_PARTS, ...MALE_ADDITIONAL_PARTS]) {
  const geom = getHighDetailGeometry(part);
  check(!!geom, `${part.id} has procedural geometry`);
  if (!geom) continue;

  const positions = geom.attributes.position;
  let finite = true;
  for (let i = 0; i < positions.count; i++) {
    if (!Number.isFinite(positions.getX(i)) || !Number.isFinite(positions.getY(i)) || !Number.isFinite(positions.getZ(i))) {
      finite = false;
      break;
    }
  }
  check(finite, `${part.id} contains only finite vertex coordinates`);

  geom.computeBoundingBox();
  const box = geom.boundingBox;
  const tolerance = 0.0025;
  check(
    near(box.min.x, part.bounds[0][0], tolerance) &&
      near(box.min.y, part.bounds[0][1], tolerance) &&
      near(box.min.z, part.bounds[0][2], tolerance) &&
      near(box.max.x, part.bounds[1][0], tolerance) &&
      near(box.max.y, part.bounds[1][1], tolerance) &&
      near(box.max.z, part.bounds[1][2], tolerance),
    `${part.id} declared bounds match generated geometry (±2.5 mm)`
  );
}

// 3. Left/right identity must follow the anatomical coordinate convention.
const center = (id) => {
  const part = byId.get(id);
  const b = part.bounds;
  return {
    x: (b[0][0] + b[1][0]) / 2,
    y: (b[0][1] + b[1][1]) / 2,
    z: (b[0][2] + b[1][2]) / 2,
  };
};
check(center('F_OVARY_R').x < 0, 'Right ovary is on the patient-right (−X) side');
check(center('F_OVARY_L').x > 0, 'Left ovary is on the patient-left (+X) side');
check(center('F_TUBE_R').x < 0, 'Right uterine tube is on the patient-right side');
check(center('F_TUBE_L').x > 0, 'Left uterine tube is on the patient-left side');
check(center('F_LABIUM_MAJUS_R').x < 0, 'Right labium majus is on the patient-right side');
check(center('F_LABIUM_MAJUS_L').x > 0, 'Left labium majus is on the patient-left side');
check(center('FJ3142').x < 0, 'Right testis is on the patient-right side');
check(center('FJ3138').x > 0, 'Left testis is on the patient-left side');

// 4. Female pelvic viscera proportions and relationships.
const uterusBox = getHighDetailGeometry(byId.get('F_UTERUS')).boundingBox;
const uterusSize = uterusBox.getSize(new THREE.Vector3());
const uterusCenter = uterusBox.getCenter(new THREE.Vector3());
check(uterusSize.y > 0.065 && uterusSize.y < 0.105, `Non-pregnant uterine length is plausible (${(uterusSize.y * 100).toFixed(1)} cm)`);
check(uterusSize.x > 0.040 && uterusSize.x < 0.065, `Uterine transverse diameter is plausible (${(uterusSize.x * 100).toFixed(1)} cm)`);
check(uterusSize.z > 0.020 && uterusSize.z < 0.045, `Uterine AP thickness is plausible (${(uterusSize.z * 100).toFixed(1)} cm)`);
check(uterusCenter.y > 0.83 && uterusCenter.y < 0.93, 'Uterus is in the lesser pelvis');
check(uterusCenter.z > -0.035 && uterusCenter.z < 0.02, 'Uterus sits between bladder (anterior) and rectum (posterior)');

const ovaryR = center('F_OVARY_R');
const ovaryL = center('F_OVARY_L');
check(Math.abs(ovaryR.x) > uterusSize.x / 2 + 0.012, 'Ovaries lie lateral to the uterine corpus');
check(ovaryR.y > uterusBox.min.y && ovaryR.y < uterusBox.max.y + 0.025, 'Ovary is at the level of the uterine cornu/fundus');

const tubeRBox = getHighDetailGeometry(byId.get('F_TUBE_R')).boundingBox;
const tubeLBox = getHighDetailGeometry(byId.get('F_TUBE_L')).boundingBox;
const tubeOverlapsUterus = (box) => box.max.x >= uterusBox.min.x - 0.005 || box.min.x <= uterusBox.max.x + 0.005;
check(tubeOverlapsUterus(tubeRBox) && tubeOverlapsUterus(tubeLBox), 'Uterine tubes attach at the uterine cornua');
check(
  tubeRBox.intersectsBox(new THREE.Box3(v3(byId.get('F_OVARY_R').bounds, 0), v3(byId.get('F_OVARY_R').bounds, 1))),
  'Right uterine tube reaches the right ovary'
);
check(
  tubeLBox.intersectsBox(new THREE.Box3(v3(byId.get('F_OVARY_L').bounds, 0), v3(byId.get('F_OVARY_L').bounds, 1))),
  'Left uterine tube reaches the left ovary'
);

const vaginaBox = getHighDetailGeometry(byId.get('F_VAGINA')).boundingBox;
check(vaginaBox.max.z > 0.075, 'Vagina reaches the vulvar vestibule rather than ending in the pelvis');
check(vaginaBox.min.y < 0.79 && vaginaBox.max.y > 0.84, 'Vagina spans the cervix-to-vestibule axis');

const urethraBox = getHighDetailGeometry(byId.get('F_URETHRA')).boundingBox;
check(urethraBox.max.z > 0.08, 'Female urethra opens at the vestibule');
check(urethraBox.max.y > 0.86 && urethraBox.min.y < 0.83, 'Female urethra extends from the bladder neck to the vestibule');
check(near(urethraBox.max.z, 0.087, 0.01), 'Urethral meatus lies at the vestibular surface');

const vaginalOrifice = byId.get('F_VAGINAL_ORIFICE').bounds;
const urethralOrifice = byId.get('F_URETHRA_ORIFICE').bounds;
check(vaginalOrifice[1][2] > 0.07, 'Vaginal orifice is on the external surface');
check(urethralOrifice[1][2] > 0.07, 'Urethral orifice is on the external surface');
check(urethralOrifice[0][1] > vaginalOrifice[1][1], 'Urethral orifice lies anterior/superior to the vaginal orifice');

// 5. External genital surface is anterior and within the perineum.
for (const id of [
  'F_MONS_PUBIS',
  'F_CLITORIS_GLANS',
  'F_LABIUM_MAJUS_R',
  'F_LABIUM_MAJUS_L',
  'F_LABIUM_MINUS_R',
  'F_LABIUM_MINUS_L',
  'F_VESTIBULE',
]) {
  const b = byId.get(id).bounds;
  check(b[1][2] > 0.06, `${id} is positioned on the anterior vulvar surface`);
  check(b[0][1] > 0.73 && b[1][1] < 0.9, `${id} is within the perineal/pubis region`);
}

// 6. Male scrotum must enclose both testes and the meatus must reach the glans tip.
const scrotum = byId.get('M_SCROTUM').bounds;
for (const id of ['FJ3138', 'FJ3142']) {
  const testis = byId.get(id).bounds;
  check(
    testis[0][0] >= scrotum[0][0] - 0.002 &&
      testis[1][0] <= scrotum[1][0] + 0.002 &&
      testis[0][1] >= scrotum[0][1] - 0.002 &&
      testis[1][1] <= scrotum[1][1] + 0.002 &&
      testis[0][2] >= scrotum[0][2] - 0.002 &&
      testis[1][2] <= scrotum[1][2] + 0.002,
    `${id} is enclosed by the scrotal sac`
  );
}
const glans = byId.get('FJ3134').bounds;
const meatus = byId.get('M_URETHRA_MEATUS').bounds;
check(
  near((meatus[0][2] + meatus[1][2]) / 2, glans[1][2], 0.01),
  'Male urethral meatus is at the glans tip'
);

// 7. Anthropometric dimorphism checks.
const maleHeight = 1.72;
const femaleHead = applyFemaleMorph(0, maleHeight, 0);
check(femaleHead.y < maleHeight && femaleHead.y > maleHeight * 0.94, 'Female stature is 3-6% shorter than the male reference');
const maleShoulder = applyFemaleMorph(0.2, 1.4, 0);
check(maleShoulder.x < 0.2 * 0.92, 'Female biacromial breadth is narrower than the male reference');
const maleHip = applyFemaleMorph(0.15, 0.88, 0);
check(Math.abs(maleHip.x) > 0.15 * 1.05, 'Female hip breadth is wider than the male reference');

const flattened = applyFemaleSurface(0, 0.8, 0.1, 1);
check(flattened.z <= 0.084, 'Female surface morph removes the male penile protrusion');
const breast = applyFemaleSurface(0.078, 1.218, 0.118, 1);
check(breast.z > 0.13, 'Female surface morph produces an anterior breast contour');
check(applyFemaleSurface(0, 0.8, 0.1, 0).z === 0.1, 'Male surface morph is a no-op');

// 8. Counts.
const femaleCount = allParts.filter((p) => isPartVisibleForSex(p.id, 'female')).length;
const maleCount = allParts.filter((p) => isPartVisibleForSex(p.id, 'male')).length;
console.log(`\nAnatomy validation`);
console.log(`  parts: ${allParts.length} total · ${maleCount} male model · ${femaleCount} female model`);
console.log(`  female curated structures: ${FEMALE_PARTS.length}`);
console.log(`  male added structures: ${MALE_ADDITIONAL_PARTS.length}`);
console.log(`  failures: ${failures}`);

if (failures > 0) {
  process.exit(1);
}
console.log('  status: PASS');
