<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Popup;
use Illuminate\Http\Request;

class PopupApiController extends Controller
{
    /** GET /api/popup?locale=en — popup settings + slides in the requested locale, or null when switched off / empty */
    public function index(Request $request)
    {
        $locale = $request->input('locale') === 'ar' ? 'ar' : 'en';
        $popup = Popup::current();

        $slides = collect($popup->slides ?? [])
            ->filter(fn ($s) => filled($s['image_url'] ?? null))
            ->map(fn ($s) => [
                'image_url' => $s['image_url'],
                'link_url'  => $s['link_url'] ?? null,
                // Arabic falls back to English when no translation was entered.
                'alt'       => $locale === 'ar' && filled($s['alt_ar'] ?? null) ? $s['alt_ar'] : ($s['alt'] ?? ''),
            ])
            ->values();

        if (! $popup->is_enabled || $slides->isEmpty()) {
            return response()->json(null);
        }

        return response()->json([
            // Changes whenever the popup is saved, so "show once" visitors see a new campaign again.
            'version'          => $popup->updated_at?->timestamp,
            'slides'           => $slides,
            'delay_seconds'    => $popup->delay_seconds,
            'frequency'        => $popup->frequency,
            'autoplay'         => $popup->autoplay,
            'interval_seconds' => $popup->interval_seconds,
            'aspect_ratio'     => $popup->aspect_ratio,
        ]);
    }
}
