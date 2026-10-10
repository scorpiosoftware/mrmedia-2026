import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '@/components/portfolio/Footer';
import Navbar from '@/components/portfolio/Navbar';
import WhatsAppButton from '@/components/portfolio/WhatsAppButton';
import { useContent, useLocale } from '@/hooks/use-content';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import {
    Award, AlertCircle, Calendar, CalendarX, CheckCircle2, ChevronDown, ChevronLeft,
    Globe, MapPin, Quote, Send, Users,
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

function scrollToRegister(e) {
    e.preventDefault();
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function RequiredMark({ required }) {
    if (!required) return null;
    return <span className="text-red-500">&nbsp;*</span>;
}

function RegisterForm({ event }) {
    const t = useContent();
    const [form, setForm] = useState(EMPTY_FORM);
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error
    const [errorMsg, setErrorMsg] = useState('');

    const requiredFields = event.required_fields ?? ['name', 'email'];
    const isRequired = (field) => requiredFields.includes(field);

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
                        <RequiredMark required={isRequired('name')} />
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required={isRequired('name')}
                        className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                        {t('events.form.email')}
                        <RequiredMark required={isRequired('email')} />
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required={isRequired('email')}
                        className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                        {t('events.form.phone')}
                        <RequiredMark required={isRequired('phone')} />
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required={isRequired('phone')}
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
                    <RequiredMark required={isRequired('company')} />
                </label>
                <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    required={isRequired('company')}
                    className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-2.5 text-sm text-[#0D1B4B] dark:text-white focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                    {t('events.form.message')}
                    <RequiredMark required={isRequired('message')} />
                </label>
                <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={3}
                    required={isRequired('message')}
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

function AgendaSection({ event, t }) {
    if (!event.agenda?.length) return null;
    return (
        <section className="py-16 sm:py-20 bg-white dark:bg-brand-dark">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-2xl font-black text-[#0D1B4B] dark:text-white sm:text-3xl">
                    {t('events.agenda_label')}
                </h2>
                <p className="mt-2 text-center text-muted-foreground dark:text-white/60">
                    {t('events.agenda_subtitle')}
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {event.agenda.map((item, i) => (
                        <div
                            key={i}
                            className="flex gap-3 rounded-2xl bg-[#F1F1F0] dark:bg-primary-dark p-5 border border-[#D1D5E8] dark:border-primary-light/40"
                        >
                            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#213C93] dark:text-brand-yellow" />
                            <div>
                                {item.title && (
                                    <p className="font-bold text-[#0D1B4B] dark:text-white">{item.title}</p>
                                )}
                                {item.description && (
                                    <p className="mt-1 text-sm text-muted-foreground dark:text-white/70">{item.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TrainerSection({ event, t }) {
    const trainer = event.trainer;
    if (!trainer?.name) return null;
    return (
        <section className="py-16 sm:py-20 bg-[#F7F7F6] dark:bg-primary-dark/40">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-10 text-center text-2xl font-black text-[#0D1B4B] dark:text-white sm:text-3xl">
                    {t('events.trainer_label')}
                </h2>
                <div className="flex flex-col items-center gap-6 rounded-3xl bg-white dark:bg-brand-dark p-8 shadow-[0_4px_32px_rgba(33,60,147,0.08)] border border-[#D1D5E8] dark:border-primary-light/40 sm:flex-row sm:items-start">
                    {trainer.image_url ? (
                        <img
                            src={trainer.image_url}
                            alt={trainer.name}
                            className="h-28 w-28 shrink-0 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[#213C93] text-3xl font-black text-white">
                            {trainer.name.charAt(0)}
                        </div>
                    )}
                    <div className="text-center sm:text-start">
                        <p className="text-lg font-black text-[#0D1B4B] dark:text-white">{trainer.name}</p>
                        {trainer.title && (
                            <p className="text-sm font-semibold text-[#213C93] dark:text-brand-yellow">{trainer.title}</p>
                        )}
                        {trainer.bio && (
                            <p className="mt-3 leading-relaxed text-muted-foreground dark:text-white/70">{trainer.bio}</p>
                        )}
                        {trainer.credentials?.length > 0 && (
                            <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
                                {trainer.credentials.map((c, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-sm text-[#0D1B4B] dark:text-white/80">
                                        <Award size={14} className="shrink-0 text-[#DDB50E]" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function TestimonialsSection({ event, t }) {
    if (!event.testimonials?.length) return null;
    return (
        <section className="py-16 sm:py-20 bg-white dark:bg-brand-dark">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-10 text-center text-2xl font-black text-[#0D1B4B] dark:text-white sm:text-3xl">
                    {t('events.testimonials_label')}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                    {event.testimonials.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-[#F1F1F0] dark:bg-primary-dark p-6 border border-[#D1D5E8] dark:border-primary-light/40"
                        >
                            <Quote size={22} className="mb-3 text-[#213C93]/30 dark:text-brand-yellow/30" />
                            <p className="leading-relaxed text-[#0D1B4B] dark:text-white/85">{item.quote}</p>
                            <div className="mt-4 flex items-center gap-3">
                                {item.avatar_url ? (
                                    <img src={item.avatar_url} alt={item.name ?? ''} className="h-9 w-9 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#213C93] text-xs font-bold text-white">
                                        {(item.name ?? '?').charAt(0)}
                                    </div>
                                )}
                                <div>
                                    {item.name && <p className="text-sm font-bold text-[#0D1B4B] dark:text-white">{item.name}</p>}
                                    {item.role && <p className="text-xs text-muted-foreground dark:text-white/60">{item.role}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FaqItem({ item }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-2xl border border-[#D1D5E8] dark:border-primary-light/40 bg-[#F1F1F0] dark:bg-primary-dark overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
                <span className="font-semibold text-[#0D1B4B] dark:text-white">{item.question}</span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#213C93] dark:text-brand-yellow transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <p className="px-5 pb-4 leading-relaxed text-muted-foreground dark:text-white/70">
                    {item.answer}
                </p>
            )}
        </div>
    );
}

function FaqSection({ event, t }) {
    if (!event.faqs?.length) return null;
    return (
        <section className="py-16 sm:py-20 bg-[#F7F7F6] dark:bg-primary-dark/40">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-10 text-center text-2xl font-black text-[#0D1B4B] dark:text-white sm:text-3xl">
                    {t('events.faq_label')}
                </h2>
                <div className="space-y-3">
                    {event.faqs.map((item, i) => (
                        <FaqItem key={i} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FinalCta({ event, t }) {
    if (!event.cta?.heading && !event.cta?.subheading) return null;
    return (
        <section className="relative overflow-hidden bg-brand-gradient py-16 sm:py-20">
            <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                {event.cta.heading && (
                    <h2 className="text-2xl font-black text-white sm:text-3xl">{event.cta.heading}</h2>
                )}
                {event.cta.subheading && (
                    <p className="mx-auto mt-3 max-w-xl text-white/80">{event.cta.subheading}</p>
                )}
                <a
                    href="#register"
                    onClick={scrollToRegister}
                    className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#213C93] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
                >
                    {t('events.register_cta')}
                </a>
            </div>
        </section>
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
                        {/* 01 — Hero: event details + register CTA */}
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

                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/85">
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

                                {!isFull && (
                                    <a
                                        href="#register"
                                        onClick={scrollToRegister}
                                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#213C93] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
                                    >
                                        {t('events.register_cta')}
                                    </a>
                                )}
                            </div>
                        </section>

                        {/* 02 — About the Event: purpose + target audience */}
                        {(event.image_url || event.description || event.target_audience) && (
                            <section className="py-16 sm:py-20 bg-white dark:bg-brand-dark">
                                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                    <div className={event.image_url ? 'grid gap-12 lg:grid-cols-2' : 'mx-auto max-w-2xl'}>
                                        {event.image_url && (
                                            <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                                                <img
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    className="h-full w-full object-cover"
                                                    loading="eager"
                                                />
                                            </div>
                                        )}
                                        <div>
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
                                            {event.target_audience && (
                                                <div className="mt-6 flex gap-3 rounded-2xl bg-[#F1F1F0] dark:bg-primary-dark p-5 border border-[#D1D5E8] dark:border-primary-light/40">
                                                    <Users size={20} className="mt-0.5 shrink-0 text-[#213C93] dark:text-brand-yellow" />
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-[#213C93] dark:text-brand-yellow">
                                                            {t('events.target_audience_label')}
                                                        </p>
                                                        <p className="mt-1 text-sm leading-relaxed text-[#0D1B4B] dark:text-white/80">
                                                            {event.target_audience}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 03 — Learning Outcomes / Agenda */}
                        <AgendaSection event={event} t={t} />

                        {/* 04 — Trainer / Speaker */}
                        <TrainerSection event={event} t={t} />

                        {/* 05 — Registration: form + price + payment */}
                        <section id="register" className="scroll-mt-24 py-16 sm:py-20 bg-[#F7F7F6] dark:bg-primary-dark/40">
                            <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
                                <h2 className="mb-8 text-center text-2xl font-black text-[#0D1B4B] dark:text-white sm:text-3xl">
                                    {t('events.registration_label')}
                                </h2>
                                <div className="rounded-3xl bg-white dark:bg-brand-dark p-8 shadow-[0_4px_32px_rgba(33,60,147,0.08)] border border-[#D1D5E8] dark:border-primary-light/40">
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

                                    {event.payment_note && (
                                        <p className="mt-5 text-center text-xs text-muted-foreground dark:text-white/50">
                                            {event.payment_note}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 06 — Testimonials */}
                        <TestimonialsSection event={event} t={t} />

                        {/* 07 — FAQ */}
                        <FaqSection event={event} t={t} />

                        {/* 08 — Final CTA */}
                        <FinalCta event={event} t={t} />
                    </>
                )}
            </main>
            <Footer />
            <WhatsAppButton />
        </>
    );
}
