<?php

use App\Models\SiteSetting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single-row, site-wide configuration: identity, defaults and theme.
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name')->default('Mr.MEDIA');
            $table->string('site_name_ar')->nullable();
            $table->string('tagline')->nullable();
            $table->string('tagline_ar')->nullable();
            $table->string('default_locale', 2)->default('en');           // en | ar
            $table->string('default_appearance', 10)->default('system');  // system | light | dark
            $table->string('theme', 20)->default('classic');              // a SiteSetting::THEMES key, or "custom"
            $table->json('custom_colors')->nullable();                    // used when theme = custom
            $table->timestamps();
        });

        SiteSetting::create(SiteSetting::DEFAULTS);
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
