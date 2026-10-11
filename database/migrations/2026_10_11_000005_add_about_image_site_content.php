<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Adds the optional About section image row; existing content rows are left untouched. */
    public function up(): void
    {
        SiteContent::firstOrCreate(['key' => 'about.image'], [
            'section'    => 'about',
            'en_value'   => '',
            'ar_value'   => '',
            'type'       => 'image',
            'sort_order' => 7,
        ]);

        SiteContent::clearCache();
    }

    public function down(): void
    {
        SiteContent::where('key', 'about.image')->delete();
        SiteContent::clearCache();
    }
};
