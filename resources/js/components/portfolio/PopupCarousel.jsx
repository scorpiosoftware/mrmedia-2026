import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ResponsiveImage from '@/components/ResponsiveImage';
import { useLocale } from '@/hooks/use-content';

const LABELS = {
    en: { close: 'Close', prev: 'Previous slide', next: 'Next slide', slide: 'Slide' },
    ar: { close: 'إغلاق', prev: 'الشريحة السابقة', next: 'الشريحة التالية', slide: 'شريحة' },
};

const SWIPE_THRESHOLD = 40; // px a finger must travel to change slide
const CLOSE_MS = 260; // matches .is-closing animations in app.css

function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const ARROW_CLASS =
    'absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none sm:h-10 sm:w-10';

/**
 * The popup itself: a "featured announcement" modal with a story-style image carousel —
 * spring entrance with a one-time gold light sweep, story progress bars, cross-fading slides
 * with a slow film zoom. Presentational: the home page decides when to open it (HomePopup
 * below); the admin page renders it for its live preview.
 */
export function PopupCarousel({ popup, onClose }) {
    const locale = useLocale();
    const labels = LABELS[locale] ?? LABELS.en;
    const slides = popup.slides;
    const count = slides.length;
    const [reduced] = useState(prefersReducedMotion);
    const autoplay = popup.autoplay && count > 1 && !reduced;
    const intervalSeconds = popup.interval_seconds ?? 5;

    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [closing, setClosing] = useState(false);
    const closeRef = useRef(null);
    const touchStartX = useRef(null);

    const go = useCallback(
        (delta) => setIndex((i) => (i + delta + count) % count),
        [count],
    );

    // The slide fading out keeps its zoom until the 700ms cross-fade ends — dropping it at once
    // would make the outgoing image visibly jump back to its normal size.
    const [leaving, setLeaving] = useState(null);
    const previousIndex = useRef(index);
    useEffect(() => {
        if (previousIndex.current === index) return;
        setLeaving(previousIndex.current);
        previousIndex.current = index;
        const timer = setTimeout(() => setLeaving(null), 700);
        return () => clearTimeout(timer);
    }, [index]);

    // Play the exit animation, then unmount.
    const requestClose = useCallback(() => {
        if (closing) return;
        if (reduced) return onClose();
        setClosing(true);
        setTimeout(onClose, CLOSE_MS);
    }, [closing, reduced, onClose]);

    // Focus the close button on open, restore focus on close; lock page scroll meanwhile.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        closeRef.current?.focus({ preventScroll: true });
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = overflow;
            previouslyFocused?.focus?.({ preventScroll: true });
        };
    }, []);

    // Keyboard: Esc closes, arrows change slide.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') requestClose();
            else if (count > 1 && e.key === 'ArrowRight') go(1);
            else if (count > 1 && e.key === 'ArrowLeft') go(-1);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [count, go, requestClose]);

    const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        setPaused(true);
    };
    const onTouchEnd = (e) => {
        setPaused(false);
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    };

    // Autoplay is driven by the current progress bar's animation (see onAnimationEnd below),
    // so pausing the bar — hover or touch — pauses the countdown exactly where it is.
    const playState = paused ? 'paused' : 'running';

    return (
        <div
            className={`mm-popup-backdrop fixed inset-0 z-70 flex items-center justify-center bg-brand-dark/80 p-4 sm:backdrop-blur-sm ${closing ? 'is-closing' : ''}`}
            onClick={requestClose}
        >
            {/* Soft brand glow behind the card (static — no looping animation) */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 h-[min(90vw,640px)] w-[min(90vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
                style={{
                    background:
                        'radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 30%, transparent) 0%, color-mix(in srgb, var(--color-primary-light) 22%, transparent) 40%, transparent 70%)',
                }}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-roledescription="carousel"
                aria-label={slides[index]?.alt || undefined}
                className={`mm-popup-card relative w-full max-w-lg ${closing ? 'is-closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {/* Card with a travelling gold border beam and glow */}
                <div
                    // [&::before]:z-30 lifts the beam above the stacked slides
                    className="mm-beam relative max-h-[80vh] overflow-hidden rounded-3xl [&::before]:z-30 bg-brand-dark shadow-[0_30px_90px_rgba(0,0,0,0.55),0_0_60px_color-mix(in_srgb,var(--color-brand-gold)_28%,transparent)] [--mm-beam-inset:0px] [--mm-beam-speed:5s] [--mm-beam-width:2px]"
                    style={{ aspectRatio: popup.aspect_ratio }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Slides: stacked and cross-faded; the visible one slowly zooms in */}
                    {slides.map((slide, i) => {
                        const active = i === index;
                        const image = (
                            <div
                                className={`h-full w-full ${active || i === leaving ? 'mm-kenburns' : ''}`}
                                style={{
                                    '--mm-kb-duration': `${(autoplay ? intervalSeconds : 8) + 1}s`,
                                    animationPlayState: playState,
                                }}
                            >
                                <ResponsiveImage
                                    src={slide.image_url}
                                    alt={slide.alt || ''}
                                    sizes="(min-width: 640px) 512px, 92vw"
                                    // Current and neighbouring slides load now; the rest when needed.
                                    loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                                    draggable={false}
                                    className="h-full w-full object-cover select-none"
                                />
                            </div>
                        );
                        return (
                            <div
                                key={i}
                                className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                                    active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'
                                }`}
                                aria-hidden={!active}
                                aria-roledescription="slide"
                                aria-label={`${labels.slide} ${i + 1} / ${count}`}
                            >
                                {slide.link_url ? (
                                    <a
                                        href={slide.link_url}
                                        onClick={() => slide.link_url.startsWith('#') && requestClose()}
                                        tabIndex={active ? 0 : -1}
                                        className="block h-full w-full"
                                        {...(/^https?:\/\//i.test(slide.link_url) && {
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                        })}
                                    >
                                        {image}
                                    </a>
                                ) : (
                                    image
                                )}
                            </div>
                        );
                    })}

                    {/* Shades so the bars and buttons read on any image */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-linear-to-b from-black/55 to-transparent"
                    />

                    {/* One-time gold light sweep after the entrance */}
                    {!closing && (
                        <div
                            aria-hidden="true"
                            className="mm-popup-shine pointer-events-none absolute inset-y-0 -left-1/3 z-10 w-1/3"
                            style={{
                                background:
                                    'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-brand-yellow) 45%, transparent), transparent)',
                            }}
                        />
                    )}

                    {/* Top bar: story progress + counter + close */}
                    <div className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
                        {count > 1 && (
                            <div dir="ltr" className="flex gap-1.5">
                                {slides.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setIndex(i)}
                                        aria-label={`${labels.slide} ${i + 1}`}
                                        aria-current={i === index}
                                        className="group relative h-4 flex-1 cursor-pointer"
                                    >
                                        <span className="absolute inset-x-0 top-1/2 h-0.75 -translate-y-1/2 overflow-hidden rounded-full bg-white/30 transition-colors group-hover:bg-white/45">
                                            {i < index && <span className="absolute inset-0 bg-white" />}
                                            {i === index &&
                                                (autoplay ? (
                                                    <span
                                                        // New element per slide restarts the bar.
                                                        key={`fill-${index}`}
                                                        className="mm-progress-fill absolute inset-0 rounded-full bg-linear-to-r from-brand-gold to-brand-yellow"
                                                        style={{
                                                            '--mm-progress-duration': `${intervalSeconds}s`,
                                                            animationPlayState: playState,
                                                        }}
                                                        onAnimationEnd={() => go(1)}
                                                    />
                                                ) : (
                                                    <span className="absolute inset-0 bg-linear-to-r from-brand-gold to-brand-yellow" />
                                                ))}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                            {count > 1 ? (
                                <span
                                    dir="ltr"
                                    className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-bold tracking-wider text-white backdrop-blur-md"
                                >
                                    <span className="text-brand-yellow">{String(index + 1).padStart(2, '0')}</span>
                                    <span className="text-white/60"> / {String(count).padStart(2, '0')}</span>
                                </span>
                            ) : (
                                <span />
                            )}
                            <button
                                ref={closeRef}
                                type="button"
                                onClick={requestClose}
                                aria-label={labels.close}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-all hover:rotate-90 hover:bg-white hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    </div>

                    {count > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => go(-1)}
                                aria-label={labels.prev}
                                className={`${ARROW_CLASS} left-3`}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => go(1)}
                                aria-label={labels.next}
                                className={`${ARROW_CLASS} right-3`}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Remembers that a visitor closed the popup. `once` → until the admin saves a new version;
// `session` → until the browser session ends; `always` → never remembered.
const SEEN_KEY = 'mm_popup_seen';

function storageFor(frequency) {
    try {
        if (frequency === 'once') return window.localStorage;
        if (frequency === 'session') return window.sessionStorage;
    } catch {
        // Storage blocked (private mode, cookies off) — just show it every visit.
    }
    return null;
}

function alreadySeen(popup) {
    try {
        return storageFor(popup.frequency)?.getItem(SEEN_KEY) === String(popup.version);
    } catch {
        return false;
    }
}

function markSeen(popup) {
    try {
        storageFor(popup.frequency)?.setItem(SEEN_KEY, String(popup.version));
    } catch {
        // ignore
    }
}

/** Home page: fetches the popup (null when disabled) and opens it after the configured delay. */
export default function HomePopup() {
    const locale = useLocale();
    const [popup, setPopup] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/popup?locale=${locale}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => !cancelled && setPopup(data))
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [locale]);

    useEffect(() => {
        if (!popup?.slides?.length || alreadySeen(popup)) return;
        const timer = setTimeout(() => setOpen(true), popup.delay_seconds * 1000);
        return () => clearTimeout(timer);
    }, [popup]);

    if (!open || !popup) return null;

    return (
        <PopupCarousel
            popup={popup}
            onClose={() => {
                markSeen(popup);
                setOpen(false);
            }}
        />
    );
}
