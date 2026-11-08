<?php

namespace Tests\Feature;

use App\Mail\AdminEmail;
use App\Models\ContactMessage;
use App\Models\Email;
use App\Models\EmailSettings;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InboxEmailTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        EmailSettings::create([
            'driver' => 'smtp',
            'host' => 'mail.moalloul.com',
            'port' => 465,
            'username' => 'info@moalloul.com',
            'password' => 'secret',
            'encryption' => 'ssl',
            'from_address' => 'info@moalloul.com',
            'from_name' => 'Mo.Alloul',
            'signature' => "Mohammad Alloul\nMarketing Manager",
        ]);

        $this->admin = User::factory()->create()->givePermissionTo('inbox.manage');
    }

    private function contactMessage(array $attrs = []): ContactMessage
    {
        return ContactMessage::create(array_merge([
            'name' => 'Mohammad Alloul',
            'email' => 'visitor@example.com',
            'phone' => '+9647701234567',
            'service' => 'Branding',
            'message' => 'I would like a quote for a new logo.',
        ], $attrs));
    }

    public function test_reply_is_sent_saved_and_marks_the_message_replied(): void
    {
        Mail::fake();
        $message = $this->contactMessage();

        $this->actingAs($this->admin)->postJson("/spa/admin/inbox/{$message->id}/reply", [
            'subject' => 'Re: Your enquiry about Branding',
            'body' => 'Thanks for reaching out — here is our quote.',
        ])->assertOk()->assertJsonPath('email.status', 'sent');

        Mail::assertSent(AdminEmail::class, function (AdminEmail $mail) {
            return $mail->hasTo('visitor@example.com')
                && $mail->quoted !== null
                && $mail->signature === "Mohammad Alloul\nMarketing Manager";
        });

        $email = Email::sole();
        $this->assertSame($message->id, $email->contact_message_id);
        $this->assertSame($this->admin->id, $email->user_id);
        $this->assertStringEndsWith('@moalloul.com', $email->message_id);
        $this->assertNotNull($message->fresh()->replied_at);
        $this->assertTrue($message->fresh()->is_read);

        // The Inbox lists the reply under the message.
        $this->actingAs($this->admin)->getJson('/spa/admin/inbox')
            ->assertJsonPath('messages.data.0.emails.0.subject', 'Re: Your enquiry about Branding');
    }

    public function test_second_reply_is_threaded_to_the_first(): void
    {
        Mail::fake();
        $message = $this->contactMessage();
        $payload = ['subject' => 'Re: Quote', 'body' => 'Hello'];

        $this->actingAs($this->admin)->postJson("/spa/admin/inbox/{$message->id}/reply", $payload)->assertOk();
        $this->actingAs($this->admin)->postJson("/spa/admin/inbox/{$message->id}/reply", $payload)->assertOk();

        [$first, $second] = Email::orderBy('id')->get();
        $this->assertSame($first->message_id, $second->in_reply_to);
        $this->assertSame($first->message_id, $second->references);

        $rendered = (new AdminEmail($second))->render();
        $this->assertStringContainsString('Hello', $rendered);
    }

    public function test_reply_needs_an_email_address(): void
    {
        $message = $this->contactMessage(['email' => '']);

        $this->actingAs($this->admin)->postJson("/spa/admin/inbox/{$message->id}/reply", [
            'subject' => 'Re', 'body' => 'Hi',
        ])->assertStatus(422);
    }

    public function test_new_email_to_several_recipients_with_attachment(): void
    {
        Mail::fake();
        Storage::fake('local');

        $res = $this->actingAs($this->admin)->post('/spa/admin/emails', [
            'to' => 'one@example.com, two@example.com; one@example.com',
            'cc' => 'boss@example.com',
            'bcc' => 'archive@example.com',
            'subject' => 'Proposal',
            'body' => 'Please find our proposal attached.',
            'attachments' => [UploadedFile::fake()->create('proposal.pdf', 200, 'application/pdf')],
        ], ['Accept' => 'application/json'])->assertOk();

        $email = Email::sole();
        $this->assertSame(['one@example.com', 'two@example.com'], $email->to);
        $this->assertSame(['boss@example.com'], $email->cc);
        $this->assertSame(['archive@example.com'], $email->bcc);
        $this->assertCount(1, $email->attachments);
        Storage::disk('local')->assertExists($email->attachments[0]['path']);
        // The storage path is never exposed to the browser.
        $this->assertArrayNotHasKey('attachments', $res->json('email'));
        $res->assertJsonPath('email.attachment_list.0.name', 'proposal.pdf');

        Mail::assertSent(AdminEmail::class, fn (AdminEmail $mail) => $mail->hasTo('two@example.com') && $mail->hasCc('boss@example.com') && $mail->hasBcc('archive@example.com'));

        $this->actingAs($this->admin)->get("/spa/admin/emails/{$email->id}/attachments/0")->assertOk()->assertDownload('proposal.pdf');
        $this->actingAs($this->admin)->getJson('/spa/admin/emails')->assertJsonPath('counts.sent', 1);
    }

    public function test_invalid_recipient_is_rejected(): void
    {
        $this->actingAs($this->admin)->postJson('/spa/admin/emails', [
            'to' => 'good@example.com, not-an-email',
            'subject' => 'Hi',
            'body' => 'Hello',
        ])->assertStatus(422)->assertJsonValidationErrors('to');

        $this->assertSame(0, Email::count());
    }

    public function test_failed_send_is_kept_and_can_be_retried_or_replaced(): void
    {
        // A mail server that refuses the connection (nothing listens on this local port).
        EmailSettings::first()->update(['host' => '127.0.0.1', 'port' => 9, 'encryption' => null]);

        $res = $this->actingAs($this->admin)->postJson('/spa/admin/emails', [
            'to' => 'client@example.com', 'subject' => 'Hi', 'body' => 'Hello',
        ])->assertStatus(422)->assertJsonPath('email.status', 'failed');

        $this->assertNotEmpty(Email::sole()->error);

        // Sending the draft again replaces the failed copy instead of duplicating it.
        Mail::fake();
        $this->actingAs($this->admin)->postJson('/spa/admin/emails', [
            'to' => 'client@example.com', 'subject' => 'Hi', 'body' => 'Hello', 'replaces' => $res->json('email.id'),
        ])->assertOk();

        $this->assertSame(1, Email::count());
        $this->assertSame('sent', Email::sole()->status);
    }

    public function test_resend_a_failed_email(): void
    {
        Mail::fake();
        $email = Email::create([
            'from_address' => 'info@moalloul.com', 'to' => ['client@example.com'], 'subject' => 'Hi', 'body' => 'Hello',
            'message_id' => Email::newMessageId('info@moalloul.com'), 'status' => 'failed', 'error' => 'timeout',
        ]);

        $this->actingAs($this->admin)->postJson("/spa/admin/emails/{$email->id}/resend")->assertOk()->assertJsonPath('email.status', 'sent');
        $this->assertNull($email->fresh()->error);
    }

    public function test_sending_requires_the_inbox_permission(): void
    {
        $message = $this->contactMessage();
        $other = User::factory()->create()->givePermissionTo('projects.manage');

        $this->actingAs($other)->postJson('/spa/admin/emails', ['to' => 'a@b.com', 'subject' => 'x', 'body' => 'y'])->assertForbidden();
        $this->actingAs($other)->postJson("/spa/admin/inbox/{$message->id}/reply", ['subject' => 'x', 'body' => 'y'])->assertForbidden();
        $this->actingAs($other)->getJson('/spa/admin/emails')->assertForbidden();
    }

    public function test_signature_is_saved_in_email_settings(): void
    {
        $admin = User::factory()->create()->givePermissionTo('email-settings.manage');

        $this->actingAs($admin)->postJson('/spa/admin/email-settings', [
            'driver' => 'smtp', 'from_address' => 'info@moalloul.com', 'from_name' => 'Mo.Alloul', 'signature' => 'Best regards',
        ])->assertOk();

        $this->actingAs($admin)->getJson('/spa/admin/email-settings')->assertJsonPath('signature', 'Best regards');
    }
}
