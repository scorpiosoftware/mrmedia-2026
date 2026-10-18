<?php

namespace App\Support;

/**
 * Re-encodes images through GD: scaled down, stored as compressed WebP (or PNG where WebP
 * isn't supported), with every byte that isn't genuine pixel data discarded. Shared by the
 * admin upload endpoints (StoresUploadedImages) and `php artisan images:optimize`.
 *
 * WebP uploads also get smaller width variants next to them (`{name}-w480.webp`, …) so the
 * site can serve each visitor the smallest file that's still sharp (srcset — see
 * resources/js/components/ResponsiveImage.jsx, which mirrors VARIANT_WIDTHS).
 */
class ImageOptimizer
{
    /** Only these real (content-sniffed) MIME types are ever accepted. */
    public const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    /** Longest side (px) a stored image is scaled down to — plenty for full-width heroes on retina screens. */
    public const MAX_SIDE = 1920;

    /** Extra widths stored beside each WebP image, for srcset. Keep in sync with ResponsiveImage.jsx. */
    public const VARIANT_WIDTHS = [160, 480, 960];

    /** Site icon: stays PNG (iOS ignores WebP home-screen icons); 512 px covers every icon size. */
    public const FAVICON_MAX_SIDE = 512;

    /** WebP quality (0–100): visually lossless for photos at a fraction of the JPEG/PNG size. */
    public const WEBP_QUALITY = 80;

    /** The sniffed MIME type, or null when the file isn't an allowed image. */
    public static function mime(string $path): ?string
    {
        $info = @getimagesize($path);
        $mime = $info['mime'] ?? null;

        return in_array($mime, self::ALLOWED_MIMES, true) ? $mime : null;
    }

    /** Width and height, or null when unreadable. */
    public static function dimensions(string $path): ?array
    {
        $info = @getimagesize($path);

        return $info ? [$info[0], $info[1]] : null;
    }

    /** "content/abc.webp" → "content/abc-w480.webp" */
    public static function variantPath(string $path, int $width): string
    {
        $info = pathinfo($path);
        $dir = $info['dirname'] === '.' ? '' : $info['dirname'].'/';

        return "{$dir}{$info['filename']}-w{$width}.{$info['extension']}";
    }

    /** All variant paths for a stored image (used when deleting it). */
    public static function variantPaths(string $path): array
    {
        return array_map(fn ($w) => self::variantPath($path, $w), self::VARIANT_WIDTHS);
    }

    /**
     * Re-encodes the image at $path. Returns the encoded bytes, or null if it can't be decoded.
     *
     * @param  string  $format  'webp' or 'png'
     */
    public static function encode(string $path, string $format = 'webp', int $maxSide = self::MAX_SIDE): ?string
    {
        return self::encodeWithVariants($path, $format, $maxSide, [])['main'] ?? null;
    }

    /**
     * Decodes once, then encodes the main image plus one copy per width in $widths.
     *
     * @return array{main: string, variants: array<int, string>}|null
     */
    public static function encodeWithVariants(string $path, string $format = 'webp', int $maxSide = self::MAX_SIDE, ?array $widths = null): ?array
    {
        $image = self::load($path);
        if ($image === null) {
            return null;
        }

        $main = self::render($image, $format, $maxSide, PHP_INT_MAX);
        $variants = [];
        foreach ($widths ?? ($format === 'webp' ? self::VARIANT_WIDTHS : []) as $width) {
            $variants[$width] = self::render($image, $format, $maxSide, $width);
        }
        unset($image); // GdImage memory is freed with the last reference (imagedestroy is a no-op since PHP 8)

        return $main === null ? null : ['main' => $main, 'variants' => array_filter($variants)];
    }

    /** Decodes and normalises an image (truecolor, EXIF rotation applied). */
    private static function load(string $path): ?\GdImage
    {
        $mime = self::mime($path);
        if ($mime === null) {
            return null;
        }

        // GD holds ~4 bytes per pixel: a 6000×6000 upload is ~144 MB decoded, plus the resized copies.
        if ((int) ini_get('memory_limit') !== -1) {
            @ini_set('memory_limit', '512M');
        }

        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
        };

        if (! $image instanceof \GdImage) {
            return null;
        }

        // Palette PNGs can't hold alpha in WebP output — promote to truecolor first.
        if (! imageistruecolor($image)) {
            imagepalettetotruecolor($image);
        }

        if ($mime === 'image/jpeg') {
            $image = self::applyExifOrientation($image, $path);
        }

        return $image;
    }

    /** Encodes a scaled copy (longest side ≤ $maxSide, width ≤ $maxWidth). Never upscales; $image is left intact. */
    private static function render(\GdImage $image, string $format, int $maxSide, int $maxWidth): ?string
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $ratio = min(1, $maxSide / max($width, $height), $maxWidth / $width);

        $out = $image;
        if ($ratio < 1) {
            $newWidth = max(1, (int) round($width * $ratio));
            $newHeight = max(1, (int) round($height * $ratio));

            $out = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($out, false);
            imagesavealpha($out, true);
            imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
            imagecopyresampled($out, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        }

        imagealphablending($out, false);
        imagesavealpha($out, true);

        ob_start();
        $format === 'png'
            ? imagepng($out, null, 9)
            : imagewebp($out, null, self::WEBP_QUALITY);
        $data = ob_get_clean();

        return $data ?: null;
    }

    /**
     * Phone photos store "rotate me" in EXIF instead of rotating the pixels. Re-encoding drops
     * the EXIF, so bake the rotation in or the image would show sideways.
     */
    private static function applyExifOrientation(\GdImage $image, string $path): \GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $image;
        }

        $orientation = (int) (@exif_read_data($path)['Orientation'] ?? 1);

        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => null,
        };

        return $rotated instanceof \GdImage ? $rotated : $image;
    }
}
