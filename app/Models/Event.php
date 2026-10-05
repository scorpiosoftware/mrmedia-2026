<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'title',
        'title_ar',
        'type',
        'description',
        'description_ar',
        'location',
        'location_ar',
        'starts_at',
        'ends_at',
        'capacity',
        'image_url',
        'is_published',
    ];

    protected $casts = [
        'starts_at'    => 'datetime',
        'ends_at'      => 'datetime',
        'is_published' => 'boolean',
    ];

    public function submissions(): HasMany
    {
        return $this->hasMany(EventSubmission::class);
    }
}
