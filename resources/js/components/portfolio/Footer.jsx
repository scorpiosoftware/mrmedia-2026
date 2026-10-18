import { useContent, useContentList, useSiteIdentity } from '@/hooks/use-content';
import { usePublicList } from '@/hooks/use-public-list';
import { useSectionVisibility } from '@/hooks/use-section-visibility';
import { getSocialIcon, getSocialLabel } from '@/lib/social-platforms';

const NAV_KEYS = ['home', 'services', 'portfolio', 'about', 'contact'];
const SECTION_IDS = { home: 'hero', services: 'services', portfolio: 'portfolio', about: 'about', contact: 'contact' };

export default function Footer() {
    const t = useContent();
    const site = useSiteIdentity();
    const contactDetails = [
        ...useContentList('contact.email'),
        ...useContentList('contact.phone'),
        ...useContentList('contact.address'),
    ];
    const { items: socialLinks } = usePublicList('/api/social-links');
    const isShown = useSectionVisibility();
    const navKeys = NAV_KEYS.filter((key) => key === 'home' || isShown(SECTION_IDS[key]));

    const scrollTo = (id) =>
        id === 'hero'
            ? window.scrollTo({ top: 0, behavior: 'smooth' })
            : document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <footer className="bg-brand-dark dark:bg-[color-mix(in_srgb,var(--color-brand-dark)_60%,black)] text-white transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <p dir="auto" className="text-2xl font-black mb-3 whitespace-pre">
                            {site.nameParts[0]}
                            {site.nameParts[1] && <span className="text-brand-gold">{site.nameParts[1]}</span>}
                        </p>
                        <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                            {t('footer.tagline')}
                        </p>
                        {socialLinks.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                {socialLinks.map((link) => {
                                    const Icon = getSocialIcon(link.platform);
                                    const label = link.label || getSocialLabel(link.platform);
                                    return (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={label}
                                            title={label}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-brand-gold hover:text-brand-dark transition-colors"
                                        >
                                            <Icon size={16} />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
                            {t('nav.home')}
                        </p>
                        <ul className="space-y-3">
                            {navKeys.map((key) => (
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
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
                            {t('contact.section_badge')}
                        </p>
                        <ul className="space-y-3 text-sm text-white/60">
                            {contactDetails.map((value, i) => (
                                <li key={i}>{value}</li>
                            ))}
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
