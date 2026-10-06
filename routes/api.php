<?php

use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\Api\EventApiController;
use App\Models\EmailSettings;
use Illuminate\Support\Facades\Route;

// Public: translated content map for the given locale
Route::get('/content', [ContentApiController::class, 'index']);

// Public: published events & training courses
Route::get('/events', [EventApiController::class, 'index']);
Route::get('/events/{slug}', [EventApiController::class, 'show']);

// Public: safe site settings (whatsapp number, etc.)
Route::get('/settings', function () {
    $s = EmailSettings::getCurrent();
    return response()->json([
        'whatsapp_number'  => $s?->whatsapp_number,
        'whatsapp_visible' => (bool) ($s?->whatsapp_visible ?? true),
    ]);
});
