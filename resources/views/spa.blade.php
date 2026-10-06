<!DOCTYPE html>
@php
    $locale = session('locale', config('app.locale', 'en'));
    $dir    = $locale === 'ar' ? 'rtl' : 'ltr';
    $lang   = $locale;

    $title       = $title ?? 'Mr.MEDIA';
    $description = $description ?? null;
    $canonical   = $canonical ?? url()->current();
    $ogImage     = $ogImage ?? asset('images/logo.png');
    $ogType      = $ogType ?? 'website';
    $robots      = $robots ?? 'index, follow';
    $jsonLd      = $jsonLd ?? null;
@endphp
<html lang="{{ $lang }}" dir="{{ $dir }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#213C93">

        <title>{{ $title }}</title>
        @if ($description)
            <meta name="description" content="{{ $description }}">
        @endif
        <meta name="robots" content="{{ $robots }}">
        <link rel="canonical" href="{{ $canonical }}">

        {{-- Open Graph --}}
        <meta property="og:site_name" content="Mr.MEDIA">
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

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/spa.jsx'])
    </head>
    <body class="antialiased">
        <div id="app"></div>
    </body>
</html>
