import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useBrandLogos, useContent, useLocale } from '@/hooks/use-content';
import { usePublicList } from '@/hooks/use-public-list';
import { ArrowUpRight, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import ResponsiveImage from '@/components/ResponsiveImage';

// Projects shown before "View All" — the first ones in the admin's display order.
const INITIAL_COUNT = 3;
const SHOW_LESS = { en: 'Show Less', ar: 'عرض أقل' };

const FILTERS = ['all', 'brand', 'digital', 'media'];
const FILTER_KEYS = {
    all: 'portfolio.filter_all',
    brand: 'portfolio.filter_brand',
    digital: 'portfolio.filter_digital',
    media: 'portfolio.filter_media',
};

export default function Portfolio() {
    const t = useContent();
    const logos = useBrandLogos();
    const { items: projects, loading } = usePublicList('/api/projects');
    const locale = useLocale();
    const [active, setActive] = useState('all');
    const [expanded, setExpanded] = useState(false);
    const [headerRef, headerVisible] = useScrollAnimation(0.2);
    const [gridRef, gridVisible] = useScrollAnimation(0.08);

    const filtered =
        active === 'all'
            ? projects
            : projects.filter((p) => p.category === active);
    const hasMore = filtered.length > INITIAL_COUNT;
    const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);

    const changeFilter = (f) => {
        setActive(f);
        setExpanded(false);
    };

    if (!loading && projects.length === 0) return null;

    return (
        <section
            id="portfolio"
            className="overflow-hidden bg-brand-bg py-24 transition-colors duration-300 dark:bg-brand-dark"
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
                    <span className="mm-chip mb-3 inline-block rounded-full bg-brand-blue/10 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-blue uppercase dark:bg-brand-blue/30 dark:text-brand-yellow">
                        {t('portfolio.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-brand-dark sm:text-4xl lg:text-5xl dark:text-white">
                        {t('portfolio.title')}
                    </h2>
                    <div aria-hidden="true" className="mm-title-line mt-5" />
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
                            onClick={() => changeFilter(f)}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                                active === f
                                    ? 'scale-105 bg-brand-blue text-white shadow-[0_4px_20px_color-mix(in_srgb,var(--color-brand-blue)_35%,transparent)]'
                                    : 'border border-border bg-white text-brand-blue hover:border-brand-blue hover:shadow-[0_2px_12px_color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] dark:border-primary-light/40 dark:bg-primary-dark dark:text-white dark:hover:border-brand-yellow/60'
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
                                className="aspect-4/3 animate-pulse rounded-2xl bg-border/60"
                            />
                        ))}

                    {visible.map((project, i) => {
                        const hasLink = Boolean(project.external_url);
                        const Card = hasLink ? 'a' : 'div';
                        // Cards revealed by "View All" slide in after the first three.
                        const revealed = i >= INITIAL_COUNT;
                        return (
                            /* Wrapper owns the staggered entrance so its delay never slows down hover */
                            <div
                                key={project.id}
                                style={{
                                    opacity: gridVisible ? 1 : 0,
                                    transform: gridVisible
                                        ? 'translateY(0) scale(1)'
                                        : 'translateY(28px) scale(0.97)',
                                    transition:
                                        'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)',
                                    transitionDelay: `${i * 80}ms`,
                                    ...(revealed && {
                                        animation:
                                            'slide-up-fade 0.6s cubic-bezier(0.16,1,0.3,1) both',
                                        animationDelay: `${(i - INITIAL_COUNT) * 80}ms`,
                                    }),
                                }}
                            >
                                <Card
                                    {...(hasLink
                                        ? {
                                              href: project.external_url,
                                              target: '_blank',
                                              rel: 'noopener noreferrer',
                                              'aria-label': project.title,
                                          }
                                        : {})}
                                    className={`group mm-beam-hover mm-spotlight relative block aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-black/5 transition-all duration-500 ease-out [--mm-beam-width:2px] [--mm-spot-color:rgb(255_255_255/0.14)] hover:-translate-y-2 hover:shadow-[0_24px_60px_color-mix(in_srgb,var(--color-brand-dark)_35%,transparent)] hover:ring-brand-gold/30 focus-visible:-translate-y-2 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:ring-white/10 ${
                                        hasLink ? 'cursor-pointer' : ''
                                    }`}
                                    style={{ backgroundColor: project.color }}
                                >
                                    {project.image_url ? (
                                        <ResponsiveImage
                                            src={project.image_url}
                                            alt={project.title}
                                            loading="lazy"
                                            // 1 / 2 / 3-column grid inside max-w-7xl
                                            sizes="(min-width: 1280px) 395px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 92vw"
                                            className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-75 motion-reduce:transition-none"
                                        />
                                    ) : (
                                        /* Background watermark fallback when no image is set */
                                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                            <ResponsiveImage
                                                src={logos.onDark}
                                                sizes="144px"
                                                loading="lazy"
                                                alt=""
                                                aria-hidden="true"
                                                className="mm-float-slow w-36 object-contain opacity-10 transition-all duration-500 select-none group-hover:scale-110 group-hover:opacity-20"
                                                style={{
                                                    animationDelay: `${(project.id * 1.1) % 4}s`,
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Base gradient — always on so the caption stays readable */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

                                    {/* Brand tint that fades in on hover */}
                                    <div className="absolute inset-0 bg-linear-to-br from-brand-blue/50 via-brand-dark/30 to-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />

                                    {/* Centred link button — pops in on hover; always shown on touch screens */}
                                    {hasLink && (
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                            <span className="relative flex h-16 w-16 scale-50 -rotate-45 items-center justify-center rounded-full bg-brand-gold opacity-0 shadow-[0_0_32px_color-mix(in_srgb,var(--color-brand-gold)_65%,transparent)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-100 group-hover:rotate-0 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:rotate-0 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:scale-90 [@media(hover:none)]:rotate-0 [@media(hover:none)]:opacity-100">
                                                {/* Soft pulsing ring */}
                                                <span className="absolute inset-0 rounded-full bg-brand-gold opacity-0 group-hover:animate-ping group-hover:opacity-40" />
                                                <ArrowUpRight
                                                    size={26}
                                                    className="relative text-brand-dark transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                                />
                                            </span>
                                        </div>
                                    )}

                                    {/* Caption — lifts slightly on hover */}
                                    <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-500 ease-out group-hover:-translate-y-1">
                                        <p className="mb-1 flex items-center gap-2 text-xs font-bold tracking-widest text-brand-yellow uppercase">
                                            <span className="h-0.5 w-4 rounded-full bg-brand-yellow transition-all duration-500 group-hover:w-8" />
                                            {project.category}
                                        </p>
                                        <h3 className="text-lg font-bold text-white">
                                            {project.title}
                                        </h3>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>

                {/* CTA — reveals the rest of the projects */}
                {hasMore && (
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
                        <button
                            type="button"
                            onClick={() => setExpanded((e) => !e)}
                            aria-expanded={expanded}
                            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand-blue px-8 py-3 text-sm font-bold text-brand-blue transition-all duration-300 hover:scale-105 hover:bg-brand-blue hover:text-white hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-blue)_30%,transparent)] dark:border-brand-yellow dark:text-brand-yellow dark:hover:bg-brand-yellow dark:hover:text-brand-dark"
                        >
                            {expanded
                                ? (SHOW_LESS[locale] ?? SHOW_LESS.en)
                                : t('portfolio.cta', 'View All Projects')}
                            {expanded ? (
                                <ChevronUp
                                    size={16}
                                    className="transition-transform duration-300 group-hover:-translate-y-0.5"
                                />
                            ) : (
                                <ArrowUpRight
                                    size={16}
                                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
