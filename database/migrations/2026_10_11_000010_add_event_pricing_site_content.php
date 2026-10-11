<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Labels for the live price summary on the event registration form. */
    private const LABELS = [
        'events.form.discount'       => ['Group discount', 'خصم المجموعة', 38],
        'events.form.total'          => ['Total', 'الإجمالي', 39],
        'events.form.per_person'     => ['per person', 'للشخص', 40],
        // {percent} and {min} are replaced on the page.
        'events.group_discount_hint' => ['Save {percent}% when registering {min} or more attendees', 'وفّر {percent}% عند تسجيل {min} أشخاص أو أكثر', 41],
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
