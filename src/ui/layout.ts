import { useEffect, useState } from 'react';

export type LayoutKind = 'phone' | 'tablet' | 'desktop';
export interface Layout {
  kind: LayoutKind;
  /** Phone held sideways: short viewport, side sheets instead of bottom sheets. */
  landscape: boolean;
  touch: boolean;
}

/**
 * Breakpoints (CSS px):
 *  - phone:   width < 640, or a short landscape viewport (height < 520 and width < 1000)
 *  - tablet:  width < 1180 — panels become mutually exclusive drawers over the canvas
 *  - desktop: both side panels docked
 */
export function computeLayout(w: number, h: number, touch: boolean): Layout {
  const phone = w < 640 || (h < 520 && w < 1000);
  const kind: LayoutKind = phone ? 'phone' : w < 1180 ? 'tablet' : 'desktop';
  return { kind, landscape: phone && w > h, touch };
}

export function useLayout(): Layout {
  const read = () => computeLayout(window.innerWidth, window.innerHeight, matchMedia('(pointer: coarse)').matches);
  const [l, setL] = useState<Layout>(read);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setL((prev) => {
          const n = read();
          return n.kind === prev.kind && n.landscape === prev.landscape && n.touch === prev.touch ? prev : n;
        }),
      );
    };
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return l;
}
