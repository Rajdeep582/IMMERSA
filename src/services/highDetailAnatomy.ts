import * as THREE from 'three';
import type { Part } from '../types/anatomy';

/**
 * High-detail procedural geometry used by the inspection viewport and by the
 * curated female pelvic / external genital structures.
 *
 * Coordinate convention: +X patient left, -X patient right, +Y superior,
 * +Z anterior. Units are metres.
 */
const highDetailGeometryCache = new Map<string, THREE.BufferGeometry>();

export function hasHighDetailModel(partId: string): boolean {
  if (partId.startsWith('F_')) return true;
  if (partId === 'M_SCROTUM' || partId === 'M_URETHRA_MEATUS') return true;
  return [
    'FJ3157', // First Lumbar Vertebra (L1)
    'FJ2422', // Left Ventricle & Heart
    'FJ2423', // Right Ventricle
    'FJ2424', // Right Atrium
    'FJ2425', // Left Atrium
    'FJ1931', // Descending Thoracic Aorta
    'FJ1730', // Brain / Ventricles
  ].includes(partId);
}

export function getHighDetailGeometry(part: Part): THREE.BufferGeometry | null {
  if (highDetailGeometryCache.has(part.id)) {
    return highDetailGeometryCache.get(part.id)!.clone();
  }

  let geom: THREE.BufferGeometry | null = null;

  switch (part.id) {
    case 'F_UTERUS':
      geom = createHighDetailUterusGeometry();
      break;
    case 'F_OVARY_R':
      geom = createHighDetailOvaryGeometry(true);
      break;
    case 'F_OVARY_L':
      geom = createHighDetailOvaryGeometry(false);
      break;
    case 'F_TUBE_R':
      geom = createHighDetailFallopianTubeGeometry(true);
      break;
    case 'F_TUBE_L':
      geom = createHighDetailFallopianTubeGeometry(false);
      break;
    case 'F_VAGINA':
      geom = createHighDetailVaginaGeometry();
      break;
    case 'F_URETHRA':
      geom = createHighDetailFemaleUrethraGeometry();
      break;
    case 'F_MAMMARY_R':
      geom = createHighDetailMammaryGeometry(true);
      break;
    case 'F_MAMMARY_L':
      geom = createHighDetailMammaryGeometry(false);
      break;
    case 'F_MONS_PUBIS':
      geom = createHighDetailMonsGeometry();
      break;
    case 'F_LABIUM_MAJUS_R':
      geom = createHighDetailLabiumMajusGeometry(true);
      break;
    case 'F_LABIUM_MAJUS_L':
      geom = createHighDetailLabiumMajusGeometry(false);
      break;
    case 'F_LABIUM_MINUS_R':
      geom = createHighDetailLabiumMinusGeometry(true);
      break;
    case 'F_LABIUM_MINUS_L':
      geom = createHighDetailLabiumMinusGeometry(false);
      break;
    case 'F_CLITORIS_GLANS':
      geom = createHighDetailClitoralGlansGeometry();
      break;
    case 'F_CLITORIS':
      geom = createHighDetailClitorisGeometry();
      break;
    case 'F_CLITORAL_HOOD':
      geom = createHighDetailClitoralHoodGeometry();
      break;
    case 'F_VESTIBULE':
      geom = createHighDetailVestibuleGeometry();
      break;
    case 'F_URETHRA_ORIFICE':
      geom = createHighDetailOrificeGeometry('urethral');
      break;
    case 'F_VAGINAL_ORIFICE':
      geom = createHighDetailOrificeGeometry('vaginal');
      break;
    case 'F_AREOLA_R':
      geom = createHighDetailAreolaGeometry(true);
      break;
    case 'F_AREOLA_L':
      geom = createHighDetailAreolaGeometry(false);
      break;
    case 'F_NIPPLE_R':
      geom = createHighDetailNippleGeometry(true);
      break;
    case 'F_NIPPLE_L':
      geom = createHighDetailNippleGeometry(false);
      break;
    case 'M_SCROTUM':
      geom = createHighDetailScrotumGeometry();
      break;
    case 'M_URETHRA_MEATUS':
      geom = createHighDetailOrificeGeometry('male-meatus');
      break;
    default:
      if (part.id === 'FJ3157' || part.name.toLowerCase().includes('first lumbar')) {
        geom = createHighDetailL1VertebraGeometry();
      } else if (['FJ2422', 'FJ2423', 'FJ2424', 'FJ2425'].includes(part.id) || part.name.toLowerCase().includes('ventricle')) {
        geom = createHighDetailHeartGeometry();
      } else if (part.id === 'FJ1931' || part.name.toLowerCase().includes('aorta')) {
        geom = createHighDetailAortaGeometry();
      } else if (part.name.toLowerCase().includes('femur')) {
        geom = createHighDetailFemurGeometry();
      }
  }

  if (geom) {
    if (!geom.userData.preserveNormals) geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    highDetailGeometryCache.set(part.id, geom);
    return geom.clone();
  }

  return null;
}

/**
 * L1 vertebra: body, pedicles, laminae, spinous process, transverse processes,
 * articular processes and vertebral foramen.
 */
function createHighDetailL1VertebraGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const bodyGeom = new THREE.CylinderGeometry(0.024, 0.026, 0.026, 36, 12);
  const posAttr = bodyGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const indentation = Math.exp(-Math.pow(x / 0.015, 2)) * 0.007;
    const newZ = z > 0 ? z * 1.15 : z + indentation;
    const endplateDip = Math.abs(y) > 0.01 ? -Math.exp(-(x * x + z * z) / 0.0003) * 0.0025 * Math.sign(y) : 0;
    posAttr.setXYZ(i, x * 1.35, y + endplateDip, newZ);
  }
  bodyGeom.translate(0, 0, 0.016);
  parts.push(bodyGeom);

  const leftPedicle = new THREE.CylinderGeometry(0.0055, 0.006, 0.02, 28, 4);
  leftPedicle.rotateX(Math.PI / 2);
  leftPedicle.rotateY(0.18);
  leftPedicle.translate(-0.018, 0.004, -0.004);
  parts.push(leftPedicle);

  const rightPedicle = leftPedicle.clone();
  rightPedicle.scale(-1, 1, 1);
  parts.push(rightPedicle);

  const leftLamina = new THREE.BoxGeometry(0.005, 0.018, 0.022);
  leftLamina.rotateY(Math.PI / 5);
  leftLamina.translate(-0.011, 0.003, -0.022);
  parts.push(leftLamina);

  const rightLamina = leftLamina.clone();
  rightLamina.scale(-1, 1, 1);
  parts.push(rightLamina);

  const spinousGeom = new THREE.BoxGeometry(0.005, 0.022, 0.032, 2, 8, 8);
  const spinPos = spinousGeom.attributes.position;
  for (let i = 0; i < spinPos.count; i++) {
    const x = spinPos.getX(i);
    const y = spinPos.getY(i);
    const z = spinPos.getZ(i);
    const flare = z < -0.01 ? 1.4 : 1.0;
    spinPos.setXYZ(i, x * flare, y, z);
  }
  spinousGeom.translate(0, 0.004, -0.042);
  parts.push(spinousGeom);

  const leftTransverse = new THREE.CylinderGeometry(0.003, 0.0045, 0.028, 24, 4);
  leftTransverse.rotateZ(Math.PI / 2);
  leftTransverse.rotateY(-0.15);
  leftTransverse.translate(-0.034, 0.004, -0.008);
  parts.push(leftTransverse);

  const rightTransverse = leftTransverse.clone();
  rightTransverse.scale(-1, 1, 1);
  parts.push(rightTransverse);

  const leftSupArticular = new THREE.CylinderGeometry(0.005, 0.006, 0.014, 24, 4);
  leftSupArticular.rotateY(0.3);
  leftSupArticular.translate(-0.017, 0.018, -0.014);
  parts.push(leftSupArticular);

  const rightSupArticular = leftSupArticular.clone();
  rightSupArticular.scale(-1, 1, 1);
  parts.push(rightSupArticular);

  const leftInfArticular = new THREE.CylinderGeometry(0.0045, 0.005, 0.014, 24, 4);
  leftInfArticular.rotateY(-0.3);
  leftInfArticular.translate(-0.012, -0.014, -0.022);
  parts.push(leftInfArticular);

  const rightInfArticular = leftInfArticular.clone();
  rightInfArticular.scale(-1, 1, 1);
  parts.push(rightInfArticular);

  return mergeBufferGeometries(parts);
}

function createHighDetailHeartGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const lvGeom = new THREE.ConeGeometry(0.032, 0.065, 48, 20);
  lvGeom.rotateZ(Math.PI + 0.45);
  lvGeom.rotateX(0.2);
  lvGeom.translate(0.014, -0.015, 0.008);
  parts.push(lvGeom);

  const rvGeom = new THREE.SphereGeometry(0.034, 40, 32, 0, Math.PI);
  rvGeom.rotateY(-Math.PI / 2);
  rvGeom.rotateZ(0.25);
  rvGeom.scale(0.85, 1.25, 0.7);
  rvGeom.translate(-0.016, -0.008, 0.014);
  parts.push(rvGeom);

  const laGeom = new THREE.SphereGeometry(0.024, 32, 24);
  laGeom.scale(1.1, 0.9, 0.9);
  laGeom.translate(0.018, 0.028, -0.012);
  parts.push(laGeom);

  const raGeom = new THREE.SphereGeometry(0.026, 32, 24);
  raGeom.scale(0.9, 1.1, 1.0);
  raGeom.translate(-0.024, 0.022, 0.004);
  parts.push(raGeom);

  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.004, 0.022, 0.004),
    new THREE.Vector3(0.002, 0.046, -0.002),
    new THREE.Vector3(-0.008, 0.058, -0.014),
    new THREE.Vector3(-0.012, 0.052, -0.026),
  ]);
  parts.push(new THREE.TubeGeometry(aortaCurve, 36, 0.011, 28, false));

  const ptCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.012, 0.018, 0.018),
    new THREE.Vector3(-0.008, 0.038, 0.012),
    new THREE.Vector3(0.006, 0.048, 0.002),
  ]);
  parts.push(new THREE.TubeGeometry(ptCurve, 28, 0.0095, 24, false));

  const svcGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.03, 28, 4);
  svcGeom.translate(-0.026, 0.044, -0.006);
  parts.push(svcGeom);

  return mergeBufferGeometries(parts);
}

function createHighDetailAortaGeometry(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.12, -0.02),
    new THREE.Vector3(-0.005, 0.06, -0.022),
    new THREE.Vector3(-0.004, 0.0, -0.02),
    new THREE.Vector3(-0.002, -0.08, -0.018),
    new THREE.Vector3(0, -0.14, -0.016),
  ]);
  return new THREE.TubeGeometry(curve, 48, 0.009, 24, false);
}

function createHighDetailFemurGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const shaftCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.18, 0),
    new THREE.Vector3(0.004, 0.09, 0.006),
    new THREE.Vector3(0, 0, 0.008),
    new THREE.Vector3(-0.003, -0.09, 0.004),
    new THREE.Vector3(0, -0.18, 0),
  ]);
  parts.push(new THREE.TubeGeometry(shaftCurve, 48, 0.013, 28, false));

  const head = new THREE.SphereGeometry(0.024, 36, 32);
  head.translate(-0.034, 0.22, 0.008);
  parts.push(head);

  const neck = new THREE.CylinderGeometry(0.013, 0.015, 0.04, 28, 6);
  neck.rotateZ(Math.PI / 3.2);
  neck.translate(-0.018, 0.205, 0.005);
  parts.push(neck);

  const gt = new THREE.BoxGeometry(0.022, 0.028, 0.02);
  gt.translate(0.018, 0.2, -0.004);
  parts.push(gt);

  const medialCondyle = new THREE.SphereGeometry(0.019, 32, 28);
  medialCondyle.scale(0.9, 1.2, 1.3);
  medialCondyle.translate(-0.018, -0.2, -0.008);
  parts.push(medialCondyle);

  const lateralCondyle = medialCondyle.clone();
  lateralCondyle.translate(0.036, 0, 0);
  parts.push(lateralCondyle);

  return mergeBufferGeometries(parts);
}

/* ------------------------------------------------------------------------- *
 * Female pelvic viscera
 * ------------------------------------------------------------------------- */

/**
 * Uterus: a continuous pear-shaped body with a rounded fundus, narrow isthmus
 * and cylindrical cervix. A lathed profile avoids the "cup with a flat lid"
 * artefact of a capped cylinder and produces the correct anteverted contour.
 */
function createHighDetailUterusGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const profile = [
    new THREE.Vector2(0.000, -0.046),
    new THREE.Vector2(0.005, -0.044),
    new THREE.Vector2(0.009, -0.038),
    new THREE.Vector2(0.0105, -0.030),
    new THREE.Vector2(0.0100, -0.022),
    new THREE.Vector2(0.0120, -0.014),
    new THREE.Vector2(0.0160, -0.006),
    new THREE.Vector2(0.0200, 0.004),
    new THREE.Vector2(0.0225, 0.014),
    new THREE.Vector2(0.0238, 0.024),
    new THREE.Vector2(0.0230, 0.031),
    new THREE.Vector2(0.0190, 0.036),
    new THREE.Vector2(0.0120, 0.039),
    new THREE.Vector2(0.000, 0.040),
  ];
  const uterus = new THREE.LatheGeometry(profile, 56);
  uterus.scale(1.0, 1.0, 0.62);
  parts.push(uterus);

  // Cornua at the tubal insertions.
  for (const sign of [-1, 1]) {
    const cornu = new THREE.ConeGeometry(0.0050, 0.010, 20);
    cornu.rotateZ(sign * -Math.PI * 0.46);
    cornu.translate(sign * 0.0205, 0.024, 0.001);
    parts.push(cornu);
  }

  const merged = mergeBufferGeometries(parts);
  // Anteversion + anteflexion: tilt the fundus anteriorly over the bladder.
  merged.rotateX(THREE.MathUtils.degToRad(15));
  merged.translate(0, 0.884, -0.008);
  return merged;
}

/**
 * Ovary: 3.2 x 2.6 x 2.1 cm almond-shaped gonad in the ovarian fossa, with the
 * ovarian ligament to the uterine cornu and the suspensory ligament superiorly.
 */
function createHighDetailOvaryGeometry(isRight: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const sign = isRight ? -1 : 1;

  const ovary = new THREE.SphereGeometry(0.016, 36, 28);
  const pos = ovary.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const bump = 1.0 + 0.045 * Math.sin(x * 260.0) * Math.cos(y * 210.0);
    const poleTaper = 1.0 - 0.18 * Math.pow(y / 0.016, 2);
    pos.setXYZ(i, x * 1.0 * bump, y * 0.80 * poleTaper * bump, z * 0.65 * bump);
  }
  ovary.rotateZ(sign * 0.16);
  ovary.rotateY(sign * -0.22);
  ovary.translate(sign * 0.053, 0.886, -0.038);
  parts.push(ovary);

  // Ovarian ligament: ovary -> uterine cornu.
  const ovarianLigament = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign * 0.042, 0.888, -0.034),
    new THREE.Vector3(sign * 0.033, 0.894, -0.026),
    new THREE.Vector3(sign * 0.024, 0.900, -0.016),
    new THREE.Vector3(sign * 0.020, 0.903, -0.006),
  ]);
  parts.push(new THREE.TubeGeometry(ovarianLigament, 20, 0.0016, 10, false));

  // Suspensory (infundibulopelvic) ligament: ovary -> pelvic side wall.
  const suspensory = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign * 0.052, 0.898, -0.044),
    new THREE.Vector3(sign * 0.060, 0.910, -0.050),
    new THREE.Vector3(sign * 0.069, 0.925, -0.052),
  ]);
  parts.push(new THREE.TubeGeometry(suspensory, 16, 0.0012, 8, false));

  return mergeBufferGeometries(parts);
}

/**
 * Uterine tube: cornu -> isthmus -> ampulla arching over the ovary ->
 * infundibulum with fimbriae at the ovarian surface.
 */
function createHighDetailFallopianTubeGeometry(isRight: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const sign = isRight ? -1 : 1;

  const tubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign * 0.021, 0.904, 0.001), // uterine ostium
    new THREE.Vector3(sign * 0.027, 0.912, 0.001), // isthmus
    new THREE.Vector3(sign * 0.036, 0.918, -0.003), // ampulla ascending
    new THREE.Vector3(sign * 0.047, 0.914, -0.011), // ampulla arch
    new THREE.Vector3(sign * 0.056, 0.903, -0.022), // ampulla descending
    new THREE.Vector3(sign * 0.059, 0.893, -0.034), // infundibulum
    new THREE.Vector3(sign * 0.055, 0.887, -0.042), // abdominal ostium
  ]);
  parts.push(new THREE.TubeGeometry(tubeCurve, 64, 0.0026, 20, false));

  // Fimbriae: a fringe of fine processes spread over the ovarian surface.
  const ostium = new THREE.Vector3(sign * 0.055, 0.887, -0.042);
  for (let f = 0; f < 18; f++) {
    const angle = (f / 18) * Math.PI * 2;
    const length = 0.0055 + (f % 4) * 0.0014;
    const tip = new THREE.Vector3(
      ostium.x + Math.cos(angle) * 0.0055,
      ostium.y + Math.sin(angle) * 0.0075,
      ostium.z - 0.0045 - Math.abs(Math.sin(angle)) * 0.0025
    );
    const control = new THREE.Vector3(
      ostium.x + Math.cos(angle) * 0.003,
      ostium.y + Math.sin(angle) * 0.004,
      ostium.z - 0.002
    );
    const fimbria = new THREE.CatmullRomCurve3([ostium.clone(), control, tip]);
    parts.push(new THREE.TubeGeometry(fimbria, 10, 0.00065, 8, false));
  }

  return mergeBufferGeometries(parts);
}

/**
 * Vagina: distensible canal from the cervical fornices to the vestibule. The
 * anterior wall is related to the urethra and bladder; the posterior wall to
 * the rectum and rectouterine pouch.
 */
function createHighDetailVaginaGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const vaginaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.844, -0.018),
    new THREE.Vector3(0, 0.830, -0.004),
    new THREE.Vector3(0, 0.814, 0.022),
    new THREE.Vector3(0, 0.800, 0.052),
    new THREE.Vector3(0, 0.792, 0.078),
    new THREE.Vector3(0, 0.789, 0.083),
  ]);
  const vagina = new THREE.TubeGeometry(vaginaCurve, 48, 0.011, 24, false);
  vagina.scale(1.25, 1.0, 0.90);
  parts.push(vagina);

  // Cervical fornices: a ring around the intravaginal cervix.
  const fornix = new THREE.TorusGeometry(0.0145, 0.0042, 12, 32);
  fornix.rotateX(Math.PI / 2);
  fornix.translate(0, 0.842, -0.016);
  parts.push(fornix);

  return mergeBufferGeometries(parts);
}

/**
 * Female urethra: short, straight canal embedded in the anterior vaginal wall,
 * opening in the vestibule between the clitoris and vaginal introitus.
 */
function createHighDetailFemaleUrethraGeometry(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.864, 0.020),
    new THREE.Vector3(0, 0.850, 0.030),
    new THREE.Vector3(0, 0.842, 0.048),
    new THREE.Vector3(0, 0.834, 0.066),
    new THREE.Vector3(0, 0.827, 0.082),
    new THREE.Vector3(0, 0.824, 0.0835),
  ]);
  return new THREE.TubeGeometry(curve, 36, 0.0034, 18, false);
}

/**
 * Mammary gland: soft glandular mound on the pectoral fascia with an axillary
 * tail. The areola and nipple are separate surface structures so that an
 * intact surface view does not show a gland disc floating on the chest.
 */
function createHighDetailMammaryGeometry(isRight: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const sign = isRight ? -1 : 1;

  const gland = new THREE.SphereGeometry(1, 40, 28);
  const pos = gland.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const lowerFullness = y < 0 ? 1.05 : 0.94;
    pos.setXYZ(i, x * 0.045, y * 0.050 * lowerFullness, z * 0.023);
  }
  gland.translate(sign * 0.078, 1.255, 0.112);
  parts.push(gland);

  const tail = new THREE.SphereGeometry(1, 32, 20);
  tail.scale(0.023, 0.032, 0.013);
  tail.rotateZ(sign * -0.25);
  tail.translate(sign * 0.103, 1.266, 0.106);
  parts.push(tail);

  return mergeBufferGeometries(parts);
}

/* ------------------------------------------------------------------------- *
 * Female external genitalia (vulva)
 * ------------------------------------------------------------------------- */


function createHighDetailMonsGeometry(): THREE.BufferGeometry {
  const mons = new THREE.SphereGeometry(1, 40, 28);
  const pos = mons.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Flatter superiorly, fuller inferiorly over the pubic symphysis.
    const vertical = y < 0 ? 1.03 : 0.94;
    // A shallow median depression blends the mons into the labial cleft
    // instead of leaving a solid plate across the vulva.
    const groove =
      Math.exp(-(x * x) / (0.009 * 0.009)) *
      Math.max(0, Math.min(1, (0.850 - (0.862 + y * 0.028 * vertical)) / 0.020));
    pos.setXYZ(i, x * 0.045, y * 0.028 * vertical, z * 0.010 - groove * 0.0045);
  }
  mons.translate(0, 0.862, 0.081);
  return mons;
}

function createHighDetailLabiumMajusGeometry(isRight: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const sign = isRight ? -1 : 1;

  const labium = new THREE.SphereGeometry(1, 36, 24);
  const pos = labium.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const lower = y < 0 ? 1.06 : 0.95;
    pos.setXYZ(i, x * 0.011, y * 0.037 * lower, z * 0.008);
  }
  labium.rotateZ(-sign * 0.08);
  labium.translate(sign * 0.021, 0.802, 0.079);
  parts.push(labium);

  // Posterior commissure of the labia majora.
  const commissure = new THREE.SphereGeometry(1, 24, 16);
  commissure.scale(0.007, 0.004, 0.005);
  commissure.translate(sign * 0.010, 0.764, 0.0755);
  parts.push(commissure);

  return mergeBufferGeometries(parts);
}

function createHighDetailLabiumMinusGeometry(isRight: boolean): THREE.BufferGeometry {
  const sign = isRight ? -1 : 1;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign * 0.0045, 0.840, 0.0858),
    new THREE.Vector3(sign * 0.0130, 0.826, 0.0850),
    new THREE.Vector3(sign * 0.0150, 0.808, 0.0845),
    new THREE.Vector3(sign * 0.0120, 0.794, 0.0838),
    new THREE.Vector3(sign * 0.0080, 0.788, 0.0830),
  ]);
  const geom = new THREE.TubeGeometry(curve, 36, 0.0018, 12, false);
  // A labium minus is a thin fold, not a round cord: flatten the tube in the
  // anteroposterior axis around the vestibular plane.
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, 0.0845 + (pos.getZ(i) - 0.0845) * 0.48);
  }
  pos.needsUpdate = true;
  return geom;
}

function createHighDetailClitoralGlansGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const glans = new THREE.SphereGeometry(1, 32, 24);
  glans.scale(0.0028, 0.0034, 0.0030);
  glans.translate(0, 0.842, 0.0930);
  parts.push(glans);

  // Frenulum: the midline fold connecting the glans to the labia minora.
  const frenulum = new THREE.SphereGeometry(1, 20, 12);
  frenulum.scale(0.0035, 0.0030, 0.0022);
  frenulum.translate(0, 0.8375, 0.0905);
  parts.push(frenulum);

  return mergeBufferGeometries(parts);
}

function createHighDetailClitorisGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Body of the clitoris, posterior to the glans.
  const bodyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.842, 0.092),
    new THREE.Vector3(0, 0.851, 0.083),
    new THREE.Vector3(0, 0.859, 0.071),
  ]);
  parts.push(new THREE.TubeGeometry(bodyCurve, 24, 0.0042, 14, false));

  // Crura along the ischiopubic rami.
  for (const sign of [-1, 1]) {
    const crus = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.855, 0.074),
      new THREE.Vector3(sign * 0.014, 0.847, 0.068),
      new THREE.Vector3(sign * 0.026, 0.836, 0.060),
      new THREE.Vector3(sign * 0.032, 0.827, 0.056),
    ]);
    parts.push(new THREE.TubeGeometry(crus, 28, 0.0032, 12, false));

    // Vestibular bulb, between the crus and the vaginal wall.
    const bulb = new THREE.SphereGeometry(1, 28, 20);
    bulb.scale(0.0105, 0.020, 0.0085);
    bulb.translate(sign * 0.018, 0.812, 0.0715);
    parts.push(bulb);
  }

  return mergeBufferGeometries(parts);
}

function createHighDetailClitoralHoodGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const hoodCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.011, 0.846, 0.0900),
    new THREE.Vector3(-0.005, 0.850, 0.0920),
    new THREE.Vector3(0, 0.851, 0.0930),
    new THREE.Vector3(0.005, 0.850, 0.0920),
    new THREE.Vector3(0.011, 0.846, 0.0900),
  ]);
  parts.push(new THREE.TubeGeometry(hoodCurve, 32, 0.0032, 12, false));

  const fold = new THREE.SphereGeometry(1, 24, 16);
  fold.scale(0.010, 0.0040, 0.0050);
  fold.translate(0, 0.848, 0.0915);
  parts.push(fold);

  return mergeBufferGeometries(parts);
}

function createHighDetailVestibuleGeometry(): THREE.BufferGeometry {
  const vestibule = new THREE.SphereGeometry(1, 32, 24);
  const pos = vestibule.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const taper = 1.0 - 0.20 * Math.abs(y);
    pos.setXYZ(i, x * 0.0055 * taper, y * 0.022, z * 0.0005);
  }
  vestibule.translate(0, 0.808, 0.0820);
  return vestibule;
}

function createHighDetailOrificeGeometry(kind: 'urethral' | 'vaginal' | 'male-meatus'): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  let rx = 0.004;
  let ry = 0.008;
  let cx = 0;
  let cy = 0.824;
  let cz = 0.0895;

  if (kind === 'vaginal') {
    rx = 0.0058;
    ry = 0.0080;
    cy = 0.796;
    cz = 0.0836;
  } else if (kind === 'male-meatus') {
    rx = 0.0032;
    ry = 0.0018;
    cy = 0.800;
    cz = 0.1012;
  } else {
    rx = 0.0018;
    ry = 0.0028;
    cy = 0.823;
    cz = 0.0838;
  }

  const disc = new THREE.CircleGeometry(1, 32);
  disc.scale(rx, ry, 1);
  disc.translate(cx, cy, cz);
  parts.push(disc);

  // A thin rounded mucosal rim. Scaling the torus in Z as well as X/Y keeps
  // the rim from ballooning into a plate at close range.
  const ring = new THREE.TorusGeometry(1, 0.12, 8, 40);
  ring.scale(rx, ry, 0.0125);
  ring.translate(cx, cy, cz + 0.0002);
  parts.push(ring);

  return mergeBufferGeometries(parts);
}

function createHighDetailAreolaGeometry(isRight: boolean): THREE.BufferGeometry {
  const sign = isRight ? -1 : 1;
  // A thin disc placed on the pre-morph chest wall. The female skin shader
  // applies the same breast-surface deformation to the areola and nipple, so
  // the complex sits flush on the curved breast instead of floating in front
  // of it.
  const areola = new THREE.CircleGeometry(1, 40);
  areola.scale(0.0225, 0.0225, 1);
  areola.translate(sign * 0.078, 1.246, 0.1195);
  return areola;
}

function createHighDetailNippleGeometry(isRight: boolean): THREE.BufferGeometry {
  const sign = isRight ? -1 : 1;
  const nipple = new THREE.CylinderGeometry(0.0046, 0.0058, 0.0065, 24, 4);
  nipple.rotateX(Math.PI * 0.5);
  nipple.translate(sign * 0.078, 1.246, 0.1235);
  return nipple;
}

/* ------------------------------------------------------------------------- *
 * Male external genital additions
 * ------------------------------------------------------------------------- */

/**
 * Scrotum: two rugose compartments with a median raphe, enclosing the testes
 * and epididymides. The left compartment is slightly lower, as is typical.
 */
function createHighDetailScrotumGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const rightSac = new THREE.SphereGeometry(1, 36, 28);
  const rp = rightSac.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const x = rp.getX(i);
    const y = rp.getY(i);
    const z = rp.getZ(i);
    const rugae = 1.0 + 0.030 * Math.sin(y * 190.0 + Math.cos(x * 240.0) * 1.4);
    rp.setXYZ(i, x * 0.0165 * rugae, y * 0.0300 * rugae, z * 0.0190 * rugae);
  }
  rightSac.translate(-0.0150, 0.783, 0.0605);
  parts.push(rightSac);

  const leftSac = new THREE.SphereGeometry(1, 36, 28);
  const lp = leftSac.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i);
    const y = lp.getY(i);
    const z = lp.getZ(i);
    const rugae = 1.0 + 0.030 * Math.sin(y * 190.0 + Math.cos(x * 240.0) * 1.4);
    lp.setXYZ(i, x * 0.0170 * rugae, y * 0.0315 * rugae, z * 0.0195 * rugae);
  }
  leftSac.translate(0.0155, 0.780, 0.0605);
  parts.push(leftSac);

  // Median raphe: fusion line of the labioscrotal folds.
  const raphe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.750, 0.0750),
    new THREE.Vector3(0, 0.775, 0.0765),
    new THREE.Vector3(0, 0.800, 0.0760),
    new THREE.Vector3(0, 0.813, 0.0725),
  ]);
  parts.push(new THREE.TubeGeometry(raphe, 24, 0.0010, 8, false));

  return mergeBufferGeometries(parts);
}

/**
 * Robust merge helper for indexed primitive geometries.
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVertices = 0;
  let totalIndices = 0;

  for (const g of geometries) {
    totalVertices += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : 0;
  }

  const mergedPos = new Float32Array(totalVertices * 3);
  const mergedNorm = new Float32Array(totalVertices * 3);
  const mergedIndex = new Uint32Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const g of geometries) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal || pos;
    const index = g.index;

    for (let i = 0; i < pos.count; i++) {
      mergedPos[(vertexOffset + i) * 3 + 0] = pos.getX(i);
      mergedPos[(vertexOffset + i) * 3 + 1] = pos.getY(i);
      mergedPos[(vertexOffset + i) * 3 + 2] = pos.getZ(i);

      if (norm) {
        mergedNorm[(vertexOffset + i) * 3 + 0] = norm.getX(i);
        mergedNorm[(vertexOffset + i) * 3 + 1] = norm.getY(i);
        mergedNorm[(vertexOffset + i) * 3 + 2] = norm.getZ(i);
      }
    }

    if (index) {
      for (let j = 0; j < index.count; j++) {
        mergedIndex[indexOffset + j] = index.getX(j) + vertexOffset;
      }
      indexOffset += index.count;
    }

    vertexOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  if (totalIndices > 0) {
    merged.setIndex(new THREE.BufferAttribute(mergedIndex, 1));
  }

  return merged;
}

/**
 * Procedural micro-anatomical surface shader snippets retained for the
 * inspection viewport.
 */
export const ANATOMICAL_SURFACE_SHADER_CHUNKS = {
  vertexPars: `
    varying vec3 vWorldPosition;
    varying vec3 vModelPosition;
  `,
  vertexMain: `
    vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
    vModelPosition = transformed;
  `,
  fragmentPars: `
    varying vec3 vWorldPosition;
    varying vec3 vModelPosition;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise3D(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
  `,
  fragmentBoneMod: `
    float boneGrain = noise3D(vModelPosition * 350.0) * 0.12;
    float osteonLines = sin(vModelPosition.y * 800.0) * 0.04;
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.92 + boneGrain + osteonLines), 0.75);
  `,
  fragmentMuscleMod: `
    float fascicleGrain = sin(vModelPosition.y * 650.0 + noise3D(vModelPosition * 120.0) * 4.0) * 0.08;
    diffuseColor.rgb += vec3(fascicleGrain * 0.5, fascicleGrain * 0.1, fascicleGrain * 0.1);
  `,
  fragmentVascularMod: `
    float vascSheen = noise3D(vModelPosition * 220.0) * 0.06;
    diffuseColor.rgb += vec3(vascSheen * 0.3, vascSheen * 0.05, vascSheen * 0.05);
  `,
};
