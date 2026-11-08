<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One page opened on the public site (see PageViewController and resources/js/lib/analytics.js).
 */
class PageView extends Model
{
    use MassPrunable;

    public $timestamps = false;

    protected $fillable = [
        'visitor_id',
        'session_id',
        'is_entry',
        'is_new_visitor',
        'path',
        'page_type',
        'event_id',
        'source',
        'referrer_host',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'device',
        'browser',
        'os',
        'country',
        'locale',
        'duration_seconds',
        'viewed_at',
        'local_date',
        'local_hour',
        'local_weekday',
    ];

    protected $casts = [
        'is_entry'         => 'boolean',
        'is_new_visitor'   => 'boolean',
        'duration_seconds' => 'integer',
        'viewed_at'        => 'datetime',
        'local_hour'       => 'integer',
        'local_weekday'    => 'integer',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /** Views whose local day falls in [from, to] (Y-m-d, inclusive). */
    public function scopeBetweenDays(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('local_date', [$from, $to]);
    }

    public function prunable(): Builder
    {
        return static::where('viewed_at', '<', now()->subDays(config('analytics.retention_days')));
    }
}
