<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SiteContent;
use App\Models\SiteSetting;
use App\Support\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

    /** Uploaded logo (Site Settings) or the built-in one — used for link previews and search-engine data. */
    private function logoUrl(): string
    {
        return $this->absoluteUrl(SiteSetting::current()->logo_url) ?? asset('images/logo.png');
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
            'ogImage'     => $this->logoUrl(),
            'ogType'      => 'website',
            'robots'      => 'index, follow',
            'jsonLd'      => $this->organizationJsonLd($content),
            'preloadImage' => $this->heroPreload($content['hero.image'] ?? null),
        ];
    }

    /**
     * The hero image is usually the LCP element, but the SPA only learns its URL after the JS
     * and the content API have loaded. Preloading it from the HTML starts the download at once.
     * srcset/sizes mirror the hero <ResponsiveImage> so the browser fetches the same file.
     */
    private function heroPreload(?string $url): ?array
    {
        $hidden = SiteSetting::current()->hidden_sections ?? [];
        if (! $url || in_array('hero', $hidden, true)) {
            return null;
        }

        $srcset = null;
        if (preg_match('#/storage/(content|projects|events|branding|popup)/[0-9a-f-]{36}\.webp$#i', $url)) {
            $relative = substr(parse_url($url, PHP_URL_PATH), strlen('/storage/'));
            $variants = ImageOptimizer::variantPaths($relative);
            // Only advertise copies that exist (images uploaded before they did may not have them).
            if (collect($variants)->every(fn ($p) => Storage::disk('public')->exists($p))) {
                $base = substr($url, 0, -strlen('.webp'));
                $srcset = collect(ImageOptimizer::VARIANT_WIDTHS)
                    ->map(fn ($w) => "{$base}-w{$w}.webp {$w}w")
                    ->push("{$url} ".ImageOptimizer::MAX_SIDE.'w')
                    ->implode(', ');
            }
        }

        return [
            'href'   => $url,
            'srcset' => $srcset,
            // Same as the hero image's `sizes` in Hero.jsx — keep the two in sync.
            'sizes'  => '(min-width: 1280px) 584px, (min-width: 1024px) 46vw, (min-width: 768px) 448px, (min-width: 640px) 384px, 256px',
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

        $image = $this->absoluteUrl($event->image_url) ?? $this->logoUrl();

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
            'ogImage'     => $this->logoUrl(),
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
            'logo'         => $this->logoUrl(),
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
