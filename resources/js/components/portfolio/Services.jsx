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
            className="overflow-hidden bg-white py-24 transition-colors duration-300 dark:bg-[#0D1B4B]"
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
                    <span className="mb-3 inline-block rounded-full bg-[#E8EAF6] px-4 py-1.5 text-xs font-bold tracking-widest text-[#213C93] uppercase dark:bg-primary-dark dark:text-[#FCD532]">
                        {t('services.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-[#0D1B4B] sm:text-4xl lg:text-5xl dark:text-white">
                        {t('services.title')}
                    </h2>
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
                                className="h-48 animate-pulse rounded-2xl bg-[#F1F1F0] dark:bg-primary-dark"
                            />
                        ))}

                    {services.map((service, i) => {
                        const Icon = getServiceIcon(service.icon);
                        return (
                            <div
                                key={service.id}
                                className="group relative cursor-default rounded-2xl border border-[#D1D5E8] bg-[#F1F1F0] p-8 transition-all duration-500 hover:-translate-y-2 hover:border-[#213C93]/50 hover:bg-white hover:shadow-[0_12px_48px_rgba(33,60,147,0.18)] dark:border-primary-light/40 dark:bg-primary-dark dark:hover:border-brand-yellow/50 dark:hover:bg-[#213C93]"
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
                                <div className="absolute top-5 right-5 h-2 w-2 rounded-full bg-[#DDB50E]/0 transition-all duration-500 group-hover:bg-[#DDB50E] group-hover:shadow-[0_0_10px_rgba(221,181,14,0.8)]" />

                                {/* Icon container */}
                                <div className="mb-5 inline-flex h-13 w-13 items-center justify-center rounded-xl bg-[#213C93] text-white transition-all duration-400 group-hover:scale-110 group-hover:bg-[#DDB50E] group-hover:text-[#0D1B4B] group-hover:shadow-[0_0_24px_rgba(221,181,14,0.45)]">
                                    <Icon size={22} />
                                </div>

                                <h3 className="mb-3 text-lg font-bold text-[#0D1B4B] transition-colors duration-300 group-hover:text-[#213C93] dark:text-white dark:group-hover:text-brand-yellow">
                                    {service.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {service.description}
                                </p>

                                {/* Bottom accent line */}
                                <div className="absolute right-8 bottom-0 left-8 h-px bg-linear-to-r from-transparent via-[#213C93]/0 to-transparent transition-all duration-500 group-hover:via-[#213C93]/30" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
