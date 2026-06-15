<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_settings', function (Blueprint $table) {
            $table->id();
            $table->string('driver')->default('smtp');
            $table->string('host')->nullable();
            $table->unsignedSmallInteger('port')->default(587);
            $table->string('username')->nullable();
            $table->text('password')->nullable();
            $table->string('encryption')->nullable(); // tls | ssl | null
            $table->string('from_address');
            $table->string('from_name');
            $table->string('to_address')->nullable(); // where contact form submissions go
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_settings');
    }
};
