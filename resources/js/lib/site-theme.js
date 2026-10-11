/** Colour slots of a site theme, in the order the dashboard shows them. */
export const THEME_COLOR_KEYS = [
    {
        key: 'primary',
        label: 'Primary',
        hint: 'Buttons, links, headings accents',
    },
    {
        key: 'primary_light',
        label: 'Primary Light',
        hint: 'Hover states, gradients',
    },
    {
        key: 'primary_dark',
        label: 'Primary Dark',
        hint: 'Gradients, dark-mode cards',
    },
    { key: 'dark', label: 'Dark', hint: 'Headings text, footer, dark mode' },
    { key: 'accent', label: 'Accent', hint: 'Highlights, badges, CTAs' },
    {
        key: 'accent_bright',
        label: 'Accent Bright',
        hint: 'Glows, highlighted words',
    },
    { key: 'background', label: 'Background', hint: 'Page background' },
];

/**
 * CSS custom properties that re-skin the public site for a palette.
 * Mirrors SiteSetting::themeCssVars() in PHP — keep the two in sync.
 * The "classic" theme returns {} so the stylesheet's original values apply.
 */
export function themeVars(theme, c) {
    if (theme === 'classic' || !c) return {};
    return {
        '--color-brand-blue': c.primary,
        '--color-primary': c.primary,
        '--color-ring': c.primary,
        '--color-primary-light': c.primary_light,
        '--color-primary-dark': c.primary_dark,
        '--color-brand-dark': c.dark,
        '--color-foreground': c.dark,
        '--color-brand-gold': c.accent,
        '--color-accent': c.accent,
        '--color-brand-yellow': c.accent_bright,
        '--color-accent-bright': c.accent_bright,
        '--color-brand-bg': c.background,
        '--color-background': c.background,
        '--color-brand-bg-alt': `color-mix(in srgb, ${c.background} 50%, white)`,
        '--color-secondary': `color-mix(in srgb, ${c.primary} 10%, white)`,
        '--color-border': `color-mix(in srgb, ${c.primary} 18%, white)`,
        '--color-muted-foreground': `color-mix(in srgb, ${c.dark} 70%, white)`,
    };
}

const ALL_VARS = Object.keys(themeVars('custom', { primary: '' }));

/** Applies (or with an empty object, removes) the theme variables on <html>. */
export function applyThemeVars(vars) {
    const style = document.documentElement.style;
    ALL_VARS.forEach((name) => {
        if (vars[name]) style.setProperty(name, vars[name]);
        else style.removeProperty(name);
    });
}
