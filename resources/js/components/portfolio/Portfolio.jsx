import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { LOGO_SRC } from '@/lib/brand-logos';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

const FILTERS = ['all', 'brand', 'digital', 'media'];
const FILTER_KEYS = {
    all:     'portfolio.filter_all',
    brand:   'portfolio.filter_brand',
    digital: 'portfolio.filter_digital',
    media:   'portfolio.filter_media',
};

const PROJECTS = [
    { id: 1, title: 'TechVentures Rebrand',  category: 'brand',   color: '#213C93' },
    { id: 2, title: 'Gulf Retail Campaign',   category: 'digital', color: '#DDB50E' },
    { id: 3, title: 'BrandLab Documentary',  category: 'media',   color: '#192E74' },
    { id: 4, title: 'FinanceHub Identity',    category: 'brand',   color: '#2E52C9' },
    { id: 5, title: 'E-Commerce Growth',      category: 'digital', color: '#FCD532' },
    { id: 6, title: 'Product Launch Video',   category: 'media',   color: '#213C93' },
];

export default function Portfolio() {
    const t = useContent();
    const [active, setActive] = useState('all');
    const [headerRef, headerVisible] = useScrollAnimation(0.2);
    const [gridRef,   gridVisible]   = useScrollAnimation(0.08);

    const visible = active === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === active);

    return (
        <section id="portfolio" className="py-24 bg-[#F1F1F0] dark:bg-brand-dark overflow-hidden transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div
                    ref={headerRef}
                    className="mb-12 text-center transition-all duration-700"
                    style={{
                        opacity:   headerVisible ? 1 : 0,
                        transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
                    }}
                >
                    <span className="inline-block mb-3 rounded-full bg-[#213C93]/10 dark:bg-[#213C93]/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#213C93] dark:text-brand-yellow">
                        {t('portfolio.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-[#0D1B4B] dark:text-white sm:text-4xl lg:text-5xl">
                        {t('portfolio.title')}
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground dark:text-white/60">
                        {t('portfolio.subtitle')}
                    </p>
                </div>

                {/* Filter tabs */}
                <div
                    className="mb-10 flex flex-wrap justify-center gap-2 transition-all duration-700"
                    style={{
                        opacity:   headerVisible ? 1 : 0,
                        transform: headerVisible ? 'translateY(0)' : 'translateY(16px)',
                        transitionDelay: '120ms',
                    }}
                >
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActive(f)}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                                active === f
                                    ? 'bg-[#213C93] text-white shadow-[0_4px_20px_rgba(33,60,147,0.35)] scale-105'
                                    : 'bg-white dark:bg-primary-dark text-[#213C93] dark:text-white border border-[#D1D5E8] dark:border-primary-light/40 hover:border-[#213C93] dark:hover:border-brand-yellow/60 hover:shadow-[0_2px_12px_rgba(33,60,147,0.12)]'
                            }`}
                        >
                            {t(FILTER_KEYS[f])}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((project, i) => (
                        <div
                            key={project.id}
                            className="group relative aspect-4/3 overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
                            style={{
                                backgroundColor: project.color,
                                opacity:   gridVisible ? 1 : 0,
                                transform: gridVisible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
                                transition: `opacity 0.55s ease, transform 0.55s ease, box-shadow 0.4s ease, translate 0.4s ease`,
                                transitionDelay: `${i * 80}ms`,
                            }}
                        >
                            {/* Background watermark */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                <img
                                    src={LOGO_SRC}
                                    alt=""
                                    aria-hidden="true"
                                    className="w-36 object-contain select-none mm-float-slow opacity-10 transition-all duration-500 group-hover:opacity-20 group-hover:scale-110"
                                    style={{ animationDelay: `${(project.id * 1.1) % 4}s` }}
                                />
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end p-6">
                                <div className="w-full flex items-end justify-between translate-y-3 group-hover:translate-y-0 transition-transform duration-400">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-[#FCD532] mb-1">
                                            {project.category}
                                        </p>
                                        <h3 className="text-lg font-bold text-white">{project.title}</h3>
                                    </div>
                                    <div className="shrink-0 h-10 w-10 rounded-full bg-[#DDB50E] flex items-center justify-center shadow-[0_0_20px_rgba(221,181,14,0.6)] scale-90 group-hover:scale-100 transition-transform duration-400">
                                        <ArrowUpRight size={18} className="text-[#0D1B4B]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div
                    className="mt-12 text-center transition-all duration-700"
                    style={{
                        opacity:   gridVisible ? 1 : 0,
                        transform: gridVisible ? 'translateY(0)' : 'translateY(20px)',
                        transitionDelay: '500ms',
                    }}
                >
                    <button className="group inline-flex items-center gap-2 rounded-full border-2 border-[#213C93] px-8 py-3 text-sm font-bold text-[#213C93] hover:bg-[#213C93] hover:text-white hover:shadow-[0_8px_32px_rgba(33,60,147,0.30)] transition-all duration-300 hover:scale-105">
                        {t('portfolio.cta')}
                        <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
