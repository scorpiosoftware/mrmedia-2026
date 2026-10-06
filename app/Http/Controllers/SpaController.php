<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SpaController extends Controller
{
    private const SITE_NAME = 'Mr.MEDIA';

    public function show(Request $request)
    {
        $path = trim($request->path(), '/');
        $canonical = $request->url();

        return view('spa', $this->resolveSeo($path, $canonical));
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
        return $this->defaultSeo($canonical, self::SITE_NAME, 'noindex, nofollow');
    }

    private function homeSeo(string $canonical): array
    {
        $content = SiteContent::getAllForLocale('en');
        $siteName = self::SITE_NAME;

        $description = $content['hero.subtitle']
            ?? 'Mr.MEDIA is a full-service marketing agency helping brands grow through strategy, creativity and digital excellence.';

        return [
            'title'       => "{$siteName} | Marketing Agency That Moves Markets",
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
        $siteName = self::SITE_NAME;

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

        return array_filter([
            '@context'     => 'https://schema.org',
            '@type'        => 'Organization',
            'name'         => self::SITE_NAME,
            'url'          => url('/'),
            'logo'         => asset('images/logo.png'),
            'description'  => $content['hero.subtitle'] ?? null,
            'email'        => $content['contact.email'] ?? null,
            'telephone'    => $content['contact.phone'] ?? null,
            'address'      => $content['contact.address'] ?? null,
            'sameAs'       => $sameAs ?: null,
        ]);
    }

    private function eventJsonLd(Event $event, string $canonical, string $image): array
    {
        $remaining = $event->capacity
            ? max(0, $event->capacity - (int) $event->submissions_sum_attendees)
            : null;

        $currency = SiteContent::getAllForLocale('en')['events.currency'] ?? 'SAR';

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
                    'name'    => $event->location ?: self::SITE_NAME,
                    'address' => $event->location,
                ]),
            'image'                => [$image],
            'organizer'            => [
                '@type' => 'Organization',
                'name'  => self::SITE_NAME,
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
