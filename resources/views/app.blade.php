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

        {{-- Google Fonts: Poppins (EN) + Cairo (AR) --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

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
