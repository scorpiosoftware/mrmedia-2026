<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $urls = [
            [
                'loc'        => url('/'),
                'lastmod'    => now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority'   => '1.0',
            ],
        ];

        Event::where('is_published', true)
            ->whereNotNull('slug')
            ->orderByDesc('updated_at')
            ->get(['slug', 'updated_at'])
            ->each(function (Event $event) use (&$urls) {
                $urls[] = [
                    'loc'        => url("/events/{$event->slug}"),
                    'lastmod'    => $event->updated_at->toAtomString(),
                    'changefreq' => 'daily',
                    'priority'   => '0.8',
                ];
            });

        $xml = view('sitemap', ['urls' => $urls])->render();

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    public function robots(): Response
    {
        $lines = [
            'User-agent: *',
            'Disallow: /admin',
            'Disallow: /spa/',
            'Disallow: /api/',
            'Disallow: /login',
            'Disallow: /register',
            'Disallow: /dashboard',
            'Disallow: /settings/',
            '',
            'Sitemap: '.url('/sitemap.xml'),
        ];

        return response(implode("\n", $lines), 200)->header('Content-Type', 'text/plain');
    }
}
