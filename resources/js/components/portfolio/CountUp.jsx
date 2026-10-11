import { useEffect, useState } from 'react';

const DURATION_MS = 1800;
const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

/**
 * Counts the numeric part of `value` up from 0 once `start` is true, keeping any
 * prefix/suffix (e.g. "150+", "$2.5M", "10 yrs"). Non-numeric values render as-is.
 */
export default function CountUp({ value, start }) {
    const match = /^(\D*)([\d,]*\.?\d+)(.*)$/.exec(String(value ?? ''));
    const hasNumber = Boolean(match);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!start || !hasNumber) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setProgress(1);
            return;
        }
        let frame;
        const began = performance.now();
        const tick = (now) => {
            const p = Math.min((now - began) / DURATION_MS, 1);
            setProgress(easeOutExpo(p));
            if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [start, hasNumber]);

    if (!match) return value;

    const [, prefix, numStr, suffix] = match;
    const target = Number(numStr.replace(/,/g, ''));
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
    const current = (target * progress).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: numStr.includes(','),
    });

    return (
        <>
            {prefix}
            <span className="tabular-nums">{current}</span>
            {suffix}
        </>
    );
}
