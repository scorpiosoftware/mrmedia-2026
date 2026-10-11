import { useContent } from '@/hooks/use-content';
import { LOGO_DARK_SRC } from '@/lib/brand-logos';
import { ArrowRight, Play } from 'lucide-react';

/* Deterministic particle positions so there are no hydration mismatches */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    size: 2 + (i % 3),
    left: ((i * 7.3 + 5) % 88) + 6,
    top:  ((i * 13.7 + 10) % 78) + 6,
    delay: (i * 0.38) % 3.2,
    duration: 2 + (i * 0.55 % 2),
}));

const DOT_GRID_A = Array.from({ length: 25 });
const DOT_GRID_B = Array.from({ length: 16 });

export default function Hero() {
    const t = useContent();
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center overflow-hidden bg-brand-gradient"
        >
            {/* ── Background layer ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">

                {/* Light-mode brightening / dark-mode deepening overlay */}
                <div className="absolute inset-0 bg-white/[0.07] dark:bg-black/25 transition-colors duration-500" />

                {/* Animated glow orbs */}
                <div
                    className="absolute -top-36 -right-36 w-175 h-175 rounded-full mm-float mm-glow-blue"
                    style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-light) 55%, transparent) 0%, color-mix(in srgb, var(--color-brand-blue) 22%, transparent) 45%, transparent 70%)' }}
                />
                <div
                    className="absolute -bottom-44 -left-44 w-145 h-145 rounded-full mm-float-rev mm-glow-gold"
                    style={{
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 28%, transparent) 0%, color-mix(in srgb, var(--color-brand-gold) 8%, transparent) 50%, transparent 70%)',
                        animationDelay: '2s',
                    }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-187.5 h-187.5 rounded-full mm-float-slow"
                    style={{
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--color-brand-blue) 32%, transparent) 0%, transparent 65%)',
                        animationDelay: '1.2s',
                    }}
                />

                {/* Spinning decorative rings */}
                <div className="absolute top-14 right-14 w-80 h-80 rounded-full border border-white/10 mm-spin-cw" />
                <div className="absolute top-24 right-24 w-55 h-55 rounded-full border border-brand-gold/18 mm-spin-ccw" />
                <div className="absolute bottom-28 left-24 w-45 h-45 rounded-full border border-white/8 mm-spin-cw" style={{ animationDelay: '4s' }} />
                <div className="absolute bottom-36 left-32 w-27.5 h-27.5 rounded-full border border-brand-gold/12 mm-spin-ccw" style={{ animationDelay: '2s' }} />

                {/* Top-left dot grid */}
                <div className="absolute top-28 left-14 mm-float-x" style={{ animationDelay: '1.5s' }}>
                    <div className="grid grid-cols-5 gap-2.5">
                        {DOT_GRID_A.map((_, i) => (
                            <div key={i} className="w-0.75 h-0.75 rounded-full bg-white/22" />
                        ))}
                    </div>
                </div>

                {/* Bottom-right dot grid — gold tinted */}
                <div className="absolute bottom-28 right-20 mm-float-x" style={{ animationDelay: '0.6s' }}>
                    <div className="grid grid-cols-4 gap-2.5">
                        {DOT_GRID_B.map((_, i) => (
                            <div key={i} className="w-0.75 h-0.75 rounded-full bg-brand-gold/35" />
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
                        className="absolute rounded-full bg-white mm-twinkle"
                        style={{
                            width:  `${size}px`,
                            height: `${size}px`,
                            left:   `${left}%`,
                            top:    `${top}%`,
                            animationDelay:    `${delay}s`,
                            animationDuration: `${duration}s`,
                        }}
                    />
                ))}

                {/* Floating logo — background particle */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[-52%] mm-float-slow pointer-events-none select-none"
                    style={{ opacity: 0.13, animationDelay: '3s' }}
                >
                    <img
                        src={LOGO_DARK_SRC}
                        alt=""
                        aria-hidden="true"
                        className="w-72 sm:w-96 md:w-120 object-contain"
                        style={{ filter: 'blur(0.8px) drop-shadow(0 0 48px color-mix(in srgb, var(--color-primary-light) 90%, transparent)) drop-shadow(0 0 96px color-mix(in srgb, var(--color-primary-light) 50%, transparent))' }}
                    />
                </div>
            </div>

            {/* ── Content ── */}
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-28">
                <div className="flex flex-col items-center text-center">

                    {/* Badge */}
                    <div
                        className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-brand-gold/30 bg-brand-gold/15 px-5 py-2.5 text-sm font-semibold text-brand-yellow backdrop-blur-sm"
                        style={{ animation: 'slide-up-fade 0.7s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.1s' }}
                    >
                        <span
                            className="h-2 w-2 rounded-full bg-brand-yellow"
                            style={{ boxShadow: '0 0 8px 2px color-mix(in srgb, var(--color-brand-yellow) 80%, transparent)', animation: 'pulse 1.5s ease-in-out infinite' }}
                        />
                        {t('hero.badge')}
                        <span
                            className="h-2 w-2 rounded-full bg-brand-yellow"
                            style={{ boxShadow: '0 0 8px 2px color-mix(in srgb, var(--color-brand-yellow) 80%, transparent)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.5s' }}
                        />
                    </div>

                    {/* Headline */}
                    <h1
                        className="mb-6 max-w-4xl text-5xl font-black leading-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]"
                        style={{
                            animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both',
                            animationDelay: '0.28s',
                            textShadow: '0 2px 40px color-mix(in srgb, var(--color-brand-blue) 40%, transparent)',
                        }}
                    >
                        {t('hero.title')}
                    </h1>

                    {/* Subtitle */}
                    <p
                        className="mb-12 max-w-2xl text-base text-white/72 sm:text-lg leading-relaxed"
                        style={{ animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.44s' }}
                    >
                        {t('hero.subtitle')}
                    </p>

                    {/* CTA buttons */}
                    <div
                        className="flex flex-wrap justify-center gap-4"
                        style={{ animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.58s' }}
                    >
                        <button
                            onClick={() => scrollTo('contact')}
                            className="btn-gold-shimmer group inline-flex items-center gap-2 rounded-full px-9 py-4 text-base font-bold text-brand-dark transition-all duration-300 hover:scale-105 hover:shadow-[0_0_44px_color-mix(in_srgb,var(--color-brand-gold)_65%,transparent)]"
                        >
                            {t('hero.cta_primary')}
                            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180" />
                        </button>

                        <button
                            onClick={() => scrollTo('portfolio')}
                            className="group inline-flex items-center gap-2 rounded-full border-2 border-white/25 px-9 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/55 hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_32px_rgba(255,255,255,0.14)]"
                        >
                            <Play size={18} className="transition-transform duration-300 group-hover:scale-110" />
                            {t('hero.cta_secondary')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Wave divider */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 80L1440 80L1440 40C1200 80 720 0 0 40L0 80Z" className="fill-brand-bg" />
                </svg>
            </div>
        </section>
    );
}
