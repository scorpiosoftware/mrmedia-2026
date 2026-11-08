<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * An email in the dashboard Inbox: sent from it (outbound) or fetched from the mailbox
 * over IMAP (inbound). Emails of one conversation share `thread_id`.
 */
class Email extends Model
{
    protected $fillable = [
        'direction',
        'thread_id',
        'contact_message_id',
        'user_id',
        'from_address',
        'from_name',
        'reply_to_address',
        'to',
        'cc',
        'bcc',
        'subject',
        'body',
        'body_html',
        'attachments',
        'message_id',
        'in_reply_to',
        'references',
        'status',
        'is_read',
        'imap_uid',
        'error',
        'sent_at',
    ];

    protected $casts = [
        'to'          => 'array',
        'cc'          => 'array',
        'bcc'         => 'array',
        'attachments' => 'array',
        'is_read'     => 'boolean',
        'sent_at'     => 'datetime',
    ];

    // Where attachments live is never sent to the browser (downloads go through the controller),
    // and received HTML is only served through the sandboxed viewer endpoint.
    protected $hidden = ['attachments', 'body_html', 'imap_uid'];

    protected $appends = ['attachment_list', 'sent_by', 'has_html'];

    public function contactMessage(): BelongsTo
    {
        return $this->belongsTo(ContactMessage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** A new globally unique Message-ID on the sender's domain, e.g. "4f1c…@moalloul.com". */
    public static function newMessageId(string $fromAddress): string
    {
        $domain = Str::after($fromAddress, '@') ?: 'localhost';

        return Str::uuid()->toString().'@'.$domain;
    }

    /**
     * Downloadable files (images embedded in the email body are left out).
     * `available` is false for files too large to have been downloaded from the mailbox.
     *
     * @return array<int, array{index: int, name: string, size: int, available: bool}>
     */
    public function getAttachmentListAttribute(): array
    {
        return collect($this->attachments ?? [])
            ->map(fn ($a, $i) => [
                'index'     => $i,
                'name'      => $a['name'],
                'size'      => (int) $a['size'],
                'available' => ! empty($a['path']),
                'inline'    => (bool) ($a['inline'] ?? false),
            ])
            ->reject(fn ($a) => $a['inline'])
            ->map(fn ($a) => collect($a)->except('inline')->all())
            ->values()
            ->all();
    }

    public function getHasHtmlAttribute(): bool
    {
        return ! empty($this->attributes['body_html'] ?? null);
    }

    /** Address a reply to this email goes to. */
    public function replyAddress(): string
    {
        return $this->reply_to_address ?: $this->from_address;
    }

    public function getSentByAttribute(): ?string
    {
        return $this->relationLoaded('user') ? $this->user?->name : null;
    }
}
