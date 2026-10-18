import { useApp } from '@/context/AppContext';

/**
 * Returns `isShown(sectionId)` for the home-page sections the admin can switch off
 * (Content Editor → "Show on website"). Anything not listed as hidden is shown, so
 * sites that never touched the toggles look exactly as before.
 */
export function useSectionVisibility() {
    const { siteSettings } = useApp();
    const hidden = siteSettings?.hidden_sections ?? [];

    return (id) => !hidden.includes(id);
}
