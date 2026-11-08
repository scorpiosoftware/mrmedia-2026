/**
 * Example values shown as input placeholders on the public contact and event registration forms.
 * The phone example is the local part for the default country (Iraq, +964).
 */
const PLACEHOLDERS = {
    en: {
        name: 'Mohammad Alloul',
        email: 'info@moalloul.com',
        phone: '770 123 4567',
        company: 'Moalloul Co.',
        service: 'e.g. Social media management',
        message: 'Tell us a little about your project…',
        notes: 'Any notes or special requests…',
    },
    ar: {
        name: 'محمد علول',
        email: 'info@moalloul.com',
        phone: '770 123 4567',
        company: 'شركة علول',
        service: 'مثال: إدارة مواقع التواصل الاجتماعي',
        message: 'أخبرنا قليلاً عن مشروعك…',
        notes: 'أي ملاحظات أو طلبات خاصة…',
    },
};

export function formPlaceholders(locale) {
    return PLACEHOLDERS[locale] ?? PLACEHOLDERS.en;
}
