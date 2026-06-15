<!DOCTYPE html>
@php
    $locale = session('locale', config('app.locale', 'en'));
    $dir    = $locale === 'ar' ? 'rtl' : 'ltr';
    $lang   = $locale;
@endphp
<html lang="{{ $lang }}" dir="{{ $dir }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#213C93">

        {{-- Google Fonts: Poppins (EN) + Cairo (AR) --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

        <link rel="icon" href="/favicon.ico" sizes="any">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/spa.jsx'])
    </head>
    <body class="antialiased">
        <div id="app"></div>
    </body>
</html>
