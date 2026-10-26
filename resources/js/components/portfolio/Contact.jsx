import PhoneInput from '@/components/portfolio/PhoneInput';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent, useContentList } from '@/hooks/use-content';
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries';
import { AlertCircle, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';

const FIELD_CLASS =
    'rounded-xl border border-border bg-white px-4 py-3 text-sm text-brand-dark transition-all duration-200 placeholder:text-muted-foreground hover:border-brand-blue/40 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none dark:border-transparent dark:bg-brand-dark dark:text-white dark:placeholder:text-white/30 dark:hover:border-primary-light/60 dark:focus:border-brand-yellow dark:focus:ring-brand-yellow/20';

const LABEL_CLASS =
    'mb-2 block text-xs font-semibold tracking-wider text-brand-blue uppercase dark:text-brand-yellow';

const EMPTY_FORM = {
    name: '',
    email: '',
    phoneCountry: DEFAULT_COUNTRY,
    phoneNumber: '',
    service: '',
    message: '',
    website: '', // honeypot — hidden from real users, only bots fill it in
};

function RequiredMark() {
    return <span className="ms-0.5 text-red-500">*</span>;
}

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export default function Contact() {
    const t = useContent();
    const emails = useContentList('contact.email');
    const phones = useContentList('contact.phone');
    const addresses = useContentList('contact.address');
    const [form, setForm] = useState(EMPTY_FORM);
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error
    const [errorMsg, setErrorMsg] = useState('');
    const [ref, isVisible] = useScrollAnimation(0.1);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        setErrorMsg('');
        const { phoneCountry, phoneNumber, ...rest } = form;
        const dial = COUNTRIES.find((c) => c.iso === phoneCountry)?.dial ?? '';
        const payload = {
            ...rest,
            phone: `+${dial} ${phoneNumber.trim()}`,
        };
        try {
            const res = await fetch('/spa/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setStatus('sent');
                setForm(EMPTY_FORM);
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setErrorMsg(
                    json?.message || 'Something went wrong. Please try again.',
                );
                setStatus('error');
            }
        } catch {
            setErrorMsg('Network error. Please check your connection.');
            setStatus('error');
        }
    };

    return (
        <section
            id="contact"
            className="overflow-hidden bg-white py-24 transition-colors duration-300 dark:bg-brand-dark"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* grid-cols-1 = minmax(0, 1fr): a long email can't widen the column past the screen */}
                <div ref={ref} className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                    {/* Info column */}
                    <div
                        className="transition-all duration-700"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible
                                ? 'translateX(0)'
                                : 'translateX(-36px)',
                            transitionDelay: '0ms',
                        }}
                    >
                        <span className="mm-chip mb-3 inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-bold tracking-widest text-brand-blue uppercase dark:bg-primary-dark dark:text-brand-yellow">
                            {t('contact.section_badge')}
                        </span>
                        <h2 className="mb-4 text-3xl font-black text-brand-dark sm:text-4xl lg:text-5xl dark:text-white">
                            {t('contact.title')}
                        </h2>
                        <p className="mb-10 leading-relaxed text-muted-foreground">
                            {t('contact.subtitle')}
                        </p>

                        <div className="space-y-5">
                            {[
                                {
                                    id: 'email',
                                    Icon: Mail,
                                    values: emails,
                                },
                                {
                                    id: 'phone',
                                    Icon: Phone,
                                    values: phones,
                                },
                                {
                                    id: 'address',
                                    Icon: MapPin,
                                    values: addresses,
                                },
                            ]
                                .filter(({ values }) => values.length)
                                .map(({ id, Icon, values }, i) => (
                                    <div
                                        key={id}
                                        className="flex items-center gap-4 transition-all duration-500"
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible
                                                ? 'translateX(0)'
                                                : 'translateX(-24px)',
                                            transitionDelay: `${150 + i * 100}ms`,
                                        }}
                                    >
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white transition-all duration-300 hover:bg-brand-gold hover:text-brand-dark hover:shadow-[0_0_20px_color-mix(in_srgb,var(--color-brand-gold)_45%,transparent)]">
                                            <Icon size={18} />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            {values.map((value, j) => (
                                                <p
                                                    key={j}
                                                    className="font-medium wrap-anywhere text-brand-dark dark:text-white/80"
                                                >
                                                    {value}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Form */}
                    <div
                        className="transition-all duration-700"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible
                                ? 'translateX(0)'
                                : 'translateX(36px)',
                            transitionDelay: '100ms',
                        }}
                    >
                        <div className="mm-beam rounded-3xl border border-border bg-brand-bg p-5 pt-36 shadow-[0_4px_32px_color-mix(in_srgb,var(--color-brand-blue)_8%,transparent)] [--mm-beam-inset:-1px] [--mm-beam-speed:8s] sm:p-8 sm:pt-44 dark:border-primary-light/40 dark:bg-primary-dark dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
                            {/* Envelope flap */}
                            {/* clip-path, not overflow-hidden: iOS Safari lets the drop-shadow filtered SVG escape a radius clip */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden [clip-path:inset(0_round_23px_23px_0_0)] sm:h-48">
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 400 140"
                                    preserveAspectRatio="none"
                                    className="absolute inset-x-0 top-0 h-28 w-full text-brand-bg drop-shadow-[0_10px_14px_rgba(13,27,75,0.35)] sm:h-36 dark:text-primary-dark"
                                >
                                    <path
                                        d="M0 0 L170 122 Q200 142 230 122 L400 0 Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M0 0 L170 122 Q200 142 230 122 L400 0"
                                        fill="none"
                                        stroke="var(--color-brand-gold)"
                                        strokeWidth="1"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>
                                <h3 className="relative pt-10 text-center text-xl font-black tracking-wide text-brand-blue uppercase sm:pt-14 sm:text-2xl dark:text-brand-yellow">
                                    {t('contact.form.heading', 'Contact Us')}
                                </h3>
                            </div>
                            {status === 'sent' ? (
                                <div className="flex h-full items-center justify-center py-16 text-center">
                                    <div>
                                        <div
                                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue shadow-[0_0_32px_color-mix(in_srgb,var(--color-brand-blue)_45%,transparent)]"
                                            style={{
                                                animation:
                                                    'scale-in-fade 0.5s cubic-bezier(0.16,1,0.3,1) both',
                                            }}
                                        >
                                            <Send
                                                size={24}
                                                className="text-white"
                                            />
                                        </div>
                                        <p className="text-lg font-bold text-brand-dark dark:text-white">
                                            Message sent!
                                        </p>
                                        <p className="mt-1 text-muted-foreground dark:text-white/60">
                                            We'll get back to you shortly.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                >
                                    {status === 'error' && (
                                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-400">
                                            <AlertCircle
                                                size={16}
                                                className="mt-0.5 shrink-0"
                                            />
                                            {errorMsg}
                                        </div>
                                    )}
                                    <div>
                                        <label className={LABEL_CLASS}>
                                            {t('contact.form.name')}
                                            <RequiredMark />
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            autoComplete="name"
                                            className={`w-full ${FIELD_CLASS}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>
                                            {t(
                                                'contact.form.phone',
                                                'Phone Number',
                                            )}
                                            <RequiredMark />
                                        </label>
                                        <PhoneInput
                                            country={form.phoneCountry}
                                            number={form.phoneNumber}
                                            onCountryChange={(iso) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    phoneCountry: iso,
                                                }))
                                            }
                                            onNumberChange={(value) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    phoneNumber: value,
                                                }))
                                            }
                                            required
                                            inputClassName={FIELD_CLASS}
                                        />
                                    </div>
                                    {[
                                        {
                                            name: 'email',
                                            label: t('contact.form.email'),
                                            type: 'email',
                                        },
                                        {
                                            name: 'service',
                                            label: t('contact.form.service'),
                                            type: 'text',
                                        },
                                    ].map(({ name, label, type }) => (
                                        <div key={name}>
                                            <label className={LABEL_CLASS}>
                                                {label}
                                            </label>
                                            <input
                                                type={type}
                                                name={name}
                                                value={form[name]}
                                                onChange={handleChange}
                                                className={`w-full ${FIELD_CLASS}`}
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className={LABEL_CLASS}>
                                            {t('contact.form.message')}
                                        </label>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            rows={4}
                                            className={`w-full resize-none ${FIELD_CLASS}`}
                                        />
                                    </div>
                                    <div
                                        aria-hidden="true"
                                        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
                                    >
                                        <label htmlFor="contact-website">
                                            Leave this field empty
                                        </label>
                                        <input
                                            id="contact-website"
                                            type="text"
                                            name="website"
                                            value={form.website}
                                            onChange={handleChange}
                                            tabIndex={-1}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'sending'}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-primary-light hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-blue)_35%,transparent)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                                    >
                                        {status === 'sending' ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Sending…
                                            </>
                                        ) : (
                                            <>
                                                {t('contact.form.submit')}
                                                <Send size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
