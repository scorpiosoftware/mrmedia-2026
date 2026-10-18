<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Shared hardened image upload for admin controllers (projects, events, site content…).
 * The using class must define `private const UPLOAD_DIR` — the folder on the public disk.
 */
trait StoresUploadedImages
{
    /** Only these real (content-sniffed) MIME types may ever be accepted. */
    private static array $allowedImageMimes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /** Longest side (px) a stored image is scaled down to — plenty for full-width heroes on retina screens. */
    private static int $maxImageSide = 1920;

    /** WebP quality (0–100): visually lossless for photos at a fraction of the JPEG/PNG size. */
    private static int $webpQuality = 80;

    /**
     * POST …/upload-image
     *
     * Hardened image upload:
     *  - Client-supplied filename/extension is never trusted or used.
     *  - Real file content is sniffed (getimagesize) against a strict MIME allow-list.
     *  - The image is fully re-encoded through GD, discarding every byte that isn't
     *    actual pixel data — this neutralises polyglot files (a valid image with a
     *    payload appended/hidden after the real image data).
     *  - Dimensions and file size are capped to avoid decompression-bomb style abuse.
     *  - Every image is scaled down to $maxImageSide and stored as compressed WebP.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        return $this->storeUploadedImage($request);
    }

    /**
     * @param  string  $format  'webp' (default) or 'png' — PNG only where WebP isn't supported (e.g. iOS home-screen icons).
     * @param  int|null  $maxSide  Override for the longest stored side.
     */
    private function storeUploadedImage(Request $request, string $format = 'webp', ?int $maxSide = null): JsonResponse
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2000', // ~2MB — stays under this server's upload_max_filesize (2M) so oversized files fail validation cleanly
                'dimensions:max_width=6000,max_height=6000',
            ],
        ]);

        $file = $request->file('image');

        $info = @getimagesize($file->getRealPath());
        if ($info === false) {
            return response()->json(['message' => 'The uploaded file is not a valid image.'], 422);
        }

        $mime = $info['mime'] ?? null;
        if (! isset(self::$allowedImageMimes[$mime])) {
            return response()->json(['message' => 'Unsupported image type.'], 422);
        }

        $reencoded = $this->reencodeImage($file->getRealPath(), $mime, $format, $maxSide ?? self::$maxImageSide);
        if ($reencoded === null) {
            return response()->json(['message' => 'Failed to process the uploaded image.'], 422);
        }

        $filename = Str::uuid()->toString().'.'.$format;
        $path = self::UPLOAD_DIR.'/'.$filename;

        Storage::disk('public')->put($path, $reencoded);

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }

    /** Re-encodes the image via GD (stripping anything that isn't genuine pixel data), downscaled to $maxSide. */
    private function reencodeImage(string $path, string $mime, string $format, int $maxSide): ?string
    {
        // GD holds ~4 bytes per pixel: a 6000×6000 upload is ~144 MB decoded, plus the resized copy.
        if ((int) ini_get('memory_limit') !== -1) {
            @ini_set('memory_limit', '512M');
        }

        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        if (! $image instanceof \GdImage) {
            return null;
        }

        // Palette PNGs can't hold alpha in WebP output — promote to truecolor first.
        if (! imageistruecolor($image)) {
            imagepalettetotruecolor($image);
        }

        if ($mime === 'image/jpeg') {
            $image = $this->applyExifOrientation($image, $path);
        }

        $image = $this->downscale($image, $maxSide);

        imagealphablending($image, false);
        imagesavealpha($image, true);

        ob_start();
        $format === 'png'
            ? imagepng($image, null, 9)
            : imagewebp($image, null, self::$webpQuality);
        $data = ob_get_clean();
        imagedestroy($image);

        return $data ?: null;
    }

    /** Scales the image so its longest side is at most $maxSide, keeping transparency. Never upscales. */
    private function downscale(\GdImage $image, int $maxSide): \GdImage
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
    private function applyExifOrientation(\GdImage $image, string $path): \GdImage
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

    /** Deletes a previously uploaded image from local storage, if the URL points at one in this controller's folder. */
    private function forgetStoredImage(?string $url): void
    {
        if (! $url) {
            return;
        }

        $marker = '/storage/'.self::UPLOAD_DIR.'/';
        if (! str_contains($url, $marker)) {
            return;
        }

        $path = self::UPLOAD_DIR.'/'.basename($url);
        Storage::disk('public')->delete($path);
    }
}
