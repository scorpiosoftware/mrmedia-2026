<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * An email in the dashboard Inbox — for now ones sent from it (replies and new emails).
 */
class Email extends Model
{
    protected $fillable = [
        'direction',
        'contact_message_id',
        'user_id',
        'from_address',
        'from_name',
        'to',
        'cc',
        'bcc',
        'subject',
        'body',
        'attachments',
        'message_id',
        'in_reply_to',
        'references',
        'status',
        'error',
        'sent_at',
    ];

    protected $casts = [
        'to'          => 'array',
        'cc'          => 'array',
        'bcc'         => 'array',
        'attachments' => 'array',
        'sent_at'     => 'datetime',
    ];

    // Where attachments live is never sent to the browser; downloads go through the controller.
    protected $hidden = ['attachments'];

    protected $appends = ['attachment_list', 'sent_by'];

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

    /** @return array<int, array{index: int, name: string, size: int}> */
    public function getAttachmentListAttribute(): array
    {
        return collect($this->attachments ?? [])
            ->map(fn ($a, $i) => ['index' => $i, 'name' => $a['name'], 'size' => (int) $a['size']])
            ->values()
            ->all();
    }

    public function getSentByAttribute(): ?string
    {
        return $this->relationLoaded('user') ? $this->user?->name : null;
    }
}
