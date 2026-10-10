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
                'slug'           => 'digital-marketing-training-session',
                'title_ar'       => 'جلسة تدريبية في التسويق الرقمي',
                'type'           => 'training',
                'mode'           => 'offline',
                'description'    => 'A hands-on training session covering social media strategy, SEO fundamentals, and content marketing best practices. Ideal for marketers looking to sharpen their digital skills.',
                'description_ar' => 'جلسة تدريبية تطبيقية تغطي استراتيجية وسائل التواصل الاجتماعي، وأساسيات تحسين محركات البحث، وأفضل ممارسات التسويق بالمحتوى. مثالية للمسوقين الراغبين في صقل مهاراتهم الرقمية.',
                'location'       => 'Mr.MEDIA HQ, Riyadh',
                'location_ar'    => 'مقر مستر ميديا، الرياض',
                'starts_at'      => '2026-11-15 10:00:00',
                'ends_at'        => '2026-11-15 13:00:00',
                'capacity'       => 30,
                'price'          => 150,
                'image_url'      => '/images/events/digital-marketing-training.svg',
                'is_published'   => true,

                'target_audience'    => 'Marketing executives, small business owners, and content creators who want a practical, up-to-date playbook for growing their brand online.',
                'target_audience_ar' => 'مدراء التسويق، وأصحاب الأعمال الصغيرة، وصنّاع المحتوى الراغبون في الحصول على دليل عملي ومحدث لتنمية علامتهم التجارية عبر الإنترنت.',

                'agenda' => [
                    ['title' => 'Social Media Strategy', 'title_ar' => 'استراتيجية التواصل الاجتماعي', 'description' => 'Build a content calendar and positioning that fits your brand voice.', 'description_ar' => 'بناء تقويم محتوى وتموضع يناسب هوية علامتك التجارية.'],
                    ['title' => 'SEO Fundamentals', 'title_ar' => 'أساسيات السيو', 'description' => 'On-page and technical SEO basics to rank higher on Google.', 'description_ar' => 'أساسيات السيو الفني وعلى الصفحة لتحسين ترتيبك في جوجل.'],
                    ['title' => 'Content Marketing', 'title_ar' => 'التسويق بالمحتوى', 'description' => 'Turn ideas into content that converts visitors into customers.', 'description_ar' => 'تحويل الأفكار إلى محتوى يحوّل الزوار إلى عملاء.'],
                    ['title' => 'Live Q&A', 'title_ar' => 'أسئلة وأجوبة مباشرة', 'description' => 'Bring your own case study and get direct feedback from the trainer.', 'description_ar' => 'أحضر دراسة حالتك واحصل على ملاحظات مباشرة من المدرب.'],
                ],

                'trainer_name'    => 'Sara Al-Hashimi',
                'trainer_name_ar' => 'سارة الهاشمي',
                'trainer_title'    => 'Head of Digital Strategy, Mr.MEDIA',
                'trainer_title_ar' => 'رئيسة الاستراتيجية الرقمية في مستر ميديا',
                'trainer_bio'    => 'Sara has led digital campaigns for over 40 brands across the region, with a focus on measurable growth through SEO and social media.',
                'trainer_bio_ar' => 'قادت سارة حملات رقمية لأكثر من 40 علامة تجارية في المنطقة، مع تركيز على تحقيق نمو قابل للقياس عبر السيو ووسائل التواصل الاجتماعي.',
                'trainer_image_url' => null,
                'trainer_credentials' => [
                    ['text' => '10+ years in digital marketing', 'text_ar' => 'أكثر من 10 سنوات خبرة في التسويق الرقمي'],
                    ['text' => 'Google & Meta certified', 'text_ar' => 'معتمدة من جوجل وميتا'],
                    ['text' => 'Trained 500+ marketers', 'text_ar' => 'دربت أكثر من 500 مسوّق'],
                ],

                'payment_note'    => 'Payment is collected at the venue on the day of the session, or via bank transfer in advance.',
                'payment_note_ar' => 'يتم تحصيل الدفع في مكان الفعالية يوم الجلسة، أو عبر التحويل البنكي مسبقًا.',

                'testimonials' => [
                    ['quote' => 'The most practical marketing session I\'ve attended — I used the SEO checklist the same week.', 'quote_ar' => 'أفضل جلسة تسويق عملية حضرتها — طبّقت قائمة السيو في نفس الأسبوع.', 'name' => 'Mohammed Al-Tamimi', 'role' => 'Founder, Local Bites', 'role_ar' => 'مؤسس، Local Bites', 'avatar_url' => null],
                    ['quote' => 'Sara explains complex ideas in a simple way. Our engagement doubled after applying her content framework.', 'quote_ar' => 'تشرح سارة الأفكار المعقدة بطريقة بسيطة. تضاعف تفاعلنا بعد تطبيق إطار المحتوى الخاص بها.', 'name' => 'Lina Fares', 'role' => 'Marketing Lead, Nova Retail', 'role_ar' => 'مسؤولة التسويق، Nova Retail', 'avatar_url' => null],
                ],

                'faqs' => [
                    ['question' => 'Do I need prior marketing experience?', 'question_ar' => 'هل أحتاج إلى خبرة سابقة في التسويق؟', 'answer' => 'No — the session is designed for beginners to intermediate marketers.', 'answer_ar' => 'لا — الجلسة مصممة للمبتدئين والمسوقين متوسطي الخبرة.'],
                    ['question' => 'Will I get a certificate?', 'question_ar' => 'هل سأحصل على شهادة؟', 'answer' => 'Yes, every attendee receives a certificate of completion.', 'answer_ar' => 'نعم، يحصل كل مشارك على شهادة إتمام.'],
                    ['question' => 'What should I bring?', 'question_ar' => 'ماذا يجب أن أحضر؟', 'answer' => 'Just a laptop and a notebook — all materials are provided.', 'answer_ar' => 'فقط جهاز لابتوب ودفتر ملاحظات — جميع المواد متوفرة.'],
                ],

                'cta_heading'       => 'Seats are limited — reserve yours today',
                'cta_heading_ar'    => 'المقاعد محدودة — احجز مكانك اليوم',
                'cta_subheading'    => 'Join 500+ marketers who leveled up their digital skills with Mr.MEDIA.',
                'cta_subheading_ar' => 'انضم إلى أكثر من 500 مسوّق طوّروا مهاراتهم الرقمية مع مستر ميديا.',
            ],
        );
    }
}
