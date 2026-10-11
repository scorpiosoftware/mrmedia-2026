import { useApp } from '@/context/AppContext';

/**
 * Returns t(key, fallback?) — reads from the global content store.
 */
export function useContent() {
    const { content } = useApp();
    return (key, fallback = '') => content[key] ?? fallback;
}

/**
 * Returns the current locale string ('en' | 'ar').
 */
export function useLocale() {
    const { locale } = useApp();
    return locale;
}

/**
 * Returns every non-empty value for a repeatable contact key, e.g.
 * useContentList('contact.phone') → [contact.phone, contact.phone_2, contact.phone_3, …].
 */
export function useContentList(baseKey) {
    const { content } = useApp();
    const prefix = `${baseKey}_`;
    return Object.entries(content)
        .map(([key, value]) => {
            if (key === baseKey) return [1, value];
            if (!key.startsWith(prefix)) return null;
            const suffix = key.slice(prefix.length);
            return /^\d+$/.test(suffix) ? [Number(suffix), value] : null;
        })
        .filter((entry) => entry && entry[1])
        .sort((a, b) => a[0] - b[0])
        .map(([, value]) => value);
}
