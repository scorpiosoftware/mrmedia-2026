<?php

namespace App\Mail;

use App\Models\ContactMessage;
use App\Models\Email;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;

/**
 * An email written in the dashboard Inbox: a reply (to a contact message or a received
 * email) or a new email. Sent as HTML with a plain-text copy, the signature from Email
 * Settings, and — for replies — the message being answered quoted underneath.
 */
class AdminEmail extends Mailable
{
    /**
     * @param  array{name: string, date: \Carbon\CarbonInterface, text: string}|null  $quoted
     */
    public function __construct(
        public readonly Email $email,
        public readonly ?string $signature = null,
        public readonly ?array $quoted = null,
    ) {}

    /** What a reply quotes from the contact message or email it answers. */
    public static function quoteOf(ContactMessage|Email|null $source): ?array
    {
        return match (true) {
            $source instanceof ContactMessage => [
                'name' => $source->name,
                'date' => $source->created_at,
                'text' => (string) $source->message,
            ],
            $source instanceof Email => [
                'name' => $source->from_name ?: $source->from_address,
                'date' => $source->sent_at ?? $source->created_at,
                'text' => \Illuminate\Support\Str::limit((string) $source->body, 20000),
            ],
            default => null,
        };
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->email->subject,
            cc: $this->email->cc ?? [],
            bcc: $this->email->bcc ?? [],
        );
    }

    public function headers(): Headers
    {
        return new Headers(
            messageId: $this->email->message_id,
            references: array_values(array_filter(explode(' ', (string) $this->email->references))),
            text: array_filter([
                'In-Reply-To'    => $this->email->in_reply_to ? "<{$this->email->in_reply_to}>" : null,
                'X-Mrmedia-Mail' => 'dashboard',
            ]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin-email',
            text: 'emails.admin-email-text',
            with: [
                // Not `$message` / `$body` clashes: Laravel injects its own $message into mail views.
                'bodyText'  => $this->email->body,
                'signature' => $this->signature,
                'quoted'    => $this->quoted,
            ],
        );
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return collect($this->email->attachments ?? [])
            ->filter(fn ($a) => ! empty($a['path']))
            ->map(fn ($a) => Attachment::fromStorageDisk('local', $a['path'])->as($a['name'])->withMime($a['mime']))
            ->all();
    }
}
