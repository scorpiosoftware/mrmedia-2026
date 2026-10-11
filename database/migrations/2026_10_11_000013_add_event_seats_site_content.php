<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Seat-availability labels on event cards and the event page. {count} is replaced on the page. */
    private const LABELS = [
        'events.seats_available' => ['{count} seats available', 'المقاعد المتاحة: {count}', 43],
        'events.seats_low'       => ['Only {count} left!', 'متبقٍ {count} فقط!', 44],
    ];

    public function up(): void
    {
        foreach (self::LABELS as $key => [$en, $ar, $sort]) {
            // firstOrCreate: never overwrites a row that already exists.
            SiteContent::firstOrCreate(['key' => $key], [
                'section'    => 'events',
                'en_value'   => $en,
                'ar_value'   => $ar,
                'type'       => 'text',
                'sort_order' => $sort,
            ]);
        }

        SiteContent::clearCache();
    }

    public function down(): void
    {
        SiteContent::whereIn('key', array_keys(self::LABELS))->delete();
        SiteContent::clearCache();
    }
};
