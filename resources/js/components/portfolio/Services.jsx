import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { usePublicList } from '@/hooks/use-public-list';
import { getServiceIcon } from '@/lib/service-icons';

export default function Services() {
    const t = useContent();
    const { items: services, loading } = usePublicList('/api/services');
    const [headerRef, headerVisible] = useScrollAnimation(0.2);
    const [gridRef, gridVisible] = useScrollAnimation(0.08);

    if (!loading && services.length === 0) return null;

    return (
        <section
            id="services"
            className="overflow-hidden bg-white py-24 transition-colors duration-300 dark:bg-brand-dark"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div
                    ref={headerRef}
                    className="mb-16 text-center transition-all duration-700"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible
                            ? 'translateY(0)'
                            : 'translateY(24px)',
                    }}
                >
                    <span className="mm-chip mb-3 inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-bold tracking-widest text-brand-blue uppercase dark:bg-primary-dark dark:text-brand-yellow">
                        {t('services.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-brand-dark sm:text-4xl lg:text-5xl dark:text-white">
                        {t('services.title')}
                    </h2>
                    <div aria-hidden="true" className="mm-title-line mt-5" />
                    <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                        {t('services.subtitle')}
                    </p>
                </div>

                {/* Grid */}
                <div
                    ref={gridRef}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {loading &&
                        services.length === 0 &&
                        Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-48 animate-pulse rounded-2xl bg-brand-bg dark:bg-primary-dark"
                            />
                        ))}

                    {services.map((service, i) => {
                        const Icon = getServiceIcon(service.icon);
                        return (
                            <div
                                key={service.id}
                                className="group mm-beam-hover mm-spotlight relative cursor-default rounded-2xl border border-border bg-brand-bg p-8 transition-all duration-500 [--mm-beam-inset:-1px] hover:-translate-y-2 hover:border-brand-blue/50 hover:bg-white hover:shadow-[0_12px_48px_color-mix(in_srgb,var(--color-brand-blue)_18%,transparent)] dark:border-primary-light/40 dark:bg-primary-dark dark:hover:border-brand-yellow/50 dark:hover:bg-brand-blue"
                                style={{
                                    opacity: gridVisible ? 1 : 0,
                                    transform: gridVisible
                                        ? 'translateY(0)'
                                        : 'translateY(32px)',
                                    transition: `opacity 0.6s ease, transform 0.6s ease, box-shadow 0.4s ease, background 0.3s ease, border-color 0.3s ease, translate 0.3s ease`,
                                    transitionDelay: `${i * 90}ms`,
                                }}
                            >
                                {/* Glow dot top-right */}
                                <div className="absolute top-5 right-5 h-2 w-2 rounded-full bg-brand-gold/0 transition-all duration-500 group-hover:bg-brand-gold group-hover:shadow-[0_0_10px_color-mix(in_srgb,var(--color-brand-gold)_80%,transparent)]" />

                                {/* Icon container */}
                                <div className="mb-5 inline-flex h-13 w-13 items-center justify-center rounded-xl bg-brand-blue text-white transition-all duration-400 group-hover:scale-110 group-hover:bg-brand-gold group-hover:text-brand-dark group-hover:shadow-[0_0_24px_color-mix(in_srgb,var(--color-brand-gold)_45%,transparent)]">
                                    <Icon size={22} />
                                </div>

                                <h3 className="mb-3 text-lg font-bold text-brand-dark transition-colors duration-300 group-hover:text-brand-blue dark:text-white dark:group-hover:text-brand-yellow">
                                    {service.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {service.description}
                                </p>

                                {/* Bottom accent line */}
                                <div className="absolute right-8 bottom-0 left-8 h-px bg-linear-to-r from-transparent via-brand-blue/0 to-transparent transition-all duration-500 group-hover:via-brand-blue/30" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
