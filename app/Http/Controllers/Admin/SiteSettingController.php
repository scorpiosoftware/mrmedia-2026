<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    /** GET /spa/admin/site-settings — current settings plus the preset palettes for the picker */
    public function show(): JsonResponse
    {
        return response()->json([
            'settings' => SiteSetting::current(),
            'themes'   => SiteSetting::THEMES,
        ]);
    }

    /** POST /spa/admin/site-settings */
    public function update(Request $request): JsonResponse
    {
        $hex = ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'];

        $rules = [
            'site_name'          => ['required', 'string', 'max:100'],
            'site_name_ar'       => ['nullable', 'string', 'max:100'],
            'tagline'            => ['nullable', 'string', 'max:160'],
            'tagline_ar'         => ['nullable', 'string', 'max:160'],
            'default_locale'     => ['required', 'in:en,ar'],
            'default_appearance' => ['required', 'in:system,light,dark'],
            'theme'              => ['required', 'in:'.implode(',', [...array_keys(SiteSetting::THEMES), 'custom'])],
            'custom_colors'      => ['nullable', 'array'],
        ];

        // Custom colours are only required (and only checked) when the custom theme is chosen.
        if ($request->input('theme') === 'custom') {
            foreach (SiteSetting::COLOR_KEYS as $key) {
                $rules["custom_colors.{$key}"] = $hex;
            }
        }

        $data = $request->validate($rules);

        if (isset($data['custom_colors'])) {
            $data['custom_colors'] = array_map(
                'strtoupper',
                array_intersect_key($data['custom_colors'], array_flip(SiteSetting::COLOR_KEYS)),
            );
        }

        $settings = SiteSetting::current();
        $settings->update($data);

        return response()->json(['settings' => $settings->fresh()]);
    }
}
