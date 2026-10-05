<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventSubmission extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'email',
        'phone',
        'company',
        'attendees',
        'message',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
