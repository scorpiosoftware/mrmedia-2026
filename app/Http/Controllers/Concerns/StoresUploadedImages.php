<?php

namespace App\Http\Controllers\Concerns;

use App\Support\ImageOptimizer;
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
     *  - Every image is scaled down and stored as compressed WebP (see ImageOptimizer).
     */
    public function uploadImage(Request $request): JsonResponse
    {
        return $this->storeUploadedImage($request);
    }

    /**
     * @param  string  $format  'webp' (default) or 'png' — PNG only where WebP isn't supported (e.g. iOS home-screen icons).
     * @param  int  $maxSide  Longest stored side.
     */
    private function storeUploadedImage(Request $request, string $format = 'webp', int $maxSide = ImageOptimizer::MAX_SIDE): JsonResponse
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

        $path = $request->file('image')->getRealPath();

        if (@getimagesize($path) === false) {
            return response()->json(['message' => 'The uploaded file is not a valid image.'], 422);
        }

        if (ImageOptimizer::mime($path) === null) {
            return response()->json(['message' => 'Unsupported image type.'], 422);
        }

        $encoded = ImageOptimizer::encodeWithVariants($path, $format, $maxSide);
        if ($encoded === null) {
            return response()->json(['message' => 'Failed to process the uploaded image.'], 422);
        }

        $stored = self::UPLOAD_DIR.'/'.Str::uuid()->toString().'.'.$format;
        $disk = Storage::disk('public');

        $disk->put($stored, $encoded['main']);
        // Smaller copies for srcset, so small slots (cards, avatars, logos) download small files.
        foreach ($encoded['variants'] as $width => $bytes) {
            $disk->put(ImageOptimizer::variantPath($stored, $width), $bytes);
        }

        return response()->json(['url' => $disk->url($stored)]);
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
        Storage::disk('public')->delete([$path, ...ImageOptimizer::variantPaths($path)]);
    }
}
