import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent, useLocale } from '@/hooks/use-content';
import { AlertCircle, Calendar, CalendarX, MapPin, Send, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function getCsrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', attendees: 1, message: '' };

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

function RegisterModal({ event, onClose }) {
    const t = useContent();
    const [form, setForm] = useState(EMPTY_FORM);
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: name === 'attendees' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        setErrorMsg('');
        try {
            const res = await fetch(`/spa/events/${event.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify(form),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setStatus('sent');
            } else {
                setErrorMsg(json?.message || 'Something went wrong. Please try again.');
                setStatus('error');
            }
        } catch {
            setErrorMsg('Network error. Please check your connection.');
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-primary-dark border border-[#D1D5E8] dark:border-primary-light/40 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 text-[#5A6A9A] hover:text-[#0D1B4B] dark:hover:text-white transition-colors"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                {status === 'sent' ? (
                    <div className="text-center py-8">
                        <div
                            className="h-16 w-16 rounded-full bg-[#213C93] flex items-center justify-center mx-auto mb-4 shadow-[0_0_32px_rgba(33,60,147,0.45)]"
                            style={{ animation: 'scale-in-fade 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
                        >
                            <Send size={24} className="text-white" />
                        </div>
                        <p className="text-lg font-bold text-[#0D1B4B] dark:text-white">{t('events.success_title')}</p>
                        <p className="text-muted-foreground dark:text-white/60 mt-1">{t('events.success_message')}</p>
                    </div>
                ) : (
                    <>
                        <h3 className="mb-1 text-xl font-black text-[#0D1B4B] dark:text-white">{t('events.form.title')}</h3>
                        <p className="mb-6 text-sm text-muted-foreground dark:text-white/60">{event.title}</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status === 'error' && (
                                <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    {errorMsg}
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                        {t('events.form.name')}
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                        {t('events.form.email')}
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                        {t('events.form.phone')}
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                        {t('events.form.attendees')}
                                    </label>
                                    <input
                                        type="number"
                                        name="attendees"
                                        min={1}
                                        max={100}
                                        value={form.attendees}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                    {t('events.form.company')}
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    value={form.company}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                    {t('events.form.message')}
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#213C93] py-3 text-sm font-bold text-white hover:bg-[#2E52C9] disabled:opacity-70 transition-colors"
                            >
                                {status === 'sending' ? (
                                    <>
                                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        {t('events.form.submit')}
                                        <Send size={15} />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Events() {
    const t = useContent();
    const locale = useLocale();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
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
                                <div
                                    key={event.id}
                                    className="flex flex-col rounded-2xl bg-white dark:bg-primary-dark border border-[#D1D5E8] dark:border-primary-light/40 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                                    style={{
                                        opacity:   isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
                                        transitionDelay: `${i * 80}ms`,
                                    }}
                                >
                                    {event.image_url && (
                                        <div className="aspect-video w-full overflow-hidden">
                                            <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col p-6">
                                        <span
                                            className={`inline-block w-fit mb-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                                event.type === 'training'
                                                    ? 'bg-[#DDB50E]/15 text-[#9A7A0A] dark:text-[#FCD532]'
                                                    : 'bg-[#213C93]/10 text-[#213C93] dark:text-brand-yellow'
                                            }`}
                                        >
                                            {event.type === 'training' ? t('events.badge_training') : t('events.badge_event')}
                                        </span>

                                        <h3 className="mb-2 text-lg font-bold text-[#0D1B4B] dark:text-white">{event.title}</h3>

                                        <div className="mb-3 space-y-1.5 text-sm text-[#5A6A9A] dark:text-white/60">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="shrink-0" />
                                                {formatDate(event.starts_at, locale)}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="shrink-0" />
                                                    {event.location}
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

                                        <button
                                            onClick={() => setSelected(event)}
                                            disabled={isFull}
                                            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#213C93] py-2.5 text-sm font-bold text-white hover:bg-[#2E52C9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isFull ? t('events.full') : t('events.cta_register')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selected && <RegisterModal event={selected} onClose={() => setSelected(null)} />}
        </section>
    );
}
