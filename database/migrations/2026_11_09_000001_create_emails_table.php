<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Emails sent from the dashboard Inbox (replies to contact messages and new emails).
        // `direction` and the threading headers are there so received mail (IMAP) can join
        // the same conversations later.
        Schema::create('emails', function (Blueprint $table) {
            $table->id();
            $table->string('direction', 8)->default('outbound')->index(); // outbound | inbound
            $table->foreignId('contact_message_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // who sent it

            $table->string('from_address');
            $table->string('from_name')->nullable();
            $table->json('to');
            $table->json('cc')->nullable();
            $table->json('bcc')->nullable();
            $table->string('subject');
            $table->longText('body');                  // plain text as typed
            $table->json('attachments')->nullable();   // [{name, path, size, mime}]

            // Threading headers (RFC 5322), without angle brackets.
            $table->string('message_id')->unique();
            $table->string('in_reply_to')->nullable()->index();
            $table->text('references')->nullable();

            $table->string('status', 8)->default('sent')->index(); // sent | failed
            $table->text('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::table('email_settings', function (Blueprint $table) {
            $table->text('signature')->nullable()->after('to_address');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->timestamp('replied_at')->nullable()->after('read_at');
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', fn (Blueprint $table) => $table->dropColumn('replied_at'));
        Schema::table('email_settings', fn (Blueprint $table) => $table->dropColumn('signature'));
        Schema::dropIfExists('emails');
    }
};
