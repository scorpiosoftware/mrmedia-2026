import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { usePublicList } from '@/hooks/use-public-list';
import { LOGO_SRC } from '@/lib/brand-logos';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

const FILTERS = ['all', 'brand', 'digital', 'media'];
const FILTER_KEYS = {
    all: 'portfolio.filter_all',
    brand: 'portfolio.filter_brand',
    digital: 'portfolio.filter_digital',
    media: 'portfolio.filter_media',
};

export default function Portfolio() {
    const t = useContent();
    const { items: projects, loading } = usePublicList('/api/projects');
    const [active, setActive] = useState('all');
    const [headerRef, headerVisible] = useScrollAnimation(0.2);
    const [gridRef, gridVisible] = useScrollAnimation(0.08);

    const visible =
        active === 'all'
            ? projects
            : projects.filter((p) => p.category === active);

    if (!loading && projects.length === 0) return null;

    return (
        <section
            id="portfolio"
            className="overflow-hidden bg-[#F1F1F0] py-24 transition-colors duration-300 dark:bg-brand-dark"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={headerRef}
                    className="mb-12 text-center transition-all duration-700"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible
                            ? 'translateY(0)'
                            : 'translateY(24px)',
                    }}
                >
                    <span className="mb-3 inline-block rounded-full bg-[#213C93]/10 px-4 py-1.5 text-xs font-bold tracking-widest text-[#213C93] uppercase dark:bg-[#213C93]/30 dark:text-brand-yellow">
                        {t('portfolio.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-[#0D1B4B] sm:text-4xl lg:text-5xl dark:text-white">
                        {t('portfolio.title')}
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-muted-foreground dark:text-white/60">
                        {t('portfolio.subtitle')}
                    </p>
                </div>

                {/* Filter tabs */}
                <div
                    className="mb-10 flex flex-wrap justify-center gap-2 transition-all duration-700"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible
                            ? 'translateY(0)'
                            : 'translateY(16px)',
                        transitionDelay: '120ms',
                    }}
                >
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActive(f)}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                                active === f
                                    ? 'scale-105 bg-[#213C93] text-white shadow-[0_4px_20px_rgba(33,60,147,0.35)]'
                                    : 'border border-[#D1D5E8] bg-white text-[#213C93] hover:border-[#213C93] hover:shadow-[0_2px_12px_rgba(33,60,147,0.12)] dark:border-primary-light/40 dark:bg-primary-dark dark:text-white dark:hover:border-brand-yellow/60'
                            }`}
                        >
                            {t(FILTER_KEYS[f])}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div
                    ref={gridRef}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {loading &&
                        projects.length === 0 &&
                        Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-4/3 animate-pulse rounded-2xl bg-[#D1D5E8]/60"
                            />
                        ))}

                    {visible.map((project, i) => {
                        const Card = project.external_url ? 'a' : 'div';
                        return (
                            <Card
                                key={project.id}
                                {...(project.external_url
                                    ? {
                                          href: project.external_url,
                                          target: '_blank',
                                          rel: 'noopener noreferrer',
                                      }
                                    : {})}
                                className="group relative aspect-4/3 cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
                                style={{
                                    backgroundColor: project.color,
                                    opacity: gridVisible ? 1 : 0,
                                    transform: gridVisible
                                        ? 'translateY(0) scale(1)'
                                        : 'translateY(28px) scale(0.97)',
                                    transition: `opacity 0.55s ease, transform 0.55s ease, box-shadow 0.4s ease, translate 0.4s ease`,
                                    transitionDelay: `${i * 80}ms`,
                                }}
                            >
                                {project.image_url ? (
                                    <img
                                        src={project.image_url}
                                        alt={project.title}
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    /* Background watermark fallback when no image is set */
                                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={LOGO_SRC}
                                            alt=""
                                            aria-hidden="true"
                                            className="mm-float-slow w-36 object-contain opacity-10 transition-all duration-500 select-none group-hover:scale-110 group-hover:opacity-20"
                                            style={{
                                                animationDelay: `${(project.id * 1.1) % 4}s`,
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Caption overlay — always visible, no hover required */}
                                <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-6">
                                    <div className="flex w-full items-end justify-between">
                                        <div>
                                            <p className="mb-1 text-xs font-bold tracking-widest text-[#FCD532] uppercase">
                                                {project.category}
                                            </p>
                                            <h3 className="text-lg font-bold text-white">
                                                {project.title}
                                            </h3>
                                        </div>
                                        <div className="flex h-10 w-10 shrink-0 scale-90 items-center justify-center rounded-full bg-[#DDB50E] shadow-[0_0_20px_rgba(221,181,14,0.6)] transition-transform duration-400 group-hover:scale-100">
                                            <ArrowUpRight
                                                size={18}
                                                className="text-[#0D1B4B]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* CTA */}
                <div
                    className="mt-12 text-center transition-all duration-700"
                    style={{
                        opacity: gridVisible ? 1 : 0,
                        transform: gridVisible
                            ? 'translateY(0)'
                            : 'translateY(20px)',
                        transitionDelay: '500ms',
                    }}
                >
                    <button className="group inline-flex items-center gap-2 rounded-full border-2 border-[#213C93] px-8 py-3 text-sm font-bold text-[#213C93] transition-all duration-300 hover:scale-105 hover:bg-[#213C93] hover:text-white hover:shadow-[0_8px_32px_rgba(33,60,147,0.30)]">
                        {t('portfolio.cta')}
                        <ArrowUpRight
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                    </button>
                </div>
            </div>
        </section>
    );
}
