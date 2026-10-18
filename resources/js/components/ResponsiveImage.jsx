import { useState } from 'react';

// Widths stored next to every uploaded WebP image (`{name}-w480.webp`, …).
// Keep in sync with ImageOptimizer::VARIANT_WIDTHS and ::MAX_SIDE.
const VARIANT_WIDTHS = [160, 480, 960];
const MAX_SIDE = 1920;

// Only our own uploads have the smaller copies — anything else renders as a plain <img>.
const UPLOADED_WEBP =
    /\/storage\/(content|projects|events|branding|popup)\/[0-9a-f-]{36}\.webp$/i;

/** srcset for an uploaded image, or undefined when the URL has no stored variants. */
export function uploadedSrcSet(src) {
    if (!src || !UPLOADED_WEBP.test(src)) return undefined;
    const base = src.slice(0, -'.webp'.length);
    return [
        ...VARIANT_WIDTHS.map((w) => `${base}-w${w}.webp ${w}w`),
        `${src} ${MAX_SIDE}w`,
    ].join(', ');
}

/**
 * <img> that lets the browser pick the smallest stored copy that's still sharp for the
 * slot it's shown in. `sizes` must describe that slot's rendered width (CSS px), e.g.
 * "(min-width: 1024px) 33vw, 100vw" for a 3-column grid. Images uploaded before the
 * copies existed fall back to the full file if a copy is missing.
 */
export default function ResponsiveImage({ src, sizes, ...props }) {
    const [failedSrc, setFailedSrc] = useState(null);
    const srcSet = failedSrc === src ? undefined : uploadedSrcSet(src);

    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={srcSet ? sizes : undefined}
            decoding="async"
            onError={srcSet ? () => setFailedSrc(src) : undefined}
            {...props}
        />
    );
}
