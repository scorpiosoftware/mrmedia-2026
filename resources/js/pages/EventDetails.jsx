import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '@/components/portfolio/Footer';
import Navbar from '@/components/portfolio/Navbar';
import PhoneInput from '@/components/portfolio/PhoneInput';
import WhatsAppButton from '@/components/portfolio/WhatsAppButton';
import { useApp } from '@/context/AppContext';
import { useContent, useLocale, useSiteIdentity } from '@/hooks/use-content';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { usePointerGlow } from '@/hooks/use-pointer-glow';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { seatsStatus } from '@/lib/event-seats';
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries';
import {
    Award, AlertCircle, Calendar, CalendarX, CheckCircle2, ChevronDown, ChevronLeft,
    Globe, MapPin, Quote, Send, Tag, Users,
} from 'lucide-react';

function getCsrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

const EMPTY_FORM = {
    name: '', email: '', phoneCountry: DEFAULT_COUNTRY, phoneNumber: '', company: '', attendees: 1, message: '',
};

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

/** Same rule as Event::priceFor() on the server — the server's figure is the one that's saved. */
function priceFor(event, attendees) {
    const unit = Number(event.price) || 0;
    const subtotal = unit * attendees;
    const discount = event.group_discount;
    const percent = discount && attendees >= discount.min_attendees ? discount.percent : 0;
    const total = Math.round(subtotal * (1 - percent / 100) * 100) / 100;
    return { unit, subtotal, percent, saved: subtotal - total, total };
}

function formatMoney(amount, t) {
    return `${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${t('events.currency')}`;
}

function groupDiscountHint(event, t) {
    if (!event.group_discount) return '';
    return t('events.group_discount_hint')
        .replace('{percent}', event.group_discount.percent)
        .replace('{min}', event.group_discount.min_attendees);
}

/** Live price breakdown, shown on the registration panel's blue side. */
function PriceSummary({ event, attendees, className = '' }) {
    const t = useContent();
    const { unit, subtotal, percent, saved, total } = priceFor(event, attendees);

    return (
        <div className={`rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur-sm ${className}`} aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-white/70">
                <span>
                    {formatMoney(unit, t)} × {attendees}
                </span>
                <span className={percent ? 'line-through opacity-70' : ''}>{formatMoney(subtotal, t)}</span>
            </div>

            {percent > 0 && (
                <div
                    key={percent}
                    className="mt-2 flex items-center justify-between gap-3 font-semibold text-emerald-300"
                    style={{ animation: 'slide-up-fade 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
                >
                    <span className="inline-flex items-center gap-1.5">
                        <Tag size={14} />
                        {t('events.form.discount')} ({percent}%)
                    </span>
                    <span>−{formatMoney(saved, t)}</span>
                </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
                <span className="text-xs font-bold uppercase tracking-widest text-white">{t('events.form.total')}</span>
                <span key={total} className="text-xl font-black text-brand-yellow" style={{ animation: 'scale-in-fade 0.3s ease-out both' }}>
                    {formatMoney(total, t)}
                </span>
            </div>
        </div>
    );
}

const FIELD_CLASS =
    'w-full rounded-xl border border-border dark:border-primary-light/50 bg-white dark:bg-brand-dark px-3.5 py-2.5 text-sm text-brand-dark dark:text-white focus:border-brand-blue dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:focus:ring-brand-yellow/20';
const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-blue dark:text-brand-yellow';

/** Fades and lifts its content in the first time it scrolls into view (same entrance as the home page). */
function Reveal({ children, delay = 0, className = '' }) {
    const [ref, visible] = useScrollAnimation(0.12);
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out motion-reduce:transition-none ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/** Centered section heading with the glowing gold underline. */
function SectionTitle({ children, className = '' }) {
    return (
        <div className={`text-center ${className}`}>
            <h2 className="text-2xl font-black text-brand-dark dark:text-white sm:text-3xl">{children}</h2>
            <div aria-hidden="true" className="mm-title-line mt-4" />
        </div>
    );
}

function scrollToRegister(e) {
    e.preventDefault();
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function RequiredMark({ required }) {
    if (!required) return null;
    return <span className="text-red-500">&nbsp;*</span>;
}

/**
 * Registration card sized to fit the viewport: on large screens a blue info side (price, discount,
 * live total, payment note) next to a compact form; on small screens the info stacks on top and the
 * total + submit button stay pinned to the bottom of the screen while the form is in view.
 */
function RegistrationPanel({ event, isFull }) {
    const t = useContent();
    const { whatsappNumber, whatsappVisible } = useApp();
    const showsWhatsApp = Boolean(whatsappNumber && whatsappVisible);
    const [form, setForm] = useState(EMPTY_FORM);
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error
    const [errorMsg, setErrorMsg] = useState('');

    const requiredFields = event.required_fields ?? ['name', 'email'];
    const isRequired = (field) => requiredFields.includes(field);
    // One registration can't take more seats than are left (the server enforces the same), nor more than 100.
    const maxAttendees = Math.max(1, Math.min(100, event.remaining ?? 100));
    // The field can be briefly empty while typing; price it as 1 until a number is entered.
    const attendees = Math.min(maxAttendees, Math.max(1, Math.floor(form.attendees) || 1));

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'attendees') {
            // Typing past the limit snaps back to it, so the price summary never quotes unavailable seats.
            const count = value === '' ? '' : Math.min(maxAttendees, Math.max(1, Math.floor(Number(value)) || 1));
            setForm((prev) => ({ ...prev, attendees: count }));
            return;
        }
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        setErrorMsg('');
        const { phoneCountry, phoneNumber, ...rest } = form;
        const dial = COUNTRIES.find((c) => c.iso === phoneCountry)?.dial ?? '';
        const payload = {
            ...rest,
            phone: phoneNumber.trim() ? `+${dial} ${phoneNumber.trim()}` : '',
        };
        try {
            const res = await fetch(`/spa/events/${event.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify(payload),
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

    const paid = event.price > 0;
    const { percent, total } = priceFor(event, attendees);

    const info = (
        <aside className="bg-brand-gradient relative flex flex-col gap-4 rounded-t-3xl p-5 text-white sm:p-6 lg:col-span-2 lg:rounded-none lg:rounded-s-3xl lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 lg:block">
                <h2 className="text-xl font-black sm:text-2xl lg:mb-6 lg:text-3xl">{t('events.registration_label')}</h2>
                <div>
                    <p className="hidden text-xs font-bold uppercase tracking-widest text-white/60 lg:block">{t('events.price_label')}</p>
                    <p className="text-xl font-black text-brand-yellow sm:text-2xl lg:mt-1 lg:text-3xl">
                        {paid ? formatMoney(event.price, t) : t('events.free')}
                        {paid && <span className="ms-1.5 text-xs font-semibold text-white/60">{t('events.form.per_person')}</span>}
                    </p>
                </div>
            </div>

            {event.group_discount && (
                <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <Tag size={12} className="shrink-0" />
                    {groupDiscountHint(event, t)}
                </p>
            )}

            {/* Full breakdown on large screens; small screens get the pinned total bar instead */}
            {paid && !isFull && status !== 'sent' && (
                <PriceSummary event={event} attendees={attendees} className="hidden lg:block" />
            )}

            {event.payment_note && (
                <div className="border-t border-white/15 pt-4 text-xs lg:mt-auto">
                    {event.titles?.payment && (
                        <p className="mb-1 font-bold uppercase tracking-widest text-brand-yellow">{event.titles.payment}</p>
                    )}
                    <p className="leading-relaxed text-white/70">{event.payment_note}</p>
                </div>
            )}
        </aside>
    );

    let body;
    if (isFull) {
        body = (
            <div className="flex h-full items-center justify-center">
                <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center text-sm font-semibold text-red-600 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-400">
                    {t('events.full')}
                </div>
            </div>
        );
    } else if (status === 'sent') {
        body = (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue shadow-[0_0_32px_color-mix(in_srgb,var(--color-brand-blue)_45%,transparent)]"
                    style={{ animation: 'scale-in-fade 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
                >
                    <Send size={24} className="text-white" />
                </div>
                <p className="text-lg font-bold text-brand-dark dark:text-white">{t('events.success_title')}</p>
                <p className="mt-1 text-muted-foreground dark:text-white/60">{t('events.success_message')}</p>
            </div>
        );
    } else {
        body = (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
                {status === 'error' && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-400">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        {errorMsg}
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                        <label className={LABEL_CLASS}>
                            {t('events.form.name')}
                            <RequiredMark required={isRequired('name')} />
                        </label>
                        <input type="text" name="name" autoComplete="name" value={form.name} onChange={handleChange} required={isRequired('name')} className={FIELD_CLASS} />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>
                            {t('events.form.email')}
                            <RequiredMark required={isRequired('email')} />
                        </label>
                        <input type="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} required={isRequired('email')} className={FIELD_CLASS} />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>
                            {t('events.form.phone')}
                            <RequiredMark required={isRequired('phone')} />
                        </label>
                        <PhoneInput
                            country={form.phoneCountry}
                            number={form.phoneNumber}
                            onCountryChange={(iso) => setForm((prev) => ({ ...prev, phoneCountry: iso }))}
                            onNumberChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))}
                            required={isRequired('phone')}
                            inputClassName="rounded-xl border border-border dark:border-primary-light/50 bg-white dark:bg-brand-dark px-3.5 py-2.5 text-sm text-brand-dark dark:text-white focus:border-brand-blue dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:focus:ring-brand-yellow/20"
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>
                            {t('events.form.company')}
                            <RequiredMark required={isRequired('company')} />
                        </label>
                        <input type="text" name="company" autoComplete="organization" value={form.company} onChange={handleChange} required={isRequired('company')} className={FIELD_CLASS} />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>{t('events.form.attendees')}</label>
                        <input
                            type="number"
                            name="attendees"
                            inputMode="numeric"
                            min={1}
                            max={maxAttendees}
                            value={form.attendees}
                            onChange={handleChange}
                            required
                            className={FIELD_CLASS}
                        />
                        {event.remaining != null && (
                            <p className={`mt-1 text-xs ${attendees >= maxAttendees ? 'font-semibold text-amber-600 dark:text-brand-yellow' : 'text-muted-foreground dark:text-white/50'}`}>
                                {t('events.form.max_attendees').replace('{count}', maxAttendees)}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>
                            {t('events.form.message')}
                            <RequiredMark required={isRequired('message')} />
                        </label>
                        <textarea name="message" value={form.message} onChange={handleChange} rows={2} required={isRequired('message')} className={`${FIELD_CLASS} resize-none`} />
                    </div>
                </div>

                {/* Pinned to the bottom of the screen on small screens, so the total and submit are always reachable.
                    Leaves room on the right for the floating WhatsApp button. */}
                <div className={`sticky bottom-0 z-10 -mx-5 -mb-5 mt-1 flex items-center gap-3 rounded-b-3xl border-t border-border bg-white/95 px-5 py-3 backdrop-blur-sm sm:-mx-6 sm:-mb-6 sm:px-6 ${showsWhatsApp ? 'max-lg:pr-24' : ''} lg:static lg:m-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none dark:border-primary-light/40 dark:bg-brand-dark/95 lg:dark:bg-transparent`}>
                    {paid && (
                        <div className="shrink-0 lg:hidden" aria-live="polite">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/50">
                                {t('events.form.total')}
                                {percent > 0 && <span className="ms-1 text-emerald-600 dark:text-emerald-400">−{percent}%</span>}
                            </p>
                            <p className="text-lg font-black leading-tight text-brand-blue dark:text-brand-yellow">{formatMoney(total, t)}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={status === 'sending'}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-primary-light hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-blue)_35%,transparent)] disabled:opacity-70 disabled:hover:shadow-none"
                    >
                        {status === 'sending' ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Sending…
                            </>
                        ) : (
                            <>
                                {t('events.form.submit')}
                                <Send size={16} className="rtl:-scale-x-100" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div className="mm-beam grid rounded-3xl border border-border bg-white shadow-[0_8px_48px_color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] lg:grid-cols-5 dark:border-primary-light/40 dark:bg-brand-dark [--mm-beam-inset:-1px] [--mm-beam-speed:8s]">
            {info}
            <div className="p-5 sm:p-6 lg:col-span-3 lg:p-8">{body}</div>
        </div>
    );
}

function AgendaSection({ event, t }) {
    if (!event.agenda?.length) return null;
    return (
        <section className="py-16 sm:py-20 bg-white dark:bg-brand-dark">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionTitle>{event.titles?.agenda || t('events.agenda_label')}</SectionTitle>
                    <p className="mt-3 text-center text-muted-foreground dark:text-white/60">
                        {t('events.agenda_subtitle')}
                    </p>
                </Reveal>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {event.agenda.map((item, i) => (
                        <Reveal key={i} delay={i * 80}>
                        <div className="group mm-beam-hover mm-spotlight flex h-full gap-3 rounded-2xl bg-brand-bg dark:bg-primary-dark p-5 border border-border dark:border-primary-light/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--color-brand-blue)_14%,transparent)] [--mm-beam-inset:-1px]">
                            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand-blue transition-transform duration-300 group-hover:scale-110 dark:text-brand-yellow" />
                            <div>
                                {item.title && (
                                    <p className="font-bold text-brand-dark dark:text-white">{item.title}</p>
                                )}
                                {item.description && (
                                    <p className="mt-1 text-sm text-muted-foreground dark:text-white/70">{item.description}</p>
                                )}
                            </div>
                        </div>
                        </Reveal>
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
        <section className="py-16 sm:py-20 bg-brand-bg-alt dark:bg-primary-dark/40">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionTitle className="mb-10">{event.titles?.trainer || t('events.trainer_label')}</SectionTitle>
                </Reveal>
                <Reveal delay={120}>
                <div className="group mm-beam mm-spotlight flex flex-col items-center gap-6 rounded-3xl bg-white dark:bg-brand-dark p-8 shadow-[0_4px_32px_color-mix(in_srgb,var(--color-brand-blue)_8%,transparent)] border border-border dark:border-primary-light/40 sm:flex-row sm:items-start [--mm-beam-inset:-1px] [--mm-beam-speed:7s]">
                    {trainer.image_url ? (
                        <img
                            src={trainer.image_url}
                            alt={trainer.name}
                            className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand-gold)_25%,transparent)] transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="mm-glow-blue flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-3xl font-black text-white">
                            {trainer.name.charAt(0)}
                        </div>
                    )}
                    <div className="text-center sm:text-start">
                        <p className="text-lg font-black text-brand-dark dark:text-white">{trainer.name}</p>
                        {trainer.title && (
                            <p className="text-sm font-semibold text-brand-blue dark:text-brand-yellow">{trainer.title}</p>
                        )}
                        {trainer.bio && (
                            <p className="mt-3 leading-relaxed text-muted-foreground dark:text-white/70">{trainer.bio}</p>
                        )}
                        {trainer.credentials?.length > 0 && (
                            <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
                                {trainer.credentials.map((c, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-sm text-brand-dark dark:text-white/80">
                                        <Award size={14} className="shrink-0 text-brand-gold" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                </Reveal>
            </div>
        </section>
    );
}

function TestimonialsSection({ event, t }) {
    if (!event.testimonials?.length) return null;
    return (
        <section className="py-16 sm:py-20 bg-white dark:bg-brand-dark">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionTitle className="mb-10">{t('events.testimonials_label')}</SectionTitle>
                </Reveal>
                <div className="grid gap-5 sm:grid-cols-2">
                    {event.testimonials.map((item, i) => (
                        <Reveal key={i} delay={i * 100}>
                        <div className="group mm-beam-hover mm-spotlight h-full rounded-2xl bg-brand-bg dark:bg-primary-dark p-6 border border-border dark:border-primary-light/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--color-brand-blue)_14%,transparent)] [--mm-beam-inset:-1px]">
                            <Quote size={22} className="mb-3 text-brand-blue/30 transition-all duration-300 group-hover:text-brand-gold group-hover:drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-brand-gold)_65%,transparent)] dark:text-brand-yellow/30" />
                            <p className="leading-relaxed text-brand-dark dark:text-white/85">{item.quote}</p>
                            <div className="mt-4 flex items-center gap-3">
                                {item.avatar_url ? (
                                    <img src={item.avatar_url} alt={item.name ?? ''} className="h-9 w-9 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                                        {(item.name ?? '?').charAt(0)}
                                    </div>
                                )}
                                <div>
                                    {item.name && <p className="text-sm font-bold text-brand-dark dark:text-white">{item.name}</p>}
                                    {item.role && <p className="text-xs text-muted-foreground dark:text-white/60">{item.role}</p>}
                                </div>
                            </div>
                        </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FaqItem({ item }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`mm-beam-hover rounded-2xl border bg-brand-bg dark:bg-primary-dark overflow-hidden transition-all duration-300 ${open ? 'border-brand-blue/40 shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] dark:border-brand-yellow/40' : 'border-border dark:border-primary-light/40'}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
                <span className="font-semibold text-brand-dark dark:text-white">{item.question}</span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-brand-blue dark:text-brand-yellow transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <p
                    className="px-5 pb-4 leading-relaxed text-muted-foreground dark:text-white/70"
                    style={{ animation: 'slide-up-fade 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
                >
                    {item.answer}
                </p>
            )}
        </div>
    );
}

function FaqSection({ event, t }) {
    if (!event.faqs?.length) return null;
    return (
        <section className="py-16 sm:py-20 bg-brand-bg-alt dark:bg-primary-dark/40">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionTitle className="mb-10">{t('events.faq_label')}</SectionTitle>
                </Reveal>
                <div className="space-y-3">
                    {event.faqs.map((item, i) => (
                        <Reveal key={i} delay={i * 70}>
                            <FaqItem item={item} />
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FinalCta({ event, t }) {
    if (!event.cta?.heading && !event.cta?.subheading) return null;
    return (
        <section className="mm-spotlight relative overflow-hidden bg-brand-gradient py-16 sm:py-20 [--mm-spot-color:rgb(255_255_255/0.08)] [--mm-spot-size:520px]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="mm-drift absolute -top-24 left-1/4 h-64 w-64 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-light) 60%, transparent) 0%, transparent 70%)' }}
                />
                <div
                    className="mm-drift absolute -bottom-24 right-1/4 h-56 w-56 rounded-full blur-3xl"
                    style={{ animationDelay: '-9s', background: 'radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 30%, transparent) 0%, transparent 70%)' }}
                />
            </div>
            <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                {event.cta.heading && (
                    <h2 className="text-2xl font-black text-white sm:text-3xl">{event.cta.heading}</h2>
                )}
                {event.cta.subheading && (
                    <p className="mx-auto mt-3 max-w-xl text-white/80">{event.cta.subheading}</p>
                )}
                <a
                    href="#register"
                    onClick={scrollToRegister}
                    className="mm-beam mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-brand-blue transition-all duration-300 hover:scale-105 hover:shadow-[0_0_44px_color-mix(in_srgb,var(--color-brand-gold)_55%,transparent)] [--mm-beam-width:2px]"
                >
                    {event.titles?.cta_button || t('events.register_cta')}
                </a>
            </Reveal>
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

    const seats = event ? seatsStatus(event, t) : null;
    const isFull = Boolean(seats?.full);

    const site = useSiteIdentity();
    usePointerGlow();

    useDocumentMeta({
        title: event ? `${event.title} | ${site.name}` : undefined,
        description: event?.description
            ? event.description.replace(/\s+/g, ' ').trim().slice(0, 160)
            : undefined,
    });

    return (
        <>
            <div aria-hidden="true" className="mm-scroll-progress" />
            <Navbar />
            <main className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-300">
                {loading ? (
                    <div className="flex min-h-screen items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
                    </div>
                ) : notFound || !event ? (
                    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                        <CalendarX size={48} className="mb-4 text-muted-foreground opacity-40" />
                        <p className="mb-6 text-lg font-bold text-brand-dark dark:text-white">{t('events.not_found')}</p>
                        <button
                            onClick={backToEvents}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
                        >
                            <ChevronLeft size={16} className="rtl:rotate-180" />
                            {t('events.back_to_events')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 01 — Hero: event details + register CTA */}
                        <section className="mm-spotlight relative overflow-hidden bg-brand-gradient pb-16 pt-28 sm:pt-32 [--mm-spot-color:rgb(255_255_255/0.08)] [--mm-spot-size:600px]">
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div
                                    className="absolute -top-32 -right-32 w-125 h-125 rounded-full mm-float mm-glow-blue"
                                    style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-light) 50%, transparent) 0%, color-mix(in srgb, var(--color-brand-blue) 18%, transparent) 45%, transparent 70%)' }}
                                />
                                <div
                                    className="absolute -bottom-32 -left-32 w-100 h-100 rounded-full mm-float-rev mm-glow-gold"
                                    style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 22%, transparent) 0%, transparent 70%)' }}
                                />
                                {/* Spinning rings + faint grid, as on the home hero */}
                                <div className="mm-spin-cw absolute top-16 right-10 hidden h-64 w-64 rounded-full border border-white/10 sm:block" />
                                <div className="mm-spin-ccw absolute top-24 right-18 hidden h-44 w-44 rounded-full border border-brand-gold/18 sm:block" />
                                <div
                                    className="absolute inset-0 opacity-[0.04]"
                                    style={{
                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
                                        backgroundSize: '60px 60px',
                                    }}
                                />
                            </div>

                            <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                <button
                                    onClick={backToEvents}
                                    className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
                                    style={{ animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0s' }}
                                >
                                    <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
                                    {t('events.back_to_events')}
                                </button>

                                <div className="mb-4 flex flex-wrap items-center gap-2" style={{ animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.1s' }}>
                                    <span
                                        className={`mm-chip inline-block w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                            event.type === 'training' ? 'bg-brand-yellow/20 text-brand-yellow' : 'bg-white/15 text-white'
                                        }`}
                                    >
                                        {event.type === 'training' ? t('events.badge_training') : t('events.badge_event')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                                        <Globe size={11} />
                                        {event.mode === 'online' ? t('events.mode_online') : t('events.mode_offline')}
                                    </span>
                                </div>

                                <h1
                                    className="mb-6 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl"
                                    style={{
                                        animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both',
                                        animationDelay: '0.22s',
                                        // drop-shadow (not text-shadow) so the glow sits behind the shimmering text fill
                                        filter: 'drop-shadow(0 2px 24px color-mix(in srgb, var(--color-brand-blue) 55%, transparent))',
                                    }}
                                >
                                    <span className="mm-text-shine">{event.title}</span>
                                </h1>

                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/85" style={{ animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.36s' }}>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="shrink-0 text-brand-yellow" />
                                        {formatDate(event.starts_at, locale)}
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="shrink-0 text-brand-yellow" />
                                            {event.location}
                                        </div>
                                    )}
                                    {seats && (
                                        <div
                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${
                                                seats.full
                                                    ? 'border-red-400/40 bg-red-500/15 text-red-200'
                                                    : seats.low
                                                      ? 'border-brand-yellow/40 bg-brand-yellow/15 text-brand-yellow'
                                                      : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                                            }`}
                                        >
                                            <span
                                                className={`h-2 w-2 shrink-0 rounded-full ${
                                                    seats.full ? 'bg-red-400' : seats.low ? 'bg-brand-yellow animate-pulse' : 'bg-emerald-400'
                                                }`}
                                            />
                                            <Users size={15} className="shrink-0" />
                                            {seats.text}
                                        </div>
                                    )}
                                </div>

                                {!isFull && (
                                    <div style={{ animation: 'slide-up-fade 0.75s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.5s' }}>
                                        <a
                                            href="#register"
                                            onClick={scrollToRegister}
                                            className="btn-gold-shimmer mm-beam mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-brand-dark transition-all duration-300 hover:scale-105 hover:shadow-[0_0_44px_color-mix(in_srgb,var(--color-brand-gold)_65%,transparent)] [--mm-beam-width:2px]"
                                        >
                                            {t('events.register_cta')}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 02 — About the Event: purpose + target audience */}
                        {(event.image_url || event.description || event.target_audience) && (
                            <section className="py-16 sm:py-20 bg-white dark:bg-brand-dark">
                                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                    <div className={event.image_url ? 'grid gap-12 lg:grid-cols-2' : 'mx-auto max-w-2xl'}>
                                        {event.image_url && (
                                            <Reveal>
                                                <div className="group mm-beam aspect-video w-full overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] [--mm-beam-speed:7s] [--mm-beam-width:2px]">
                                                    <img
                                                        src={event.image_url}
                                                        alt={event.title}
                                                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                                                        loading="eager"
                                                    />
                                                </div>
                                            </Reveal>
                                        )}
                                        <Reveal delay={120}>
                                            {event.description && (
                                                <>
                                                    <h2 className="mb-4 text-xl font-black text-brand-dark dark:text-white">
                                                        {t('events.about_label')}
                                                    </h2>
                                                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground dark:text-white/70">
                                                        {event.description}
                                                    </p>
                                                </>
                                            )}
                                            {event.target_audience && (
                                                <div className="mm-beam-hover mm-spotlight mt-6 flex gap-3 rounded-2xl bg-brand-bg dark:bg-primary-dark p-5 border border-border dark:border-primary-light/40 [--mm-beam-inset:-1px]">
                                                    <Users size={20} className="mt-0.5 shrink-0 text-brand-blue dark:text-brand-yellow" />
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-brand-blue dark:text-brand-yellow">
                                                            {t('events.target_audience_label')}
                                                        </p>
                                                        <p className="mt-1 text-sm leading-relaxed text-brand-dark dark:text-white/80">
                                                            {event.target_audience}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </Reveal>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 03 — Learning Outcomes / Agenda */}
                        <AgendaSection event={event} t={t} />

                        {/* 04 — Trainer / Speaker */}
                        <TrainerSection event={event} t={t} />

                        {/* 05 — Registration: form + price + payment */}
                        <section
                            id="register"
                            className="scroll-mt-16 bg-brand-bg-alt py-6 sm:py-10 lg:flex lg:min-h-[calc(100svh-5rem)] lg:scroll-mt-20 lg:items-center dark:bg-primary-dark/40"
                        >
                            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
                                <Reveal>
                                    <RegistrationPanel event={event} isFull={isFull} />
                                </Reveal>
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
