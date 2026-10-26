<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Labels for the event page: registration cut-off, countdown, sharing, calendar and error messages. */
    private const LABELS = [
        'events.registration_closed' => ['Registration for this event has closed.', 'انتهى التسجيل في هذه الفعالية.', 45],
        'events.starts_in'           => ['Starts in', 'يبدأ خلال', 46],
        'events.live_now'            => ['Happening now', 'جارية الآن', 47],
        'events.share_label'         => ['Share', 'مشاركة', 48],
        'events.copy_link'           => ['Copy link', 'نسخ الرابط', 49],
        'events.link_copied'         => ['Link copied!', 'تم نسخ الرابط!', 50],
        'events.add_to_calendar'     => ['Add to calendar', 'أضف إلى التقويم', 51],
        'events.calendar_google'     => ['Google Calendar', 'تقويم Google', 52],
        'events.calendar_ics'        => ['Apple / Outlook', 'Apple / Outlook', 53],
        'events.whatsapp_us'         => ['Questions? Message us on WhatsApp', 'لديك سؤال؟ راسلنا على واتساب', 54],
        'events.sending'             => ['Sending…', 'جارٍ الإرسال…', 55],
        'events.error_generic'       => ['Something went wrong. Please try again.', 'حدث خطأ ما. يرجى المحاولة مرة أخرى.', 56],
        'events.error_network'       => ['Network error. Please check your connection.', 'خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.', 57],
        'events.error_invalid'       => ['Please check your details and try again.', 'يرجى التحقق من بياناتك والمحاولة مرة أخرى.', 58],
        'events.error_full'          => ['Not enough seats left for this many attendees.', 'لا توجد مقاعد كافية لهذا العدد من الحضور.', 59],
        'events.error_busy'          => ['Many people are registering right now. Please try again.', 'يقوم الكثيرون بالتسجيل الآن. يرجى المحاولة مرة أخرى.', 60],
        'events.load_error'          => ['We couldn\'t load this event. Please check your connection.', 'تعذّر تحميل الفعالية. يرجى التحقق من اتصالك.', 61],
        'events.retry'               => ['Try again', 'إعادة المحاولة', 62],
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
