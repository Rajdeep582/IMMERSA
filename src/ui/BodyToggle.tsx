import { Loader2 } from 'lucide-react';
import type { BodyModel } from '../data/types';

const OPTIONS: { id: BodyModel; label: string; title: string }[] = [
  { id: 'male', label: 'Male', title: 'Male body — BodyParts3D (2,234 meshes)' },
  { id: 'female', label: 'Female', title: 'Female body — HRA Visible Human Female reference organs (882 meshes)' },
];

/** Segmented control switching between the male and female anatomical models. */
export function BodyToggle({ value, pending, onChange }: { value: BodyModel; pending: BodyModel | null; onChange: (m: BodyModel) => void }) {
  return (
    <div className="body-toggle" role="radiogroup" aria-label="Body model">
      {OPTIONS.map((o) => (
        <button key={o.id} role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} title={o.title} onClick={() => onChange(o.id)} disabled={!!pending}>
          {pending === o.id && <Loader2 size={12} className="spin" />}
          {o.label}
        </button>
      ))}
      <span className="body-toggle-thumb" style={{ transform: `translateX(${value === 'male' ? 0 : 100}%)` }} aria-hidden />
    </div>
  );
}
