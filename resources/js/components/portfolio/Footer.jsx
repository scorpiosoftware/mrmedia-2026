import { useContent } from '@/hooks/use-content';
import { Instagram, Linkedin, Twitter } from 'lucide-react';

const NAV_KEYS = ['home', 'services', 'portfolio', 'about', 'contact'];
const SECTION_IDS = { home: 'hero', services: 'services', portfolio: 'portfolio', about: 'about', contact: 'contact' };

export default function Footer() {
    const t = useContent();

    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <footer className="bg-[#0D1B4B] dark:bg-[#080F28] text-white transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <p className="text-2xl font-black mb-3">
                            Mr.<span className="text-[#DDB50E]">MEDIA</span>
                        </p>
                        <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                            {t('footer.tagline')}
                        </p>
                        <div className="mt-6 flex gap-3">
                            {[
                                { Icon: Instagram, href: t('footer.social.instagram'), label: 'Instagram' },
                                { Icon: Twitter, href: t('footer.social.twitter'), label: 'Twitter' },
                                { Icon: Linkedin, href: t('footer.social.linkedin'), label: 'LinkedIn' },
                            ].map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-[#DDB50E] hover:text-[#0D1B4B] transition-colors"
                                >
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#DDB50E] mb-4">
                            {t('nav.home')}
                        </p>
                        <ul className="space-y-3">
                            {NAV_KEYS.map((key) => (
                                <li key={key}>
                                    <button
                                        onClick={() => scrollTo(SECTION_IDS[key])}
                                        className="text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        {t(`nav.${key}`)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#DDB50E] mb-4">
                            {t('contact.section_badge')}
                        </p>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li>{t('contact.email')}</li>
                            <li>{t('contact.phone')}</li>
                            <li>{t('contact.address')}</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/40">
                    {t('footer.copyright')}
                </div>
            </div>
        </footer>
    );
}
