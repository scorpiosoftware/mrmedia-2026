<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'title_ar',
        'type',
        'mode',
        'description',
        'description_ar',
        'location',
        'location_ar',
        'starts_at',
        'ends_at',
        'capacity',
        'price',
        'image_url',
        'is_published',
    ];

    protected $casts = [
        'starts_at'    => 'datetime',
        'ends_at'      => 'datetime',
        'price'        => 'decimal:2',
        'is_published' => 'boolean',
    ];

    public function submissions(): HasMany
    {
        return $this->hasMany(EventSubmission::class);
    }
}
