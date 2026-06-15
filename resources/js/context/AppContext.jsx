import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

function getCsrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export function AppProvider({ children }) {
    const [locale, setLocaleState] = useState(() => localStorage.getItem('mm_locale') || 'en');
    const [content, setContent] = useState({});
    const [contentLoading, setContentLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('mm_dark');
        if (saved !== null) return saved === 'true';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

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
        localStorage.setItem('mm_dark', String(isDarkMode));
    }, [isDarkMode]);

    const toggleDarkMode = useCallback(() => setIsDarkMode((prev) => !prev), []);

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
            value={{ locale, content, contentLoading, user, userLoading, setLocale, login, logout, isDarkMode, toggleDarkMode }}
        >
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
