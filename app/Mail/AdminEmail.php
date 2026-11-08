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
 * An email written in the dashboard Inbox: a reply to a contact message or a new email.
 * Sent as HTML with a plain-text copy, the signature from Email Settings, and — for
 * replies — the visitor's original message quoted underneath.
 */
class AdminEmail extends Mailable
{
    public function __construct(
        public readonly Email $email,
        public readonly ?string $signature = null,
        public readonly ?ContactMessage $quoted = null,
    ) {}

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
            text: array_filter(['In-Reply-To' => $this->email->in_reply_to ? "<{$this->email->in_reply_to}>" : null]),
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
            ->map(fn ($a) => Attachment::fromStorageDisk('local', $a['path'])->as($a['name'])->withMime($a['mime']))
            ->all();
    }
}
