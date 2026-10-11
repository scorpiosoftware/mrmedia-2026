<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Hint under "Number of Attendees" showing how many seats one registration can take. {count} is replaced on the page. */
    public function up(): void
    {
        // firstOrCreate: never overwrites a row that already exists.
        SiteContent::firstOrCreate(['key' => 'events.form.max_attendees'], [
            'section'    => 'events',
            'en_value'   => 'Up to {count} seats available',
            'ar_value'   => 'المقاعد المتاحة: حتى {count}',
            'type'       => 'text',
            'sort_order' => 42,
        ]);

        SiteContent::clearCache();
    }

    public function down(): void
    {
        SiteContent::where('key', 'events.form.max_attendees')->delete();
        SiteContent::clearCache();
    }
};
