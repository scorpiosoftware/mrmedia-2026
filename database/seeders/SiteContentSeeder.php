<?php

namespace Database\Seeders;

use App\Models\SiteContent;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $contents = [
            // ── Navigation
            ['key' => 'nav.home',        'section' => 'nav', 'en_value' => 'Home',       'ar_value' => 'الرئيسية', 'type' => 'text', 'sort_order' => 1],
            ['key' => 'nav.services',    'section' => 'nav', 'en_value' => 'Services',   'ar_value' => 'خدماتنا',  'type' => 'text', 'sort_order' => 2],
            ['key' => 'nav.portfolio',   'section' => 'nav', 'en_value' => 'Portfolio',  'ar_value' => 'أعمالنا',  'type' => 'text', 'sort_order' => 3],
            ['key' => 'nav.about',       'section' => 'nav', 'en_value' => 'About',      'ar_value' => 'من نحن',  'type' => 'text', 'sort_order' => 4],
            ['key' => 'nav.contact',     'section' => 'nav', 'en_value' => 'Contact',    'ar_value' => 'تواصل',   'type' => 'text', 'sort_order' => 5],
            ['key' => 'nav.cta',         'section' => 'nav', 'en_value' => 'Get Started','ar_value' => 'ابدأ الآن','type' => 'text', 'sort_order' => 6],

            // ── Hero
            ['key' => 'hero.badge',     'section' => 'hero', 'en_value' => 'Marketing Agency',       'ar_value' => 'وكالة تسويق',              'type' => 'text',     'sort_order' => 1],
            ['key' => 'hero.title',     'section' => 'hero', 'en_value' => 'We Build Brands That Move Markets',  'ar_value' => 'نبني علامات تجارية تُحرّك الأسواق', 'type' => 'text',     'sort_order' => 2],
            ['key' => 'hero.subtitle',  'section' => 'hero', 'en_value' => 'Mr.MEDIA is a full-service marketing agency helping brands grow through strategy, creativity and digital excellence.', 'ar_value' => 'مستر ميديا وكالة تسويق متكاملة تساعد العلامات التجارية على النمو من خلال الاستراتيجية والإبداع والتميز الرقمي.', 'type' => 'textarea', 'sort_order' => 3],
            ['key' => 'hero.cta_primary',   'section' => 'hero', 'en_value' => 'Start Your Project', 'ar_value' => 'ابدأ مشروعك', 'type' => 'text', 'sort_order' => 4],
            ['key' => 'hero.cta_secondary', 'section' => 'hero', 'en_value' => 'View Our Work',      'ar_value' => 'شاهد أعمالنا','type' => 'text', 'sort_order' => 5],

            // ── Stats
            ['key' => 'stats.clients',       'section' => 'stats', 'en_value' => '150+',               'ar_value' => '+150',                  'type' => 'text',     'sort_order' => 1],
            ['key' => 'stats.clients_label', 'section' => 'stats', 'en_value' => 'Happy Clients',       'ar_value' => 'عميل راضٍ',             'type' => 'text',     'sort_order' => 2],
            ['key' => 'stats.projects',      'section' => 'stats', 'en_value' => '300+',               'ar_value' => '+300',                  'type' => 'text',     'sort_order' => 3],
            ['key' => 'stats.projects_label','section' => 'stats', 'en_value' => 'Projects Delivered',  'ar_value' => 'مشروع منجز',            'type' => 'text',     'sort_order' => 4],
            ['key' => 'stats.years',         'section' => 'stats', 'en_value' => '8+',                 'ar_value' => '+8',                    'type' => 'text',     'sort_order' => 5],
            ['key' => 'stats.years_label',   'section' => 'stats', 'en_value' => 'Years of Experience', 'ar_value' => 'سنوات خبرة',            'type' => 'text',     'sort_order' => 6],
            ['key' => 'stats.awards',        'section' => 'stats', 'en_value' => '25+',                'ar_value' => '+25',                   'type' => 'text',     'sort_order' => 7],
            ['key' => 'stats.awards_label',  'section' => 'stats', 'en_value' => 'Awards Won',          'ar_value' => 'جائزة حُصِد عليها',     'type' => 'text',     'sort_order' => 8],

            // ── Services
            ['key' => 'services.section_badge',    'section' => 'services', 'en_value' => 'What We Do',     'ar_value' => 'ماذا نقدم',    'type' => 'text',     'sort_order' => 1],
            ['key' => 'services.title',            'section' => 'services', 'en_value' => 'Our Services',   'ar_value' => 'خدماتنا',      'type' => 'text',     'sort_order' => 2],
            ['key' => 'services.subtitle',         'section' => 'services', 'en_value' => 'We offer a complete suite of marketing and creative services designed to elevate your brand.', 'ar_value' => 'نقدم مجموعة متكاملة من خدمات التسويق والإبداع المصممة لرفع مستوى علامتك التجارية.', 'type' => 'textarea', 'sort_order' => 3],
            ['key' => 'services.s1.title',         'section' => 'services', 'en_value' => 'Brand Strategy', 'ar_value' => 'استراتيجية العلامة التجارية', 'type' => 'text', 'sort_order' => 4],
            ['key' => 'services.s1.description',   'section' => 'services', 'en_value' => 'Build a powerful brand identity that resonates with your audience and stands out in the market.', 'ar_value' => 'بناء هوية علامة تجارية قوية تتردد صداها مع جمهورك وتتميز في السوق.', 'type' => 'textarea', 'sort_order' => 5],
            ['key' => 'services.s2.title',         'section' => 'services', 'en_value' => 'Digital Marketing', 'ar_value' => 'التسويق الرقمي', 'type' => 'text', 'sort_order' => 6],
            ['key' => 'services.s2.description',   'section' => 'services', 'en_value' => 'Data-driven campaigns across social media, search, and display that maximize your ROI.', 'ar_value' => 'حملات مبنية على البيانات عبر وسائل التواصل الاجتماعي والبحث والعرض لتعظيم عائد استثمارك.', 'type' => 'textarea', 'sort_order' => 7],
            ['key' => 'services.s3.title',         'section' => 'services', 'en_value' => 'Content Creation', 'ar_value' => 'إنتاج المحتوى', 'type' => 'text', 'sort_order' => 8],
            ['key' => 'services.s3.description',   'section' => 'services', 'en_value' => 'Compelling visuals, videos and copy that tell your brand\'s story and engage your audience.', 'ar_value' => 'صور ومقاطع فيديو ونصوص مقنعة تحكي قصة علامتك التجارية وتشرك جمهورك.', 'type' => 'textarea', 'sort_order' => 9],
            ['key' => 'services.s4.title',         'section' => 'services', 'en_value' => 'Web & App Design', 'ar_value' => 'تصميم المواقع والتطبيقات', 'type' => 'text', 'sort_order' => 10],
            ['key' => 'services.s4.description',   'section' => 'services', 'en_value' => 'Beautiful, conversion-optimized digital experiences that turn visitors into customers.', 'ar_value' => 'تجارب رقمية جميلة محسّنة للتحويل تحول الزوار إلى عملاء.', 'type' => 'textarea', 'sort_order' => 11],
            ['key' => 'services.s5.title',         'section' => 'services', 'en_value' => 'Media Production', 'ar_value' => 'الإنتاج الإعلامي', 'type' => 'text', 'sort_order' => 12],
            ['key' => 'services.s5.description',   'section' => 'services', 'en_value' => 'Professional photography, videography and motion graphics for all your marketing needs.', 'ar_value' => 'تصوير فوتوغرافي واحترافي وموشن جرافيك لجميع احتياجاتك التسويقية.', 'type' => 'textarea', 'sort_order' => 13],
            ['key' => 'services.s6.title',         'section' => 'services', 'en_value' => 'PR & Events', 'ar_value' => 'العلاقات العامة والفعاليات', 'type' => 'text', 'sort_order' => 14],
            ['key' => 'services.s6.description',   'section' => 'services', 'en_value' => 'Strategic public relations and memorable event experiences that amplify your brand presence.', 'ar_value' => 'علاقات عامة استراتيجية وتجارب فعاليات لا تُنسى تُضخّم حضور علامتك التجارية.', 'type' => 'textarea', 'sort_order' => 15],

            // ── Portfolio
            ['key' => 'portfolio.section_badge', 'section' => 'portfolio', 'en_value' => 'Our Work',     'ar_value' => 'أعمالنا',        'type' => 'text',     'sort_order' => 1],
            ['key' => 'portfolio.title',         'section' => 'portfolio', 'en_value' => 'Selected Projects', 'ar_value' => 'مشاريع مختارة', 'type' => 'text',     'sort_order' => 2],
            ['key' => 'portfolio.subtitle',      'section' => 'portfolio', 'en_value' => 'A showcase of our finest work across branding, digital, and media.', 'ar_value' => 'عرض لأفضل أعمالنا في مجال العلامات التجارية والرقمنة والإعلام.', 'type' => 'textarea', 'sort_order' => 3],
            ['key' => 'portfolio.cta',           'section' => 'portfolio', 'en_value' => 'View All Projects', 'ar_value' => 'عرض جميع المشاريع', 'type' => 'text', 'sort_order' => 4],
            ['key' => 'portfolio.filter_all',    'section' => 'portfolio', 'en_value' => 'All',           'ar_value' => 'الكل',           'type' => 'text',     'sort_order' => 5],
            ['key' => 'portfolio.filter_brand',  'section' => 'portfolio', 'en_value' => 'Branding',      'ar_value' => 'هوية بصرية',     'type' => 'text',     'sort_order' => 6],
            ['key' => 'portfolio.filter_digital','section' => 'portfolio', 'en_value' => 'Digital',       'ar_value' => 'رقمي',           'type' => 'text',     'sort_order' => 7],
            ['key' => 'portfolio.filter_media',  'section' => 'portfolio', 'en_value' => 'Media',         'ar_value' => 'إعلام',          'type' => 'text',     'sort_order' => 8],

            // ── About
            ['key' => 'about.section_badge', 'section' => 'about', 'en_value' => 'Who We Are',        'ar_value' => 'من نحن',               'type' => 'text',     'sort_order' => 1],
            ['key' => 'about.title',         'section' => 'about', 'en_value' => 'Passion Meets Strategy', 'ar_value' => 'الشغف يلتقي بالاستراتيجية', 'type' => 'text', 'sort_order' => 2],
            ['key' => 'about.body',          'section' => 'about', 'en_value' => 'Mr.MEDIA was founded with a single mission: to create marketing that matters. We combine strategic thinking with bold creativity to help brands connect with their audiences in meaningful ways.\n\nWith a team of passionate marketers, designers, and storytellers, we have helped hundreds of businesses across the region achieve their growth ambitions.', 'ar_value' => 'تأسست مستر ميديا بمهمة واحدة: إنشاء تسويق مؤثر. نجمع التفكير الاستراتيجي مع الإبداع الجريء لمساعدة العلامات التجارية على التواصل مع جماهيرها بطرق ذات معنى.\n\nبفريق من المسوقين والمصممين والمبدعين المتحمسين، ساعدنا مئات الشركات في جميع أنحاء المنطقة على تحقيق طموحاتها في النمو.', 'type' => 'textarea', 'sort_order' => 3],
            ['key' => 'about.mission_label', 'section' => 'about', 'en_value' => 'Our Mission',         'ar_value' => 'مهمتنا',               'type' => 'text',     'sort_order' => 4],
            ['key' => 'about.mission_text',  'section' => 'about', 'en_value' => 'To empower brands with creative marketing solutions that drive real business results.', 'ar_value' => 'تمكين العلامات التجارية بحلول تسويقية إبداعية تحقق نتائج أعمال حقيقية.', 'type' => 'textarea', 'sort_order' => 5],
            ['key' => 'about.cta',           'section' => 'about', 'en_value' => 'Learn More About Us', 'ar_value' => 'اعرف المزيد عنا',     'type' => 'text',     'sort_order' => 6],

            // ── Testimonials
            ['key' => 'testimonials.section_badge', 'section' => 'testimonials', 'en_value' => 'Client Love',       'ar_value' => 'آراء عملائنا',     'type' => 'text',     'sort_order' => 1],
            ['key' => 'testimonials.title',         'section' => 'testimonials', 'en_value' => 'What Our Clients Say', 'ar_value' => 'ماذا يقول عملاؤنا', 'type' => 'text',  'sort_order' => 2],
            ['key' => 'testimonials.t1.quote',      'section' => 'testimonials', 'en_value' => 'Mr.MEDIA transformed our brand completely. The results exceeded our expectations by far.', 'ar_value' => 'غيّرت مستر ميديا علامتنا التجارية بالكامل. النتائج فاقت توقعاتنا بكثير.', 'type' => 'textarea', 'sort_order' => 3],
            ['key' => 'testimonials.t1.name',       'section' => 'testimonials', 'en_value' => 'Ahmed Al-Rashid',    'ar_value' => 'أحمد الراشد',      'type' => 'text',     'sort_order' => 4],
            ['key' => 'testimonials.t1.role',       'section' => 'testimonials', 'en_value' => 'CEO, TechVentures',  'ar_value' => 'المدير التنفيذي، تك فنتشرز', 'type' => 'text', 'sort_order' => 5],
            ['key' => 'testimonials.t2.quote',      'section' => 'testimonials', 'en_value' => 'The team\'s creativity and dedication brought our vision to life in ways we never imagined.', 'ar_value' => 'أحيا إبداع الفريق وتفانيه رؤيتنا بطرق لم نتخيلها قط.', 'type' => 'textarea', 'sort_order' => 6],
            ['key' => 'testimonials.t2.name',       'section' => 'testimonials', 'en_value' => 'Sara Hassan',        'ar_value' => 'سارة حسن',          'type' => 'text',     'sort_order' => 7],
            ['key' => 'testimonials.t2.role',       'section' => 'testimonials', 'en_value' => 'Founder, BrandLab',  'ar_value' => 'مؤسسة، براند لاب',  'type' => 'text',     'sort_order' => 8],
            ['key' => 'testimonials.t3.quote',      'section' => 'testimonials', 'en_value' => 'Our digital presence grew 300% in just 6 months. Mr.MEDIA delivers on every promise.', 'ar_value' => 'نما حضورنا الرقمي بنسبة 300% في 6 أشهر فقط. مستر ميديا تفي بكل وعد.', 'type' => 'textarea', 'sort_order' => 9],
            ['key' => 'testimonials.t3.name',       'section' => 'testimonials', 'en_value' => 'Khalid Mansour',     'ar_value' => 'خالد منصور',        'type' => 'text',     'sort_order' => 10],
            ['key' => 'testimonials.t3.role',       'section' => 'testimonials', 'en_value' => 'Director, Gulf Retail', 'ar_value' => 'مدير، غالف ريتيل', 'type' => 'text', 'sort_order' => 11],

            // ── Contact
            ['key' => 'contact.section_badge', 'section' => 'contact', 'en_value' => 'Get In Touch',      'ar_value' => 'تواصل معنا',          'type' => 'text',     'sort_order' => 1],
            ['key' => 'contact.title',         'section' => 'contact', 'en_value' => 'Let\'s Build Something Great', 'ar_value' => 'لنبنِ شيئًا عظيمًا معًا', 'type' => 'text', 'sort_order' => 2],
            ['key' => 'contact.subtitle',      'section' => 'contact', 'en_value' => 'Ready to take your brand to the next level? We\'d love to hear from you.', 'ar_value' => 'هل أنت مستعد للارتقاء بعلامتك التجارية إلى المستوى التالي؟ يسعدنا سماعك.', 'type' => 'textarea', 'sort_order' => 3],
            ['key' => 'contact.email',         'section' => 'contact', 'en_value' => 'hello@mrmedia.com', 'ar_value' => 'hello@mrmedia.com',   'type' => 'text',     'sort_order' => 4],
            ['key' => 'contact.phone',         'section' => 'contact', 'en_value' => '+966 50 000 0000',  'ar_value' => '+٩٦٦ ٥٠ ٠٠٠ ٠٠٠٠',  'type' => 'text',     'sort_order' => 5],
            ['key' => 'contact.address',       'section' => 'contact', 'en_value' => 'Riyadh, Saudi Arabia', 'ar_value' => 'الرياض، المملكة العربية السعودية', 'type' => 'text', 'sort_order' => 6],
            ['key' => 'contact.form.name',     'section' => 'contact', 'en_value' => 'Your Name',         'ar_value' => 'اسمك',                'type' => 'text',     'sort_order' => 7],
            ['key' => 'contact.form.email',    'section' => 'contact', 'en_value' => 'Email Address',     'ar_value' => 'البريد الإلكتروني',   'type' => 'text',     'sort_order' => 8],
            ['key' => 'contact.form.service',  'section' => 'contact', 'en_value' => 'Service Needed',    'ar_value' => 'الخدمة المطلوبة',     'type' => 'text',     'sort_order' => 9],
            ['key' => 'contact.form.message',  'section' => 'contact', 'en_value' => 'Your Message',      'ar_value' => 'رسالتك',              'type' => 'text',     'sort_order' => 10],
            ['key' => 'contact.form.submit',   'section' => 'contact', 'en_value' => 'Send Message',      'ar_value' => 'إرسال الرسالة',       'type' => 'text',     'sort_order' => 11],

            // ── Footer
            ['key' => 'footer.tagline',    'section' => 'footer', 'en_value' => 'Marketing that moves markets.', 'ar_value' => 'تسويق يُحرّك الأسواق.',         'type' => 'text',     'sort_order' => 1],
            ['key' => 'footer.copyright',  'section' => 'footer', 'en_value' => '© 2026 Mr.MEDIA. All rights reserved.', 'ar_value' => '© 2026 مستر ميديا. جميع الحقوق محفوظة.', 'type' => 'text', 'sort_order' => 2],
            ['key' => 'footer.social.instagram', 'section' => 'footer', 'en_value' => 'https://instagram.com/mrmedia', 'ar_value' => 'https://instagram.com/mrmedia', 'type' => 'text', 'sort_order' => 3],
            ['key' => 'footer.social.twitter',   'section' => 'footer', 'en_value' => 'https://twitter.com/mrmedia',   'ar_value' => 'https://twitter.com/mrmedia',   'type' => 'text', 'sort_order' => 4],
            ['key' => 'footer.social.linkedin',  'section' => 'footer', 'en_value' => 'https://linkedin.com/company/mrmedia', 'ar_value' => 'https://linkedin.com/company/mrmedia', 'type' => 'text', 'sort_order' => 5],
        ];

        foreach ($contents as $item) {
            SiteContent::updateOrCreate(['key' => $item['key']], $item);
        }
    }
}
