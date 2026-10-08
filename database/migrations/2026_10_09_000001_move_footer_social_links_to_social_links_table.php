<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $legacy = DB::table('site_contents')
            ->where('key', 'like', 'footer.social.%')
            ->get(['key', 'en_value']);

        $sortOrder = (int) DB::table('social_links')->max('sort_order');

        foreach ($legacy as $row) {
            $platform = substr($row->key, strlen('footer.social.'));
            $url = trim((string) $row->en_value);

            if ($platform === '' || $url === '') {
                continue;
            }

            $exists = DB::table('social_links')->where('platform', $platform)->exists();

            if (! $exists) {
                DB::table('social_links')->insert([
                    'platform' => $platform,
                    'label' => null,
                    'url' => $url,
                    'sort_order' => ++$sortOrder,
                    'is_published' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        DB::table('site_contents')->where('key', 'like', 'footer.social.%')->delete();

        $this->forgetContentCache();
    }

    public function down(): void
    {
        // Restores the content keys the footer used to read. Social links are left
        // in place — admins may have added ones that never existed as content keys.
        $sortOrder = 2;

        foreach (['instagram', 'twitter', 'linkedin'] as $platform) {
            $url = DB::table('social_links')->where('platform', $platform)->value('url');

            if ($url === null) {
                continue;
            }

            DB::table('site_contents')->updateOrInsert(
                ['key' => "footer.social.{$platform}"],
                [
                    'section' => 'footer',
                    'en_value' => $url,
                    'ar_value' => $url,
                    'type' => 'text',
                    'sort_order' => ++$sortOrder,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $this->forgetContentCache();
    }

    private function forgetContentCache(): void
    {
        Cache::forget('site_contents_en');
        Cache::forget('site_contents_ar');
    }
};
