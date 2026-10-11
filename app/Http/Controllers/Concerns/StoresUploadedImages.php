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
    /** Only these real (content-sniffed) MIME types may ever be stored, mapped to the extension we persist with. */
    private static array $allowedImageMimes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /**
     * POST …/upload-image
     *
     * Hardened image upload:
     *  - Client-supplied filename/extension is never trusted or used.
     *  - Real file content is sniffed (getimagesize) against a strict MIME allow-list;
     *    the stored extension is derived from that, not from the original filename,
     *    which by itself defeats double-extension / renamed-executable tricks.
     *  - The image is fully re-encoded through GD, discarding every byte that isn't
     *    actual pixel data — this neutralises polyglot files (a valid image with a
     *    payload appended/hidden after the real image data).
     *  - Dimensions and file size are capped to avoid decompression-bomb style abuse.
     */
    public function uploadImage(Request $request): JsonResponse
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

        $reencoded = $this->reencodeImage($file->getRealPath(), $mime);
        if ($reencoded === null) {
            return response()->json(['message' => 'Failed to process the uploaded image.'], 422);
        }

        $filename = Str::uuid()->toString().'.'.self::$allowedImageMimes[$mime];
        $path = self::UPLOAD_DIR.'/'.$filename;

        Storage::disk('public')->put($path, $reencoded);

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }

    /** Re-encodes the image via GD, stripping anything that isn't genuine pixel data. */
    private function reencodeImage(string $path, string $mime): ?string
    {
        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        if (! $image instanceof \GdImage) {
            return null;
        }

        ob_start();

        match ($mime) {
            'image/jpeg' => imagejpeg($image, null, 87),
            'image/png' => (function () use ($image) {
                imagesavealpha($image, true);
                imagepng($image, null, 6);
            })(),
            'image/webp' => imagewebp($image, null, 85),
        };

        $data = ob_get_clean();
        imagedestroy($image);

        return $data ?: null;
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
