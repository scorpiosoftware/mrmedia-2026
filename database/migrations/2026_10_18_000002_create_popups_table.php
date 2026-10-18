<?php

use App\Models\Popup;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single-row settings table for the home-page popup carousel (Admin → Popup).
        Schema::create('popups', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(false); // off until the admin adds slides and turns it on

            // [{ image_url, link_url, alt, alt_ar }, …] in display order
            $table->json('slides')->nullable();

            // When / how often visitors see it
            $table->unsignedTinyInteger('delay_seconds')->default(2);
            $table->string('frequency', 10)->default('once'); // once | session | always

            // Carousel
            $table->boolean('autoplay')->default(true);
            $table->unsignedTinyInteger('interval_seconds')->default(5);
            $table->string('aspect_ratio', 5)->default('1/1'); // 1/1 | 4/5 | 16/9

            $table->timestamps();
        });

        Popup::create(Popup::DEFAULTS);
    }

    public function down(): void
    {
        Schema::dropIfExists('popups');
    }
};
