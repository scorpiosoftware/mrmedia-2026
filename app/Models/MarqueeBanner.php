<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Settings + phrases for the auto-scrolling banner on the home page (a single row). */
class MarqueeBanner extends Model
{
    public const SEPARATORS = ['sparkle', 'star', 'diamond', 'dot', 'asterisk', 'logo', 'none'];

    public const FONT_SIZES = ['sm', 'md', 'lg'];

    public const PHRASE_STYLES = ['solid', 'highlight', 'outline'];

    public const DEFAULTS = [
        'is_enabled' => true,
        'phrases' => [
            ['text' => 'Brand Strategy', 'text_ar' => 'استراتيجية العلامة التجارية', 'style' => 'solid'],
            ['text' => 'Digital Marketing', 'text_ar' => 'التسويق الرقمي', 'style' => 'highlight'],
            ['text' => 'Social Media', 'text_ar' => 'وسائل التواصل الاجتماعي', 'style' => 'solid'],
            ['text' => 'Content Creation', 'text_ar' => 'صناعة المحتوى', 'style' => 'outline'],
            ['text' => 'Media Production', 'text_ar' => 'الإنتاج الإعلامي', 'style' => 'solid'],
            ['text' => 'Creative Campaigns', 'text_ar' => 'حملات إبداعية', 'style' => 'highlight'],
        ],
        'speed' => 60,
        'direction' => 'left',
        'pause_on_hover' => true,
        'separator' => 'sparkle',
        'font_size' => 'md',
        'background_color' => '#213C93',
        'text_color' => '#FFFFFF',
        'highlight_color' => '#FCD532',
        'tilted' => false,
        'double_row' => false,
    ];

    protected $fillable = [
        'is_enabled',
        'phrases',
        'speed',
        'direction',
        'pause_on_hover',
        'separator',
        'font_size',
        'background_color',
        'text_color',
        'highlight_color',
        'tilted',
        'double_row',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'phrases' => 'array',
        'speed' => 'integer',
        'pause_on_hover' => 'boolean',
        'tilted' => 'boolean',
        'double_row' => 'boolean',
    ];

    public static function current(): self
    {
        return self::first() ?? self::create(self::DEFAULTS);
    }
}
