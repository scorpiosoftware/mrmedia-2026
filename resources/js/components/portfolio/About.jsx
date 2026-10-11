import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useBrandLogos, useContent, useContentList } from '@/hooks/use-content';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function About() {
    const t = useContent();
    const logos = useBrandLogos();
    const [ref, isVisible] = useScrollAnimation(0.1);
    const aboutImage = t('about.image');
    // Editable in Content → About (about.value_1, _2, …); blank entries are skipped.
    const values = useContentList('about.value');

    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <section id="about" className="py-24 bg-white dark:bg-primary-dark overflow-hidden transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div ref={ref} className="grid gap-16 lg:grid-cols-2 lg:items-center">

                    {/* ── Visual side ── */}
                    <div
                        className="relative order-2 lg:order-1 transition-all duration-800"
                        style={{
                            opacity:   isVisible ? 1 : 0,
                            transform: isVisible ? 'translateX(0)' : 'translateX(-40px)',
                            transitionDelay: '60ms',
                        }}
                    >
                        {/* Main visual card */}
                        <div className="group relative overflow-hidden rounded-3xl bg-brand-gradient aspect-4/3 flex items-center justify-center shadow-[0_20px_64px_color-mix(in_srgb,var(--color-brand-blue)_35%,transparent)] transition-shadow duration-500 hover:shadow-[0_28px_80px_color-mix(in_srgb,var(--color-brand-blue)_45%,transparent)]">
                            {aboutImage ? (
                                <>
                                    {/* Optional photo set in the dashboard (Content → About) */}
                                    <img
                                        src={aboutImage}
                                        alt={t('about.title')}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                                    />
                                    {/* Keeps the stats badge readable over any photo */}
                                    <div className="absolute inset-0 bg-linear-to-t from-brand-dark/80 via-brand-dark/10 to-transparent" />
                                </>
                            ) : (
                                <>
                                    {/* Spinning ring inside card */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-64 rounded-full border border-white/10 mm-spin-cw" />
                                        <div className="absolute w-44 h-44 rounded-full border border-brand-gold/15 mm-spin-ccw" />
                                    </div>

                                    <img
                                        src={logos.onDark}
                                        alt=""
                                        aria-hidden="true"
                                        className="w-56 object-contain select-none mm-float-slow opacity-10"
                                        style={{ animationDelay: '2s' }}
                                    />
                                </>
                            )}

                            {/* Inner badge */}
                            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
                                <p className="text-2xl font-black text-brand-yellow text-glow-gold">{t('stats.years')}</p>
                                <p className="text-sm text-white/75 mt-0.5">{t('stats.years_label')}</p>
                            </div>
                        </div>

                        {/* Floating badge — bounces gently */}
                        <div
                            className="absolute -top-4 -right-4 rounded-2xl bg-brand-gold p-5 shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-gold)_50%,transparent)] mm-float-rev"
                            style={{ animationDelay: '0.5s' }}
                        >
                            <p className="text-3xl font-black text-brand-dark text-glow-gold">{t('stats.clients')}</p>
                            <p className="text-xs font-semibold text-brand-dark/70">{t('stats.clients_label')}</p>
                        </div>
                    </div>

                    {/* ── Text side ── */}
                    <div
                        className="order-1 lg:order-2 transition-all duration-800"
                        style={{
                            opacity:   isVisible ? 1 : 0,
                            transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
                            transitionDelay: '160ms',
                        }}
                    >
                        <span className="inline-block mb-3 rounded-full bg-secondary dark:bg-brand-blue/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-blue dark:text-brand-yellow">
                            {t('about.section_badge')}
                        </span>
                        <h2 className="mb-6 text-3xl font-black text-brand-dark dark:text-white sm:text-4xl lg:text-5xl">
                            {t('about.title')}
                        </h2>
                        <div className="mb-8 space-y-4 text-muted-foreground leading-relaxed">
                            {t('about.body')
                                .split('\n\n')
                                .map((para, i) => <p key={i}>{para}</p>)}
                        </div>

                        {/* Mission box */}
                        <div className="mb-8 rounded-2xl bg-brand-bg dark:bg-brand-dark border-l-4 border-brand-blue dark:border-brand-yellow p-6 rtl:border-l-0 rtl:border-r-4 transition-all duration-300 hover:shadow-[0_4px_24px_color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)]">
                            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue dark:text-brand-yellow mb-2">
                                {t('about.mission_label')}
                            </p>
                            <p className="text-brand-dark dark:text-white/80 font-medium">{t('about.mission_text')}</p>
                        </div>

                        {/* Values list — staggered inside the slide */}
                        {values.length > 0 && (
                            <ul className="mb-8 grid grid-cols-2 gap-3">
                                {values.map((value, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-2 text-sm text-brand-dark dark:text-white/80 font-medium transition-all duration-500"
                                        style={{
                                            opacity:   isVisible ? 1 : 0,
                                            transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                                            transitionDelay: `${300 + i * 80}ms`,
                                        }}
                                    >
                                        <CheckCircle size={16} className="text-brand-blue dark:text-brand-yellow shrink-0" />
                                        {value}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <button
                            onClick={() => scrollTo('contact')}
                            className="group inline-flex items-center gap-2 rounded-full bg-brand-blue px-7 py-3 text-sm font-bold text-white hover:bg-primary-light hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-blue)_35%,transparent)] hover:scale-105 transition-all duration-300"
                        >
                            {t('about.cta')}
                            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
