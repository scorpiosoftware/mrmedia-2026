<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\PageView;
use App\Support\UserAgent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Records page views from the public site (resources/js/lib/analytics.js) for the
 * dashboard's Statistics page. Visitors are anonymous random ids made in the browser;
 * no IP address or personal detail is stored. Bots and signed-in staff are skipped.
 */
class PageViewController extends Controller
{
    private const UUID = 'regex:/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    private const SEARCH_HOSTS = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'yandex.', 'baidu.', 'ecosia.', 'search.brave.'];

    private const SOCIAL_HOSTS = [
        'facebook.', 'fb.', 'messenger.', 'instagram.', 't.co', 'twitter.', 'x.com', 'linkedin.', 'lnkd.in',
        'tiktok.', 'youtube.', 'youtu.be', 'snapchat.', 'whatsapp.', 'wa.me', 'telegram.', 't.me', 'pinterest.', 'reddit.', 'threads.',
    ];

    /** POST /spa/track — returns the new view's id (used to report time on page), or 204 when not recorded. */
    public function store(Request $request): JsonResponse|Response
    {
        $data = $request->validate([
            'visitor_id'   => ['required', 'string', self::UUID],
            'session_id'   => ['required', 'string', self::UUID],
            'is_entry'     => ['boolean'],
            'path'         => ['required', 'string', 'max:255'],
            'referrer'     => ['nullable', 'string', 'max:2048'],
            'utm_source'   => ['nullable', 'string', 'max:100'],
            'utm_medium'   => ['nullable', 'string', 'max:100'],
            'utm_campaign' => ['nullable', 'string', 'max:100'],
            'locale'       => ['nullable', 'string', 'max:5'],
        ]);

        $ua = $request->userAgent();
        if ($request->user() || UserAgent::isBot($ua)) {
            return response()->noContent();
        }

        $page = $this->resolvePage($data['path']);
        if (! $page) {
            return response()->noContent();
        }

        $isEntry = (bool) ($data['is_entry'] ?? false);
        $referrerHost = $isEntry ? $this->externalHost($data['referrer'] ?? null, $request->getHost()) : null;
        $now = now();
        $local = $now->copy()->setTimezone(config('analytics.timezone'));

        $view = PageView::create([
            'visitor_id'     => strtolower($data['visitor_id']),
            'session_id'     => strtolower($data['session_id']),
            'is_entry'       => $isEntry,
            'is_new_visitor' => ! PageView::where('visitor_id', strtolower($data['visitor_id']))->exists(),
            ...$page,
            'source'         => $isEntry ? $this->classifySource($referrerHost, $data) : null,
            'referrer_host'  => $referrerHost,
            'utm_source'     => $isEntry ? ($data['utm_source'] ?? null) : null,
            'utm_medium'     => $isEntry ? ($data['utm_medium'] ?? null) : null,
            'utm_campaign'   => $isEntry ? ($data['utm_campaign'] ?? null) : null,
            ...UserAgent::parse($ua),
            // Set by Cloudflare when the site sits behind it; otherwise left empty.
            'country'        => $this->country($request->header('CF-IPCountry')),
            'locale'         => in_array($data['locale'] ?? null, ['en', 'ar'], true) ? $data['locale'] : null,
            'viewed_at'      => $now,
            'local_date'     => $local->toDateString(),
            'local_hour'     => $local->hour,
            'local_weekday'  => $local->dayOfWeekIso - 1,
        ]);

        return response()->json(['id' => $view->id], 201);
    }

    /**
     * POST /spa/track/{id}/leave — time spent on a page, sent when the visitor moves on or
     * hides the tab. May arrive more than once; the longest report wins.
     */
    public function leave(Request $request, int $id): Response
    {
        $data = $request->validate([
            'visitor_id' => ['required', 'string', self::UUID],
            'seconds'    => ['required', 'integer', 'min:0'],
        ]);

        $seconds = min($data['seconds'], config('analytics.max_duration_seconds'));

        PageView::whereKey($id)
            ->where('visitor_id', strtolower($data['visitor_id']))
            ->where('viewed_at', '>=', now()->subHours(2))
            ->where(fn ($q) => $q->whereNull('duration_seconds')->orWhere('duration_seconds', '<', $seconds))
            ->update(['duration_seconds' => $seconds]);

        return response()->noContent();
    }

    /** Public pages we count: the home page and published event landing pages. */
    private function resolvePage(string $path): ?array
    {
        $path = '/'.trim(parse_url($path, PHP_URL_PATH) ?: '', '/');

        if ($path === '/') {
            return ['path' => '/', 'page_type' => 'home', 'event_id' => null];
        }

        if (preg_match('#^/events/([^/]+)$#', $path, $m)) {
            $event = Event::where('slug', urldecode($m[1]))->where('is_published', true)->first(['id', 'slug']);

            return $event
                ? ['path' => '/events/'.$event->slug, 'page_type' => 'event', 'event_id' => $event->id]
                : null;
        }

        return null;
    }

    /** Referrer host without "www.", or null for direct visits and links from this site. */
    private function externalHost(?string $referrer, string $ownHost): ?string
    {
        $host = $referrer ? parse_url($referrer, PHP_URL_HOST) : null;
        if (! $host) {
            return null;
        }

        $host = strtolower(preg_replace('/^www\./i', '', $host));

        return $host === strtolower(preg_replace('/^www\./i', '', $ownHost)) ? null : substr($host, 0, 255);
    }

    private function classifySource(?string $host, array $data): string
    {
        if (! empty($data['utm_source']) || ! empty($data['utm_campaign'])) {
            return 'campaign';
        }
        if (! $host) {
            return 'direct';
        }

        $matches = fn (array $needles) => collect($needles)->contains(
            fn ($n) => str_starts_with($host, $n) || str_contains($host, '.'.$n) || $host === rtrim($n, '.'),
        );

        return match (true) {
            $matches(self::SEARCH_HOSTS) => 'search',
            $matches(self::SOCIAL_HOSTS) => 'social',
            default                      => 'referral',
        };
    }

    private function country(?string $code): ?string
    {
        return $code && preg_match('/^[A-Z]{2}$/', $code) && ! in_array($code, ['XX', 'T1'], true) ? $code : null;
    }
}
