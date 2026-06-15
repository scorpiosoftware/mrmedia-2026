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
        <section className="relative bg-[#0D1B4B] dark:bg-primary-dark py-20 overflow-hidden transition-colors duration-300">
            {/* Background glow blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-16 left-1/4 w-96 h-48 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(33,60,147,0.55) 0%, transparent 70%)' }}
                />
                <div
                    className="absolute -bottom-16 right-1/4 w-72 h-36 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(221,181,14,0.22) 0%, transparent 70%)' }}
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

            <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    {STATS.map(({ num, label }, i) => (
                        <div
                            key={num}
                            className="text-center transition-all duration-700"
                            style={{
                                opacity:   isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                                transitionDelay: `${i * 130}ms`,
                            }}
                        >
                            {/* Number with glow */}
                            <p
                                className="text-5xl font-black sm:text-6xl text-glow-gold"
                                style={{ color: '#FCD532' }}
                            >
                                {t(num)}
                            </p>

                            {/* Divider line */}
                            <div className="mx-auto mt-3 mb-3 h-px w-12 bg-linear-to-r from-transparent via-[#DDB50E]/60 to-transparent" />

                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                                {t(label)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
