<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('service');
            $table->text('message');

            // Submission attempt metadata — lets an admin spot bulk/bot activity.
            $table->string('ip_address', 45)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->boolean('is_spam')->default(false)->index();

            $table->boolean('is_read')->default(false)->index();
            $table->timestamp('read_at')->nullable();

            // Whether the notification email actually went out. The message is stored
            // either way, so a mail outage can never lose an enquiry.
            $table->boolean('mail_delivered')->default(false);
            $table->text('mail_error')->nullable();

            $table->timestamps();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
