<!DOCTYPE html>
@php
    $locale = session('locale', config('app.locale', 'en'));
    $dir    = $locale === 'ar' ? 'rtl' : 'ltr';
    $lang   = $locale === 'ar' ? 'ar' : 'en';
@endphp
<html lang="{{ $lang }}" dir="{{ $dir }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Brand meta --}}
        <meta name="theme-color" content="#213C93">
        <meta name="description" content="Mr.MEDIA – Marketing Agency that moves markets.">
        <meta name="robots" content="noindex, nofollow">
        <title>Settings | Mr.MEDIA</title>

        {{-- Dark mode detection --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';
                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) document.documentElement.classList.add('dark');
                }
            })();
        </script>

        <style>
            html { background-color: #F1F1F0; }
            html.dark { background-color: #0D1B4B; }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/spa.jsx'])
    </head>
    <body class="font-sans antialiased">
        <div id="app"></div>
    </body>
</html>
