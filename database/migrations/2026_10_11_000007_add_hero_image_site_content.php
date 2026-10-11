<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Adds the optional Hero image row; existing content rows are left untouched. */
    public function up(): void
    {
        SiteContent::firstOrCreate(['key' => 'hero.image'], [
            'section'    => 'hero',
            'en_value'   => '',
            'ar_value'   => '',
            'type'       => 'image',
            'sort_order' => 6,
        ]);

        SiteContent::clearCache();
    }

    public function down(): void
    {
        SiteContent::where('key', 'hero.image')->delete();
        SiteContent::clearCache();
    }
};
