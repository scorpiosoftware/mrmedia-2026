import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
    const t = useContent();
    const site = useSiteIdentity();
    const { contentLoading } = useApp();
    const showSkeleton = useMinimumLoading(contentLoading, MIN_SKELETON_MS);

    useDocumentMeta({
        title: site.tagline ? `${site.name} | ${site.tagline}` : site.name,
        description: t(
            'hero.subtitle',
            `${site.name} is a full-service marketing agency helping brands grow through strategy, creativity and digital excellence.`,
        ),
    });

    // Scroll to a section after navigating here from another page (e.g. an event's detail page)
    // (waits for the real sections to render, since the skeleton has no section ids)
    useEffect(() => {
        const id = location.state?.scrollTo;
        if (id && !showSkeleton) {
            requestAnimationFrame(() =>
                document.getElementById(id)?.scrollIntoView(),
            );
        }
    }, [location.state, showSkeleton]);

    if (showSkeleton) return <HomeSkeleton />;

    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <Stats />
                <Services />
                <MarqueeBanner />
                <Portfolio />
                <Events />
                <About />
                <Testimonials />
                <Contact />
            </main>
            <Footer />
            <WhatsAppButton />
        </>
    );
}
