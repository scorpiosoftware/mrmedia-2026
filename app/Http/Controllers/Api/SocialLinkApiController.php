<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialLink;

class SocialLinkApiController extends Controller
{
    /** GET /api/social-links — published social links for the public site, in display order */
    public function index()
    {
        $links = SocialLink::where('is_published', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (SocialLink $link) => [
                'id' => $link->id,
                'platform' => $link->platform,
                'label' => $link->label,
                'url' => $link->url,
            ]);

        return response()->json($links);
    }
}
