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
            SiteContent::orderBy('section')->orderBy('sort_order')->orderBy('id')->get()
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

    /**
     * POST /spa/admin/content/contact-entry — body: { kind: email|phone|address }
     *
     * Adds another contact detail as a new row keyed `contact.{kind}_N` (N = 2, 3, …).
     * The original `contact.{kind}` row is always entry #1 and is never touched.
     */
    public function addContactEntry(Request $request)
    {
        $data = $request->validate([
            'kind' => ['required', 'in:'.implode(',', SiteContent::CONTACT_LIST_KINDS)],
        ]);

        $base = "contact.{$data['kind']}";
        $baseRow = SiteContent::where('key', $base)->first();

        // Exact suffix match in PHP — LIKE escaping of `_` differs between databases.
        $next = SiteContent::where('key', 'like', "{$base}%")
            ->pluck('key')
            ->map(fn ($key) => preg_match('/^'.preg_quote($base, '/').'_(\d+)$/', $key, $m) ? (int) $m[1] : 1)
            ->push(1)
            ->max() + 1;

        $row = SiteContent::create([
            'key'        => "{$base}_{$next}",
            'section'    => 'contact',
            'en_value'   => '',
            'ar_value'   => '',
            'type'       => 'text',
            // Sits right after the original entry in the editor.
            'sort_order' => $baseRow?->sort_order ?? 0,
        ]);

        SiteContent::clearCache();

        return response()->json($row);
    }

    /** DELETE /spa/admin/content/{siteContent} — only extra contact entries (contact.{kind}_N) can be removed. */
    public function destroyContactEntry(SiteContent $siteContent)
    {
        if (! SiteContent::isExtraContactKey($siteContent->key)) {
            return response()->json(['message' => 'Only added contact entries can be deleted.'], 422);
        }

        $siteContent->delete();
        SiteContent::clearCache();

        return response()->json(['message' => 'Entry deleted.']);
    }
}
