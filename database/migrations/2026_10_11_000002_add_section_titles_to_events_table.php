<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Per-event overrides for landing-page section headings, e.g.
            // { "agenda": "...", "agenda_ar": "...", "trainer": ..., "payment": ..., "cta_button": ... }.
            // Blank keys fall back to the site-wide labels in site_contents.
            $table->json('section_titles')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('section_titles');
        });
    }
};
