<?php

use App\Http\Controllers\Api\ContentApiController;
use Illuminate\Support\Facades\Route;

// Public: translated content map for the given locale
Route::get('/content', [ContentApiController::class, 'index']);
