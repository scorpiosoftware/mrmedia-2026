// Default brand mark, downsized from the full-resolution originals in
// resources/branding/originals/. Imported as files (not inlined base64): the minifier
// copied the inline strings into every place that used them, which tripled their
// weight in the main bundle. Vite emits them as hashed, long-cached assets.
// Regenerate from the originals if the brand mark ever changes.

import logo from '../../branding/logo.webp';
import logoDark from '../../branding/logo-dark.webp';

export const LOGO_SRC = logo;

export const LOGO_DARK_SRC = logoDark;
