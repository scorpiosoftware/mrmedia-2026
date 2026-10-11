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

/**
 * Site name and tagline from the dashboard's Site Settings, in the current language
 * (Arabic falls back to English when left blank).
 */
export function useSiteIdentity() {
    const { siteSettings = {}, locale } = useApp();
    const pick = (en, ar) => (locale === 'ar' && ar ? ar : en) || '';
    const name = pick(siteSettings.site_name, siteSettings.site_name_ar) || 'Mr.MEDIA';
    return {
        name,
        nameParts: splitBrandName(name),
        tagline: pick(siteSettings.tagline, siteSettings.tagline_ar),
    };
}

/**
 * Splits a name into [lead, accent] for the two-tone logo text:
 * after the first "." ("Mr.MEDIA" → "Mr." + "MEDIA"), else at the last space
 * ("Acme Studio" → "Acme " + "Studio"); a single word has no accent part.
 */
export function splitBrandName(name) {
    const dot = name.indexOf('.');
    if (dot > 0 && dot < name.length - 1) return [name.slice(0, dot + 1), name.slice(dot + 1)];
    const space = name.lastIndexOf(' ');
    if (space > 0) return [name.slice(0, space + 1), name.slice(space + 1)];
    return [name, ''];
}
