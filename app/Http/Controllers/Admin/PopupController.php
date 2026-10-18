<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\StoresUploadedImages;
use App\Http\Controllers\Controller;
use App\Models\Popup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PopupController extends Controller
{
    // Provides uploadImage() — POST /spa/admin/popup/upload-image: WebP + srcset copies, same rules as every upload.
    use StoresUploadedImages;

    private const UPLOAD_DIR = 'popup';

    /** GET /spa/admin/popup */
    public function show(): JsonResponse
    {
        return response()->json(Popup::current());
    }

    /** POST /spa/admin/popup */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'is_enabled'         => ['boolean'],
            'slides'             => ['present', 'array', 'max:'.Popup::MAX_SLIDES],
            // Slide images must be files uploaded through this controller — never an arbitrary address.
            'slides.*.image_url' => ['required', 'string', 'max:2048', 'starts_with:'.Storage::disk('public')->url(self::UPLOAD_DIR.'/')],
            // Optional click-through: a full http(s) URL, a site path ("/events/…") or an anchor ("#contact").
            'slides.*.link_url'  => ['nullable', 'string', 'max:2048', 'regex:#^(https?://|/|\#)#i'],
            'slides.*.alt'       => ['nullable', 'string', 'max:160'],
            'slides.*.alt_ar'    => ['nullable', 'string', 'max:160'],
            'delay_seconds'      => ['required', 'integer', 'min:0', 'max:60'],
            'frequency'          => ['required', 'in:'.implode(',', Popup::FREQUENCIES)],
            'autoplay'           => ['boolean'],
            'interval_seconds'   => ['required', 'integer', 'min:2', 'max:30'],
            'aspect_ratio'       => ['required', 'in:'.implode(',', Popup::ASPECT_RATIOS)],
        ], [
            'slides.max'                    => 'A popup can have at most '.Popup::MAX_SLIDES.' slides.',
            'slides.*.image_url.required'   => 'Every slide needs an image.',
            'slides.*.image_url.starts_with' => 'Please upload slide images using the upload button.',
            'slides.*.link_url.regex'       => 'Links must start with https://, / or #.',
        ]);

        // Keep only the known keys of each slide.
        $data['slides'] = collect($data['slides'])
            ->map(fn ($s) => [
                'image_url' => $s['image_url'],
                'link_url'  => $s['link_url'] ?? null,
                'alt'       => $s['alt'] ?? '',
                'alt_ar'    => $s['alt_ar'] ?? '',
            ])
            ->values()
            ->all();

        $popup = Popup::current();
        $previous = collect($popup->slides ?? [])->pluck('image_url');

        $popup->update($data);

        // Delete images of slides that were removed or replaced.
        $kept = collect($data['slides'])->pluck('image_url');
        $previous->diff($kept)->each(fn ($url) => $this->forgetStoredImage($url));

        return response()->json($popup->fresh());
    }
}
