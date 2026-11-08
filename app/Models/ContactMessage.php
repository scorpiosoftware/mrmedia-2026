<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactMessage extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'service',
        'message',
        'ip_address',
        'user_agent',
        'is_spam',
        'is_read',
        'read_at',
        'replied_at',
        'mail_delivered',
        'mail_error',
    ];

    protected $casts = [
        'is_spam' => 'boolean',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'replied_at' => 'datetime',
        'mail_delivered' => 'boolean',
    ];

    /** Emails sent from the dashboard in reply to this message, oldest first. */
    public function emails(): HasMany
    {
        return $this->hasMany(Email::class)->orderBy('id');
    }

    public function scopeGenuine(Builder $query): Builder
    {
        return $query->where('is_spam', false);
    }

    public function markRead(): void
    {
        if (! $this->is_read) {
            $this->update(['is_read' => true, 'read_at' => now()]);
        }
    }
}
