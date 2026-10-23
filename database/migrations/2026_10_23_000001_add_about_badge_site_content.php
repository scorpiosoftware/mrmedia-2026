<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** About-section badges, split off from the Statistics keys they used to share. Start from the current stats values. */
    private const BADGES = [
        'about.years'         => ['stats.years', 8],
        'about.years_label'   => ['stats.years_label', 9],
        'about.clients'       => ['stats.clients', 10],
        'about.clients_label' => ['stats.clients_label', 11],
    ];

    public function up(): void
    {
        foreach (self::BADGES as $key => [$source, $sort]) {
            $current = SiteContent::where('key', $source)->first();

            // firstOrCreate: never overwrites a row that already exists.
            SiteContent::firstOrCreate(['key' => $key], [
                'section'    => 'about',
                'en_value'   => $current?->en_value ?? '',
                'ar_value'   => $current?->ar_value ?? '',
                'type'       => 'text',
                'sort_order' => $sort,
            ]);
        }

        SiteContent::clearCache();
    }

    public function down(): void
    {
        SiteContent::whereIn('key', array_keys(self::BADGES))->delete();
        SiteContent::clearCache();
    }
};
