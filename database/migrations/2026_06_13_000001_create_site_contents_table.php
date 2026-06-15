<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_contents', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('section')->index();
            $table->text('en_value')->nullable();
            $table->text('ar_value')->nullable();
            $table->string('type')->default('text'); // text | textarea | html | image
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_contents');
    }
};
