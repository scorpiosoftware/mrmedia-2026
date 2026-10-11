<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            // Uploaded via Site Settings; null = use the built-in Mr.MEDIA artwork.
            $table->string('logo_url', 2048)->nullable();      // for light backgrounds
            $table->string('logo_dark_url', 2048)->nullable(); // for dark backgrounds
            $table->string('favicon_url', 2048)->nullable();   // browser tab / home-screen icon
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'logo_dark_url', 'favicon_url']);
        });
    }
};
