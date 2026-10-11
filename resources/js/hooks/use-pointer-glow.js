import { useEffect } from 'react';

/**
 * Feeds the pointer position into every `.mm-spotlight` element as `--mx` / `--my`,
 * so its CSS glow follows the cursor. One delegated listener for the whole page,
 * throttled to one update per frame; skipped on touch-only devices and reduced motion.
 */
export function usePointerGlow() {
    useEffect(() => {
        const canHover = window.matchMedia('(hover: hover)').matches;
        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (!canHover || reduced) return;

        let frame = 0;
        let last = null;

        const update = () => {
            frame = 0;
            const el = last.target.closest?.('.mm-spotlight');
            if (!el) return;
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${last.clientX - rect.left}px`);
            el.style.setProperty('--my', `${last.clientY - rect.top}px`);
        };

        const onMove = (e) => {
            last = e;
            if (!frame) frame = requestAnimationFrame(update);
        };

        document.addEventListener('pointermove', onMove, { passive: true });
        return () => {
            document.removeEventListener('pointermove', onMove);
            cancelAnimationFrame(frame);
        };
    }, []);
}
