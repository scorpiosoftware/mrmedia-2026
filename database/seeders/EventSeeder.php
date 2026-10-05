<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        Event::updateOrCreate(
            ['title' => 'Digital Marketing Training Session'],
            [
                'title_ar'       => 'جلسة تدريبية في التسويق الرقمي',
                'type'           => 'training',
                'description'    => 'A hands-on training session covering social media strategy, SEO fundamentals, and content marketing best practices. Ideal for marketers looking to sharpen their digital skills.',
                'description_ar' => 'جلسة تدريبية تطبيقية تغطي استراتيجية وسائل التواصل الاجتماعي، وأساسيات تحسين محركات البحث، وأفضل ممارسات التسويق بالمحتوى. مثالية للمسوقين الراغبين في صقل مهاراتهم الرقمية.',
                'location'       => 'Mr.MEDIA HQ, Riyadh',
                'location_ar'    => 'مقر مستر ميديا، الرياض',
                'starts_at'      => '2026-11-15 10:00:00',
                'ends_at'        => '2026-11-15 13:00:00',
                'capacity'       => 30,
                'image_url'      => '/images/events/digital-marketing-training.svg',
                'is_published'   => true,
            ],
        );
    }
}
