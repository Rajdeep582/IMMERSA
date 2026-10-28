import type { BiologicalSex, Part, SystemId } from '../types/anatomy';
import { FEMALE_PARTS } from './femaleAnatomy.ts';
import { MALE_ADDITIONAL_PARTS, MALE_BINARY_SPECIFIC_IDS } from './maleAnatomy.ts';

/**
 * Single source of truth for model ownership, surface classification and
 * material assignment. Keeping these rules in one place prevents the class of
 * bugs where a female layer accidentally renders a male structure (or vice
 * versa) because three different components each carried their own ID list.
 */

export const MALE_SPECIFIC_PARTS = new Set<string>([
  ...MALE_BINARY_SPECIFIC_IDS,
  ...MALE_ADDITIONAL_PARTS.map((part) => part.id),
]);

export const FEMALE_SPECIFIC_PARTS = new Set<string>(FEMALE_PARTS.map((part) => part.id));

export const ADDITIONAL_PARTS: Part[] = [...FEMALE_PARTS, ...MALE_ADDITIONAL_PARTS];

/** Structures that belong on the external (intact-body) surface. */
export const EXTERNAL_GENITAL_PARTS = new Set<string>([
  'FJ3134', // glans penis
  'F_MONS_PUBIS',
  'F_LABIUM_MAJUS_R',
  'F_LABIUM_MAJUS_L',
  'F_LABIUM_MINUS_R',
  'F_LABIUM_MINUS_L',
  'F_CLITORIS_GLANS',
  'F_CLITORAL_HOOD',
  'F_VESTIBULE',
  'F_URETHRA_ORIFICE',
  'F_VAGINAL_ORIFICE',
  'M_SCROTUM',
  'M_URETHRA_MEATUS',
]);

export const SURFACE_PART_IDS = new Set<string>([
  'FJ2810', // skin
  'FJ2812', // eyebrow
  'FJ2813', // hair of head
  'FJ2814', // lip
  'FJ2815', // pubic hair (male; hidden on female model)
  'F_HAIR',  // hair of head (female)
  'F_AREOLA_R',
  'F_AREOLA_L',
  'F_NIPPLE_R',
  'F_NIPPLE_L',
  ...EXTERNAL_GENITAL_PARTS,
]);

export type PartMaterialKey =
  | SystemId
  | 'skin'
  | 'genital-skin'
  | 'scrotum'
  | 'hair'
  | 'lip'
  | 'mucosa'
  | 'mucosa-light'
  | 'vestibule'
  | 'areola'
  | 'nipple'
  | 'orifice';

export function isPartVisibleForSex(partId: string, sex: BiologicalSex): boolean {
  if (sex === 'female') return !MALE_SPECIFIC_PARTS.has(partId);
  return !FEMALE_SPECIFIC_PARTS.has(partId);
}

export function getPartSex(partId: string): BiologicalSex | 'both' {
  if (FEMALE_SPECIFIC_PARTS.has(partId)) return 'female';
  if (MALE_SPECIFIC_PARTS.has(partId)) return 'male';
  return 'both';
}

export function isExternalGenitalPart(partId: string): boolean {
  return EXTERNAL_GENITAL_PARTS.has(partId);
}

export function isSurfacePart(part: Part): boolean {
  return SURFACE_PART_IDS.has(part.id) || part.system === 'sensory';
}

/**
 * Assigns the material that matches the tissue, not merely the organ system.
 * The atlas stores skin, hair and lip in a single integumentary layer; without
 * this split the pubic hair renders bone-white and the lips share the skin
 * shader.
 */
export function getPartMaterialKey(part: Part): PartMaterialKey {
  if (part.id === 'FJ2810') return 'skin';
  if (['FJ2812', 'FJ2813', 'FJ2815', 'F_HAIR'].includes(part.id)) return 'hair';
  if (part.id === 'FJ2814') return 'lip';
  if (part.id === 'F_AREOLA_R' || part.id === 'F_AREOLA_L') return 'areola';
  if (part.id === 'F_NIPPLE_R' || part.id === 'F_NIPPLE_L') return 'nipple';
  if (['F_URETHRA_ORIFICE', 'F_VAGINAL_ORIFICE', 'M_URETHRA_MEATUS'].includes(part.id)) return 'orifice';
  if (part.id === 'F_VESTIBULE') return 'vestibule';
  if (['F_LABIUM_MINUS_R', 'F_LABIUM_MINUS_L', 'F_CLITORIS_GLANS', 'F_CLITORIS', 'FJ3134'].includes(part.id)) {
    return 'mucosa-light';
  }
  if (['F_MONS_PUBIS', 'F_LABIUM_MAJUS_R', 'F_LABIUM_MAJUS_L', 'F_CLITORAL_HOOD'].includes(part.id)) {
    return 'genital-skin';
  }
  if (part.id === 'M_SCROTUM') return 'scrotum';
  return part.system;
}
