<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SiteContent;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SpaController extends Controller
{
    public function show(Request $request)
    {
        $path = trim($request->path(), '/');
        $canonical = $request->url();
        $settings = SiteSetting::current();

        return view('spa', [
            ...$this->resolveSeo($path, $canonical),
            'siteSettings' => $settings->publicPayload(),
            // The admin panel keeps its fixed brand colours; only the public site is themed.
            'themeVars'    => str_starts_with($path, 'admin') ? [] : $settings->themeCssVars(),
            'themeColor'   => $settings->colors()['primary'],
        ]);
    }

    private function siteName(): string
    {
        return SiteSetting::current()->site_name;
    }

    private function resolveSeo(string $path, string $canonical): array
    {
        if ($path === '') {
            return $this->homeSeo($canonical);
        }

        if (preg_match('#^events/([^/]+)$#', $path, $m)) {
            return $this->eventSeo($m[1], $canonical);
        }

        // Admin screens, auth redirects, and anything else under the SPA catch-all
        return $this->defaultSeo($canonical, $this->siteName(), 'noindex, nofollow');
    }

    private function homeSeo(string $canonical): array
    {
        $content = SiteContent::getAllForLocale('en');
        $siteName = $this->siteName();
        $tagline = SiteSetting::current()->tagline;

        $description = $content['hero.subtitle']
            ?? "{$siteName} is a full-service marketing agency helping brands grow through strategy, creativity and digital excellence.";

        return [
            'title'       => $tagline ? "{$siteName} | {$tagline}" : $siteName,
            'description' => $description,
            'canonical'   => $canonical,
            'ogImage'     => asset('images/logo.png'),
            'ogType'      => 'website',
            'robots'      => 'index, follow',
            'jsonLd'      => $this->organizationJsonLd($content),
        ];
    }

    private function eventSeo(string $slug, string $canonical): array
    {
        $siteName = $this->siteName();

        $event = Event::where('slug', $slug)
            ->where('is_published', true)
            ->withSum('submissions', 'attendees')
            ->first();

        if (! $event) {
            return $this->defaultSeo($canonical, "Event Not Found | {$siteName}", 'noindex, follow');
        }

        $description = $event->description
            ? Str::limit(trim(preg_replace('/\s+/', ' ', strip_tags($event->description))), 160)
            : "Join {$event->title}, hosted by {$siteName}.";

        $image = $this->absoluteUrl($event->image_url) ?? asset('images/logo.png');

        return [
            'title'       => "{$event->title} | {$siteName}",
            'description' => $description,
            'canonical'   => $canonical,
            'ogImage'     => $image,
            'ogType'      => 'event',
            'robots'      => 'index, follow',
            'jsonLd'      => $this->eventJsonLd($event, $canonical, $image),
        ];
    }

    private function defaultSeo(string $canonical, string $title, string $robots): array
    {
        return [
            'title'       => $title,
            'description' => null,
            'canonical'   => $canonical,
            'ogImage'     => asset('images/logo.png'),
            'ogType'      => 'website',
            'robots'      => $robots,
            'jsonLd'      => null,
        ];
    }

    private function absoluteUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Str::startsWith($path, ['http://', 'https://']) ? $path : asset(ltrim($path, '/'));
    }

    private function organizationJsonLd(array $content): array
    {
        $sameAs = array_values(array_filter([
            $content['footer.social.instagram'] ?? null,
            $content['footer.social.twitter'] ?? null,
            $content['footer.social.linkedin'] ?? null,
        ]));

        // Schema.org accepts a single value or a list; only emit a list when there's more than one.
        $listOrSingle = fn (array $values) => count($values) > 1 ? $values : ($values[0] ?? null);

        return array_filter([
            '@context'     => 'https://schema.org',
            '@type'        => 'Organization',
            'name'         => $this->siteName(),
            'url'          => url('/'),
            'logo'         => asset('images/logo.png'),
            'description'  => $content['hero.subtitle'] ?? null,
            'email'        => $listOrSingle(SiteContent::contactList($content, 'email')),
            'telephone'    => $listOrSingle(SiteContent::contactList($content, 'phone')),
            'address'      => $listOrSingle(SiteContent::contactList($content, 'address')),
            'sameAs'       => $sameAs ?: null,
        ]);
    }

    private function eventJsonLd(Event $event, string $canonical, string $image): array
    {
        $remaining = $event->capacity
            ? max(0, $event->capacity - (int) $event->submissions_sum_attendees)
            : null;

        $currency = SiteContent::getAllForLocale('en')['events.currency'] ?? 'IQD';

        return array_filter([
            '@context'             => 'https://schema.org',
            '@type'                => 'Event',
            'name'                 => $event->title,
            'description'          => $event->description ? strip_tags($event->description) : null,
            'startDate'            => $event->starts_at?->toIso8601String(),
            'endDate'              => $event->ends_at?->toIso8601String(),
            'eventAttendanceMode'  => $event->mode === 'online'
                ? 'https://schema.org/OnlineEventAttendanceMode'
                : 'https://schema.org/OfflineEventAttendanceMode',
            'eventStatus'          => 'https://schema.org/EventScheduled',
            'location'             => $event->mode === 'online'
                ? ['@type' => 'VirtualLocation', 'url' => $canonical]
                : array_filter([
                    '@type'   => 'Place',
                    'name'    => $event->location ?: $this->siteName(),
                    'address' => $event->location,
                ]),
            'image'                => [$image],
            'organizer'            => [
                '@type' => 'Organization',
                'name'  => $this->siteName(),
                'url'   => url('/'),
            ],
            'offers'               => array_filter([
                '@type'         => 'Offer',
                'price'         => (string) ($event->price ?? '0'),
                'priceCurrency' => $currency,
                'availability'  => $remaining !== null && $remaining <= 0
                    ? 'https://schema.org/SoldOut'
                    : 'https://schema.org/InStock',
                'url'           => $canonical,
            ]),
        ]);
    }
}
