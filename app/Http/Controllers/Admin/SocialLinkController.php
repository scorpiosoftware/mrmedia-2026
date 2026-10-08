<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SocialLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialLinkController extends Controller
{
    /** GET /spa/admin/social-links — all links, ordered for display */
    public function index(): JsonResponse
    {
        return response()->json($this->ordered());
    }

    /** POST /spa/admin/social-links */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateLink($request);
        $data['sort_order'] = SocialLink::max('sort_order') + 1;

        return response()->json(SocialLink::create($data));
    }

    /** POST /spa/admin/social-links/{socialLink} */
    public function update(Request $request, SocialLink $socialLink): JsonResponse
    {
        $socialLink->update($this->validateLink($request));

        return response()->json($socialLink);
    }

    /** DELETE /spa/admin/social-links/{socialLink} */
    public function destroy(SocialLink $socialLink): JsonResponse
    {
        $socialLink->delete();

        return response()->json(['message' => 'Social link deleted.']);
    }

    /** POST /spa/admin/social-links/reorder — body: { ids: [3, 1, 2, ...] } in the desired display order */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:social_links,id'],
        ]);

        foreach ($data['ids'] as $index => $id) {
            SocialLink::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json($this->ordered());
    }

    private function ordered()
    {
        return SocialLink::orderBy('sort_order')->orderByDesc('id')->get();
    }

    private function validateLink(Request $request): array
    {
        return $request->validate([
            'platform' => ['required', 'string', 'max:50'],
            'label' => ['nullable', 'string', 'max:100'],
            'url' => ['required', 'url', 'max:2048'],
            'is_published' => ['boolean'],
        ]);
    }
}
