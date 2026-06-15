<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('email_settings', function (Blueprint $table) {
            $table->boolean('whatsapp_visible')->default(true)->after('whatsapp_number');
        });
    }

    public function down(): void
    {
        Schema::table('email_settings', function (Blueprint $table) {
            $table->dropColumn('whatsapp_visible');
        });
    }
};
