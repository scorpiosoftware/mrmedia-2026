import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import About from '@/components/portfolio/About';
import Contact from '@/components/portfolio/Contact';
import Events from '@/components/portfolio/Events';
import Footer from '@/components/portfolio/Footer';
import Hero from '@/components/portfolio/Hero';
import Navbar from '@/components/portfolio/Navbar';
import Portfolio from '@/components/portfolio/Portfolio';
import Services from '@/components/portfolio/Services';
import Stats from '@/components/portfolio/Stats';
import Testimonials from '@/components/portfolio/Testimonials';
import WhatsAppButton from '@/components/portfolio/WhatsAppButton';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { useContent } from '@/hooks/use-content';

export default function Home() {
    const location = useLocation();
    const t = useContent();

    useDocumentMeta({
        title: 'Mr.MEDIA | Marketing Agency That Moves Markets',
        description: t(
            'hero.subtitle',
            'Mr.MEDIA is a full-service marketing agency helping brands grow through strategy, creativity and digital excellence.',
        ),
    });

    // Scroll to a section after navigating here from another page (e.g. an event's detail page)
    useEffect(() => {
        const id = location.state?.scrollTo;
        if (id) {
            requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
        }
    }, [location.state]);

    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <Stats />
                <Services />
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
