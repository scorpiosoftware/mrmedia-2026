<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('id');
            $table->string('mode')->default('offline')->after('type'); // online | offline
            $table->decimal('price', 10, 2)->nullable()->after('capacity'); // null/0 = free
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['slug', 'mode', 'price']);
        });
    }
};
