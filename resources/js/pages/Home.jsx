import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import About from '@/components/portfolio/About';
import Contact from '@/components/portfolio/Contact';
import Events from '@/components/portfolio/Events';
import Footer from '@/components/portfolio/Footer';
import Hero from '@/components/portfolio/Hero';
import HomeSkeleton from '@/components/portfolio/HomeSkeleton';
import MarqueeBanner from '@/components/portfolio/MarqueeBanner';
import Navbar from '@/components/portfolio/Navbar';
import HomePopup from '@/components/portfolio/PopupCarousel';
import Portfolio from '@/components/portfolio/Portfolio';
import Services from '@/components/portfolio/Services';
import Stats from '@/components/portfolio/Stats';
import Testimonials from '@/components/portfolio/Testimonials';
import WhatsAppButton from '@/components/portfolio/WhatsAppButton';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { usePointerGlow } from '@/hooks/use-pointer-glow';
import { useSectionVisibility } from '@/hooks/use-section-visibility';
import { useApp } from '@/context/AppContext';
import { useContent, useSiteIdentity } from '@/hooks/use-content';

// Once shown, the skeleton stays at least this long so a fast language switch doesn't flicker.
const MIN_SKELETON_MS = 400;

/**
 * True while `loading`, and for at least `minMs` after it started — avoids a split-second flash
 * on language switches. The very first load is never held back: that would only delay the
 * hero (the page's LCP element).
 */
function useMinimumLoading(loading, minMs) {
    const [visible, setVisible] = useState(loading);
    const startedAt = useRef(loading ? Date.now() : 0);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (loading) {
            startedAt.current = Date.now();
            setVisible(true);
            return;
        }
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            setVisible(false);
            return;
        }
        const remaining = minMs - (Date.now() - startedAt.current);
        if (remaining <= 0) {
            setVisible(false);
            return;
        }
        const timer = setTimeout(() => setVisible(false), remaining);
        return () => clearTimeout(timer);
    }, [loading, minMs]);

    return visible;
}

const SCROLL_KEY = 'mm-home-scroll';
// Give images and lazily fetched sections this long to grow the page before giving up.
const RESTORE_WINDOW_MS = 3000;

// Only the first render after a real page reload restores — not later in-app visits to the home page.
let restoreChecked = false;

/** The scroll position saved before a reload of this page, or null. */
function takeSavedScroll() {
    if (restoreChecked) return null;
    restoreChecked = true;
    const nav = performance.getEntriesByType?.('navigation')[0];
    if (nav?.type !== 'reload') return null;
    try {
        const y = Number(sessionStorage.getItem(SCROLL_KEY));
        return y > 0 ? y : null;
    } catch {
        return null;
    }
}

/**
 * Scrolls to `y`, re-applying it while the page grows (sections and images loading in) until
 * it's reached, the window runs out, or the visitor scrolls on their own. Returns a cleanup.
 */
function restoreScroll(y) {
    // Keeps going after `y` is first reached: images above it can still load and push it down.
    // 'instant' overrides the global `scroll-behavior: smooth`.
    const apply = () =>
        window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    const observer = new ResizeObserver(apply);
    const timer = setTimeout(() => stop(), RESTORE_WINDOW_MS);
    const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];

    function stop() {
        observer.disconnect();
        clearTimeout(timer);
        userEvents.forEach((e) => window.removeEventListener(e, stop));
    }

    userEvents.forEach((e) =>
        window.addEventListener(e, stop, { passive: true }),
    );
    observer.observe(document.body);
    requestAnimationFrame(apply);
    return stop;
}

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const t = useContent();
    const site = useSiteIdentity();
    const { contentLoading } = useApp();
    const showSkeleton = useMinimumLoading(contentLoading, MIN_SKELETON_MS);
    const isShown = useSectionVisibility();
    usePointerGlow();

    useDocumentMeta({
        title: site.tagline ? `${site.name} | ${site.tagline}` : site.name,
        description: t(
            'hero.subtitle',
            `${site.name} is a full-service marketing agency helping brands grow through strategy, creativity and digital excellence.`,
        ),
    });

    // The page height changes as sections load, so the browser's own scroll restoration
    // lands at a random section on refresh — we save and restore the position ourselves.
    useEffect(() => {
        const previous = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
        const save = () => {
            try {
                sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
            } catch {
                // Storage blocked (private mode) — a refresh just starts at the top.
            }
        };
        window.addEventListener('pagehide', save);
        return () => {
            window.removeEventListener('pagehide', save);
            window.history.scrollRestoration = previous;
        };
    }, []);

    // After a refresh, return to the saved position once the real sections render
    // (a `state.scrollTo` jump from another page takes priority).
    useEffect(() => {
        if (showSkeleton || location.state?.scrollTo) return;
        const target = takeSavedScroll();
        if (target === null) return;
        return restoreScroll(target);
    }, [showSkeleton, location.state]);

    // Scroll to a section after navigating here from another page (e.g. an event's detail page)
    // (waits for the real sections to render, since the skeleton has no section ids)
    useEffect(() => {
        const id = location.state?.scrollTo;
        if (id && !showSkeleton) {
            requestAnimationFrame(() =>
                document.getElementById(id)?.scrollIntoView(),
            );
            // History state survives a refresh — clear it so a reload doesn't jump here again.
            navigate(`${location.pathname}${location.search}`, {
                replace: true,
                state: null,
            });
        }
    }, [location, navigate, showSkeleton]);

    // During a language switch the previous content is still loaded, so the hero skeleton can match its layout.
    if (showSkeleton)
        return <HomeSkeleton heroImage={Boolean(t('hero.image'))} />;

    return (
        <>
            <div aria-hidden="true" className="mm-scroll-progress" />
            <Navbar />
            <main>
                {/* Each section can be hidden in Content Editor → "Show on website". */}
                {isShown('hero') && <Hero />}
                {isShown('stats') && <Stats />}
                {isShown('services') && <Services />}
                {/* The marquee has its own on/off switch on its admin page. It takes the
                    background of the section right above it, so it never sits in a band of its own. */}
                <MarqueeBanner
                    background={
                        isShown('services')
                            ? 'bg-white dark:bg-brand-dark' // = Services
                            : isShown('stats')
                              ? 'bg-brand-dark dark:bg-primary-dark' // = Stats
                              : 'bg-brand-bg dark:bg-brand-dark' // = hero's wave / site background
                    }
                />
                {isShown('portfolio') && <Portfolio />}
                {isShown('events') && <Events />}
                {isShown('about') && <About />}
                {isShown('testimonials') && <Testimonials />}
                {isShown('contact') && <Contact />}
            </main>
            <Footer />
            <WhatsAppButton />
            {/* Popup carousel — managed in Admin → Popup; renders nothing when switched off. */}
            <HomePopup />
        </>
    );
}
