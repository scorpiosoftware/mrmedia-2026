import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { BarChart3, Globe, Image, Megaphone, Monitor, Star } from 'lucide-react';

const SERVICES = [
    { key: 's1', Icon: Star },
    { key: 's2', Icon: BarChart3 },
    { key: 's3', Icon: Image },
    { key: 's4', Icon: Monitor },
    { key: 's5', Icon: Globe },
    { key: 's6', Icon: Megaphone },
];

export default function Services() {
    const t = useContent();
    const [headerRef, headerVisible] = useScrollAnimation(0.2);
    const [gridRef,   gridVisible]   = useScrollAnimation(0.08);

    return (
        <section id="services" className="py-24 bg-white dark:bg-[#0D1B4B] overflow-hidden transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Section header */}
                <div
                    ref={headerRef}
                    className="mb-16 text-center transition-all duration-700"
                    style={{
                        opacity:   headerVisible ? 1 : 0,
                        transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
                    }}
                >
                    <span className="inline-block mb-3 rounded-full bg-[#E8EAF6] dark:bg-primary-dark px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#213C93] dark:text-[#FCD532]">
                        {t('services.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-[#0D1B4B] dark:text-white sm:text-4xl lg:text-5xl">
                        {t('services.title')}
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                        {t('services.subtitle')}
                    </p>
                </div>

                {/* Grid */}
                <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.map(({ key, Icon }, i) => (
                        <div
                            key={key}
                            className="group relative rounded-2xl border border-[#D1D5E8] dark:border-primary-light/40 bg-[#F1F1F0] dark:bg-primary-dark p-8 cursor-default transition-all duration-500 hover:-translate-y-2 hover:border-[#213C93]/50 dark:hover:border-brand-yellow/50 hover:shadow-[0_12px_48px_rgba(33,60,147,0.18)] hover:bg-white dark:hover:bg-[#213C93]"
                            style={{
                                opacity:   gridVisible ? 1 : 0,
                                transform: gridVisible ? 'translateY(0)' : 'translateY(32px)',
                                transition: `opacity 0.6s ease, transform 0.6s ease, box-shadow 0.4s ease, background 0.3s ease, border-color 0.3s ease, translate 0.3s ease`,
                                transitionDelay: `${i * 90}ms`,
                            }}
                        >
                            {/* Glow dot top-right */}
                            <div className="absolute top-5 right-5 h-2 w-2 rounded-full bg-[#DDB50E]/0 group-hover:bg-[#DDB50E] transition-all duration-500 group-hover:shadow-[0_0_10px_rgba(221,181,14,0.8)]" />

                            {/* Icon container */}
                            <div className="mb-5 inline-flex h-13 w-13 items-center justify-center rounded-xl bg-[#213C93] text-white group-hover:bg-[#DDB50E] group-hover:text-[#0D1B4B] transition-all duration-400 group-hover:shadow-[0_0_24px_rgba(221,181,14,0.45)] group-hover:scale-110">
                                <Icon size={22} />
                            </div>

                            <h3 className="mb-3 text-lg font-bold text-[#0D1B4B] dark:text-white group-hover:text-[#213C93] dark:group-hover:text-brand-yellow transition-colors duration-300">
                                {t(`services.${key}.title`)}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {t(`services.${key}.description`)}
                            </p>

                            {/* Bottom accent line */}
                            <div className="absolute bottom-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-[#213C93]/0 to-transparent group-hover:via-[#213C93]/30 transition-all duration-500" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
