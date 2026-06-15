<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteContent extends Model
{
    protected $fillable = ['key', 'section', 'en_value', 'ar_value', 'type', 'sort_order'];

    public static function getAllForLocale(string $locale): array
    {
        return Cache::remember("site_contents_{$locale}", 3600, function () use ($locale) {
            $valueColumn = $locale === 'ar' ? 'ar_value' : 'en_value';

            return static::orderBy('sort_order')
                ->get(['key', $valueColumn])
                ->pluck($valueColumn, 'key')
                ->toArray();
        });
    }

    public static function getAllGrouped(): array
    {
        return static::orderBy('section')->orderBy('sort_order')
            ->get()
            ->groupBy('section')
            ->toArray();
    }

    public static function clearCache(): void
    {
        Cache::forget('site_contents_en');
        Cache::forget('site_contents_ar');
    }
}
