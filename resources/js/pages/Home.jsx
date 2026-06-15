import About from '@/components/portfolio/About';
import Contact from '@/components/portfolio/Contact';
import Footer from '@/components/portfolio/Footer';
import Hero from '@/components/portfolio/Hero';
import Navbar from '@/components/portfolio/Navbar';
import Portfolio from '@/components/portfolio/Portfolio';
import Services from '@/components/portfolio/Services';
import Stats from '@/components/portfolio/Stats';
import Testimonials from '@/components/portfolio/Testimonials';
import WhatsAppButton from '@/components/portfolio/WhatsAppButton';

export default function Home() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <Stats />
                <Services />
                <Portfolio />
                <About />
                <Testimonials />
                <Contact />
            </main>
            <Footer />
            <WhatsAppButton />
        </>
    );
}
