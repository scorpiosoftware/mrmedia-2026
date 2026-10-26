<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * starts_at / ends_at hold the wall-clock time typed in the dashboard; this is the venue's
     * timezone they're in, so the site can show the venue's time and know when an event has passed.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('timezone', 64)->default('Asia/Baghdad')->after('ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('timezone');
        });
    }
};
