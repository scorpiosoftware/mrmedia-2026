import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { LOGO_SRC } from '@/lib/brand-logos';
import { ArrowRight, CheckCircle } from 'lucide-react';

const VALUES = [
    { en: 'Strategy-first thinking',   ar: 'تفكير استراتيجي أولاً' },
    { en: 'Bold creative execution',   ar: 'تنفيذ إبداعي جريء' },
    { en: 'Data-driven decisions',     ar: 'قرارات مبنية على البيانات' },
    { en: 'Client-centric approach',   ar: 'نهج يمحور العميل' },
];

export default function About() {
    const t = useContent();
    const [ref, isVisible] = useScrollAnimation(0.1);

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
                        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient aspect-4/3 flex items-center justify-center shadow-[0_20px_64px_rgba(33,60,147,0.35)] transition-shadow duration-500 hover:shadow-[0_28px_80px_rgba(33,60,147,0.45)]">
                            {/* Spinning ring inside card */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-64 h-64 rounded-full border border-white/10 mm-spin-cw" />
                                <div className="absolute w-44 h-44 rounded-full border border-[#DDB50E]/15 mm-spin-ccw" />
                            </div>

                            <img
                                src={LOGO_SRC}
                                alt=""
                                aria-hidden="true"
                                className="w-56 object-contain select-none mm-float-slow opacity-10"
                                style={{ animationDelay: '2s' }}
                            />

                            {/* Inner badge */}
                            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
                                <p className="text-2xl font-black text-[#FCD532] text-glow-gold">{t('stats.years')}</p>
                                <p className="text-sm text-white/75 mt-0.5">{t('stats.years_label')}</p>
                            </div>
                        </div>

                        {/* Floating badge — bounces gently */}
                        <div
                            className="absolute -top-4 -right-4 rounded-2xl bg-[#DDB50E] p-5 shadow-[0_8px_32px_rgba(221,181,14,0.50)] mm-float-rev"
                            style={{ animationDelay: '0.5s' }}
                        >
                            <p className="text-3xl font-black text-[#0D1B4B] text-glow-gold">{t('stats.clients')}</p>
                            <p className="text-xs font-semibold text-[#0D1B4B]/70">{t('stats.clients_label')}</p>
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
                        <span className="inline-block mb-3 rounded-full bg-[#E8EAF6] dark:bg-[#213C93]/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#213C93] dark:text-brand-yellow">
                            {t('about.section_badge')}
                        </span>
                        <h2 className="mb-6 text-3xl font-black text-[#0D1B4B] dark:text-white sm:text-4xl lg:text-5xl">
                            {t('about.title')}
                        </h2>
                        <div className="mb-8 space-y-4 text-muted-foreground leading-relaxed">
                            {t('about.body')
                                .split('\n\n')
                                .map((para, i) => <p key={i}>{para}</p>)}
                        </div>

                        {/* Mission box */}
                        <div className="mb-8 rounded-2xl bg-[#F1F1F0] dark:bg-brand-dark border-l-4 border-[#213C93] dark:border-brand-yellow p-6 rtl:border-l-0 rtl:border-r-4 transition-all duration-300 hover:shadow-[0_4px_24px_rgba(33,60,147,0.12)]">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#213C93] dark:text-brand-yellow mb-2">
                                {t('about.mission_label')}
                            </p>
                            <p className="text-[#0D1B4B] dark:text-white/80 font-medium">{t('about.mission_text')}</p>
                        </div>

                        {/* Values list — staggered inside the slide */}
                        <ul className="mb-8 grid grid-cols-2 gap-3">
                            {VALUES.map((v, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-2 text-sm text-[#0D1B4B] dark:text-white/80 font-medium transition-all duration-500"
                                    style={{
                                        opacity:   isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                                        transitionDelay: `${300 + i * 80}ms`,
                                    }}
                                >
                                    <CheckCircle size={16} className="text-[#213C93] dark:text-brand-yellow shrink-0" />
                                    {v.en}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => scrollTo('contact')}
                            className="group inline-flex items-center gap-2 rounded-full bg-[#213C93] px-7 py-3 text-sm font-bold text-white hover:bg-[#2E52C9] hover:shadow-[0_8px_32px_rgba(33,60,147,0.35)] hover:scale-105 transition-all duration-300"
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
