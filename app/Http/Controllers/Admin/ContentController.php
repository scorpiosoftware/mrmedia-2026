<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContentController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/content', [
            'contents' => SiteContent::orderBy('section')->orderBy('sort_order')->get(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'items'              => ['required', 'array'],
            'items.*.id'         => ['required', 'integer', 'exists:site_contents,id'],
            'items.*.en_value'   => ['nullable', 'string'],
            'items.*.ar_value'   => ['nullable', 'string'],
        ]);

        foreach ($validated['items'] as $item) {
            SiteContent::where('id', $item['id'])->update([
                'en_value' => $item['en_value'] ?? '',
                'ar_value' => $item['ar_value'] ?? '',
            ]);
        }

        SiteContent::clearCache();

        return back()->with('success', 'Content updated successfully.');
    }
}
