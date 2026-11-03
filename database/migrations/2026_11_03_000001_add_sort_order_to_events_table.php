<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Manual display order, set from the dashboard (like projects and services). */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('is_published');
        });

        // Seed with the previous public order (soonest first) so the site looks unchanged.
        DB::table('events')->orderBy('starts_at')->orderBy('id')->pluck('id')
            ->each(fn ($id, $index) => DB::table('events')->where('id', $id)->update(['sort_order' => $index]));
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
