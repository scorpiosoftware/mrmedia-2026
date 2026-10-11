<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarqueeBanner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarqueeBannerController extends Controller
{
    /** GET /spa/admin/marquee */
    public function show(): JsonResponse
    {
        return response()->json(MarqueeBanner::current());
    }

    /** POST /spa/admin/marquee */
    public function update(Request $request): JsonResponse
    {
        $hex = 'regex:/^#[0-9A-Fa-f]{6}$/';

        $data = $request->validate([
            'is_enabled'       => ['boolean'],
            'phrases'          => ['present', 'array', 'max:30'],
            'phrases.*.text'    => ['required', 'string', 'max:120'],
            'phrases.*.text_ar' => ['nullable', 'string', 'max:120'],
            'phrases.*.style'   => ['required', 'in:'.implode(',', MarqueeBanner::PHRASE_STYLES)],
            'speed'            => ['required', 'integer', 'min:10', 'max:300'],
            'direction'        => ['required', 'in:left,right'],
            'pause_on_hover'   => ['boolean'],
            'separator'        => ['required', 'in:'.implode(',', MarqueeBanner::SEPARATORS)],
            'font_size'        => ['required', 'in:'.implode(',', MarqueeBanner::FONT_SIZES)],
            'background_color' => ['required', $hex],
            'text_color'       => ['required', $hex],
            'highlight_color'  => ['required', $hex],
            'tilted'           => ['boolean'],
            'double_row'       => ['boolean'],
        ], [
            'phrases.*.text.required' => 'Every phrase needs English text.',
        ]);

        // Keep only the known keys of each phrase.
        $data['phrases'] = collect($data['phrases'])
            ->map(fn ($p) => [
                'text'    => $p['text'],
                'text_ar' => $p['text_ar'] ?? '',
                'style'   => $p['style'],
            ])
            ->values()
            ->all();

        $banner = MarqueeBanner::current();
        $banner->update($data);

        return response()->json($banner);
    }
}
