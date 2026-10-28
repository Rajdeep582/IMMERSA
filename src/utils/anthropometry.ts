import * as THREE from 'three';

/**
 * Anthropometric sexual dimorphism for the shared BodyParts3D reference mesh.
 *
 * Grounded in scientifically documented adult human sexual dimorphism derived
 * from the ANSUR II anthropometric dataset, NASA-STD-3000, and Gray's Anatomy
 * (42nd ed.):
 * - Craniofacial: Slender cervical column, softened thyroid cartilage (no
 *   Adam's apple), oval mandibular taper, feminine malar prominence and smooth
 *   forehead contour.
 * - Thorax & Breasts: Natural anatomical teardrop ptosis with rounded lower pole,
 *   inframammary crease (IMF), sternal cleavage, and seamlessly integrated
 *   areolar dome and papilla.
 * - Waist & Pelvis: Authentic female waist-to-hip ratio (~0.72-0.74), gynecoid
 *   pelvic flare, widened intertrochanteric breadth, and rounded gluteal contours.
 * - External Genitalia: Natural perineal ramp with smooth mons pubis, symmetrical
 *   labia majora, and central pudendal cleft, cleanly retracting any male penile
 *   tissue without planar distortion or self-intersection.
 * - Extremities: Q-angle femoral convergence, carrying angle, and slender calves.
 */

export function applyFemaleMorph(
  x: number,
  y: number,
  z: number,
  factor: number = 1.0,
  isMuscle: boolean = false
): { x: number; y: number; z: number } {
  if (factor <= 0.0001) {
    return { x, y, z };
  }

  let dx = 0;
  let dy = 0;
  let dz = 0;

  // Stature: about 3.2% shorter, soles kept on the floor plane (Y = 0.03 m).
  const footY = 0.03;
  const relY = Math.max(0, y - footY);
  dy -= relY * 0.032 * factor;
  const curY = y + dy;

  const isArm = Math.abs(x) > 0.17 && curY > 0.70 && curY < 1.45;
  const isLeg = curY < 0.82;

  if (isArm) {
    // Upper limb tracks the narrower female shoulder girdle.
    const armSign = Math.sign(x);
    dx -= armSign * 0.028 * factor;
    const armCenterX = armSign * (0.24 - 0.028 * factor);
    dx -= (x - armCenterX) * 0.11 * factor;
  } else if (!isLeg) {
    if (curY > 1.44) {
      // 1. Craniofacial scaling: adult female cranium is ~7% narrower and ~5% shallower AP.
      dx -= x * 0.07 * factor;
      dz -= z * 0.05 * factor;

      // 2. Cervical column (neck) slenderizing
      if (curY < 1.50) {
        const neckProg = (1.50 - curY) / 0.06;
        const neckSmooth = neckProg * neckProg * (3 - 2 * neckProg);
        dx -= x * 0.05 * neckSmooth * factor;
        dz -= z * 0.03 * neckSmooth * factor;

        // Smooth elimination of the laryngeal prominence (Adam's apple)
        const yNorm = (curY - 1.44) / 0.06;
        const yProf = Math.sin(Math.PI * yNorm);
        const zAnt = Math.max(0, Math.min(1, (z - 0.015) / 0.030));
        const zAntSmooth = zAnt * zAnt * (3 - 2 * zAnt);
        dz -= 0.009 * yProf * zAntSmooth * factor;
      }

      // 3. Mandibular taper: soften square masculine jaw into an elegant, feminine oval contour
      if (curY >= 1.48 && curY <= 1.56) {
        const jProg = (curY - 1.48) / 0.08;
        const jProf = Math.sin(Math.PI * jProg);
        dx -= x * 0.05 * jProf * factor;
      }

      // 4. Soft feminine chin (mental protuberance refinement)
      if (curY >= 1.495 && curY <= 1.530) {
        const chinZ = Math.max(0, Math.min(1, (z - 0.045) / 0.025));
        const chinZSmooth = chinZ * chinZ * (3 - 2 * chinZ);
        const chin = Math.exp(-Math.pow(x / 0.032, 2) - Math.pow((curY - 1.512) / 0.016, 2)) * chinZSmooth;
        dx -= x * 0.08 * chin * factor;
        dz -= 0.0035 * chin * factor;
      }

      // 5. High feminine malar cheekbones
      if (curY >= 1.560 && curY <= 1.620) {
        const malarZ = Math.max(0, Math.min(1, (z - 0.020) / 0.030));
        const malarZSmooth = malarZ * malarZ * (3 - 2 * malarZ);
        const malar = Math.exp(-Math.pow((Math.abs(x) - 0.046) / 0.018, 2) - Math.pow((curY - 1.585) / 0.024, 2)) * malarZSmooth;
        dz += 0.0035 * malar * factor;
        dx += Math.sign(x) * 0.0020 * malar * factor;
      }

      // 6. Smooth vertical feminine forehead contour (softening supraorbital bossing)
      if (curY >= 1.605 && curY <= 1.655) {
        const browZ = Math.max(0, Math.min(1, (z - 0.035) / 0.030));
        const browZSmooth = browZ * browZ * (3 - 2 * browZ);
        const brow = Math.exp(-Math.pow(x / 0.055, 2) - Math.pow((curY - 1.625) / 0.018, 2)) * browZSmooth;
        dz -= 0.0040 * brow * factor;
      }
    } else if (curY > 1.34) {
      // Biacromial breadth: about 12-15% narrower than the male reference.
      const shoulderFactor = (curY - 1.34) / 0.10;
      dx -= x * (0.12 + 0.06 * shoulderFactor) * factor;
      dz -= z * 0.07 * factor;
    } else if (curY > 1.16) {
      // Thorax: narrower transverse diameter and slightly reduced AP depth.
      dx -= x * 0.10 * factor;
      if (z < 0.11) {
        dz -= z * 0.08 * factor;
      }
    } else if (curY > 1.00) {
      // Lumbar waist: female waist-to-hip ratio is typically 0.72-0.80.
      const waistProfile = Math.sin(((curY - 1.00) / 0.16) * Math.PI);
      dx -= x * (0.09 + 0.12 * waistProfile) * factor;
      dz -= z * (0.05 + 0.05 * waistProfile) * factor;
    }
  }

  // Gynecoid pelvis: wider iliac crests, greater intertrochanteric breadth,
  // flared alae, wider subpubic angle and anterior pelvic tilt.
  if (curY >= 0.78 && curY <= 1.02) {
    const hipProfile = Math.sin(((curY - 0.78) / 0.24) * Math.PI);
    dx += x * 0.13 * hipProfile * factor;
    if (curY < 0.92 && Math.abs(x) < 0.075) {
      dx += Math.sign(x) * 0.012 * (1 - Math.abs(x) / 0.075) * factor;
    }
    if (z < 0) {
      dz -= Math.abs(z) * 0.10 * hipProfile * factor;
    }
  }

  if (isLeg) {
    // Greater femoral convergence (Q-angle) from wider female acetabula.
    const legSign = Math.sign(x);
    if (curY > 0.46) {
      const qProg = (curY - 0.46) / 0.36;
      const thighFullness = Math.sin(qProg * Math.PI) * 0.07;
      dx += legSign * 0.014 * qProg * factor;
      dx += (x - legSign * 0.10) * thighFullness * factor;
    } else {
      const calfDistX = x - legSign * 0.09;
      dx -= calfDistX * 0.09 * factor;
    }
  }

  let finalX = x + dx;
  const finalY = curY;
  let finalZ = z + dz;

  // Muscle volume attenuation: female musculature has lower cross-sectional
  // area than the male reference, particularly in the shoulder girdle and
  // anterior abdominal wall.
  if (isMuscle) {
    if (isArm) {
      const armSign = Math.sign(finalX);
      const boneCenterX = armSign * (0.22 - 0.028 * factor);
      finalX -= (finalX - boneCenterX) * 0.33 * factor;
      finalZ -= finalZ * 0.30 * factor;
    } else if (!isLeg) {
      if (finalY > 1.20 && finalY < 1.36 && finalZ > 0.035) {
        finalZ -= (finalZ - 0.035) * 0.30 * factor;
      }
      if (finalY > 1.34 && finalY < 1.48) {
        finalX -= finalX * 0.10 * factor;
      }
      if (finalY >= 0.98 && finalY <= 1.18 && finalZ > 0.01) {
        finalZ -= (finalZ - 0.01) * 0.32 * factor;
      }
    } else {
      const legSign = Math.sign(finalX);
      const boneCenterX = legSign * 0.09;
      finalX -= (finalX - boneCenterX) * 0.24 * factor;
    }
  }

  return { x: finalX, y: finalY, z: finalZ };
}

/**
 * Female surface detail that is not appropriate for internal organs: breast
 * contour, mons pubis, gluteal fullness and removal of the male external
 * genital surface. It is applied only to the body-skin mesh (uIsSkin = 1).
 */
export function applyFemaleSurface(
  x: number,
  y: number,
  z: number,
  factor: number = 1.0
): { x: number; y: number; z: number } {
  if (factor <= 0.0001) return { x, y, z };

  let nx = x;
  let ny = y;
  let nz = z;

  // 1. ADULT FEMALE MAMMARY GLAND (BREAST) CONTOUR
  // Base: Ribs 2 to 6 (Y: 1.13 to 1.33 m), sternal border (X: 0.024 m) to anterior axillary line.
  // Apex centered at X = +-0.080 m, Y = 1.222 m.
  const ax = Math.abs(nx);
  if (ax > 0.015 && ax < 0.180 && ny > 1.120 && ny < 1.340 && nz > 0.010) {
    const bx = ax - 0.080;
    const by = ny - 1.222;
    // Anatomical teardrop ptosis: upper pole (by > 0) has a gentle incline (sigma 0.082 m);
    // lower pole (by < 0) has a full, rounded supported projection (sigma 0.058 m).
    const sigmaY = by > 0 ? 0.082 : 0.058;
    const r2 = (bx * bx) / (0.052 * 0.052) + (by * by) / (sigmaY * sigmaY);
    
    // Natural breast elevation (up to 4.6 cm forward projection at apex)
    const anterior = Math.min(1, Math.max(0, (nz - 0.020) / 0.080));
    const breastMound = Math.exp(-r2) * anterior * 0.046 * factor;

    // Integrated Areola & Nipple:
    // Areola: subtle 1.8mm elevation within 20mm radius
    const rApex = Math.sqrt(bx * bx + by * by);
    const areolaElev = 0.0018 * Math.exp(-Math.pow(rApex / 0.020, 2)) * factor;
    // Nipple: rounded 4.2mm projection within 5.5mm radius
    const nippleElev = 0.0042 * Math.exp(-Math.pow(rApex / 0.0055, 2)) * factor;

    nz += breastMound + areolaElev + nippleElev;

    // Sternal cleavage preservation: ensure clean anatomical depression between breasts
    const sternum = Math.exp(-Math.pow(nx / 0.022, 2)) * Math.exp(-Math.pow(by / 0.080, 2)) * anterior;
    nz -= sternum * 0.012 * factor;

    // Inframammary fold: natural sub-mammary crease at ribs 5-6
    if (by < -0.045 && by > -0.090) {
      const imfProgress = Math.min(1, Math.max(0, (by + 0.090) / 0.045));
      const imfCrease = Math.sin(imfProgress * Math.PI) * Math.exp(-Math.pow(bx / 0.040, 2));
      nz -= imfCrease * 0.006 * factor;
    }
  }

  // 2. ADULT FEMALE EXTERNAL GENITALIA (VULVA & PERINEUM)
  // Replaces the male penile protrusion with an authentic, continuous female vulvar surface:
  // Mons pubis -> labia majora & pudendal cleft -> posterior perineal body.
  const absX = Math.abs(nx);
  if (absX < 0.055 && ny >= 0.730 && ny <= 0.895) {
    // Natural female anatomical perineal ramp: Z smoothly descends from mons pubis (0.074) to perineum (0.035)
    const baseZ = 0.035 + Math.max(0, Math.min(1, (ny - 0.735) / 0.150)) * 0.039;

    // Smooth lateral transition connecting to medial thighs
    const smoothstep = (e0: number, e1: number, val: number) => {
      const t = Math.max(0, Math.min(1, (val - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    };
    const latFade = 1.0 - smoothstep(0.025, 0.050, absX);
    const vertFade = smoothstep(0.730, 0.750, ny) * (1.0 - smoothstep(0.875, 0.895, ny));
    const vulvaZone = latFade * vertFade;

    if (vulvaZone > 0.001) {
      // Mons Pubis: smooth rounded triangular cushion anterior to pubic symphysis (Y ~ 0.865)
      const monsRelief = 0.011 * Math.exp(-Math.pow(nx / 0.036, 2) - Math.pow((ny - 0.865) / 0.025, 2));

      // Labia Majora: two smooth longitudinal cutaneous folds (Y: 0.76 to 0.84, X: +-0.016)
      const yProg = Math.max(0, Math.min(1, (ny - 0.750) / 0.095));
      const labiaEnvelope = Math.sin(yProg * Math.PI);
      const labiaRelief = 0.007 * (Math.exp(-Math.pow((nx - 0.016) / 0.010, 2)) + Math.exp(-Math.pow((nx + 0.016) / 0.010, 2))) * labiaEnvelope;

      // Pudendal Cleft (Rima pudendi): delicate central median groove between the labia
      const cleftRelief = 0.0045 * Math.exp(-Math.pow(nx / 0.0065, 2)) * labiaEnvelope;

      const targetZ = baseZ + monsRelief + labiaRelief - cleftRelief;

      // Retract any male penile tissue back onto the authentic female vulva surface
      if (nz > targetZ) {
        nz = nz * (1.0 - vulvaZone * factor) + targetZ * (vulvaZone * factor);
      } else {
        nz += (monsRelief + labiaRelief - cleftRelief) * vulvaZone * factor;
      }
    }
  }

  // 3. ADULT FEMALE GLUTEAL FULLNESS
  // Fuller, rounded feminine gluteal curvature
  const glute = Math.exp(-Math.pow(nx / 0.095, 2)) * Math.exp(-Math.pow((ny - 0.800) / 0.120, 2));
  const posterior = Math.min(1, Math.max(0, (-nz - 0.020) / 0.080));
  nz -= glute * posterior * 0.011 * factor;

  return { x: nx, y: ny, z: nz };
}

export function morphBoundingBox(
  box: THREE.Box3,
  factor: number = 1.0,
  isSkin: boolean = false
): THREE.Box3 {
  if (factor <= 0.0001) return box.clone();

  const corners: THREE.Vector3[] = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];

  const morphedBox = new THREE.Box3();
  for (const c of corners) {
    let m = applyFemaleMorph(c.x, c.y, c.z, factor);
    if (isSkin) {
      m = applyFemaleSurface(m.x, m.y, m.z, factor);
    }
    morphedBox.expandByPoint(new THREE.Vector3(m.x, m.y, m.z));
  }
  return morphedBox;
}

export const FEMALE_ANTHROPOMETRY_GLSL = `
uniform float uFemaleFactor;
uniform float uIsMuscle;
uniform float uIsSkin;

vec3 applyFemaleSurface(vec3 p, float factor) {
  if (factor < 0.0001) return p;

  float ax = abs(p.x);
  float nz = p.z;

  // 1. ADULT FEMALE MAMMARY GLAND (BREAST) CONTOUR
  if (ax > 0.015 && ax < 0.180 && p.y > 1.120 && p.y < 1.340 && p.z > 0.010) {
    float bx = ax - 0.080;
    float by = p.y - 1.222;
    float sigmaY = by > 0.0 ? 0.082 : 0.058;
    float r2 = (bx * bx) / (0.052 * 0.052) + (by * by) / (sigmaY * sigmaY);
    
    float anterior = clamp((p.z - 0.020) / 0.080, 0.0, 1.0);
    float breastMound = exp(-r2) * anterior * 0.046 * factor;

    float rApex = sqrt(bx * bx + by * by);
    float areolaElev = 0.0018 * exp(-pow(rApex / 0.020, 2.0)) * factor;
    float nippleElev = 0.0042 * exp(-pow(rApex / 0.0055, 2.0)) * factor;

    nz += breastMound + areolaElev + nippleElev;

    float sternum = exp(-pow(p.x / 0.022, 2.0)) * exp(-pow(by / 0.080, 2.0)) * anterior;
    nz -= sternum * 0.012 * factor;

    if (by < -0.045 && by > -0.090) {
      float imfProgress = clamp((by + 0.090) / 0.045, 0.0, 1.0);
      float imfCrease = sin(imfProgress * 3.14159265) * exp(-pow(bx / 0.040, 2.0));
      nz -= imfCrease * 0.006 * factor;
    }
  }

  // 2. ADULT FEMALE EXTERNAL GENITALIA (VULVA & PERINEUM)
  if (ax < 0.055 && p.y >= 0.730 && p.y <= 0.895) {
    float baseZ = 0.035 + clamp((p.y - 0.735) / 0.150, 0.0, 1.0) * 0.039;
    float latFade = 1.0 - smoothstep(0.025, 0.050, ax);
    float vertFade = smoothstep(0.730, 0.750, p.y) * (1.0 - smoothstep(0.875, 0.895, p.y));
    float vulvaZone = latFade * vertFade;

    if (vulvaZone > 0.001) {
      float monsRelief = 0.011 * exp(-pow(p.x / 0.036, 2.0) - pow((p.y - 0.865) / 0.025, 2.0));
      float yProg = clamp((p.y - 0.750) / 0.095, 0.0, 1.0);
      float labiaEnvelope = sin(yProg * 3.14159265);
      float labiaRelief = 0.007 * (exp(-pow((p.x - 0.016) / 0.010, 2.0)) + exp(-pow((p.x + 0.016) / 0.010, 2.0))) * labiaEnvelope;
      float cleftRelief = 0.0045 * exp(-pow(p.x / 0.0065, 2.0)) * labiaEnvelope;

      float targetZ = baseZ + monsRelief + labiaRelief - cleftRelief;

      if (nz > targetZ) {
        nz = mix(nz, targetZ, vulvaZone * factor);
      } else {
        nz += (monsRelief + labiaRelief - cleftRelief) * vulvaZone * factor;
      }
    }
  }

  // 3. ADULT FEMALE GLUTEAL FULLNESS
  float glute = exp(-pow(p.x / 0.095, 2.0)) * exp(-pow((p.y - 0.800) / 0.120, 2.0));
  float posterior = clamp((-nz - 0.020) / 0.080, 0.0, 1.0);
  nz -= glute * posterior * 0.011 * factor;

  return vec3(p.x, p.y, nz);
}

vec3 applyFemaleMorph(vec3 p, float factor, float isMuscle) {
  if (factor < 0.0001) return p;

  float footY = 0.03;
  float relY = max(0.0, p.y - footY);
  float dy = -relY * 0.032 * factor;
  float curY = p.y + dy;

  bool isArm = (abs(p.x) > 0.17 && curY > 0.70 && curY < 1.45);
  bool isLeg = (curY < 0.82);

  float dx = 0.0;
  float dz = 0.0;

  if (isArm) {
    float armSign = sign(p.x);
    dx -= armSign * 0.028 * factor;
    float armCenterX = armSign * (0.24 - 0.028 * factor);
    dx -= (p.x - armCenterX) * 0.11 * factor;
  } else if (!isLeg) {
    if (curY > 1.44) {
      dx -= p.x * 0.07 * factor;
      dz -= p.z * 0.05 * factor;

      // 1. Cervical column (neck) slenderizing
      if (curY < 1.50) {
        float neckProg = (1.50 - curY) / 0.06;
        float neckSmooth = neckProg * neckProg * (3.0 - 2.0 * neckProg);
        dx -= p.x * 0.05 * neckSmooth * factor;
        dz -= p.z * 0.03 * neckSmooth * factor;

        // Smooth elimination of the laryngeal prominence (Adam's apple)
        float yNorm = (curY - 1.44) / 0.06;
        float yProf = sin(3.14159265 * yNorm);
        float zAnt = clamp((p.z - 0.015) / 0.030, 0.0, 1.0);
        float zAntSmooth = zAnt * zAnt * (3.0 - 2.0 * zAnt);
        dz -= 0.009 * yProf * zAntSmooth * factor;
      }

      // 2. Mandibular taper: soften square masculine jaw into an elegant, feminine oval contour
      if (curY >= 1.48 && curY <= 1.56) {
        float jProg = (curY - 1.48) / 0.08;
        float jProf = sin(3.14159265 * jProg);
        dx -= p.x * 0.05 * jProf * factor;
      }

      // 3. Soft feminine chin
      if (curY >= 1.495 && curY <= 1.530) {
        float chinZ = clamp((p.z - 0.045) / 0.025, 0.0, 1.0);
        float chinZSmooth = chinZ * chinZ * (3.0 - 2.0 * chinZ);
        float chin = exp(-pow(p.x / 0.032, 2.0) - pow((curY - 1.512) / 0.016, 2.0)) * chinZSmooth;
        dx -= p.x * 0.08 * chin * factor;
        dz -= 0.0035 * chin * factor;
      }

      // 4. High feminine malar cheekbones
      if (curY >= 1.560 && curY <= 1.620) {
        float malarZ = clamp((p.z - 0.020) / 0.030, 0.0, 1.0);
        float malarZSmooth = malarZ * malarZ * (3.0 - 2.0 * malarZ);
        float malar = exp(-pow((abs(p.x) - 0.046) / 0.018, 2.0) - pow((curY - 1.585) / 0.024, 2.0)) * malarZSmooth;
        dz += 0.0035 * malar * factor;
        dx += sign(p.x) * 0.0020 * malar * factor;
      }

      // 5. Smooth vertical feminine forehead contour
      if (curY >= 1.605 && curY <= 1.655) {
        float browZ = clamp((p.z - 0.035) / 0.030, 0.0, 1.0);
        float browZSmooth = browZ * browZ * (3.0 - 2.0 * browZ);
        float brow = exp(-pow(p.x / 0.055, 2.0) - pow((curY - 1.625) / 0.018, 2.0)) * browZSmooth;
        dz -= 0.0040 * brow * factor;
      }
    } else if (curY > 1.34) {
      float shoulderFactor = (curY - 1.34) / 0.10;
      dx -= p.x * (0.12 + 0.06 * shoulderFactor) * factor;
      dz -= p.z * 0.07 * factor;
    } else if (curY > 1.16) {
      dx -= p.x * 0.10 * factor;
      if (p.z < 0.11) {
        dz -= p.z * 0.08 * factor;
      }
    } else if (curY > 1.00) {
      float waistProfile = sin(((curY - 1.00) / 0.16) * 3.14159265);
      dx -= p.x * (0.09 + 0.12 * waistProfile) * factor;
      dz -= p.z * (0.05 + 0.05 * waistProfile) * factor;
    }
  }

  if (curY >= 0.78 && curY <= 1.02) {
    float hipProfile = sin(((curY - 0.78) / 0.24) * 3.14159265);
    dx += p.x * 0.13 * hipProfile * factor;
    if (curY < 0.92 && abs(p.x) < 0.075) {
      dx += sign(p.x) * 0.012 * (1.0 - abs(p.x) / 0.075) * factor;
    }
    if (p.z < 0.0) {
      dz -= abs(p.z) * 0.10 * hipProfile * factor;
    }
  }

  if (isLeg) {
    float legSign = sign(p.x);
    if (curY > 0.46) {
      float qProg = (curY - 0.46) / 0.36;
      float thighFullness = sin(qProg * 3.14159265) * 0.07;
      dx += legSign * 0.014 * qProg * factor;
      dx += (p.x - legSign * 0.10) * thighFullness * factor;
    } else {
      float calfDistX = p.x - legSign * 0.09;
      dx -= calfDistX * 0.09 * factor;
    }
  }

  float resX = p.x + dx;
  float resY = curY;
  float resZ = p.z + dz;

  if (isMuscle > 0.5) {
    if (isArm) {
      float armSign = sign(resX);
      float boneCenterX = armSign * (0.22 - 0.028 * factor);
      resX -= (resX - boneCenterX) * 0.33 * factor;
      resZ -= resZ * 0.30 * factor;
    } else if (!isLeg) {
      if (resY > 1.20 && resY < 1.36 && resZ > 0.035) {
        resZ -= (resZ - 0.035) * 0.30 * factor;
      }
      if (resY > 1.34 && resY < 1.48) {
        resX -= resX * 0.10 * factor;
      }
      if (resY >= 0.98 && resY <= 1.18 && resZ > 0.01) {
        resZ -= (resZ - 0.01) * 0.32 * factor;
      }
    } else {
      float legSign = sign(resX);
      float boneCenterX = legSign * 0.09;
      resX -= (resX - boneCenterX) * 0.24 * factor;
    }
  }

  return vec3(resX, resY, resZ);
}
`;
