<!DOCTYPE html>
@php
    $siteSettings = $siteSettings ?? [];
    $siteName     = $siteSettings['site_name'] ?? 'Mr.MEDIA';
    $locale = session('locale', $siteSettings['default_locale'] ?? config('app.locale', 'en'));
    $dir    = $locale === 'ar' ? 'rtl' : 'ltr';
    $lang   = $locale;

    $title       = $title ?? $siteName;
    $themeVars   = $themeVars ?? [];
    $themeStyle  = collect($themeVars)->map(fn ($v, $k) => "{$k}: {$v}")->implode('; ');
    $description = $description ?? null;
    $canonical   = $canonical ?? url()->current();
    $ogImage     = $ogImage ?? ($siteSettings['logo_url'] ?? null) ?? asset('images/logo.png');
    $ogType      = $ogType ?? 'website';
    $robots      = $robots ?? 'index, follow';
    $jsonLd      = $jsonLd ?? null;
    $preloadImage = $preloadImage ?? null;
@endphp
<html lang="{{ $lang }}" dir="{{ $dir }}" @if ($themeStyle) style="{{ $themeStyle }}" @endif>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="{{ $themeColor ?? '#213C93' }}">

        <title>{{ $title }}</title>
        @if ($description)
            <meta name="description" content="{{ $description }}">
        @endif
        <meta name="robots" content="{{ $robots }}">
        <link rel="canonical" href="{{ $canonical }}">

        {{-- LCP image (home hero): start downloading before the JS has even loaded --}}
        @if ($preloadImage)
            <link rel="preload" as="image" fetchpriority="high" href="{{ $preloadImage['href'] }}"
                @if ($preloadImage['srcset']) imagesrcset="{{ $preloadImage['srcset'] }}" imagesizes="{{ $preloadImage['sizes'] }}" @endif>
        @endif

        {{-- Open Graph --}}
        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:type" content="{{ $ogType }}">
        <meta property="og:title" content="{{ $title }}">
        @if ($description)
            <meta property="og:description" content="{{ $description }}">
        @endif
        <meta property="og:url" content="{{ $canonical }}">
        <meta property="og:image" content="{{ $ogImage }}">
        <meta property="og:locale" content="{{ $locale === 'ar' ? 'ar_AR' : 'en_US' }}">

        {{-- Twitter card --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $title }}">
        @if ($description)
            <meta name="twitter:description" content="{{ $description }}">
        @endif
        <meta name="twitter:image" content="{{ $ogImage }}">

        @if ($jsonLd)
            <script type="application/ld+json">{!! json_encode($jsonLd, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
        @endif

        @if (! empty($siteSettings['favicon_url']))
            {{-- Uploaded in Site Settings --}}
            <link rel="icon" href="{{ $siteSettings['favicon_url'] }}" type="image/png">
            <link rel="apple-touch-icon" href="{{ $siteSettings['favicon_url'] }}">
        @else
            <link rel="icon" href="/favicon.ico" sizes="any">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        @endif

        {{-- Site settings for first paint (default language/appearance, theme, name) --}}
        <script>window.__SITE_SETTINGS__ = {!! json_encode($siteSettings, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!};</script>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/spa.jsx'])
    </head>
    <body class="antialiased">
        <div id="app"></div>
    </body>
</html>
