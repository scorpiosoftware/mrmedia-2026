<?php

use App\Models\MarqueeBanner;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single-row settings table for the scrolling phrases banner on the home page.
        Schema::create('marquee_banners', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(true);

            // [{ text, text_ar, style: solid|highlight|outline }, …] in display order
            $table->json('phrases')->nullable();

            // Motion
            $table->unsignedSmallInteger('speed')->default(60); // pixels per second
            $table->string('direction', 10)->default('left');   // left | right
            $table->boolean('pause_on_hover')->default(true);

            // Appearance
            $table->string('separator', 20)->default('sparkle'); // sparkle | star | diamond | dot | asterisk | logo | none
            $table->string('font_size', 5)->default('md');       // sm | md | lg
            $table->string('background_color', 9)->default('#213C93');
            $table->string('text_color', 9)->default('#FFFFFF');
            $table->string('highlight_color', 9)->default('#FCD532');
            $table->boolean('tilted')->default(false);
            $table->boolean('double_row')->default(false);

            $table->timestamps();
        });

        MarqueeBanner::create(MarqueeBanner::DEFAULTS);
    }

    public function down(): void
    {
        Schema::dropIfExists('marquee_banners');
    }
};
