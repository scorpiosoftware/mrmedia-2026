<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\StoresUploadedImages;
use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Support\ImageOptimizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SiteSettingController extends Controller
{
    // Shared hardened upload (JPG/PNG/WebP, ≤2MB, ≤6000px, content-sniffed + re-encoded).
    use StoresUploadedImages;

    private const UPLOAD_DIR = 'branding';

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
        // Branding URLs must point at a file uploaded through this controller — never an arbitrary address.
        $brandingUrl = ['nullable', 'string', 'max:2048', 'starts_with:'.Storage::disk('public')->url(self::UPLOAD_DIR.'/')];

        $rules = [
            'site_name'          => ['required', 'string', 'max:100'],
            'site_name_ar'       => ['nullable', 'string', 'max:100'],
            'tagline'            => ['nullable', 'string', 'max:160'],
            'tagline_ar'         => ['nullable', 'string', 'max:160'],
            'default_locale'     => ['required', 'in:en,ar'],
            'default_appearance' => ['required', 'in:system,light,dark'],
            'theme'              => ['required', 'in:'.implode(',', [...array_keys(SiteSetting::THEMES), 'custom'])],
            'custom_colors'      => ['nullable', 'array'],
            'logo_url'           => $brandingUrl,
            'logo_dark_url'      => $brandingUrl,
            'favicon_url'        => $brandingUrl,
        ];

        // Custom colours are only required (and only checked) when the custom theme is chosen.
        if ($request->input('theme') === 'custom') {
            foreach (SiteSetting::COLOR_KEYS as $key) {
                $rules["custom_colors.{$key}"] = $hex;
            }
        }

        $data = $request->validate($rules, [
            'starts_with' => 'Please upload the :attribute using the upload button.',
        ], [
            'logo_url'      => 'light-background logo',
            'logo_dark_url' => 'dark-background logo',
            'favicon_url'   => 'site icon',
        ]);

        if (isset($data['custom_colors'])) {
            $data['custom_colors'] = array_map(
                'strtoupper',
                array_intersect_key($data['custom_colors'], array_flip(SiteSetting::COLOR_KEYS)),
            );
        }

        $settings = SiteSetting::current();
        $previous = $settings->only(SiteSetting::BRANDING_FIELDS);

        $settings->update($data);

        // Delete branding files that were replaced or removed.
        foreach (SiteSetting::BRANDING_FIELDS as $field) {
            if (array_key_exists($field, $data) && $previous[$field] && $previous[$field] !== $data[$field]) {
                $this->forgetStoredImage($previous[$field]);
            }
        }

        return response()->json(['settings' => $settings->fresh()]);
    }

    /**
     * POST /spa/admin/site-settings/sections — which home-page sections are hidden.
     * Its own endpoint so a toggle saves instantly without re-validating every other setting.
     */
    public function updateSections(Request $request): JsonResponse
    {
        $data = $request->validate([
            'hidden_sections'   => ['present', 'array'],
            'hidden_sections.*' => ['string', 'in:'.implode(',', SiteSetting::TOGGLEABLE_SECTIONS)],
        ]);

        $settings = SiteSetting::current();
        $settings->update(['hidden_sections' => array_values(array_unique($data['hidden_sections']))]);

        return response()->json(['hidden_sections' => $settings->fresh()->hidden_sections ?? []]);
    }

    /** POST /spa/admin/site-settings/upload-logo — light or dark logo */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['dimensions:min_width=128,min_height=128'],
        ], [
            'image.dimensions' => 'The logo must be at least 128 × 128 px.',
        ]);

        return $this->uploadImage($request);
    }

    /** POST /spa/admin/site-settings/upload-favicon — square PNG, used for the browser tab and home-screen icon */
    public function uploadFavicon(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['mimes:png', 'dimensions:ratio=1/1,min_width=48,min_height=48'],
        ], [
            'image.mimes' => 'The site icon must be a PNG file.',
            'image.dimensions' => 'The site icon must be square and at least 48 × 48 px (512 × 512 recommended).',
        ]);

        // Stays PNG: iOS ignores WebP for the home-screen (apple-touch) icon.
        return $this->storeUploadedImage($request, 'png', ImageOptimizer::FAVICON_MAX_SIDE);
    }
}
