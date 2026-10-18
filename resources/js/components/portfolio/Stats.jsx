import CountUp from '@/components/portfolio/CountUp';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';

const STATS = [
    { num: 'stats.clients', label: 'stats.clients_label' },
    { num: 'stats.projects', label: 'stats.projects_label' },
    { num: 'stats.years', label: 'stats.years_label' },
    { num: 'stats.awards', label: 'stats.awards_label' },
];

export default function Stats() {
    const t = useContent();
    const [ref, isVisible] = useScrollAnimation(0.2);

    return (
        <section className="relative overflow-hidden bg-brand-dark py-12 transition-colors sm:py-20 duration-300 dark:bg-primary-dark">
            {/* Background glow blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="mm-drift absolute -top-16 left-1/4 h-48 w-96 rounded-full blur-3xl"
                    style={{
                        background:
                            'radial-gradient(circle, color-mix(in srgb, var(--color-brand-blue) 55%, transparent) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="mm-drift absolute right-1/4 -bottom-16 h-36 w-72 rounded-full blur-3xl"
                    style={{
                        animationDelay: '-9s',
                        background:
                            'radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 22%, transparent) 0%, transparent 70%)',
                    }}
                />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            <div
                ref={ref}
                className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            >
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                    {STATS.map(({ num, label }, i) => (
                        <div
                            key={num}
                            className="mm-beam mm-spotlight rounded-xl border border-white/10 bg-white/[0.04] px-3 py-5 text-center sm:rounded-2xl sm:px-4 sm:py-8 backdrop-blur-sm transition-all duration-700 [--mm-beam-inset:-1px] hover:bg-white/[0.07]"
                            style={{
                                '--mm-beam-speed': '6s',
                                // Offset each card's beam so they don't orbit in lockstep
                                '--mm-beam-delay': `${i * -1.5}s`,
                                '--mm-spot-color':
                                    'color-mix(in srgb, var(--color-brand-yellow) 14%, transparent)',
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible
                                    ? 'translateY(0)'
                                    : 'translateY(24px)',
                                transitionDelay: `${i * 130}ms`,
                            }}
                        >
                            {/* Number with glow */}
                            <p
                                className="text-glow-gold text-4xl font-black sm:text-6xl"
                                style={{ color: 'var(--color-brand-yellow)' }}
                            >
                                <CountUp value={t(num)} start={isVisible} />
                            </p>

                            {/* Divider line */}
                            <div className="mx-auto my-2 h-px w-10 bg-linear-to-r from-transparent via-brand-gold/60 to-transparent sm:my-3 sm:w-12" />

                            <p className="text-[10px] font-semibold tracking-[0.14em] text-white/60 uppercase sm:text-xs sm:tracking-[0.18em]">
                                {t(label)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
