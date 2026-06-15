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
