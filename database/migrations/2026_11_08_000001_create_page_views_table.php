<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();

            // Anonymous ids generated in the visitor's browser (no IPs or personal data).
            $table->string('visitor_id', 36)->index();
            $table->string('session_id', 36)->index();
            $table->boolean('is_entry')->default(false);        // first page of the session
            $table->boolean('is_new_visitor')->default(false);  // first page this visitor ever viewed

            $table->string('path', 255);
            $table->string('page_type', 16)->index();           // home | event
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();

            // Where the session came from — recorded on its entry page only.
            $table->string('source', 16)->nullable();           // direct | search | social | referral | campaign
            $table->string('referrer_host', 255)->nullable();
            $table->string('utm_source', 100)->nullable();
            $table->string('utm_medium', 100)->nullable();
            $table->string('utm_campaign', 100)->nullable();

            $table->string('device', 16)->nullable();           // desktop | mobile | tablet
            $table->string('browser', 32)->nullable();
            $table->string('os', 32)->nullable();
            $table->string('country', 2)->nullable();
            $table->string('locale', 5)->nullable();

            $table->unsignedInteger('duration_seconds')->nullable();

            $table->timestamp('viewed_at')->index();
            // Day / hour in the statistics timezone (config/analytics.php), so grouping is plain SQL on any database.
            $table->date('local_date')->index();
            $table->unsignedTinyInteger('local_hour');
            $table->unsignedTinyInteger('local_weekday');       // 0 = Monday … 6 = Sunday
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
