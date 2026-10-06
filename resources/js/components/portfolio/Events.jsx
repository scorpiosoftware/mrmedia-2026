import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent, useLocale } from '@/hooks/use-content';
import { ArrowUpRight, Calendar, CalendarX, MapPin, Monitor, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
        <section id="events" className="py-24 bg-[#F1F1F0] dark:bg-brand-dark overflow-hidden transition-colors duration-300">
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
                    <span className="inline-block mb-3 rounded-full bg-[#213C93]/10 dark:bg-[#213C93]/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#213C93] dark:text-brand-yellow">
                        {t('events.section_badge')}
                    </span>
                    <h2 className="text-3xl font-black text-[#0D1B4B] dark:text-white sm:text-4xl lg:text-5xl">
                        {t('events.title')}
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground dark:text-white/60">
                        {t('events.subtitle')}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="h-10 w-10 rounded-full border-4 border-[#213C93] border-t-transparent animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="py-16 text-center text-[#5A6A9A] dark:text-white/50">
                        <CalendarX size={40} className="mx-auto mb-3 opacity-40" />
                        <p>{t('events.empty')}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {events.map((event, i) => {
                            const isFull = event.remaining !== null && event.remaining <= 0;
                            return (
                                <Link
                                    key={event.id}
                                    to={`/events/${event.slug}`}
                                    className="group flex flex-col rounded-2xl bg-white dark:bg-primary-dark border border-[#D1D5E8] dark:border-primary-light/40 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                                    style={{
                                        opacity:   isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
                                        transitionDelay: `${i * 80}ms`,
                                    }}
                                >
                                    {event.image_url && (
                                        <div className="aspect-video w-full overflow-hidden">
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col p-6">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                                    event.type === 'training'
                                                        ? 'bg-[#DDB50E]/15 text-[#9A7A0A] dark:text-[#FCD532]'
                                                        : 'bg-[#213C93]/10 text-[#213C93] dark:text-brand-yellow'
                                                }`}
                                            >
                                                {event.type === 'training' ? t('events.badge_training') : t('events.badge_event')}
                                            </span>
                                            <span className="inline-flex items-center gap-1 w-fit rounded-full bg-[#F1F1F0] dark:bg-white/10 px-3 py-1 text-xs font-bold text-[#5A6A9A] dark:text-white/60">
                                                <Monitor size={11} />
                                                {event.mode === 'online' ? t('events.mode_online') : t('events.mode_offline')}
                                            </span>
                                        </div>

                                        <h3 className="mb-2 text-lg font-bold text-[#0D1B4B] dark:text-white">{event.title}</h3>

                                        <div className="mb-3 space-y-1.5 text-sm text-[#5A6A9A] dark:text-white/60">
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
                                            {event.remaining !== null && (
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} className="shrink-0" />
                                                    {isFull ? t('events.full') : `${event.remaining} / ${event.capacity}`}
                                                </div>
                                            )}
                                        </div>

                                        {event.description && (
                                            <p className="mb-5 flex-1 text-sm text-muted-foreground dark:text-white/50 line-clamp-3">
                                                {event.description}
                                            </p>
                                        )}

                                        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                                            <span className="text-lg font-black text-[#213C93] dark:text-brand-yellow">
                                                {event.price ? `${Number(event.price).toLocaleString()} ${t('events.currency')}` : t('events.free')}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white group-hover:bg-[#2E52C9] transition-colors">
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
