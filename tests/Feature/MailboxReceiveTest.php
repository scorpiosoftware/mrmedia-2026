<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\Email;
use App\Models\EmailSettings;
use App\Models\User;
use App\Support\Mailbox\FetchedEmail;
use App\Support\Mailbox\MailboxClient;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Fakes\FakeMailboxClient;
use Tests\TestCase;

class MailboxReceiveTest extends TestCase
{
    use RefreshDatabase;

    private FakeMailboxClient $mailbox;

    private EmailSettings $settings;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $this->mailbox = new FakeMailboxClient();
        $this->app->instance(MailboxClient::class, $this->mailbox);

        $this->settings = EmailSettings::create([
            'driver' => 'smtp', 'host' => 'moalloul.com', 'port' => 465, 'username' => 'info@moalloul.com',
            'password' => 'mailbox-pass', 'encryption' => 'ssl',
            'from_address' => 'info@moalloul.com', 'from_name' => 'Mo.Alloul',
        ]);

        $this->admin = User::factory()->create()->givePermissionTo('inbox.manage');
    }

    private function enableImap(): void
    {
        $this->settings->update([
            'imap_enabled' => true, 'imap_host' => 'moalloul.com', 'imap_port' => 993, 'imap_encryption' => 'ssl',
            'imap_username' => 'info@moalloul.com', 'imap_password' => 'mailbox-pass', 'imap_sent_folder' => 'INBOX.Sent',
        ]);
    }

    private function incoming(int $uid, array $overrides = []): FetchedEmail
    {
        $o = array_merge([
            'messageId' => "msg-{$uid}@gmail.com",
            'inReplyTo' => null,
            'references' => [],
            'from' => ['address' => 'client@gmail.com', 'name' => 'Mohammad Alloul'],
            'replyTo' => null,
            'subject' => "Question {$uid}",
            'text' => "Hello, this is message {$uid}.",
            'html' => null,
            'attachments' => [],
            'sentByThisSite' => false,
        ], $overrides);

        return new FetchedEmail(
            uid: $uid, messageId: $o['messageId'], inReplyTo: $o['inReplyTo'], references: $o['references'],
            from: $o['from'], replyTo: $o['replyTo'], to: ['info@moalloul.com'], cc: [], subject: $o['subject'],
            date: Carbon::parse('2026-11-08 10:00:00'), text: $o['text'], html: $o['html'],
            attachments: $o['attachments'], sentByThisSite: $o['sentByThisSite'],
        );
    }

    public function test_fetch_stores_new_mail_and_remembers_where_it_stopped(): void
    {
        $this->enableImap();
        $this->mailbox->messages = [
            $this->incoming(10),
            $this->incoming(11, ['sentByThisSite' => true]),   // a contact-form notification — skipped
            $this->incoming(12, ['attachments' => [['name' => 'brief.pdf', 'mime' => 'application/pdf', 'content' => '%PDF-1.4', 'content_id' => null, 'inline' => false]]]),
        ];

        $this->artisan('mail:fetch')->expectsOutputToContain('Fetched 2 new email(s)')->assertSuccessful();

        $this->assertSame(2, Email::where('direction', 'inbound')->count());
        $email = Email::where('message_id', 'msg-12@gmail.com')->first();
        $this->assertFalse($email->is_read);
        $this->assertSame($email->id, $email->thread_id);
        $this->assertSame('brief.pdf', $email->attachment_list[0]['name']);
        Storage::disk('local')->assertExists($email->attachments[0]['path']);

        $settings = $this->settings->fresh();
        $this->assertSame(12, $settings->imap_last_uid);
        $this->assertSame(1001, $settings->imap_uidvalidity);
        $this->assertNotNull($settings->imap_synced_at);

        // Next run continues after UID 12 and doesn't duplicate.
        $this->mailbox->messages[] = $this->incoming(13);
        $this->artisan('mail:fetch')->assertSuccessful();
        $this->assertSame(['afterUid' => 12, 'sinceDays' => 30], end($this->mailbox->fetchCalls));
        $this->assertSame(3, Email::where('direction', 'inbound')->count());
    }

    public function test_a_renumbered_folder_starts_over_without_duplicates(): void
    {
        $this->enableImap();
        $this->mailbox->messages = [$this->incoming(5)];
        $this->artisan('mail:fetch')->assertSuccessful();

        $this->mailbox->uidValidity = 2002;
        $this->artisan('mail:fetch')->assertSuccessful();

        $this->assertSame(0, $this->mailbox->fetchCalls[1]['afterUid']);
        $this->assertSame(1, Email::where('direction', 'inbound')->count());
    }

    public function test_connection_errors_are_saved_for_the_dashboard(): void
    {
        $this->enableImap();
        $this->mailbox->failWith = 'Authentication failed';

        $this->artisan('mail:fetch')->assertFailed();
        $this->assertSame('Authentication failed', $this->settings->fresh()->imap_error);

        $this->actingAs($this->admin)->getJson('/spa/admin/mail')
            ->assertOk()
            ->assertJsonPath('mailbox.error', 'Authentication failed')
            ->assertJsonMissingPath('mailbox.password');
    }

    public function test_customer_answer_to_a_reply_joins_the_contact_message_conversation(): void
    {
        Mail::fake();
        $this->enableImap();
        $message = ContactMessage::create(['name' => 'Mohammad Alloul', 'email' => 'client@gmail.com', 'phone' => '+9647701234567', 'message' => 'Need a quote']);

        $this->actingAs($this->admin)->postJson("/spa/admin/inbox/{$message->id}/reply", ['subject' => 'Re: Quote', 'body' => 'Here it is'])->assertOk();
        $sent = Email::sole();
        $this->assertSame('read', $message->fresh()->is_read ? 'read' : 'unread');

        $this->mailbox->messages = [$this->incoming(20, ['subject' => 'Re: Re: Quote', 'inReplyTo' => $sent->message_id, 'references' => [$sent->message_id]])];
        $this->artisan('mail:fetch')->assertSuccessful();

        $answer = Email::where('direction', 'inbound')->sole();
        $this->assertSame($message->id, $answer->contact_message_id);
        $this->assertSame($sent->thread_id, $answer->thread_id);
        // The contact message comes back as unread, with both emails in its conversation.
        $this->assertFalse($message->fresh()->is_read);
        $this->actingAs($this->admin)->getJson('/spa/admin/inbox')->assertJsonCount(2, 'messages.data.0.emails');

        // Replying again threads to their answer.
        $this->actingAs($this->admin)->postJson("/spa/admin/inbox/{$message->id}/reply", ['subject' => 'Re: Quote', 'body' => 'Great'])->assertOk();
        $this->assertSame($answer->message_id, Email::latest('id')->first()->in_reply_to);
    }

    public function test_received_list_thread_and_read_state(): void
    {
        $this->enableImap();
        $this->mailbox->messages = [$this->incoming(1), $this->incoming(2)];
        $this->artisan('mail:fetch');

        $res = $this->actingAs($this->admin)->getJson('/spa/admin/mail')->assertOk();
        $res->assertJsonPath('counts.received_unread', 2)
            ->assertJsonPath('emails.data.0.thread_size', 1)
            ->assertJsonPath('mailbox.enabled', true);
        // Raw HTML is never in list payloads.
        $this->assertArrayNotHasKey('body_html', $res->json('emails.data.0'));

        $email = Email::where('message_id', 'msg-1@gmail.com')->first();
        $this->actingAs($this->admin)->getJson("/spa/admin/emails/{$email->id}/thread")
            ->assertOk()->assertJsonPath('counts.received_unread', 1);
        $this->assertTrue($email->fresh()->is_read);

        $this->actingAs($this->admin)->postJson("/spa/admin/emails/{$email->id}/read", ['is_read' => false])->assertOk();
        $this->assertFalse($email->fresh()->is_read);

        $this->actingAs($this->admin)->getJson('/spa/admin/mail?filter=unread')->assertJsonCount(2, 'emails.data');
    }

    public function test_html_view_is_sandboxed(): void
    {
        $this->enableImap();
        $this->mailbox->messages = [$this->incoming(3, [
            'html' => '<p>Hi</p><script>alert(1)</script><img src="cid:logo123"><img src="https://tracker.example/pixel.gif">',
            'text' => null,
            'attachments' => [['name' => 'logo.png', 'mime' => 'image/png', 'content' => 'PNGDATA', 'content_id' => 'logo123', 'inline' => true]],
        ])];
        $this->artisan('mail:fetch');
        $email = Email::where('direction', 'inbound')->sole();

        // Text fallback is made from the HTML; the embedded logo isn't listed as a download.
        $this->assertSame('Hi', $email->body);
        $this->assertSame([], $email->attachment_list);

        $res = $this->actingAs($this->admin)->getJson("/spa/admin/emails/{$email->id}/html")->assertOk();
        $html = $res->json('html');
        $this->assertStringNotContainsString('<script', $html);
        $this->assertStringContainsString('data:image/png;base64,'.base64_encode('PNGDATA'), $html);
        $this->assertStringContainsString("img-src data:;", $html);
        $res->assertJsonPath('remote_images', true);

        $withImages = $this->actingAs($this->admin)->getJson("/spa/admin/emails/{$email->id}/html?images=1")->json('html');
        $this->assertStringContainsString('img-src data: https: http:', $withImages);
    }

    public function test_reply_to_a_received_email(): void
    {
        Mail::fake();
        $this->enableImap();
        $this->mailbox->messages = [$this->incoming(7, ['replyTo' => 'replies@gmail.com', 'references' => ['older@gmail.com']])];
        $this->artisan('mail:fetch');
        $received = Email::where('direction', 'inbound')->sole();

        $this->actingAs($this->admin)->postJson("/spa/admin/emails/{$received->id}/reply", [
            'subject' => 'Re: Question 7', 'body' => 'Thanks!',
        ])->assertOk();

        $reply = Email::where('direction', 'outbound')->sole();
        $this->assertSame(['replies@gmail.com'], $reply->to);
        $this->assertSame($received->message_id, $reply->in_reply_to);
        $this->assertSame('older@gmail.com msg-7@gmail.com', $reply->references);
        $this->assertSame($received->thread_id, $reply->thread_id);

        $this->actingAs($this->admin)->getJson("/spa/admin/emails/{$received->id}/thread")->assertJsonCount(2, 'emails');
    }

    public function test_sent_emails_are_copied_to_the_mailbox_sent_folder(): void
    {
        $this->enableImap();
        $this->settings->update(['driver' => 'log']);

        $this->actingAs($this->admin)->postJson('/spa/admin/emails', ['to' => 'client@gmail.com', 'subject' => 'Offer', 'body' => 'Hello'])->assertOk();

        $this->assertCount(1, $this->mailbox->appended);
        $this->assertSame('INBOX.Sent', $this->mailbox->appended[0]['folder']);
        $this->assertStringContainsString('Subject: Offer', $this->mailbox->appended[0]['raw']);
    }

    public function test_check_now_endpoint(): void
    {
        $this->actingAs($this->admin)->postJson('/spa/admin/mail/sync')->assertStatus(422);

        $this->enableImap();
        $this->mailbox->messages = [$this->incoming(1)];
        $this->actingAs($this->admin)->postJson('/spa/admin/mail/sync')->assertOk()->assertJsonPath('stored', 1);
    }

    public function test_setup_command_saves_only_imap_settings_and_detects_the_sent_folder(): void
    {
        $this->artisan('mail:imap-setup', [
            '--host' => 'moalloul.com', '--username' => 'info@moalloul.com', '--same-password' => true,
        ])->expectsOutputToContain('Receiving email is on')->assertSuccessful();

        $s = $this->settings->fresh();
        $this->assertTrue($s->imapReady());
        $this->assertSame('mailbox-pass', $s->imap_password);
        $this->assertSame('INBOX.Sent', $s->imap_sent_folder);
        $this->assertSame(993, $s->imap_port);
        // SMTP untouched.
        $this->assertSame(465, (int) $s->port);
        $this->assertSame('smtp', $s->driver);
        $this->assertSame(['host' => 'moalloul.com', 'port' => 993, 'encryption' => 'ssl', 'username' => 'info@moalloul.com', 'password' => 'mailbox-pass'], $this->mailbox->connectedWith);

        $this->artisan('mail:imap-setup', ['--disable' => true])->assertSuccessful();
        $this->assertFalse($this->settings->fresh()->imapReady());
    }

    public function test_setup_command_saves_nothing_when_the_connection_fails(): void
    {
        $this->mailbox->failWith = 'Authentication failed';

        $this->artisan('mail:imap-setup', [
            '--host' => 'moalloul.com', '--username' => 'info@moalloul.com', '--password' => 'wrong',
        ])->expectsOutputToContain('Could not connect: Authentication failed')->assertFailed();

        $this->assertFalse((bool) $this->settings->fresh()->imap_enabled);
    }

    public function test_fetch_does_nothing_until_set_up(): void
    {
        $this->artisan('mail:fetch')->expectsOutputToContain('mail:imap-setup')->assertSuccessful();
        $this->assertSame([], $this->mailbox->fetchCalls);
    }
}
