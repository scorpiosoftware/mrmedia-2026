<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/** Site-wide configuration (single row): name, default language/appearance and colour theme. */
class SiteSetting extends Model
{
    private const CACHE_KEY = 'site_settings';

    /** Theme colour slots, in the order the dashboard shows them. */
    public const COLOR_KEYS = ['primary', 'primary_light', 'primary_dark', 'dark', 'accent', 'accent_bright', 'background'];

    /**
     * Preset palettes. "classic" is the original Mr.MEDIA look and applies no overrides at all,
     * so the stylesheet's own values are used unchanged.
     */
    public const THEMES = [
        'classic'  => ['name' => 'Classic Blue & Gold', 'primary' => '#213C93', 'primary_light' => '#2E52C9', 'primary_dark' => '#192E74', 'dark' => '#0D1B4B', 'accent' => '#DDB50E', 'accent_bright' => '#FCD532', 'background' => '#F1F1F0'],
        'emerald'  => ['name' => 'Emerald & Amber',     'primary' => '#0F766E', 'primary_light' => '#14B8A6', 'primary_dark' => '#0B5B55', 'dark' => '#052E2B', 'accent' => '#D97706', 'accent_bright' => '#F59E0B', 'background' => '#F3F1EC'],
        'royal'    => ['name' => 'Royal Purple',        'primary' => '#5B21B6', 'primary_light' => '#7C3AED', 'primary_dark' => '#4C1D95', 'dark' => '#1E0B3D', 'accent' => '#DB2777', 'accent_bright' => '#F472B6', 'background' => '#F4F2F8'],
        'crimson'  => ['name' => 'Crimson & Charcoal',  'primary' => '#B91C1C', 'primary_light' => '#DC2626', 'primary_dark' => '#8F1515', 'dark' => '#1C1917', 'accent' => '#D97706', 'accent_bright' => '#FBBF24', 'background' => '#F5F3F0'],
        'ocean'    => ['name' => 'Ocean',               'primary' => '#0369A1', 'primary_light' => '#0EA5E9', 'primary_dark' => '#075985', 'dark' => '#082F49', 'accent' => '#0891B2', 'accent_bright' => '#67E8F9', 'background' => '#EFF5F8'],
        'midnight' => ['name' => 'Midnight Gold',       'primary' => '#1F2937', 'primary_light' => '#4B5563', 'primary_dark' => '#111827', 'dark' => '#030712', 'accent' => '#CA8A04', 'accent_bright' => '#FACC15', 'background' => '#F3F4F6'],
    ];

    public const DEFAULTS = [
        'site_name' => 'Mr.MEDIA',
        'site_name_ar' => 'مستر ميديا',
        'tagline' => 'Marketing Agency That Moves Markets',
        'tagline_ar' => 'وكالة تسويق تُحرّك الأسواق',
        'default_locale' => 'en',
        'default_appearance' => 'system',
        'theme' => 'classic',
        'custom_colors' => null,
    ];

    protected $fillable = [
        'site_name',
        'site_name_ar',
        'tagline',
        'tagline_ar',
        'default_locale',
        'default_appearance',
        'theme',
        'custom_colors',
        'logo_url',
        'logo_dark_url',
        'favicon_url',
    ];

    /** Branding image fields, each uploaded through Site Settings. */
    public const BRANDING_FIELDS = ['logo_url', 'logo_dark_url', 'favicon_url'];

    protected $casts = [
        'custom_colors' => 'array',
    ];

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
    }

    public static function current(): self
    {
        // Cache plain attributes, not the model object — the cache refuses to unserialize classes.
        $attributes = Cache::rememberForever(
            self::CACHE_KEY,
            fn () => (self::first() ?? self::create(self::DEFAULTS))->fresh()->getAttributes(),
        );

        return (new self)->newFromBuilder($attributes);
    }

    /** The palette in use: a preset, or the custom colours (falling back to classic for any missing slot). */
    public function colors(): array
    {
        if ($this->theme === 'custom') {
            return array_merge(
                array_intersect_key(self::THEMES['classic'], array_flip(self::COLOR_KEYS)),
                array_intersect_key($this->custom_colors ?? [], array_flip(self::COLOR_KEYS)),
            );
        }

        $preset = self::THEMES[$this->theme] ?? self::THEMES['classic'];

        return array_intersect_key($preset, array_flip(self::COLOR_KEYS));
    }

    /**
     * CSS custom properties that re-skin the public site. Mirrors themeVars() in
     * resources/js/lib/site-theme.js — keep the two in sync.
     */
    public function themeCssVars(): array
    {
        if ($this->theme === 'classic') {
            return [];
        }

        $c = $this->colors();

        return [
            '--color-brand-blue'       => $c['primary'],
            '--color-primary'          => $c['primary'],
            '--color-ring'             => $c['primary'],
            '--color-primary-light'    => $c['primary_light'],
            '--color-primary-dark'     => $c['primary_dark'],
            '--color-brand-dark'       => $c['dark'],
            '--color-foreground'       => $c['dark'],
            '--color-brand-gold'       => $c['accent'],
            '--color-accent'           => $c['accent'],
            '--color-brand-yellow'     => $c['accent_bright'],
            '--color-accent-bright'    => $c['accent_bright'],
            '--color-brand-bg'         => $c['background'],
            '--color-background'       => $c['background'],
            '--color-brand-bg-alt'     => "color-mix(in srgb, {$c['background']} 50%, white)",
            '--color-secondary'        => "color-mix(in srgb, {$c['primary']} 10%, white)",
            '--color-border'           => "color-mix(in srgb, {$c['primary']} 18%, white)",
            '--color-muted-foreground' => "color-mix(in srgb, {$c['dark']} 70%, white)",
        ];
    }

    /** Settings the browser needs on first paint (embedded in the SPA page). */
    public function publicPayload(): array
    {
        return [
            'site_name'          => $this->site_name,
            'site_name_ar'       => $this->site_name_ar,
            'tagline'            => $this->tagline,
            'tagline_ar'         => $this->tagline_ar,
            'default_locale'     => $this->default_locale,
            'default_appearance' => $this->default_appearance,
            'theme'              => $this->theme,
            'colors'             => $this->colors(),
            'logo_url'           => $this->logo_url,
            'logo_dark_url'      => $this->logo_dark_url,
            'favicon_url'        => $this->favicon_url,
        ];
    }
}
