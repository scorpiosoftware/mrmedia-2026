<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->string('slug')->unique();
            $table->string('category')->default('brand'); // brand | digital | media | ...
            $table->string('client')->nullable();
            $table->string('client_ar')->nullable();
            $table->text('description')->nullable();
            $table->text('description_ar')->nullable();
            $table->string('external_url')->nullable();
            $table->string('image_url')->nullable();
            $table->string('color')->default('#213C93');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
