<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'title' => 'Brand Strategy',
                'title_ar' => 'استراتيجية العلامة التجارية',
                'description' => "Build a powerful brand identity that resonates with your audience and stands out in the market.",
                'description_ar' => 'بناء هوية علامة تجارية قوية تتردد صداها مع جمهورك وتتميز في السوق.',
                'icon' => 'star',
            ],
            [
                'title' => 'Digital Marketing',
                'title_ar' => 'التسويق الرقمي',
                'description' => 'Data-driven campaigns across social media, search, and display that maximize your ROI.',
                'description_ar' => 'حملات مبنية على البيانات عبر وسائل التواصل الاجتماعي والبحث والعرض لتعظيم عائد استثمارك.',
                'icon' => 'bar-chart-3',
            ],
            [
                'title' => 'Content Creation',
                'title_ar' => 'إنتاج المحتوى',
                'description' => "Compelling visuals, videos and copy that tell your brand's story and engage your audience.",
                'description_ar' => 'صور ومقاطع فيديو ونصوص مقنعة تحكي قصة علامتك التجارية وتشرك جمهورك.',
                'icon' => 'image',
            ],
            [
                'title' => 'Web & App Design',
                'title_ar' => 'تصميم المواقع والتطبيقات',
                'description' => 'Beautiful, conversion-optimized digital experiences that turn visitors into customers.',
                'description_ar' => 'تجارب رقمية جميلة محسّنة للتحويل تحول الزوار إلى عملاء.',
                'icon' => 'monitor',
            ],
            [
                'title' => 'Media Production',
                'title_ar' => 'الإنتاج الإعلامي',
                'description' => 'Professional photography, videography and motion graphics for all your marketing needs.',
                'description_ar' => 'تصوير فوتوغرافي واحترافي وموشن جرافيك لجميع احتياجاتك التسويقية.',
                'icon' => 'globe',
            ],
            [
                'title' => 'PR & Events',
                'title_ar' => 'العلاقات العامة والفعاليات',
                'description' => 'Strategic public relations and memorable event experiences that amplify your brand presence.',
                'description_ar' => 'علاقات عامة استراتيجية وتجارب فعاليات لا تُنسى تُضخّم حضور علامتك التجارية.',
                'icon' => 'megaphone',
            ],
        ];

        foreach ($services as $index => $service) {
            Service::firstOrCreate(
                ['title' => $service['title']],
                $service + ['sort_order' => $index + 1, 'is_published' => true],
            );
        }
    }
}
