<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $senderName,
        public readonly string $senderPhone,
        public readonly ?string $senderEmail,
        public readonly ?string $service,
        // Not named `$message` — Laravel injects its own $message (the
        // Illuminate\Mail\Message wrapper) into every mail view, which would
        // silently shadow a Mailable property of the same name.
        public readonly ?string $body,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Contact Form Message from {$this->senderName}",
            replyTo: $this->senderEmail ? [$this->senderEmail] : [],
        );
    }

    /** Marks the notification as sent by this site, so fetching mail doesn't import it as a new email. */
    public function headers(): Headers
    {
        return new Headers(text: ['X-Mrmedia-Mail' => 'contact-notification']);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.contact-form');
    }
}
