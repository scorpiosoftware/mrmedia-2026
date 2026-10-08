import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { AlertCircle, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export default function Contact() {
    const t = useContent();
    const [form, setForm] = useState({
        name: '',
        email: '',
        service: '',
        message: '',
        website: '', // honeypot — hidden from real users, only bots fill it in
    });
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error
    const [errorMsg, setErrorMsg] = useState('');
    const [ref, isVisible] = useScrollAnimation(0.1);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        setErrorMsg('');
        try {
            const res = await fetch('/spa/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify(form),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setStatus('sent');
                setForm({
                    name: '',
                    email: '',
                    service: '',
                    message: '',
                    website: '',
                });
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
                <div ref={ref} className="grid gap-16 lg:grid-cols-2">
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
                        <span className="mb-3 inline-block rounded-full bg-[#E8EAF6] px-4 py-1.5 text-xs font-bold tracking-widest text-[#213C93] uppercase dark:bg-primary-dark dark:text-brand-yellow">
                            {t('contact.section_badge')}
                        </span>
                        <h2 className="mb-4 text-3xl font-black text-[#0D1B4B] sm:text-4xl lg:text-5xl dark:text-white">
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
                                    value: t('contact.email'),
                                },
                                {
                                    id: 'phone',
                                    Icon: Phone,
                                    value: t('contact.phone'),
                                },
                                {
                                    id: 'address',
                                    Icon: MapPin,
                                    value: t('contact.address'),
                                },
                            ].map(({ id, Icon, value }, i) => (
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
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#213C93] text-white transition-all duration-300 hover:bg-[#DDB50E] hover:text-[#0D1B4B] hover:shadow-[0_0_20px_rgba(221,181,14,0.45)]">
                                        <Icon size={18} />
                                    </div>
                                    <p className="font-medium text-[#0D1B4B] dark:text-white/80">
                                        {value}
                                    </p>
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
                        <div className="rounded-3xl border border-[#D1D5E8] bg-[#F1F1F0] p-8 shadow-[0_4px_32px_rgba(33,60,147,0.08)] dark:border-primary-light/40 dark:bg-primary-dark">
                            {status === 'sent' ? (
                                <div className="flex h-full items-center justify-center py-16 text-center">
                                    <div>
                                        <div
                                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#213C93] shadow-[0_0_32px_rgba(33,60,147,0.45)]"
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
                                        <p className="text-lg font-bold text-[#0D1B4B] dark:text-white">
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
                                    {[
                                        {
                                            name: 'name',
                                            label: t('contact.form.name'),
                                            type: 'text',
                                        },
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
                                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase dark:text-brand-yellow">
                                                {label}
                                            </label>
                                            <input
                                                type={type}
                                                name={name}
                                                value={form[name]}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl border border-[#D1D5E8] bg-white px-4 py-3 text-sm text-[#0D1B4B] transition-all duration-200 placeholder:text-muted-foreground hover:border-[#213C93]/40 focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none dark:border-primary-light/50 dark:bg-brand-dark dark:text-white dark:placeholder:text-white/30 dark:hover:border-primary-light dark:focus:border-brand-yellow dark:focus:ring-brand-yellow/20"
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase dark:text-brand-yellow">
                                            {t('contact.form.message')}
                                        </label>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            rows={4}
                                            required
                                            className="w-full resize-none rounded-xl border border-[#D1D5E8] bg-white px-4 py-3 text-sm text-[#0D1B4B] transition-all duration-200 placeholder:text-muted-foreground hover:border-[#213C93]/40 focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none dark:border-primary-light/50 dark:bg-brand-dark dark:text-white dark:placeholder:text-white/30 dark:hover:border-primary-light dark:focus:border-brand-yellow dark:focus:ring-brand-yellow/20"
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
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#213C93] py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[#2E52C9] hover:shadow-[0_8px_32px_rgba(33,60,147,0.35)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
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
