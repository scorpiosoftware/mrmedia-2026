<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarqueeBanner;
use Illuminate\Http\Request;

class MarqueeBannerApiController extends Controller
{
    /** GET /api/marquee?locale=en — banner settings with phrases in the requested locale, or an empty payload when hidden */
    public function index(Request $request)
    {
        $locale = $request->input('locale') === 'ar' ? 'ar' : 'en';
        $banner = MarqueeBanner::current();

        $phrases = collect($banner->phrases ?? [])
            ->map(fn ($p) => [
                // Arabic falls back to English when no translation was entered.
                'text'  => $locale === 'ar' && filled($p['text_ar'] ?? null) ? $p['text_ar'] : ($p['text'] ?? ''),
                'style' => $p['style'] ?? 'solid',
            ])
            ->filter(fn ($p) => filled($p['text']))
            ->values();

        if (! $banner->is_enabled || $phrases->isEmpty()) {
            return response()->json(null);
        }

        return response()->json([
            'phrases'          => $phrases,
            'speed'            => $banner->speed,
            'direction'        => $banner->direction,
            'pause_on_hover'   => $banner->pause_on_hover,
            'separator'        => $banner->separator,
            'font_size'        => $banner->font_size,
            'background_color' => $banner->background_color,
            'text_color'       => $banner->text_color,
            'highlight_color'  => $banner->highlight_color,
            'tilted'           => $banner->tilted,
            'double_row'       => $banner->double_row,
        ]);
    }
}
