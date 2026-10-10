<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Which registration form fields the public form must require, e.g. ["name","email"].
            // "attendees" is always required and isn't part of this list.
            $table->json('required_fields')->nullable()->after('capacity');
        });

        DB::table('events')->whereNull('required_fields')->update([
            'required_fields' => json_encode(['name', 'email']),
        ]);
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('required_fields');
        });
    }
};
