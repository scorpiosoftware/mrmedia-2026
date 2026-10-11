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
        'unit_price',
        'discount_percent',
        'total_price',
        'message',
    ];

    protected $casts = [
        'unit_price'       => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'total_price'      => 'decimal:2',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
