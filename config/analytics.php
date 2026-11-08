<?php

/*
|--------------------------------------------------------------------------
| First-party visitor statistics
|--------------------------------------------------------------------------
|
| Page views are recorded by the public site (POST /spa/track) and shown on the
| dashboard's Statistics page. Visitors are identified by an anonymous random id the
| browser keeps — no IP addresses or personal details are stored.
|
*/

return [

    // Days are grouped and the busiest-hours chart is drawn in this timezone.
    'timezone' => env('ANALYTICS_TIMEZONE', 'Asia/Baghdad'),

    // Page views older than this are deleted by `php artisan model:prune` (scheduled daily).
    'retention_days' => (int) env('ANALYTICS_RETENTION_DAYS', 400),

    // Longest time on a page we accept; anything above is a tab left open.
    'max_duration_seconds' => 1800,

    // "Visitors right now" counts anyone who opened a page within this many minutes.
    'realtime_minutes' => 5,

];
