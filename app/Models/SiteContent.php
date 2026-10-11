<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteContent extends Model
{
    protected $fillable = ['key', 'section', 'en_value', 'ar_value', 'type', 'sort_order'];

    /** Contact details that support multiple entries: `contact.{kind}`, then `contact.{kind}_2`, `_3`, … */
    public const CONTACT_LIST_KINDS = ['email', 'phone', 'address'];

    public static function isExtraContactKey(string $key): bool
    {
        return (bool) preg_match('/^contact\.('.implode('|', self::CONTACT_LIST_KINDS).')_\d+$/', $key);
    }

    /** All non-empty values for a contact kind, original entry first, then _2, _3, … in order. */
    public static function contactList(array $content, string $kind): array
    {
        $base = "contact.{$kind}";

        return collect($content)
            ->filter(fn ($value, $key) => $key === $base || preg_match('/^'.preg_quote($base, '/').'_\d+$/', $key))
            ->sortBy(fn ($value, $key) => $key === $base ? 1 : (int) substr($key, strlen($base) + 1))
            ->filter(fn ($value) => filled($value))
            ->values()
            ->all();
    }

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
