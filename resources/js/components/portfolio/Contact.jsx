import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useContent } from '@/hooks/use-content';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
    const t = useContent();
    const [form, setForm] = useState({ name: '', email: '', service: '', message: '' });
    const [sent, setSent] = useState(false);
    const [ref, isVisible] = useScrollAnimation(0.1);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 4000);
        setForm({ name: '', email: '', service: '', message: '' });
    };

    return (
        <section id="contact" className="py-24 bg-white dark:bg-brand-dark overflow-hidden transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div ref={ref} className="grid gap-16 lg:grid-cols-2">

                    {/* Info column */}
                    <div
                        className="transition-all duration-700"
                        style={{
                            opacity:   isVisible ? 1 : 0,
                            transform: isVisible ? 'translateX(0)' : 'translateX(-36px)',
                            transitionDelay: '0ms',
                        }}
                    >
                        <span className="inline-block mb-3 rounded-full bg-[#E8EAF6] dark:bg-primary-dark px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#213C93] dark:text-brand-yellow">
                            {t('contact.section_badge')}
                        </span>
                        <h2 className="mb-4 text-3xl font-black text-[#0D1B4B] dark:text-white sm:text-4xl lg:text-5xl">
                            {t('contact.title')}
                        </h2>
                        <p className="mb-10 text-muted-foreground leading-relaxed">{t('contact.subtitle')}</p>

                        <div className="space-y-5">
                            {[
                                { Icon: Mail,   value: t('contact.email') },
                                { Icon: Phone,  value: t('contact.phone') },
                                { Icon: MapPin, value: t('contact.address') },
                            ].map(({ Icon, value }, i) => (
                                <div
                                    key={value}
                                    className="flex items-center gap-4 transition-all duration-500"
                                    style={{
                                        opacity:   isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateX(0)' : 'translateX(-24px)',
                                        transitionDelay: `${150 + i * 100}ms`,
                                    }}
                                >
                                    <div className="shrink-0 h-11 w-11 rounded-xl bg-[#213C93] flex items-center justify-center text-white transition-all duration-300 hover:bg-[#DDB50E] hover:text-[#0D1B4B] hover:shadow-[0_0_20px_rgba(221,181,14,0.45)]">
                                        <Icon size={18} />
                                    </div>
                                    <p className="text-[#0D1B4B] dark:text-white/80 font-medium">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <div
                        className="transition-all duration-700"
                        style={{
                            opacity:   isVisible ? 1 : 0,
                            transform: isVisible ? 'translateX(0)' : 'translateX(36px)',
                            transitionDelay: '100ms',
                        }}
                    >
                        <div className="rounded-3xl bg-[#F1F1F0] dark:bg-primary-dark p-8 shadow-[0_4px_32px_rgba(33,60,147,0.08)] border border-[#D1D5E8] dark:border-primary-light/40">
                            {sent ? (
                                <div className="flex h-full items-center justify-center text-center py-16">
                                    <div>
                                        <div
                                            className="h-16 w-16 rounded-full bg-[#213C93] flex items-center justify-center mx-auto mb-4 shadow-[0_0_32px_rgba(33,60,147,0.45)]"
                                            style={{ animation: 'scale-in-fade 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
                                        >
                                            <Send size={24} className="text-white" />
                                        </div>
                                        <p className="text-lg font-bold text-[#0D1B4B] dark:text-white">Message sent!</p>
                                        <p className="text-muted-foreground dark:text-white/60 mt-1">We'll get back to you shortly.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {[
                                        { name: 'name',    label: t('contact.form.name'),    type: 'text'  },
                                        { name: 'email',   label: t('contact.form.email'),   type: 'email' },
                                        { name: 'service', label: t('contact.form.service'), type: 'text'  },
                                    ].map(({ name, label, type }) => (
                                        <div key={name}>
                                            <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                                {label}
                                            </label>
                                            <input
                                                type={type}
                                                name={name}
                                                value={form[name]}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-3 text-sm text-[#0D1B4B] dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/30 focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20 transition-all duration-200 hover:border-[#213C93]/40 dark:hover:border-primary-light"
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#213C93] dark:text-brand-yellow mb-2 uppercase tracking-wider">
                                            {t('contact.form.message')}
                                        </label>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            rows={4}
                                            required
                                            className="w-full rounded-xl border border-[#D1D5E8] dark:border-primary-light/50 bg-white dark:bg-brand-dark px-4 py-3 text-sm text-[#0D1B4B] dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/30 focus:border-[#213C93] dark:focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 dark:focus:ring-brand-yellow/20 transition-all duration-200 resize-none hover:border-[#213C93]/40 dark:hover:border-primary-light"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#213C93] py-3.5 text-sm font-bold text-white hover:bg-[#2E52C9] hover:shadow-[0_8px_32px_rgba(33,60,147,0.35)] hover:scale-[1.02] transition-all duration-300"
                                    >
                                        {t('contact.form.submit')}
                                        <Send size={16} />
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
