<?php

use App\Http\Controllers\Api\ContentApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA Auth endpoints  (web middleware = full session pipeline)
|--------------------------------------------------------------------------
*/

// Login — returns the authenticated user as JSON
Route::post('/spa/login', function (Request $request) {
    $credentials = $request->validate([
        'email'    => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (Auth::guard('web')->attempt($credentials)) {
        $request->session()->regenerate();
        return response()->json(Auth::guard('web')->user()->only('id', 'name', 'email'));
    }

    return response()->json(['message' => 'These credentials do not match our records.'], 422);
})->middleware('throttle:10,1');

// Current user — 200 with user data, 401 if not authenticated
Route::get('/spa/user', function (Request $request) {
    return $request->user()
        ? response()->json($request->user()->only('id', 'name', 'email'))
        : response()->json(null, 401);
})->middleware('auth:web');

// Logout
Route::post('/spa/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return response()->json(['ok' => true]);
});

// Admin content editor endpoints (auth required)
Route::middleware('auth:web')->group(function () {
    Route::get('/spa/admin/content',  [ContentApiController::class, 'adminIndex']);
    Route::post('/spa/admin/content', [ContentApiController::class, 'adminUpdate']);
});

/*
|--------------------------------------------------------------------------
| SPA catch-all  (must be last — serves the React app for every other URL)
|--------------------------------------------------------------------------
*/
Route::get('/{any?}', fn () => view('spa'))
    ->where('any', '^(?!api|storage|up|spa).*$')
    ->name('spa');

require __DIR__.'/settings.php';
