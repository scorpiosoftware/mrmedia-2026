import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent, useLocale } from '@/hooks/use-content';
import { seatsStatus } from '@/lib/event-seats';
import { ArrowUpRight, Calendar, CalendarX, MapPin, Monitor, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ResponsiveImage from '@/components/ResponsiveImage';

function formatDate(value, locale) {
    if (!value) return '';
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function Events() {
    const t = useContent();
    const locale = useLocale();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ref, isVisible] = useScrollAnimation(0.1);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/events?locale=${locale}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setEvents(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [locale]);

    return (
        <section id="events" className="py-24 bg-brand-bg dark:bg-brand-dark overflow-hidden transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div
                    ref={ref}
                    className="mb-12 text-center transition-all duration-700"
                    style={{
                        opacity:   isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                    }}
                >
                    <span className="mm-chip inline-block mb-3 rounded-full bg-brand-blue/10 dark:bg-brand-blue/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-blue dark:text-brand-yellow">
                        {t('events.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-brand-dark dark:text-white sm:text-4xl lg:text-5xl">
                        {t('events.title')}
                    </h2>
                    <div aria-hidden="true" className="mm-title-line mt-5" />
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground dark:text-white/60">
                        {t('events.subtitle')}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="h-10 w-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground dark:text-white/50">
                        <CalendarX size={40} className="mx-auto mb-3 opacity-40" />
                        <p>{t('events.empty')}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {events.map((event, i) => {
                            const seats = seatsStatus(event, t);
                            return (
                                <Link
                                    key={event.id}
                                    to={`/events/${event.slug}`}
                                    className="group mm-beam-hover mm-spotlight flex flex-col rounded-2xl [--mm-beam-inset:-1px] bg-white dark:bg-primary-dark border border-border dark:border-primary-light/40 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                                    style={{
                                        opacity:   isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
                                        transitionDelay: `${i * 80}ms`,
                                    }}
                                >
                                    {event.image_url && (
                                        <div className="aspect-video w-full overflow-hidden">
                                            <ResponsiveImage
                                                src={event.image_url}
                                                alt={event.title}
                                                loading="lazy"
                                                // 1 / 2 / 3-column grid inside max-w-7xl
                                                sizes="(min-width: 1280px) 395px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 92vw"
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col p-6">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                                    event.type === 'training'
                                                        ? 'bg-brand-gold/15 text-[color-mix(in_srgb,var(--color-brand-gold)_70%,black)] dark:text-brand-yellow'
                                                        : 'bg-brand-blue/10 text-brand-blue dark:text-brand-yellow'
                                                }`}
                                            >
                                                {event.type === 'training' ? t('events.badge_training') : t('events.badge_event')}
                                            </span>
                                            <span className="inline-flex items-center gap-1 w-fit rounded-full bg-brand-bg dark:bg-white/10 px-3 py-1 text-xs font-bold text-muted-foreground dark:text-white/60">
                                                <Monitor size={11} />
                                                {event.mode === 'online' ? t('events.mode_online') : t('events.mode_offline')}
                                            </span>
                                        </div>

                                        <h3 className="mb-2 text-lg font-bold text-brand-dark dark:text-white">{event.title}</h3>

                                        <div className="mb-3 space-y-1.5 text-sm text-muted-foreground dark:text-white/60">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="shrink-0" />
                                                {formatDate(event.starts_at, locale)}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="shrink-0" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                            {seats && (
                                                <div
                                                    className={`flex items-center gap-2 ${
                                                        seats.full
                                                            ? 'font-semibold text-red-600 dark:text-red-400'
                                                            : seats.low
                                                              ? 'font-semibold text-amber-600 dark:text-brand-yellow'
                                                              : 'text-emerald-700 dark:text-emerald-400'
                                                    }`}
                                                >
                                                    <Users size={14} className="shrink-0" />
                                                    {seats.text}
                                                </div>
                                            )}
                                        </div>

                                        {event.description && (
                                            <p className="mb-5 flex-1 text-sm text-muted-foreground dark:text-white/50 line-clamp-3">
                                                {event.description}
                                            </p>
                                        )}

                                        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                                            <span className="text-lg font-black text-brand-blue dark:text-brand-yellow">
                                                {event.price ? `${Number(event.price).toLocaleString()} ${t('events.currency')}` : t('events.free')}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white group-hover:bg-primary-light transition-colors">
                                                {t('events.view_details')}
                                                <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
