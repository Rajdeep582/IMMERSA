import { SOURCES } from '../data/references';
import type { Registry } from '../data/registry';

export function SourcesPanel({ registry }: { registry: Registry }) {
  const m = registry.manifest.systems;
  const total = Object.values(m).reduce((a, s) => a + (s?.units ?? 0), 0);
  const tris = Object.values(m).reduce((a, s) => a + (s?.trisFull ?? 0), 0);
  return (
    <div className="sources">
      <p className="small">
        {total.toLocaleString()} meshes · {(tris / 1e6).toFixed(2)}M triangles at full resolution · {registry.structures.size.toLocaleString()} hierarchy nodes.
      </p>
      {SOURCES.filter((s) => s.model === 'both' || s.model === registry.model).map((s) => (
        <article key={s.name} className="source">
          <h3>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name}
            </a>
          </h3>
          <div className="muted small">{s.by}</div>
          <dl>
            <dt>Licence</dt>
            <dd>{s.license}</dd>
            <dt>Used for</dt>
            <dd>{s.use}</dd>
            <dt>Attribution</dt>
            <dd>{s.attribution}</dd>
          </dl>
        </article>
      ))}
      <article className="source">
        <h3>Known gaps in the {registry.model} model</h3>
        {registry.model === 'male' ? (
          <ul className="small">
            <li>The spinal cord is not modelled (only a short upper-cervical segment of its central canal exists), and there are no spinal nerves or nerve roots. Peripheral nerves are limited to the optic nerves and orbital branches of the oculomotor, trochlear and ophthalmic nerves.</li>
            <li>No lung surfaces (only the bronchial tree and pulmonary vessels), no lymph vessels or nodes.</li>
            <li>Skin is a single surface; epidermis, dermis, hypodermis and appendages are not separated.</li>
            <li>Hip bones are single meshes (ilium, ischium and pubis not separated); bony landmarks are not segmented.</li>
            <li>No microscopic or histological models are included.</li>
            <li>Hierarchy groupings (regions, sides) are organised for navigation from FMA names and positions; identities and names are FMA terms.</li>
          </ul>
        ) : (
          <ul className="small">
            <li>Skeleton limited to the vertebral column (C1–L6; this body has six lumbar vertebrae), pelvis (ilium, ischium, pubis as compact and spongy bone), and femur, patella, tibia and fibula from the knee models. No skull, ribs, sternum, upper-limb or foot bones.</li>
            <li>Muscles limited to extra-ocular muscles and rectus femoris with the quadriceps tendon. No general musculature.</li>
            <li>No stomach, oesophagus, oral cavity, endocrine glands or peripheral/spinal nerves; vessels cover the head (orbit), thorax, abdomen and pelvis but not the limbs.</li>
            <li>The lymph node is the HRA generic reference node at a single placement; the placenta model is excluded (pregnancy-specific).</li>
            <li>Landmark surfaces (impressions, entheses, condyles, hila) are thin patches on organ/bone surfaces and are listed under "Landmarks and surfaces".</li>
            <li>Missing structures are not substituted from the male model: the two bodies are different individuals and are not co-registered.</li>
          </ul>
        )}
      </article>
    </div>
  );
}
