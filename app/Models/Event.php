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
        'required_fields',
        'target_audience',
        'target_audience_ar',
        'agenda',
        'trainer_name',
        'trainer_name_ar',
        'trainer_title',
        'trainer_title_ar',
        'trainer_bio',
        'trainer_bio_ar',
        'trainer_image_url',
        'trainer_credentials',
        'payment_note',
        'payment_note_ar',
        'testimonials',
        'faqs',
        'cta_heading',
        'cta_heading_ar',
        'cta_subheading',
        'cta_subheading_ar',
    ];

    protected $casts = [
        'starts_at'            => 'datetime',
        'ends_at'              => 'datetime',
        'price'                => 'decimal:2',
        'is_published'         => 'boolean',
        'required_fields'      => 'array',
        'agenda'               => 'array',
        'trainer_credentials'  => 'array',
        'testimonials'         => 'array',
        'faqs'                 => 'array',
    ];

    public function submissions(): HasMany
    {
        return $this->hasMany(EventSubmission::class);
    }
}
