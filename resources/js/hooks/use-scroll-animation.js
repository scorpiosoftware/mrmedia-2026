import { useEffect, useRef, useState } from 'react';

/**
 * Returns [ref, isVisible].
 * Attach `ref` to a container; `isVisible` flips true once it enters the viewport.
 * Disconnects after first trigger so it never fires again.
 */
export function useScrollAnimation(threshold = 0.12) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, isVisible];
}
