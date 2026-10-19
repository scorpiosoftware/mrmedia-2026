<?php

use App\Http\Controllers\Admin\EmailSettingsController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\InboxController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\MarqueeBannerController;
use App\Http\Controllers\Admin\PopupController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\SocialLinkController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\EventSubmissionController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\SpaController;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA Auth endpoints  (web middleware = full session pipeline)
|--------------------------------------------------------------------------
*/

// Login — returns the authenticated user (with roles and permissions) as JSON
Route::post('/spa/login', function (Request $request) {
    $credentials = $request->validate([
        'email'    => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (Auth::guard('web')->attempt($credentials)) {
        $request->session()->regenerate();
        return response()->json(Permissions::sessionPayload(Auth::guard('web')->user()));
    }

    return response()->json(['message' => 'These credentials do not match our records.'], 422);
})->middleware('throttle:10,1');

// Current user — 200 with user data (roles + effective permissions), 401 if not authenticated
Route::get('/spa/user', function (Request $request) {
    return $request->user()
        ? response()->json(Permissions::sessionPayload($request->user()))
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

// Admin endpoints — signed in, and each dashboard section behind its permission
// (config/permissions.php). Profile is always available for changing your own password.
Route::middleware('auth:web')->group(function () {
    Route::get('/spa/admin/profile',           [ProfileController::class, 'show']);
    Route::post('/spa/admin/profile/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:6,1');

    Route::middleware('permission:content.manage')->group(function () {
        Route::get('/spa/admin/content',  [ContentApiController::class, 'adminIndex']);
        Route::post('/spa/admin/content', [ContentApiController::class, 'adminUpdate']);
        Route::post('/spa/admin/content/upload-image', [ContentApiController::class, 'uploadImage'])->middleware('throttle:20,1');
        Route::post('/spa/admin/content/contact-entry',          [ContentApiController::class, 'addContactEntry']);
        Route::delete('/spa/admin/content/{siteContent}',        [ContentApiController::class, 'destroyContactEntry']);
    });

    Route::middleware('permission:email-settings.manage')->group(function () {
        Route::get('/spa/admin/email-settings',       [EmailSettingsController::class, 'show']);
        Route::post('/spa/admin/email-settings',      [EmailSettingsController::class, 'update']);
        Route::post('/spa/admin/email-settings/test', [EmailSettingsController::class, 'testSend']);
    });

    Route::middleware('permission:events.manage')->group(function () {
        Route::get('/spa/admin/events',       [EventController::class, 'index']);
        Route::post('/spa/admin/events',      [EventController::class, 'store']);
        Route::post('/spa/admin/events/upload-image', [EventController::class, 'uploadImage'])->middleware('throttle:20,1');
        Route::post('/spa/admin/events/{event}',   [EventController::class, 'update']);
        Route::delete('/spa/admin/events/{event}', [EventController::class, 'destroy']);

        Route::get('/spa/admin/events/{event}/submissions',                 [EventController::class, 'submissions']);
        Route::delete('/spa/admin/events/{event}/submissions/{submission}', [EventController::class, 'destroySubmission']);
    });

    Route::middleware('permission:projects.manage')->group(function () {
        Route::get('/spa/admin/projects',       [ProjectController::class, 'index']);
        Route::post('/spa/admin/projects',      [ProjectController::class, 'store']);
        Route::post('/spa/admin/projects/upload-image', [ProjectController::class, 'uploadImage'])->middleware('throttle:20,1');
        Route::post('/spa/admin/projects/reorder',      [ProjectController::class, 'reorder']);
        Route::post('/spa/admin/projects/{project}',    [ProjectController::class, 'update']);
        Route::delete('/spa/admin/projects/{project}',  [ProjectController::class, 'destroy']);
    });

    Route::middleware('permission:services.manage')->group(function () {
        Route::get('/spa/admin/services',       [ServiceController::class, 'index']);
        Route::post('/spa/admin/services',      [ServiceController::class, 'store']);
        Route::post('/spa/admin/services/reorder',     [ServiceController::class, 'reorder']);
        Route::post('/spa/admin/services/{service}',   [ServiceController::class, 'update']);
        Route::delete('/spa/admin/services/{service}', [ServiceController::class, 'destroy']);
    });

    Route::middleware('permission:inbox.manage')->group(function () {
        Route::get('/spa/admin/inbox',    [InboxController::class, 'index']);
        Route::post('/spa/admin/inbox/{contactMessage}/read',  [InboxController::class, 'markRead']);
        Route::delete('/spa/admin/inbox/{contactMessage}',     [InboxController::class, 'destroy']);
    });

    // The Content page also shows/hides home page sections, so these two accept either permission.
    Route::middleware('permission:site-settings.manage|content.manage')->group(function () {
        Route::get('/spa/admin/site-settings',  [SiteSettingController::class, 'show']);
        Route::post('/spa/admin/site-settings/sections', [SiteSettingController::class, 'updateSections']);
    });

    Route::middleware('permission:site-settings.manage')->group(function () {
        Route::post('/spa/admin/site-settings', [SiteSettingController::class, 'update']);
        Route::post('/spa/admin/site-settings/upload-logo',    [SiteSettingController::class, 'uploadLogo'])->middleware('throttle:20,1');
        Route::post('/spa/admin/site-settings/upload-favicon', [SiteSettingController::class, 'uploadFavicon'])->middleware('throttle:20,1');
    });

    Route::middleware('permission:marquee.manage')->group(function () {
        Route::get('/spa/admin/marquee',  [MarqueeBannerController::class, 'show']);
        Route::post('/spa/admin/marquee', [MarqueeBannerController::class, 'update']);
    });

    Route::middleware('permission:popup.manage')->group(function () {
        Route::get('/spa/admin/popup',  [PopupController::class, 'show']);
        Route::post('/spa/admin/popup', [PopupController::class, 'update']);
        Route::post('/spa/admin/popup/upload-image', [PopupController::class, 'uploadImage'])->middleware('throttle:20,1');
    });

    Route::middleware('permission:social-links.manage')->group(function () {
        Route::get('/spa/admin/social-links',       [SocialLinkController::class, 'index']);
        Route::post('/spa/admin/social-links',      [SocialLinkController::class, 'store']);
        Route::post('/spa/admin/social-links/reorder',          [SocialLinkController::class, 'reorder']);
        Route::post('/spa/admin/social-links/{socialLink}',     [SocialLinkController::class, 'update']);
        Route::delete('/spa/admin/social-links/{socialLink}',   [SocialLinkController::class, 'destroy']);
    });

    Route::middleware('permission:users.manage')->group(function () {
        Route::get('/spa/admin/users',            [UserController::class, 'index']);
        Route::post('/spa/admin/users',           [UserController::class, 'store']);
        Route::post('/spa/admin/users/{user}',    [UserController::class, 'update']);
        Route::delete('/spa/admin/users/{user}',  [UserController::class, 'destroy']);
    });

    Route::middleware('permission:roles.manage')->group(function () {
        Route::get('/spa/admin/roles',            [RoleController::class, 'index']);
        Route::post('/spa/admin/roles',           [RoleController::class, 'store']);
        Route::post('/spa/admin/roles/{role}',    [RoleController::class, 'update']);
        Route::delete('/spa/admin/roles/{role}',  [RoleController::class, 'destroy']);
    });
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
