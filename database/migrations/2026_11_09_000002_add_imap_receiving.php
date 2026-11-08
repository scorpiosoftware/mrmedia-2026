<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Receiving email: the mailbox's IMAP settings (set with `php artisan mail:imap-setup`)
 * and the fields received emails need. Conversations are grouped by `thread_id`
 * (the id of the conversation's first email).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_settings', function (Blueprint $table) {
            $table->boolean('imap_enabled')->default(false);
            $table->string('imap_host')->nullable();
            $table->unsignedInteger('imap_port')->nullable();
            $table->string('imap_encryption', 8)->nullable();   // ssl | tls | none
            $table->string('imap_username')->nullable();
            $table->text('imap_password')->nullable();          // encrypted
            $table->string('imap_folder')->default('INBOX');
            $table->string('imap_sent_folder')->nullable();     // where copies of dashboard emails are saved
            $table->unsignedBigInteger('imap_uidvalidity')->nullable();
            $table->unsignedBigInteger('imap_last_uid')->default(0);
            $table->timestamp('imap_synced_at')->nullable();
            $table->text('imap_error')->nullable();
        });

        Schema::table('emails', function (Blueprint $table) {
            $table->unsignedBigInteger('thread_id')->nullable()->after('id')->index();
            $table->string('reply_to_address')->nullable()->after('from_name');
            $table->longText('body_html')->nullable()->after('body');
            $table->boolean('is_read')->default(true)->after('status')->index();
            $table->unsignedBigInteger('imap_uid')->nullable()->after('is_read');
        });

        // Emails sent before conversations existed: each reply chain to a contact message is
        // one conversation, every other email its own.
        DB::table('emails')->whereNull('contact_message_id')->update(['thread_id' => DB::raw('id')]);
        DB::table('emails')->whereNotNull('contact_message_id')
            ->select('contact_message_id', DB::raw('MIN(id) as first_id'))
            ->groupBy('contact_message_id')
            ->get()
            ->each(fn ($row) => DB::table('emails')
                ->where('contact_message_id', $row->contact_message_id)
                ->update(['thread_id' => $row->first_id]));
    }

    public function down(): void
    {
        Schema::table('emails', function (Blueprint $table) {
            $table->dropIndex(['thread_id']);
            $table->dropIndex(['is_read']);
            $table->dropColumn(['thread_id', 'reply_to_address', 'body_html', 'is_read', 'imap_uid']);
        });

        Schema::table('email_settings', function (Blueprint $table) {
            $table->dropColumn([
                'imap_enabled', 'imap_host', 'imap_port', 'imap_encryption', 'imap_username', 'imap_password',
                'imap_folder', 'imap_sent_folder', 'imap_uidvalidity', 'imap_last_uid', 'imap_synced_at', 'imap_error',
            ]);
        });
    }
};
