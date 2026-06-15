<?php

use App\Http\Controllers\Api\ContentApiController;
use App\Models\EmailSettings;
use Illuminate\Support\Facades\Route;

// Public: translated content map for the given locale
Route::get('/content', [ContentApiController::class, 'index']);

// Public: safe site settings (whatsapp number, etc.)
Route::get('/settings', function () {
    $s = EmailSettings::getCurrent();
    return response()->json([
        'whatsapp_number'  => $s?->whatsapp_number,
        'whatsapp_visible' => (bool) ($s?->whatsapp_visible ?? true),
    ]);
});
