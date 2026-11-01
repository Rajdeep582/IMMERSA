import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

type Snap = 'half' | 'full';

/**
 * Phone bottom sheet with native-feeling drag: grab the handle/header (or pull down on content that is
 * scrolled to the top) to move it; release snaps to half / full height or dismisses, using the
 * release velocity. Movement is applied straight to `transform` (no React renders while dragging).
 */
export function BottomSheet({ children, header, onClose, label, initial = 'half' }: { children: ReactNode; header: ReactNode; onClose: () => void; label: string; initial?: Snap }) {
  const ref = useRef<HTMLDivElement>(null);
  const snap = useRef<Snap>(initial);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Offsets are measured from the fully open position (0) downwards.
  const metrics = () => {
    const el = ref.current!;
    const full = el.offsetHeight;
    const halfVisible = Math.min(full, Math.max(260, window.innerHeight * 0.56));
    return { full, half: full - halfVisible };
  };
  const place = (y: number, animate: boolean) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.42s cubic-bezier(0.22, 0.9, 0.24, 1)' : 'none';
    el.style.transform = `translate3d(0, ${Math.max(0, y)}px, 0)`;
  };
  const settle = (y: number, v: number) => {
    const { full, half } = metrics();
    // Project where a flick would carry the sheet, then pick the nearest stop.
    const proj = y + v * 180;
    if (proj > half + (full - half) * 0.45 || (v > 1.1 && y > half * 0.5)) {
      place(full, true);
      window.setTimeout(() => closeRef.current(), 260);
      return;
    }
    const target: Snap = proj < half * 0.5 ? 'full' : 'half';
    snap.current = target;
    place(target === 'full' ? 0 : half, true);
  };

  useLayoutEffect(() => {
    const { full, half } = metrics();
    place(full, false);
    // Next frame: slide in to the initial stop.
    const r = requestAnimationFrame(() => place(snap.current === 'full' ? 0 : half, true));
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current!;
    let startY = 0;
    let baseY = 0;
    let lastY = 0;
    let lastT = 0;
    let v = 0;
    let dragging = false;
    let pending: { y: number; scroller: HTMLElement | null } | null = null;

    const current = () => {
      const m = /translate3d\(0px?, ([\d.-]+)px/.exec(el.style.transform);
      return m ? parseFloat(m[1]!) : 0;
    };
    const begin = (y: number) => {
      dragging = true;
      startY = y;
      baseY = current();
      lastY = y;
      lastT = performance.now();
      v = 0;
      el.classList.add('dragging');
    };
    const move = (y: number) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      v = 0.75 * ((y - lastY) / dt) + 0.25 * v;
      lastY = y;
      lastT = now;
      let ny = baseY + (y - startY);
      if (ny < 0) ny = ny * 0.25; // rubber band above full height
      place(ny, false);
    };
    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      if (Math.abs(lastY - startY) < 5 && fromHandle) {
        // A tap on the handle toggles half / full.
        const { half } = metrics();
        snap.current = snap.current === 'full' ? 'half' : 'full';
        place(snap.current === 'full' ? 0 : half, true);
      } else settle(current(), v);
      fromHandle = false;
    };
    let fromHandle = false;

    // Handle / header: pointer events (mouse + touch).
    const handle = el.querySelector<HTMLElement>('.bs-handle');
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button, input')) return;
      handle!.setPointerCapture(e.pointerId);
      fromHandle = true;
      begin(e.clientY);
    };
    const onMove = (e: PointerEvent) => dragging && move(e.clientY);
    handle?.addEventListener('pointerdown', onDown);
    handle?.addEventListener('pointermove', onMove);
    handle?.addEventListener('pointerup', end);
    handle?.addEventListener('pointercancel', end);

    // Content: pulling down while scrolled to the top drags the sheet; pushing up from half expands it.
    const onTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('.bs-handle, canvas, input, .inspect-canvas, [data-no-sheet-drag]')) return;
      const scroller = (e.target as HTMLElement).closest<HTMLElement>('.panel-scroll, .inspector, .search-results');
      pending = { y: e.touches[0]!.clientY, scroller };
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]!.clientY;
      if (pending && !dragging) {
        const dy = y - pending.y;
        if (Math.abs(dy) < 6) return;
        const atTop = !pending.scroller || pending.scroller.scrollTop <= 0;
        const expand = dy < 0 && snap.current === 'half';
        if ((dy > 0 && atTop) || expand) begin(pending.y);
        pending = null;
      }
      if (dragging) {
        e.preventDefault();
        move(y);
      }
    };
    const onTouchEnd = () => {
      pending = null;
      end();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      handle?.removeEventListener('pointerdown', onDown);
      handle?.removeEventListener('pointermove', onMove);
      handle?.removeEventListener('pointerup', end);
      handle?.removeEventListener('pointercancel', end);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="sheet bs" role="dialog" aria-label={label}>
      <div className="bs-handle">
        <div className="bs-grip" aria-hidden />
        {header}
      </div>
      {children}
    </div>
  );
}
