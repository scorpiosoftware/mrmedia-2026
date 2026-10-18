<?php

namespace App\Support;

/**
 * Re-encodes images through GD: scaled down, stored as compressed WebP (or PNG where WebP
 * isn't supported), with every byte that isn't genuine pixel data discarded. Shared by the
 * admin upload endpoints (StoresUploadedImages) and `php artisan images:optimize`.
 */
class ImageOptimizer
{
    /** Only these real (content-sniffed) MIME types are ever accepted. */
    public const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    /** Longest side (px) a stored image is scaled down to — plenty for full-width heroes on retina screens. */
    public const MAX_SIDE = 1920;

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

    /**
     * Re-encodes the image at $path. Returns the encoded bytes, or null if it can't be decoded.
     *
     * @param  string  $format  'webp' or 'png'
     */
    public static function encode(string $path, string $format = 'webp', int $maxSide = self::MAX_SIDE): ?string
    {
        $mime = self::mime($path);
        if ($mime === null) {
            return null;
        }

        // GD holds ~4 bytes per pixel: a 6000×6000 upload is ~144 MB decoded, plus the resized copy.
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

        $image = self::downscale($image, $maxSide);

        imagealphablending($image, false);
        imagesavealpha($image, true);

        ob_start();
        $format === 'png'
            ? imagepng($image, null, 9)
            : imagewebp($image, null, self::WEBP_QUALITY);
        $data = ob_get_clean();
        imagedestroy($image);

        return $data ?: null;
    }

    /** Scales the image so its longest side is at most $maxSide, keeping transparency. Never upscales. */
    private static function downscale(\GdImage $image, int $maxSide): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $longest = max($width, $height);

        if ($longest <= $maxSide) {
            return $image;
        }

        $ratio = $maxSide / $longest;
        $newWidth = max(1, (int) round($width * $ratio));
        $newHeight = max(1, (int) round($height * $ratio));

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagefill($resized, 0, 0, imagecolorallocatealpha($resized, 0, 0, 0, 127));
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);

        return $resized;
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

        if ($rotated instanceof \GdImage) {
            imagedestroy($image);

            return $rotated;
        }

        return $image;
    }
}
