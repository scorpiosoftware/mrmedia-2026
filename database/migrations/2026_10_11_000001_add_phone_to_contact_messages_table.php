<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            // Stored with its country code, e.g. "+964 7701234567".
            $table->string('phone', 32)->nullable()->after('email');

            // Only name and phone are required on the form now.
            $table->string('email')->nullable()->change();
            $table->string('service')->nullable()->change();
            $table->text('message')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropColumn('phone');
        });
    }
};
