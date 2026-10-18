<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            // Home-page sections switched off in Content Editor. Null/empty = everything shown,
            // so existing sites are unchanged and no site content rows are touched.
            $table->json('hidden_sections')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('hidden_sections');
        });
    }
};
