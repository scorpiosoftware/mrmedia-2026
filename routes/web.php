<?php

use App\Http\Controllers\Admin\EmailSettingsController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\InboxController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\SocialLinkController;
use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\EventSubmissionController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\SpaController;
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

// Public contact form submission
Route::post('/spa/contact', [ContactController::class, 'send'])->middleware('throttle:contact');

// Public: submit/register for an event or training course
Route::post('/spa/events/{event}/submit', [EventSubmissionController::class, 'store'])->middleware('throttle:event-submission');

// Admin endpoints (auth required)
Route::middleware('auth:web')->group(function () {
    Route::get('/spa/admin/content',  [ContentApiController::class, 'adminIndex']);
    Route::post('/spa/admin/content', [ContentApiController::class, 'adminUpdate']);

    Route::get('/spa/admin/email-settings',       [EmailSettingsController::class, 'show']);
    Route::post('/spa/admin/email-settings',      [EmailSettingsController::class, 'update']);
    Route::post('/spa/admin/email-settings/test', [EmailSettingsController::class, 'testSend']);

    Route::get('/spa/admin/events',       [EventController::class, 'index']);
    Route::post('/spa/admin/events',      [EventController::class, 'store']);
    Route::post('/spa/admin/events/upload-image', [EventController::class, 'uploadImage'])->middleware('throttle:20,1');
    Route::post('/spa/admin/events/{event}',   [EventController::class, 'update']);
    Route::delete('/spa/admin/events/{event}', [EventController::class, 'destroy']);

    Route::get('/spa/admin/events/{event}/submissions',                 [EventController::class, 'submissions']);
    Route::delete('/spa/admin/events/{event}/submissions/{submission}', [EventController::class, 'destroySubmission']);

    Route::get('/spa/admin/projects',       [ProjectController::class, 'index']);
    Route::post('/spa/admin/projects',      [ProjectController::class, 'store']);
    Route::post('/spa/admin/projects/upload-image', [ProjectController::class, 'uploadImage'])->middleware('throttle:20,1');
    Route::post('/spa/admin/projects/reorder',      [ProjectController::class, 'reorder']);
    Route::post('/spa/admin/projects/{project}',    [ProjectController::class, 'update']);
    Route::delete('/spa/admin/projects/{project}',  [ProjectController::class, 'destroy']);

    Route::get('/spa/admin/services',       [ServiceController::class, 'index']);
    Route::post('/spa/admin/services',      [ServiceController::class, 'store']);
    Route::post('/spa/admin/services/reorder',     [ServiceController::class, 'reorder']);
    Route::post('/spa/admin/services/{service}',   [ServiceController::class, 'update']);
    Route::delete('/spa/admin/services/{service}', [ServiceController::class, 'destroy']);

    Route::get('/spa/admin/inbox',    [InboxController::class, 'index']);
    Route::post('/spa/admin/inbox/{contactMessage}/read',  [InboxController::class, 'markRead']);
    Route::delete('/spa/admin/inbox/{contactMessage}',     [InboxController::class, 'destroy']);

    Route::get('/spa/admin/social-links',       [SocialLinkController::class, 'index']);
    Route::post('/spa/admin/social-links',      [SocialLinkController::class, 'store']);
    Route::post('/spa/admin/social-links/reorder',          [SocialLinkController::class, 'reorder']);
    Route::post('/spa/admin/social-links/{socialLink}',     [SocialLinkController::class, 'update']);
    Route::delete('/spa/admin/social-links/{socialLink}',   [SocialLinkController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| SEO
|--------------------------------------------------------------------------
*/
Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);

/*
|--------------------------------------------------------------------------
| SPA catch-all  (must be last — serves the React app for every other URL)
|--------------------------------------------------------------------------
*/
Route::get('/{any?}', [SpaController::class, 'show'])
    ->where('any', '^(?!api|storage|up|spa).*$')
    ->name('spa');

require __DIR__.'/settings.php';
