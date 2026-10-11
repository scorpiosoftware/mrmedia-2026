import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

function getCsrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

// Site-wide settings embedded in the page by the server (see spa.blade.php).
const SITE_SETTINGS = window.__SITE_SETTINGS__ ?? {};

export function AppProvider({ children }) {
    // A visitor's own choice wins; otherwise use the default language set in the dashboard.
    const [locale, setLocaleState] = useState(
        () => localStorage.getItem('mm_locale') || SITE_SETTINGS.default_locale || 'en',
    );
    const [content, setContent] = useState({});
    const [contentLoading, setContentLoading] = useState(true);
    const [whatsappNumber, setWhatsappNumber] = useState(null);
    const [whatsappVisible, setWhatsappVisible] = useState(true);
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('mm_dark');
        if (saved !== null) return saved === 'true';
        if (SITE_SETTINGS.default_appearance === 'dark') return true;
        if (SITE_SETTINGS.default_appearance === 'light') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Make sure <html> matches the starting language (the server may have rendered another).
    useEffect(() => {
        document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', locale);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch translated content whenever locale changes
    useEffect(() => {
        setContentLoading(true);
        fetch(`/api/content?locale=${locale}`)
            .then((r) => (r.ok ? r.json() : {}))
            .then((data) => {
                setContent(data);
                setContentLoading(false);
            })
            .catch(() => setContentLoading(false));
    }, [locale]);

    // Load public site settings on mount
    useEffect(() => {
        fetch('/api/settings')
            .then((r) => (r.ok ? r.json() : {}))
            .then((data) => {
                setWhatsappNumber(data.whatsapp_number ?? null);
                setWhatsappVisible(data.whatsapp_visible ?? true);
            })
            .catch(() => {});
    }, []);

    // Check authentication on mount
    useEffect(() => {
        fetch('/spa/user', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                setUser(data);
                setUserLoading(false);
            })
            .catch(() => setUserLoading(false));
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    // Only remember the mode once the visitor actually toggles it, so the dashboard's
    // default appearance keeps applying to everyone who hasn't chosen.
    const toggleDarkMode = useCallback(
        () =>
            setIsDarkMode((prev) => {
                localStorage.setItem('mm_dark', String(!prev));
                return !prev;
            }),
        [],
    );

    const setLocale = useCallback((loc) => {
        if (loc === locale) return;
        setLocaleState(loc);
        localStorage.setItem('mm_locale', loc);
        document.documentElement.setAttribute('dir', loc === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', loc);
    }, [locale]);

    const login = useCallback(async (email, password) => {
        const res = await fetch('/spa/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrf(),
            },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.message || 'Invalid credentials');
        }

        const userData = await res.json();
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        await fetch('/spa/logout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json' },
        });
        setUser(null);
    }, []);

    return (
        <AppContext.Provider
            value={{ locale, content, contentLoading, whatsappNumber, whatsappVisible, user, userLoading, setLocale, login, logout, isDarkMode, toggleDarkMode, siteSettings: SITE_SETTINGS }}
        >
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
