import { Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useBrandLogos, useContent, useLocale, useSiteIdentity } from '@/hooks/use-content';
import { useSectionVisibility } from '@/hooks/use-section-visibility';

const NAV_KEYS = ['home', 'services', 'portfolio', 'events', 'about', 'contact'];
const SECTION_IDS = { home: 'hero', services: 'services', portfolio: 'portfolio', events: 'events', about: 'about', contact: 'contact' };

export default function Navbar() {
    const t = useContent();
    const site = useSiteIdentity();
    const logos = useBrandLogos();
    const locale = useLocale();
    const { setLocale, isDarkMode, toggleDarkMode } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const isAr = locale === 'ar';
    const isShown = useSectionVisibility();
    const [open, setOpen] = useState(false);
    const [scrolledPastTop, setScrolled] = useState(false);
    // Without the hero there's no dark gradient behind the bar, so use the solid style from the start.
    const scrolled = scrolledPastTop || !isShown('hero');
    // "Home" always stays — it scrolls to the top even when the hero is hidden.
    const navKeys = NAV_KEYS.filter((key) => key === 'home' || isShown(SECTION_IDS[key]));
    const [activeSection, setActiveSection] = useState('home');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* Highlight active nav link based on scroll position */
    useEffect(() => {
        const ids = Object.values(SECTION_IDS);
        const onScroll = () => {
            const current = ids.find((id) => {
                const el = document.getElementById(id);
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                return rect.top <= 100 && rect.bottom > 100;
            });
            if (current) {
                const key = Object.keys(SECTION_IDS).find((k) => SECTION_IDS[k] === current);
                if (key) setActiveSection(key);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: id } });
        } else if (id === 'hero') {
            // Works whether or not the hero section is shown.
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
        setOpen(false);
    };

    const switchLocale = () => setLocale(isAr ? 'en' : 'ar');

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-400 ${
                scrolled
                    ? 'bg-white/96 dark:bg-brand-dark/96 backdrop-blur-md shadow-[0_4px_32px_color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] border-b border-border/50 dark:border-primary-light/50'
                    : 'bg-transparent dark:bg-brand-dark/30'
            }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between lg:h-20">

                    {/* Logo */}
                    <button
                        onClick={() => scrollTo('hero')}
                        className="flex items-center gap-2.5 focus:outline-none group"
                    >
                        <div
                            className={`flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-105 w-11 h-11 ${
                                scrolled
                                    ? 'bg-white dark:bg-primary-dark shadow-[0_2px_14px_color-mix(in_srgb,var(--color-brand-blue)_15%,transparent)]'
                                    : 'bg-brand-dark/70 backdrop-blur-sm border border-white/15 shadow-[0_0_18px_color-mix(in_srgb,var(--color-primary-light)_35%,transparent)]'
                            }`}
                        >
                            <img
                                src={!scrolled || isDarkMode ? logos.onDark : logos.light}
                                alt={site.name}
                                className="w-9 h-9 object-contain"
                            />
                        </div>
                        <span dir="auto" className="text-xl font-black tracking-tight whitespace-pre">
                            <span className={`transition-colors duration-300 ${scrolled ? 'text-brand-blue dark:text-white' : 'text-white'}`}>{site.nameParts[0]}</span>
                            {site.nameParts[1] && (
                                <span className="text-brand-gold transition-all duration-300 group-hover:drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-brand-gold)_70%,transparent)]">
                                    {site.nameParts[1]}
                                </span>
                            )}
                        </span>
                    </button>

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-8">
                        {navKeys.map((key) => (
                            <button
                                key={key}
                                onClick={() => scrollTo(SECTION_IDS[key])}
                                className={`relative text-sm font-medium transition-all duration-300 group ${
                                    scrolled ? 'text-brand-blue dark:text-white/90' : 'text-white/90'
                                } hover:text-brand-gold`}
                            >
                                {t(`nav.${key}`)}
                                {/* Active indicator */}
                                <span
                                    className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-brand-gold transition-all duration-300 ${
                                        activeSection === key ? 'w-full' : 'w-0 group-hover:w-full'
                                    }`}
                                />
                            </button>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className={`flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 hover:scale-110 ${
                                scrolled
                                    ? 'text-brand-blue dark:text-white hover:bg-secondary dark:hover:bg-primary-dark'
                                    : 'text-white hover:bg-white/15'
                            }`}
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {/* Locale toggle */}
                        <button
                            onClick={switchLocale}
                            className={`hidden sm:flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 hover:scale-105 ${
                                scrolled
                                    ? 'border-brand-blue dark:border-white/50 text-brand-blue dark:text-white hover:bg-brand-blue dark:hover:bg-white/15 hover:text-white'
                                    : 'border-white/50 text-white hover:border-white hover:bg-white/15'
                            }`}
                        >
                            {isAr ? 'EN' : 'عربي'}
                        </button>

                        {/* CTA */}
                        {isShown('contact') && (
                            <button
                                onClick={() => scrollTo('contact')}
                                className={`hidden sm:inline-flex rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                                    scrolled
                                        ? 'bg-brand-blue text-white hover:bg-primary-light hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--color-brand-blue)_35%,transparent)]'
                                        : 'bg-white/15 text-white border border-white/30 hover:bg-white/25 hover:border-white/60'
                                }`}
                            >
                                {t('nav.cta')}
                            </button>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setOpen(!open)}
                            className={`lg:hidden p-2 transition-colors duration-200 ${scrolled ? 'text-brand-blue dark:text-white' : 'text-white'}`}
                            aria-label="Toggle menu"
                        >
                            <div className="transition-all duration-300">
                                {open ? <X size={22} /> : <Menu size={22} />}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                className={`lg:hidden overflow-hidden transition-all duration-400 ${
                    open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                } bg-white dark:bg-brand-dark border-t border-border dark:border-primary-light shadow-lg`}
            >
                <div className="px-4 pb-6 pt-4">
                    {navKeys.map((key) => (
                        <button
                            key={key}
                            onClick={() => scrollTo(SECTION_IDS[key])}
                            className={`block w-full text-start py-3 text-sm font-medium border-b border-secondary dark:border-primary-light/50 transition-colors duration-200 ${
                                activeSection === key ? 'text-brand-gold' : 'text-brand-blue dark:text-white/80 hover:text-brand-gold'
                            }`}
                        >
                            {t(`nav.${key}`)}
                        </button>
                    ))}
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={switchLocale}
                            className="flex-1 rounded-full border border-brand-blue dark:border-white/40 py-2 text-sm font-semibold text-brand-blue dark:text-white hover:bg-brand-blue dark:hover:bg-white/15 hover:text-white transition-all duration-200"
                        >
                            {isAr ? 'EN' : 'عربي'}
                        </button>
                        {isShown('contact') && (
                            <button
                                onClick={() => scrollTo('contact')}
                                className="flex-1 rounded-full bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors duration-200"
                            >
                                {t('nav.cta')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
