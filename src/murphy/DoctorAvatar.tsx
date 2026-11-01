import { useId } from 'react';

/**
 * Animated Doctor Murphy mascot (pure SVG + CSS): a friendly doctor with a head mirror, white coat and
 * stethoscope. Blinks and breathes when idle, looks up and "thinks" while searching, and talks
 * (mouth moves) while the answer streams.
 */
export function DoctorAvatar({ size = 40, state = 'idle', className = '' }: { size?: number; state?: 'idle' | 'thinking' | 'talking'; className?: string }) {
  const u = useId().replace(/:/g, '');
  const id = (n: string) => `${n}${u}`;
  return (
    <svg className={`doc-av ${state} ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id={id('docBg')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fe3d8" />
          <stop offset="0.55" stopColor="#4fb8ac" />
          <stop offset="1" stopColor="#2f8d84" />
        </linearGradient>
        <linearGradient id={id('docSkin')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d2b1" />
          <stop offset="1" stopColor="#e9b892" />
        </linearGradient>
        <radialGradient id={id('docMirror')} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d9e6ef" />
          <stop offset="1" stopColor="#8fa6b6" />
        </radialGradient>
        <clipPath id={id('docClip')}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id('docClip')})`}>
        <circle cx="32" cy="32" r="32" fill={`url(#${id('docBg')})`} />
        <g className="doc-body">
          {/* coat + shirt + tie */}
          <path d="M8 66 C9 52 18 46 32 46 C46 46 55 52 56 66 Z" fill="#f7f9fb" />
          <path d="M26 46.5 L32 56 L38 46.5 C36 46 34 45.8 32 45.8 C30 45.8 28 46 26 46.5 Z" fill="#cfe3f2" />
          <path d="M31 50 L33 50 L34 58 L32 60 L30 58 Z" fill="#2f6f9f" />
          <path d="M26 46.5 L23 52 L28 55 L32 56 Z M38 46.5 L41 52 L36 55 L32 56 Z" fill="#e3e9ef" />
          {/* stethoscope */}
          <path d="M23 49 C21 55 23 59 27 59.5 M41 49 C43 55 41 59 37 59.5" fill="none" stroke="#2d3a44" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="37.2" cy="60.2" r="2.1" fill="#c9d3db" stroke="#55636e" strokeWidth="0.8" />
          {/* neck */}
          <path d="M27.5 40 L36.5 40 L36 47 C34 48.2 30 48.2 28 47 Z" fill="#e5b38d" />
          {/* head */}
          <g className="doc-head">
            <ellipse cx="32" cy="29" rx="11.5" ry="13" fill={`url(#${id('docSkin')})`} />
            <ellipse cx="20.6" cy="30" rx="2" ry="3" fill="#e9b892" />
            <ellipse cx="43.4" cy="30" rx="2" ry="3" fill="#e9b892" />
            {/* hair */}
            <path d="M20.5 27 C19.5 17 25 13 32.5 13 C40 13 45 17.5 43.6 27 C42 22 38.5 19.8 33 20.6 C28 21.3 24 21 20.5 27 Z" fill="#3b3330" />
            {/* head mirror band + mirror */}
            <path d="M21 22.5 C26 18.6 38 18.6 43 22.5" fill="none" stroke="#3a4650" strokeWidth="1.6" />
            <circle className="doc-mirror" cx="32" cy="19.5" r="4.4" fill={`url(#${id('docMirror')})`} stroke="#6d808e" strokeWidth="0.9" />
            <circle cx="32" cy="19.5" r="1.1" fill="#56697a" />
            {/* eyes */}
            <g className="doc-eyes">
              <ellipse cx="27.4" cy="29.6" rx="1.45" ry="1.75" fill="#2a2523" />
              <ellipse cx="36.6" cy="29.6" rx="1.45" ry="1.75" fill="#2a2523" />
              <circle cx="27.9" cy="29" r="0.45" fill="#fff" />
              <circle cx="37.1" cy="29" r="0.45" fill="#fff" />
            </g>
            <path d="M25.2 26.2 C26.4 25.3 28.3 25.3 29.4 26" fill="none" stroke="#3b3330" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M34.6 26 C35.7 25.3 37.6 25.3 38.8 26.2" fill="none" stroke="#3b3330" strokeWidth="0.9" strokeLinecap="round" />
            {/* nose, cheeks */}
            <path d="M32 30.5 C31.4 32.6 31.2 33.4 32.6 33.6" fill="none" stroke="#c98f6c" strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="25.6" cy="34" r="1.6" fill="#f09c8a" opacity="0.35" />
            <circle cx="38.4" cy="34" r="1.6" fill="#f09c8a" opacity="0.35" />
            {/* mouth (smile / talking) */}
            <path className="doc-smile" d="M28.8 36.2 C30.6 38.3 33.4 38.3 35.2 36.2" fill="none" stroke="#9c4f42" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse className="doc-talk" cx="32" cy="37" rx="2.2" ry="1.4" fill="#8e3f35" />
          </g>
        </g>
      </g>
      {/* thinking sparkles */}
      <g className="doc-think" fill="#fff">
        <circle cx="49" cy="14" r="1.6" />
        <circle cx="53.5" cy="10" r="2.1" />
        <circle cx="58.5" cy="6" r="2.6" />
      </g>
    </svg>
  );
}
