import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { Quote } from 'lucide-react';

const ITEMS = [
    { quote: 'testimonials.t1.quote', name: 'testimonials.t1.name', role: 'testimonials.t1.role' },
    { quote: 'testimonials.t2.quote', name: 'testimonials.t2.name', role: 'testimonials.t2.role' },
    { quote: 'testimonials.t3.quote', name: 'testimonials.t3.name', role: 'testimonials.t3.role' },
];

export default function Testimonials() {
    const t = useContent();
    const [headerRef, headerVisible] = useScrollAnimation(0.2);
    const [gridRef,   gridVisible]   = useScrollAnimation(0.1);

    return (
        <section className="py-24 bg-[#F1F1F0] dark:bg-brand-dark overflow-hidden transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div
                    ref={headerRef}
                    className="mb-16 text-center transition-all duration-700"
                    style={{
                        opacity:   headerVisible ? 1 : 0,
                        transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
                    }}
                >
                    <span className="inline-block mb-3 rounded-full bg-[#213C93]/10 dark:bg-[#213C93]/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#213C93] dark:text-brand-yellow">
                        {t('testimonials.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-[#0D1B4B] dark:text-white sm:text-4xl lg:text-5xl">
                        {t('testimonials.title')}
                    </h2>
                </div>

                {/* Cards */}
                <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {ITEMS.map(({ quote, name, role }, i) => (
                        <div
                            key={name}
                            className="group flex flex-col rounded-2xl bg-white dark:bg-primary-dark p-8 border border-[#D1D5E8] dark:border-primary-light/40 cursor-default transition-all duration-500 hover:-translate-y-2 hover:border-[#213C93]/30 dark:hover:border-brand-yellow/40 hover:shadow-[0_12px_48px_rgba(33,60,147,0.14)]"
                            style={{
                                opacity:   gridVisible ? 1 : 0,
                                transform: gridVisible ? 'translateY(0)' : 'translateY(32px)',
                                transition: 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.4s ease, border-color 0.3s ease, translate 0.4s ease',
                                transitionDelay: `${i * 110}ms`,
                            }}
                        >
                            {/* Quote icon with hover glow */}
                            <Quote
                                size={32}
                                className="mb-4 shrink-0 text-[#DDB50E] transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(221,181,14,0.65)]"
                            />

                            <p className="flex-1 text-muted-foreground leading-relaxed mb-6 italic">
                                "{t(quote)}"
                            </p>

                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shrink-0 transition-all duration-300 group-hover:shadow-[0_0_16px_rgba(33,60,147,0.40)] group-hover:scale-110">
                                    {t(name).charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-[#0D1B4B] dark:text-white text-sm">{t(name)}</p>
                                    <p className="text-xs text-muted-foreground">{t(role)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
