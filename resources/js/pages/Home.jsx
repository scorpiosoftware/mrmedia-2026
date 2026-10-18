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

/** True while `loading`, and for at least `minMs` after it started — avoids a split-second flash. */
function useMinimumLoading(loading, minMs) {
    const [visible, setVisible] = useState(loading);
    const startedAt = useRef(loading ? Date.now() : 0);

    useEffect(() => {
        if (loading) {
            startedAt.current = Date.now();
            setVisible(true);
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
    // lands at a random section on refresh — start from the top instead.
    useEffect(() => {
        const previous = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
        return () => {
            window.history.scrollRestoration = previous;
        };
    }, []);

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
                {/* The marquee has its own on/off switch on its admin page. */}
                <MarqueeBanner />
                {isShown('portfolio') && <Portfolio />}
                {isShown('events') && <Events />}
                {isShown('about') && <About />}
                {isShown('testimonials') && <Testimonials />}
                {isShown('contact') && <Contact />}
            </main>
            <Footer />
            <WhatsAppButton />
        </>
    );
}
