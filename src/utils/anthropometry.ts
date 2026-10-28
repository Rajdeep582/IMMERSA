import * as THREE from 'three';

/**
 * Anthropometric sexual dimorphism for the shared BodyParts3D reference mesh.
 *
 * Grounded in scientifically documented adult human sexual dimorphism derived
 * from the ANSUR II anthropometric dataset, NASA-STD-3000, and Gray's Anatomy
 * (42nd ed.):
 * - Craniofacial: Graceful, slender cervical column, softened thyroid cartilage (no
 *   Adam's apple), smooth oval mandibular taper, feminine malar fullness, and smooth,
 *   vertical forehead contour without supraorbital bossing.
 * - Thorax & Breasts: Natural anatomical teardrop ptosis with rounded lower pole,
 *   inframammary crease (IMF), sternal cleavage, and harmonious integration
 *   with procedural areola/nipple and mammary gland complexes.
 * - Waist & Pelvis: Authentic female waist-to-hip ratio (~0.72-0.74), gynecoid
 *   pelvic flare, widened intertrochanteric breadth, and rounded gluteal contours.
 * - External Genitalia: Natural perineal floor with clean retraction of male
 *   protrusion, seamlessly seating the anatomically accurate procedural vulvar
 *   structures (mons pubis, labia majora/minora, clitoral hood/glans).
 * - Extremities: Q-angle femoral convergence, carrying angle, and slender calves.
 */

function smoothstep(e0: number, e1: number, val: number): number {
  const t = Math.max(0, Math.min(1, (val - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

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
    if (curY > 1.48) {
      // 1. Craniofacial scaling: adult female cranium is ~6% narrower and ~4% shallower AP.
      dx -= x * 0.06 * factor;
      dz -= (z - 0.01) * 0.04 * factor;

      // 2. Mandibular taper: soften square masculine jaw into an elegant, feminine oval contour
      if (curY >= 1.46 && curY <= 1.56) {
        const jProg = (curY - 1.46) / 0.10;
        const jProf = Math.sin(Math.PI * jProg);
        dx -= x * 0.07 * jProf * factor;
        if (z > 0.03) {
          dz -= 0.003 * jProf * factor;
        }
      }

      // 3. Smooth vertical feminine forehead contour (softening supraorbital bossing across brow)
      if (curY >= 1.58 && curY <= 1.66 && z > 0.035) {
        const browProg = Math.sin(((curY - 1.58) / 0.08) * Math.PI);
        const browAnt = Math.min(1.0, (z - 0.035) / 0.035);
        const browSmooth = browAnt * browAnt * (3.0 - 2.0 * browAnt);
        dz -= 0.0045 * browProg * browSmooth * factor;
      }
    } else if (curY > 1.38) {
      // Cervical column (neck) continuous taper
      const neckProg = Math.min(1.0, Math.max(0.0, (1.50 - curY) / 0.12));
      const neckFactor = neckProg * neckProg * (3.0 - 2.0 * neckProg);
      dx -= x * 0.05 * neckFactor * factor;
      dz -= z * 0.04 * neckFactor * factor;

      // Smooth reduction of thyroid cartilage prominence (Adam's apple)
      if (curY >= 1.44 && curY <= 1.50 && z > 0.020) {
        const yNorm = (curY - 1.44) / 0.06;
        const yProf = Math.sin(Math.PI * yNorm);
        const zAnt = Math.min(1.0, (z - 0.020) / 0.025);
        const zAntSmooth = zAnt * zAnt * (3.0 - 2.0 * zAnt);
        dz -= 0.0045 * yProf * zAntSmooth * factor;
      }
    } else if (curY > 1.26) {
      // Biacromial breadth: narrower female shoulder girdle
      const shoulderFactor = (curY - 1.26) / 0.16;
      const shoulderSmooth = shoulderFactor * shoulderFactor * (3.0 - 2.0 * shoulderFactor);
      dx -= x * (0.10 + 0.04 * shoulderSmooth) * factor;
      dz -= z * 0.06 * factor;
    } else if (curY > 1.16) {
      // Thorax: narrower transverse diameter
      dx -= x * 0.10 * factor;
      if (z < 0.11) {
        dz -= z * 0.07 * factor;
      }
    } else if (curY > 0.98) {
      // Lumbar waist: authentic female waist-to-hip ratio (~0.73)
      const waistProfile = Math.sin(((curY - 0.98) / 0.18) * Math.PI);
      dx -= x * (0.08 + 0.12 * waistProfile) * factor;
      dz -= z * (0.04 + 0.04 * waistProfile) * factor;
    }
  }

  // Gynecoid pelvis: wider iliac crests, greater intertrochanteric breadth
  if (curY >= 0.76 && curY <= 1.02) {
    const hipProfile = Math.sin(((curY - 0.76) / 0.26) * Math.PI);
    dx += x * 0.13 * hipProfile * factor;
    if (curY < 0.92 && Math.abs(x) < 0.075) {
      dx += Math.sign(x) * 0.012 * (1 - Math.abs(x) / 0.075) * factor;
    }
    if (z < 0) {
      dz -= Math.abs(z) * 0.09 * hipProfile * factor;
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
 * Female surface detail applied to the outer skin mesh: natural breast
 * contour, gluteal fullness, and clean retraction of the male external
 * genital surface.
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
  // Base: Ribs 2 to 6 (Y: 1.13 to 1.34 m), sternal border to anterior axillary line.
  // Centered at X = +-0.078 m, Y = 1.246 m.
  const ax = Math.abs(nx);
  if (ax > 0.015 && ax < 0.180 && ny > 1.130 && ny < 1.340 && nz > 0.010) {
    const bx = ax - 0.078;
    const by = ny - 1.246;
    // Anatomical teardrop ptosis: upper pole (by > 0) has gentle incline (sigma 0.080 m);
    // lower pole (by < 0) has full, rounded supported projection (sigma 0.056 m).
    const sigmaY = by > 0 ? 0.080 : 0.056;
    const r2 = (bx * bx) / (0.052 * 0.052) + (by * by) / (sigmaY * sigmaY);

    // Natural breast elevation (up to 4.6 cm forward projection at apex)
    const anterior = Math.min(1, Math.max(0, (nz - 0.015) / 0.080));
    const breastMound = Math.exp(-r2) * anterior * 0.046 * factor;
    nz += breastMound;

    // Sternal cleavage preservation: gentle anatomical depression between breasts
    const sternum = Math.exp(-Math.pow(nx / 0.024, 2)) * Math.exp(-Math.pow(by / 0.080, 2)) * anterior;
    nz -= sternum * 0.007 * factor;

    // Inframammary fold: natural sub-mammary crease at ribs 5-6
    if (by < -0.045 && by > -0.090) {
      const imfProgress = Math.min(1, Math.max(0, (by + 0.090) / 0.045));
      const imfCrease = Math.sin(imfProgress * Math.PI) * Math.exp(-Math.pow(bx / 0.042, 2));
      nz -= imfCrease * 0.004 * factor;
    }
  }

  // 2. RETRACT MALE PENILE PROTRUSION ON SKIN MESH
  // Retracts male genital volume flush with the natural anterior pelvic floor,
  // providing a clean, seamless base for the procedural female external genitalia.
  const absX = Math.abs(nx);
  if (absX < 0.055 && ny >= 0.730 && ny <= 0.895) {
    const targetZ = 0.038 + Math.max(0, Math.min(1, (ny - 0.735) / 0.150)) * 0.034;
    const latFade = 1.0 - smoothstep(0.025, 0.050, absX);
    const vertFade = smoothstep(0.730, 0.750, ny) * (1.0 - smoothstep(0.875, 0.895, ny));
    const vulvaZone = latFade * vertFade;

    if (vulvaZone > 0.001 && nz > targetZ) {
      nz = nz * (1.0 - vulvaZone * factor) + targetZ * (vulvaZone * factor);
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
  if (ax > 0.015 && ax < 0.180 && p.y > 1.130 && p.y < 1.340 && p.z > 0.010) {
    float bx = ax - 0.078;
    float by = p.y - 1.246;
    float sigmaY = by > 0.0 ? 0.080 : 0.056;
    float r2 = (bx * bx) / (0.052 * 0.052) + (by * by) / (sigmaY * sigmaY);

    float anterior = clamp((p.z - 0.015) / 0.080, 0.0, 1.0);
    float breastMound = exp(-r2) * anterior * 0.046 * factor;
    nz += breastMound;

    float sternum = exp(-pow(p.x / 0.024, 2.0)) * exp(-pow(by / 0.080, 2.0)) * anterior;
    nz -= sternum * 0.007 * factor;

    if (by < -0.045 && by > -0.090) {
      float imfProgress = clamp((by + 0.090) / 0.045, 0.0, 1.0);
      float imfCrease = sin(imfProgress * 3.14159265) * exp(-pow(bx / 0.042, 2.0));
      nz -= imfCrease * 0.004 * factor;
    }
  }

  // 2. RETRACT MALE PENILE PROTRUSION ON SKIN MESH
  if (ax < 0.055 && p.y >= 0.730 && p.y <= 0.895) {
    float targetZ = 0.038 + clamp((p.y - 0.735) / 0.150, 0.0, 1.0) * 0.034;
    float latFade = 1.0 - smoothstep(0.025, 0.050, ax);
    float vertFade = smoothstep(0.730, 0.750, p.y) * (1.0 - smoothstep(0.875, 0.895, p.y));
    float vulvaZone = latFade * vertFade;

    if (vulvaZone > 0.001 && nz > targetZ) {
      nz = mix(nz, targetZ, vulvaZone * factor);
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
    if (curY > 1.48) {
      // 1. Craniofacial scaling: adult female cranium is ~6% narrower and ~4% shallower AP.
      dx -= p.x * 0.06 * factor;
      dz -= (p.z - 0.01) * 0.04 * factor;

      // 2. Mandibular taper: soften square masculine jaw into an elegant, feminine oval contour
      if (curY >= 1.46 && curY <= 1.56) {
        float jProg = (curY - 1.46) / 0.10;
        float jProf = sin(3.14159265 * jProg);
        dx -= p.x * 0.07 * jProf * factor;
        if (p.z > 0.03) {
          dz -= 0.003 * jProf * factor;
        }
      }

      // 3. Smooth vertical feminine forehead contour (softening supraorbital bossing across brow)
      if (curY >= 1.58 && curY <= 1.66 && p.z > 0.035) {
        float browProg = sin(((curY - 1.58) / 0.08) * 3.14159265);
        float browAnt = clamp((p.z - 0.035) / 0.035, 0.0, 1.0);
        float browSmooth = browAnt * browAnt * (3.0 - 2.0 * browAnt);
        dz -= 0.0045 * browProg * browSmooth * factor;
      }
    } else if (curY > 1.38) {
      // Cervical column (neck) continuous taper
      float neckProg = clamp((1.50 - curY) / 0.12, 0.0, 1.0);
      float neckFactor = neckProg * neckProg * (3.0 - 2.0 * neckProg);
      dx -= p.x * 0.05 * neckFactor * factor;
      dz -= p.z * 0.04 * neckFactor * factor;

      // Smooth reduction of thyroid cartilage prominence (Adam's apple)
      if (curY >= 1.44 && curY <= 1.50 && p.z > 0.020) {
        float yNorm = (curY - 1.44) / 0.06;
        float yProf = sin(3.14159265 * yNorm);
        float zAnt = clamp((p.z - 0.020) / 0.025, 0.0, 1.0);
        float zAntSmooth = zAnt * zAnt * (3.0 - 2.0 * zAnt);
        dz -= 0.0045 * yProf * zAntSmooth * factor;
      }
    } else if (curY > 1.26) {
      // Biacromial breadth: narrower female shoulder girdle
      float shoulderFactor = (curY - 1.26) / 0.16;
      float shoulderSmooth = shoulderFactor * shoulderFactor * (3.0 - 2.0 * shoulderFactor);
      dx -= p.x * (0.10 + 0.04 * shoulderSmooth) * factor;
      dz -= p.z * 0.06 * factor;
    } else if (curY > 1.16) {
      // Thorax: narrower transverse diameter
      dx -= p.x * 0.10 * factor;
      if (p.z < 0.11) {
        dz -= p.z * 0.07 * factor;
      }
    } else if (curY > 0.98) {
      // Lumbar waist: authentic female waist-to-hip ratio (~0.73)
      float waistProfile = sin(((curY - 0.98) / 0.18) * 3.14159265);
      dx -= p.x * (0.08 + 0.12 * waistProfile) * factor;
      dz -= p.z * (0.04 + 0.04 * waistProfile) * factor;
    }
  }

  // Gynecoid pelvis: wider iliac crests, greater intertrochanteric breadth
  if (curY >= 0.76 && curY <= 1.02) {
    float hipProfile = sin(((curY - 0.76) / 0.26) * 3.14159265);
    dx += p.x * 0.13 * hipProfile * factor;
    if (curY < 0.92 && abs(p.x) < 0.075) {
      dx += sign(p.x) * 0.012 * (1.0 - abs(p.x) / 0.075) * factor;
    }
    if (p.z < 0.0) {
      dz -= abs(p.z) * 0.09 * hipProfile * factor;
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
