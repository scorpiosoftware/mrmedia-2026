<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Settings + slides for the home-page popup carousel (a single row). */
class Popup extends Model
{
    /** once = until the popup is changed in the dashboard; session = once per browser session; always = every visit. */
    public const FREQUENCIES = ['once', 'session', 'always'];

    public const ASPECT_RATIOS = ['1/1', '4/5', '16/9'];

    public const MAX_SLIDES = 10;

    public const DEFAULTS = [
        'is_enabled' => false,
        'slides' => [],
        'delay_seconds' => 2,
        'frequency' => 'once',
        'autoplay' => true,
        'interval_seconds' => 5,
        'aspect_ratio' => '1/1',
    ];

    protected $fillable = [
        'is_enabled',
        'slides',
        'delay_seconds',
        'frequency',
        'autoplay',
        'interval_seconds',
        'aspect_ratio',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'slides' => 'array',
        'delay_seconds' => 'integer',
        'autoplay' => 'boolean',
        'interval_seconds' => 'integer',
    ];

    public static function current(): self
    {
        return self::first() ?? self::create(self::DEFAULTS);
    }
}
