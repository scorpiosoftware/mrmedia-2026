import { useBrandLogos, useLocale } from '@/hooks/use-content';
import { Asterisk, Diamond, Sparkle, Star } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const FONT_SIZES = {
    sm: { text: 'text-lg sm:text-xl', icon: 16, pad: 'py-3', gap: 'gap-6' },
    md: { text: 'text-2xl sm:text-3xl', icon: 22, pad: 'py-4', gap: 'gap-8' },
    lg: { text: 'text-3xl sm:text-5xl', icon: 30, pad: 'py-5', gap: 'gap-10' },
};

// Repeat the phrases until one copy is long enough to overflow wide screens.
const MIN_ITEMS_PER_COPY = 10;

function Separator({ type, size, color }) {
    const logos = useBrandLogos();
    const props = { size, color, className: 'shrink-0', 'aria-hidden': true };
    switch (type) {
        case 'star':
            return <Star {...props} fill={color} />;
        case 'diamond':
            return <Diamond {...props} fill={color} />;
        case 'asterisk':
            return <Asterisk {...props} strokeWidth={3} />;
        case 'dot':
            return (
                <span
                    aria-hidden="true"
                    className="shrink-0 rounded-full"
                    style={{
                        width: size / 2.5,
                        height: size / 2.5,
                        backgroundColor: color,
                    }}
                />
            );
        case 'logo':
            return (
                <img
                    src={logos.onDark}
                    alt=""
                    aria-hidden="true"
                    className="shrink-0 object-contain"
                    style={{ height: size * 1.2 }}
                />
            );
        case 'none':
            return null;
        default:
            return <Sparkle {...props} fill={color} />;
    }
}

function Phrase({ phrase, banner }) {
    const style =
        phrase.style === 'highlight'
            ? { color: banner.highlight_color }
            : phrase.style === 'outline'
              ? {
                    color: 'transparent',
                    WebkitTextStroke: `1.5px ${banner.text_color}`,
                }
              : { color: banner.text_color };
    return (
        <span
            dir="auto"
            className="font-black tracking-tight whitespace-nowrap uppercase"
            style={style}
        >
            {phrase.text}
        </span>
    );
}

function MarqueeRow({ banner, reverse = false, swapColors = false }) {
    const size = FONT_SIZES[banner.font_size] ?? FONT_SIZES.md;
    const copyRef = useRef(null);
    const [copyWidth, setCopyWidth] = useState(0);

    // Second row of a double banner uses swapped colours for contrast.
    const colors = swapColors
        ? {
              ...banner,
              background_color: banner.highlight_color,
              text_color: banner.background_color,
              highlight_color: banner.text_color,
          }
        : banner;

    const items = [];
    while (items.length < MIN_ITEMS_PER_COPY) items.push(...banner.phrases);

    // Duration follows the measured width, so `speed` stays in px/s whatever the phrase lengths.
    useLayoutEffect(() => {
        const el = copyRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => setCopyWidth(el.offsetWidth));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const duration = copyWidth ? copyWidth / Math.max(banner.speed, 1) : 0;
    const goesRight = (banner.direction === 'right') !== reverse;

    const copy = (hidden) => (
        <div
            ref={hidden ? undefined : copyRef}
            aria-hidden={hidden || undefined}
            className={`flex shrink-0 items-center ${size.gap} pe-8 ${size.text}`}
        >
            {items.map((phrase, i) => (
                <span key={i} className={`flex items-center ${size.gap}`}>
                    <Phrase phrase={phrase} banner={colors} />
                    <Separator
                        type={banner.separator}
                        size={size.icon}
                        color={colors.highlight_color}
                    />
                </span>
            ))}
        </div>
    );

    return (
        <div
            className={`group/marquee overflow-hidden ${size.pad}`}
            style={{ backgroundColor: colors.background_color }}
        >
            {/* Forced LTR so the -50% shift loops correctly on the Arabic site too */}
            <div
                dir="ltr"
                className={`flex w-max motion-reduce:animate-none! ${
                    banner.pause_on_hover
                        ? 'group-hover/marquee:[animation-play-state:paused]'
                        : ''
                }`}
                style={
                    duration
                        ? {
                              animation: `mm-marquee ${duration}s linear infinite`,
                              animationDirection: goesRight
                                  ? 'reverse'
                                  : 'normal',
                          }
                        : undefined
                }
            >
                {copy(false)}
                {copy(true)}
            </div>
        </div>
    );
}

/** Presentational banner — used by the home page and the admin live preview. */
export function MarqueeStrip({ banner }) {
    if (!banner?.phrases?.length) return null;

    const rows = banner.double_row ? 2 : 1;
    const tilt = (i) => {
        if (!banner.tilted) return undefined;
        const angle = banner.double_row ? (i === 0 ? -2.5 : 2.5) : -2;
        return { transform: `rotate(${angle}deg)` };
    };

    return (
        <div className={banner.tilted ? 'relative py-10' : 'relative'}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    // Tilted rows are widened so their ends never show inside the viewport.
                    className={`${banner.tilted ? '-mx-[5%] w-[110%] shadow-[0_10px_40px_color-mix(in_srgb,var(--color-brand-dark)_25%,transparent)]' : ''} ${
                        banner.double_row && banner.tilted && i === 1
                            ? '-mt-14 sm:-mt-16'
                            : ''
                    } ${i === 0 ? 'relative z-10' : ''}`}
                    style={tilt(i)}
                >
                    <MarqueeRow
                        banner={banner}
                        reverse={i === 1}
                        swapColors={i === 1}
                    />
                </div>
            ))}
        </div>
    );
}

/** Home page section: fetches the banner (null when hidden in the dashboard). */
export default function MarqueeBanner() {
    const locale = useLocale();
    const [banner, setBanner] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/marquee?locale=${locale}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => !cancelled && setBanner(data))
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [locale]);

    // Hidden banners come back as an empty payload.
    if (!banner?.phrases?.length) return null;

    return (
        <section
            aria-label="Highlights"
            className="overflow-hidden bg-brand-bg transition-colors duration-300 dark:bg-brand-dark"
        >
            <MarqueeStrip banner={banner} />
        </section>
    );
}
