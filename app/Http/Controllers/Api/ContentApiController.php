<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\Request;

class ContentApiController extends Controller
{
    /** GET /api/content?locale=en — returns { key: value } map for the given locale */
    public function index(Request $request)
    {
        $locale = in_array($request->get('locale'), ['en', 'ar']) ? $request->get('locale') : 'en';

        return response()->json(SiteContent::getAllForLocale($locale));
    }

    /** GET /api/admin/content — returns all records for the editor (auth required) */
    public function adminIndex()
    {
        return response()->json(
            SiteContent::orderBy('section')->orderBy('sort_order')->get()
        );
    }

    /** POST /api/admin/content — batch-update en_value + ar_value (auth required) */
    public function adminUpdate(Request $request)
    {
        $validated = $request->validate([
            'items'            => ['required', 'array'],
            'items.*.id'       => ['required', 'integer', 'exists:site_contents,id'],
            'items.*.en_value' => ['nullable', 'string'],
            'items.*.ar_value' => ['nullable', 'string'],
        ]);

        foreach ($validated['items'] as $item) {
            SiteContent::where('id', $item['id'])->update([
                'en_value' => $item['en_value'] ?? '',
                'ar_value' => $item['ar_value'] ?? '',
            ]);
        }

        SiteContent::clearCache();

        return response()->json(['message' => 'Content updated successfully.']);
    }
}
