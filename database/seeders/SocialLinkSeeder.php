<?php

namespace Database\Seeders;

use App\Models\SiteContent;
use App\Models\SocialLink;
use Illuminate\Database\Seeder;

class SocialLinkSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['platform' => 'instagram', 'url' => 'https://instagram.com/mrmedia'],
            ['platform' => 'facebook',  'url' => 'https://facebook.com/mrmedia'],
            ['platform' => 'tiktok',    'url' => 'https://tiktok.com/@mrmedia'],
            ['platform' => 'twitter',   'url' => 'https://twitter.com/mrmedia'],
            ['platform' => 'linkedin',  'url' => 'https://linkedin.com/company/mrmedia'],
        ];

        // Carry over any URL the footer previously read from the site content table.
        $legacy = SiteContent::where('key', 'like', 'footer.social.%')
            ->pluck('en_value', 'key');

        foreach ($defaults as $index => $item) {
            SocialLink::firstOrCreate(
                ['platform' => $item['platform']],
                [
                    'url' => $legacy->get("footer.social.{$item['platform']}") ?: $item['url'],
                    'sort_order' => $index,
                    'is_published' => true,
                ],
            );
        }
    }
}
