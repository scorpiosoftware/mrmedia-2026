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
        'group_discount_percent',
        'group_discount_min_attendees',
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
        'section_titles',
    ];

    protected $casts = [
        'starts_at'            => 'datetime',
        'ends_at'              => 'datetime',
        'price'                => 'decimal:2',
        'group_discount_percent'       => 'decimal:2',
        'group_discount_min_attendees' => 'integer',
        'is_published'         => 'boolean',
        'required_fields'      => 'array',
        'agenda'               => 'array',
        'trainer_credentials'  => 'array',
        'testimonials'         => 'array',
        'faqs'                 => 'array',
        'section_titles'       => 'array',
    ];

    /**
     * Price breakdown for one registration. The group discount applies to the whole
     * registration once it reaches the minimum number of attendees.
     * Mirrored on the registration form (EventDetails.jsx → priceFor) for the live summary.
     *
     * @return array{unit_price: ?float, discount_percent: float, total_price: ?float}
     */
    public function priceFor(int $attendees): array
    {
        if ($this->price === null) {
            return ['unit_price' => null, 'discount_percent' => 0.0, 'total_price' => null];
        }

        $unit = (float) $this->price;
        $percent = (float) $this->group_discount_percent;
        $discount = $percent > 0 && $attendees >= $this->group_discount_min_attendees ? $percent : 0.0;

        return [
            'unit_price'       => $unit,
            'discount_percent' => $discount,
            'total_price'      => round($unit * $attendees * (1 - $discount / 100), 2),
        ];
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(EventSubmission::class);
    }
}
