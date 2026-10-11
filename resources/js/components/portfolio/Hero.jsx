import { useContent } from '@/hooks/use-content';
import { LOGO_DARK_SRC } from '@/lib/brand-logos';
import { ArrowRight, Play } from 'lucide-react';

/* Deterministic particle positions so there are no hydration mismatches */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    size: 2 + (i % 3),
    left: ((i * 7.3 + 5) % 88) + 6,
    top: ((i * 13.7 + 10) % 78) + 6,
    delay: (i * 0.38) % 3.2,
    duration: 2 + ((i * 0.55) % 2),
}));

const DOT_GRID_A = Array.from({ length: 25 });
const DOT_GRID_B = Array.from({ length: 16 });

export default function Hero() {
    const t = useContent();
    // Optional image (Content → Hero). When set, the hero splits into text + image columns.
    const heroImage = t('hero.image');
    const split = Boolean(heroImage);
    const scrollTo = (id) =>
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <section
            id="hero"
            className="bg-brand-gradient relative flex min-h-screen items-center overflow-hidden"
        >
            {/* ── Background layer ── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {/* Light-mode brightening / dark-mode deepening overlay */}
                <div className="absolute inset-0 bg-white/[0.07] transition-colors duration-500 dark:bg-black/25" />

                {/* Animated glow orbs */}
                <div
                    className="mm-float mm-glow-blue absolute -top-36 -right-36 h-175 w-175 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, color-mix(in srgb, var(--color-primary-light) 55%, transparent) 0%, color-mix(in srgb, var(--color-brand-blue) 22%, transparent) 45%, transparent 70%)',
                    }}
                />
                <div
                    className="mm-float-rev mm-glow-gold absolute -bottom-44 -left-44 h-145 w-145 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 28%, transparent) 0%, color-mix(in srgb, var(--color-brand-gold) 8%, transparent) 50%, transparent 70%)',
                        animationDelay: '2s',
                    }}
                />
                <div
                    className="mm-float-slow absolute top-1/2 left-1/2 h-187.5 w-187.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, color-mix(in srgb, var(--color-brand-blue) 32%, transparent) 0%, transparent 65%)',
                        animationDelay: '1.2s',
                    }}
                />

                {/* Spinning decorative rings */}
                <div className="mm-spin-cw absolute top-14 right-14 h-80 w-80 rounded-full border border-white/10" />
                <div className="mm-spin-ccw absolute top-24 right-24 h-55 w-55 rounded-full border border-brand-gold/18" />
                <div
                    className="mm-spin-cw absolute bottom-28 left-24 h-45 w-45 rounded-full border border-white/8"
                    style={{ animationDelay: '4s' }}
                />
                <div
                    className="mm-spin-ccw absolute bottom-36 left-32 h-27.5 w-27.5 rounded-full border border-brand-gold/12"
                    style={{ animationDelay: '2s' }}
                />

                {/* Top-left dot grid */}
                <div
                    className="mm-float-x absolute top-28 left-14"
                    style={{ animationDelay: '1.5s' }}
                >
                    <div className="grid grid-cols-5 gap-2.5">
                        {DOT_GRID_A.map((_, i) => (
                            <div
                                key={i}
                                className="h-0.75 w-0.75 rounded-full bg-white/22"
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom-right dot grid — gold tinted */}
                <div
                    className="mm-float-x absolute right-20 bottom-28"
                    style={{ animationDelay: '0.6s' }}
                >
                    <div className="grid grid-cols-4 gap-2.5">
                        {DOT_GRID_B.map((_, i) => (
                            <div
                                key={i}
                                className="h-0.75 w-0.75 rounded-full bg-brand-gold/35"
                            />
                        ))}
                    </div>
                </div>

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Particle dot field */}
                {PARTICLES.map(({ id, size, left, top, delay, duration }) => (
                    <div
                        key={id}
                        className="mm-twinkle absolute rounded-full bg-white"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            left: `${left}%`,
                            top: `${top}%`,
                            animationDelay: `${delay}s`,
                            animationDuration: `${duration}s`,
                        }}
                    />
                ))}

                {/* Floating logo — background particle (centred layout only) */}
                {!split && (
                    <div
                        className="mm-float-slow pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[-52%] select-none"
                        style={{ opacity: 0.13, animationDelay: '3s' }}
                    >
                        <img
                            src={LOGO_DARK_SRC}
                            alt=""
                            aria-hidden="true"
                            className="w-72 object-contain sm:w-96 md:w-120"
                            style={{
                                filter: 'blur(0.8px) drop-shadow(0 0 48px color-mix(in srgb, var(--color-primary-light) 90%, transparent)) drop-shadow(0 0 96px color-mix(in srgb, var(--color-primary-light) 50%, transparent))',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            <div className="relative mx-auto w-full max-w-7xl px-4 pt-28 pb-28 sm:px-6 lg:px-8">
                <div
                    className={
                        split
                            ? 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16'
                            : undefined
                    }
                >
                    <div
                        className={`flex flex-col items-center text-center ${split ? 'lg:items-start lg:text-start' : ''}`}
                    >
                        {/* Badge */}
                        <div
                            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-brand-gold/30 bg-brand-gold/15 px-5 py-2.5 text-sm font-semibold text-brand-yellow backdrop-blur-sm"
                            style={{
                                animation:
                                    'slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) both',
                                animationDelay: '0.1s',
                            }}
                        >
                            <span
                                className="h-2 w-2 rounded-full bg-brand-yellow"
                                style={{
                                    boxShadow:
                                        '0 0 8px 2px color-mix(in srgb, var(--color-brand-yellow) 80%, transparent)',
                                    animation:
                                        'pulse 1.5s ease-in-out infinite',
                                }}
                            />
                            {t('hero.badge')}
                            <span
                                className="h-2 w-2 rounded-full bg-brand-yellow"
                                style={{
                                    boxShadow:
                                        '0 0 8px 2px color-mix(in srgb, var(--color-brand-yellow) 80%, transparent)',
                                    animation:
                                        'pulse 1.5s ease-in-out infinite',
                                    animationDelay: '0.5s',
                                }}
                            />
                        </div>

                        {/* Headline */}
                        <h1
                            className={`mb-6 max-w-4xl leading-tight font-black text-white ${
                                split
                                    ? 'text-4xl sm:text-5xl md:text-6xl xl:text-7xl'
                                    : 'text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem]'
                            }`}
                            style={{
                                animation:
                                    'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both',
                                animationDelay: '0.28s',
                                textShadow:
                                    '0 2px 40px color-mix(in srgb, var(--color-brand-blue) 40%, transparent)',
                            }}
                        >
                            {t('hero.title')}
                        </h1>

                        {/* Subtitle */}
                        <p
                            className="mb-12 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg"
                            style={{
                                animation:
                                    'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both',
                                animationDelay: '0.44s',
                            }}
                        >
                            {t('hero.subtitle')}
                        </p>

                        {/* CTA buttons */}
                        <div
                            className={`flex flex-wrap justify-center gap-4 ${split ? 'lg:justify-start' : ''}`}
                            style={{
                                animation:
                                    'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both',
                                animationDelay: '0.58s',
                            }}
                        >
                            <button
                                onClick={() => scrollTo('contact')}
                                className="btn-gold-shimmer group inline-flex items-center gap-2 rounded-full px-9 py-4 text-base font-bold text-brand-dark transition-all duration-300 hover:scale-105 hover:shadow-[0_0_44px_color-mix(in_srgb,var(--color-brand-gold)_65%,transparent)]"
                            >
                                {t('hero.cta_primary')}
                                <ArrowRight
                                    size={18}
                                    className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180"
                                />
                            </button>

                            <button
                                onClick={() => scrollTo('portfolio')}
                                className="group inline-flex items-center gap-2 rounded-full border-2 border-white/25 px-9 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/55 hover:bg-white/10 hover:shadow-[0_0_32px_rgba(255,255,255,0.14)]"
                            >
                                <Play
                                    size={18}
                                    className="transition-transform duration-300 group-hover:scale-110"
                                />
                                {t('hero.cta_secondary')}
                            </button>
                        </div>
                    </div>

                    {/* Image column — only when an image is set */}
                    {split && (
                        <div
                            className="relative mx-auto w-full max-w-md lg:max-w-none"
                            style={{
                                animation:
                                    'slide-right-fade 0.9s cubic-bezier(0.16,1,0.3,1) both',
                                animationDelay: '0.35s',
                            }}
                        >
                            {/* Soft glows behind the frame */}
                            <div
                                aria-hidden="true"
                                className="mm-glow-gold pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-60"
                            />
                            <div
                                aria-hidden="true"
                                className="mm-spin-cw pointer-events-none absolute -end-6 -top-6 h-28 w-28 rounded-full border border-brand-gold/40"
                            />
                            <div className="group relative aspect-square overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-[0_24px_80px_color-mix(in_srgb,var(--color-brand-dark)_55%,transparent)] backdrop-blur-sm">
                                <img
                                    src={heroImage}
                                    alt={t('hero.title')}
                                    fetchPriority="high"
                                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                                />
                                {/* Subtle brand tint at the edge so the photo blends into the gradient */}
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-dark/30 via-transparent to-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Wave divider */}
            <div className="absolute right-0 bottom-0 left-0">
                <svg
                    viewBox="0 0 1440 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0 80L1440 80L1440 40C1200 80 720 0 0 40L0 80Z"
                        className="fill-brand-bg"
                    />
                </svg>
            </div>
        </section>
    );
}
