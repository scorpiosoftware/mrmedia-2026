import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '@/components/portfolio/Footer';
import Navbar from '@/components/portfolio/Navbar';
import WhatsAppButton from '@/components/portfolio/WhatsAppButton';
import { useContent, useLocale } from '@/hooks/use-content';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import {
    AlertCircle, Calendar, CalendarX, ChevronLeft, Globe, MapPin, Send, Users,
} from 'lucide-react';

function getCsrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', attendees: 1, message: '' };

function formatDate(value, locale) {
    if (!value) return '';
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function RegisterForm({ event }) {
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

    if (status === 'sent') {
        return (
            <div className="text-center py-10">
                <div
                    className="h-16 w-16 rounded-full bg-[#213C93] flex items-center justify-center mx-auto mb-4 shadow-[0_0_32px_rgba(33,60,147,0.45)]"
                    style={{ animation: 'scale-in-fade 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
                >
                    <Send size={24} className="text-white" />
                </div>
                <p className="text-lg font-bold text-[#0D1B4B] dark:text-white">{t('events.success_title')}</p>
                <p className="text-muted-foreground dark:text-white/60 mt-1">{t('events.success_message')}</p>
            </div>
        );
    }

    return (
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#213C93] py-3.5 text-sm font-bold text-white hover:bg-[#2E52C9] hover:shadow-[0_8px_32px_rgba(33,60,147,0.35)] disabled:opacity-70 disabled:hover:shadow-none transition-all duration-300"
            >
                {status === 'sending' ? (
                    <>
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Sending…
                    </>
                ) : (
                    <>
                        {t('events.form.submit')}
                        <Send size={16} />
                    </>
                )}
            </button>
        </form>
    );
}

export default function EventDetails() {
    const { slug } = useParams();
    const locale = useLocale();
    const t = useContent();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        setEvent(null);

        fetch(`/api/events/${slug}?locale=${locale}`)
            .then(async (r) => {
                if (!r.ok) {
                    setNotFound(true);
                    return;
                }
                setEvent(await r.json());
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug, locale]);

    const backToEvents = () => navigate('/', { state: { scrollTo: 'events' } });

    const isFull = event?.remaining !== null && event?.remaining !== undefined && event.remaining <= 0;

    useDocumentMeta({
        title: event ? `${event.title} | Mr.MEDIA` : undefined,
        description: event?.description
            ? event.description.replace(/\s+/g, ' ').trim().slice(0, 160)
            : undefined,
    });

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-300">
                {loading ? (
                    <div className="flex min-h-screen items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-4 border-[#213C93] border-t-transparent animate-spin" />
                    </div>
                ) : notFound || !event ? (
                    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                        <CalendarX size={48} className="mb-4 text-[#5A6A9A] opacity-40" />
                        <p className="mb-6 text-lg font-bold text-[#0D1B4B] dark:text-white">{t('events.not_found')}</p>
                        <button
                            onClick={backToEvents}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-6 py-3 text-sm font-bold text-white hover:bg-[#2E52C9] transition-colors"
                        >
                            <ChevronLeft size={16} className="rtl:rotate-180" />
                            {t('events.back_to_events')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header band */}
                        <section className="relative overflow-hidden bg-brand-gradient pb-16 pt-28 sm:pt-32">
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div
                                    className="absolute -top-32 -right-32 w-125 h-125 rounded-full mm-float mm-glow-blue"
                                    style={{ background: 'radial-gradient(circle, rgba(46,82,201,0.5) 0%, rgba(33,60,147,0.18) 45%, transparent 70%)' }}
                                />
                                <div
                                    className="absolute -bottom-32 -left-32 w-100 h-100 rounded-full mm-float-rev mm-glow-gold"
                                    style={{ background: 'radial-gradient(circle, rgba(221,181,14,0.22) 0%, transparent 70%)' }}
                                />
                            </div>

                            <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                <button
                                    onClick={backToEvents}
                                    className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
                                >
                                    <ChevronLeft size={16} className="rtl:rotate-180" />
                                    {t('events.back_to_events')}
                                </button>

                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                            event.type === 'training' ? 'bg-[#FCD532]/20 text-[#FCD532]' : 'bg-white/15 text-white'
                                        }`}
                                    >
                                        {event.type === 'training' ? t('events.badge_training') : t('events.badge_event')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                                        <Globe size={11} />
                                        {event.mode === 'online' ? t('events.mode_online') : t('events.mode_offline')}
                                    </span>
                                </div>

                                <h1 className="mb-6 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                                    {event.title}
                                </h1>

                                <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="shrink-0 text-[#FCD532]" />
                                        {formatDate(event.starts_at, locale)}
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="shrink-0 text-[#FCD532]" />
                                            {event.location}
                                        </div>
                                    )}
                                    {event.remaining !== null && (
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="shrink-0 text-[#FCD532]" />
                                            {isFull ? t('events.full') : `${event.remaining} / ${event.capacity}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Body */}
                        <section className="py-16 sm:py-20">
                            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                <div className="grid gap-12 lg:grid-cols-5">

                                    {/* Left: image + description */}
                                    <div className="lg:col-span-3">
                                        {event.image_url && (
                                            <div className="mb-8 aspect-video w-full overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                                                <img
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    className="h-full w-full object-cover"
                                                    loading="eager"
                                                />
                                            </div>
                                        )}

                                        {event.description && (
                                            <>
                                                <h2 className="mb-4 text-xl font-black text-[#0D1B4B] dark:text-white">
                                                    {t('events.about_label')}
                                                </h2>
                                                <p className="whitespace-pre-line leading-relaxed text-muted-foreground dark:text-white/70">
                                                    {event.description}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Right: sticky registration card */}
                                    <div className="lg:col-span-2">
                                        <div className="lg:sticky lg:top-28 rounded-3xl bg-[#F1F1F0] dark:bg-primary-dark p-8 shadow-[0_4px_32px_rgba(33,60,147,0.08)] border border-[#D1D5E8] dark:border-primary-light/40">
                                            <div className="mb-6 flex items-center justify-between border-b border-[#D1D5E8] dark:border-primary-light/40 pb-6">
                                                <span className="text-xs font-bold uppercase tracking-widest text-[#5A6A9A] dark:text-white/50">
                                                    {t('events.price_label')}
                                                </span>
                                                <span className="text-2xl font-black text-[#213C93] dark:text-brand-yellow">
                                                    {event.price ? `${Number(event.price).toLocaleString()} ${t('events.currency')}` : t('events.free')}
                                                </span>
                                            </div>

                                            {isFull ? (
                                                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 px-4 py-4 text-center text-sm font-semibold text-red-600 dark:text-red-400">
                                                    {t('events.full')}
                                                </div>
                                            ) : (
                                                <RegisterForm event={event} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
            <Footer />
            <WhatsAppButton />
        </>
    );
}
