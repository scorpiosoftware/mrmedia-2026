<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** The About section's value bullets were hardcoded in About.jsx; move them into editable site content. */
    private const VALUES = [
        1 => ['Strategy-first thinking', 'تفكير استراتيجي أولاً'],
        2 => ['Bold creative execution', 'تنفيذ إبداعي جريء'],
        3 => ['Data-driven decisions', 'قرارات مبنية على البيانات'],
        4 => ['Client-centric approach', 'نهج يمحور العميل'],
    ];

    public function up(): void
    {
        foreach (self::VALUES as $n => [$en, $ar]) {
            // firstOrCreate: never overwrites a row that already exists.
            SiteContent::firstOrCreate(['key' => "about.value_{$n}"], [
                'section'    => 'about',
                'en_value'   => $en,
                'ar_value'   => $ar,
                'type'       => 'text',
                'sort_order' => 5, // between the mission text and the CTA
            ]);
        }

        SiteContent::clearCache();
    }

    public function down(): void
    {
        SiteContent::whereIn('key', array_map(fn ($n) => "about.value_{$n}", array_keys(self::VALUES)))->delete();
        SiteContent::clearCache();
    }
};
