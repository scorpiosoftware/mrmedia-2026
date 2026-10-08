<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = [
        'name',
        'email',
        'service',
        'message',
        'ip_address',
        'user_agent',
        'is_spam',
        'is_read',
        'read_at',
        'mail_delivered',
        'mail_error',
    ];

    protected $casts = [
        'is_spam' => 'boolean',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'mail_delivered' => 'boolean',
    ];

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
