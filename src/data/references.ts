import type { Reference } from './types';

/** Primary sources. Curated text cites OpenStax by section number; structure identity comes from FMA via BodyParts3D. */
const OPENSTAX_BOOK = 'https://openstax.org/details/books/anatomy-and-physiology-2e';

export const os = (section: string): Reference => ({
  label: `OpenStax Anatomy & Physiology 2e, §${section}`,
  url: OPENSTAX_BOOK,
});

export const fmaRef = (fmaId: string): Reference => ({
  label: `Foundational Model of Anatomy ${fmaId.replace('FMA', 'FMA:')}`,
  url: `https://bioregistry.io/fma:${fmaId.replace('FMA', '')}`,
});

/** Ontology reference for HRA crosswalk ids (UBERON via OBO PURL, FMA via bioregistry). */
export const ontRef = (id: string): Reference =>
  id.startsWith('FMA')
    ? fmaRef(id.replace(':', ''))
    : { label: `UBERON ontology ${id}`, url: `http://purl.obolibrary.org/obo/${id.replace(':', '_')}` };

export const HRA: Reference = {
  label: 'HuBMAP Human Reference Atlas 3D Reference Object Library (Visible Human Female), CC BY 4.0',
  url: 'https://github.com/hubmapconsortium/ccf-3d-reference-object-library',
};

export const BODYPARTS3D: Reference = {
  label: 'BodyParts3D, © The Database Center for Life Science (DBCLS), CC BY 4.0',
  url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
};

export const SOURCES = [
  {
    model: 'female',
    name: 'HRA 3D Reference Object Library v1.2–v1.4 (Visible Human Female)',
    by: 'HuBMAP Human Reference Atlas (HRA) consortium',
    license: 'CC BY 4.0',
    use: '882 female meshes in one registered body frame: reproductive organs, mammary glands, brain (Allen atlas parcellation), spinal cord segments, vertebrae, pelvis, knee region, organs, eyes, vessels. Node labels and UBERON/FMA ids from the HRA ASCT+B ↔ 3D crosswalk (v2.0). Re-centred, simplified for the body view, meshopt-compressed.',
    attribution: '"3D Reference Object Library, HuBMAP Human Reference Atlas" — https://humanatlas.io',
    url: 'https://github.com/hubmapconsortium/ccf-3d-reference-object-library',
  },
  {
    model: 'male',
    name: 'BodyParts3D 4.0 (is_a / part_of builds, OBJ, 99% quality)',
    by: 'The Database Center for Life Science (DBCLS), Japan',
    license: 'CC BY 4.0 (per current DBCLS licence page). The OBJ file headers carry the earlier notice "CC BY-SA 2.1 Japan".',
    use: 'Geometry of all 2,234 element meshes, FMA concept ids and English names, is_a/part_of relations. Converted to glTF (metres, y-up), simplified for the body view, meshopt-compressed.',
    attribution: '"BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"',
    url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
  },
  {
    model: 'both',
    name: 'Foundational Model of Anatomy (FMA)',
    by: 'University of Washington Structural Informatics Group',
    license: 'CC BY 3.0',
    use: 'Stable structure identifiers and canonical English terms (via BodyParts3D).',
    attribution: 'FMA ids link to bioregistry.io resolvers.',
    url: 'https://bioregistry.io/registry/fma',
  },
  {
    model: 'both',
    name: 'OpenStax Anatomy and Physiology 2e',
    by: 'OpenStax, Rice University',
    license: 'CC BY 4.0',
    use: 'Basis for curated educational summaries (cited per entry by section).',
    attribution: 'Access for free at openstax.org',
    url: OPENSTAX_BOOK,
  },
];
