import { useEffect, useState } from 'react';
import { useLocale } from '@/hooks/use-content';

/** Fetches a published, locale-aware public list endpoint (e.g. /api/projects, /api/services). */
export function usePublicList(endpoint) {
    const locale = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        fetch(`${endpoint}?locale=${locale}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (cancelled) {
                    return;
                }

                setItems(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [endpoint, locale]);

    return { items, loading };
}
