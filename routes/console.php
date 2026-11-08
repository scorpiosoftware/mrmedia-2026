<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Deletes page views older than config('analytics.retention_days').
Schedule::command('model:prune', ['--model' => [\App\Models\PageView::class]])->daily();
