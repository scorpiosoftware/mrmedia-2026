/**
 * Event dates from the public API carry the venue's UTC offset (e.g. 2026-11-05T10:00:00+03:00)
 * plus its `timezone`, so everything here shows the venue's time — never the visitor's.
 */

const DEFAULT_TIMEZONE = 'Asia/Baghdad';

function intlLocale(locale) {
    return locale === 'ar' ? 'ar' : 'en-US';
}

function zoneOf(event) {
    return event.timezone || DEFAULT_TIMEZONE;
}

function dayKey(date, timeZone) {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** "Thursday, November 5, 2026 at 10:00 AM" in the venue's time. */
export function formatEventDate(event, locale, options = {}) {
    if (!event?.starts_at) return '';
    return new Intl.DateTimeFormat(intlLocale(locale), {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: zoneOf(event),
        ...options,
    }).format(new Date(event.starts_at));
}

/**
 * Start–end with the venue's zone label: "Thu, Nov 5, 2026 · 10:00 AM – 2:00 PM GMT+3",
 * or both dates for a multi-day event.
 */
export function formatEventRange(event, locale) {
    if (!event?.starts_at) return '';
    const timeZone = zoneOf(event);
    const start = new Date(event.starts_at);
    const end = event.ends_at ? new Date(event.ends_at) : null;
    const loc = intlLocale(locale);

    const day = new Intl.DateTimeFormat(loc, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone });
    const time = new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit', timeZone });
    const zone = new Intl.DateTimeFormat(loc, { timeZoneName: 'short', timeZone })
        .formatToParts(start)
        .find((p) => p.type === 'timeZoneName')?.value;

    let text;
    if (!end || end <= start) {
        text = `${day.format(start)} · ${time.format(start)}`;
    } else if (dayKey(start, timeZone) === dayKey(end, timeZone)) {
        text = `${day.format(start)} · ${time.format(start)} – ${time.format(end)}`;
    } else {
        text = `${day.format(start)} ${time.format(start)} – ${day.format(end)} ${time.format(end)}`;
    }
    return zone ? `${text} ${zone}` : text;
}

/** Calendar entries need an end; events without one get a one-hour slot. */
function endOf(event) {
    const start = new Date(event.starts_at);
    const end = event.ends_at ? new Date(event.ends_at) : null;
    return end && end > start ? end : new Date(start.getTime() + 60 * 60 * 1000);
}

/** 20261105T070000Z */
function utcStamp(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(event, pageUrl) {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${utcStamp(new Date(event.starts_at))}/${utcStamp(endOf(event))}`,
        details: [event.description, pageUrl].filter(Boolean).join('\n\n'),
        location: event.location || '',
        ctz: zoneOf(event),
    });
    return `https://calendar.google.com/calendar/render?${params}`;
}

function icsText(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/([,;])/g, '\\$1');
}

/** Downloads an .ics file — opens in Apple Calendar / Outlook. */
export function downloadIcs(event, pageUrl) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//mrmedia//events//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:event-${event.id}@${window.location.host}`,
        `DTSTAMP:${utcStamp(new Date())}`,
        `DTSTART:${utcStamp(new Date(event.starts_at))}`,
        `DTEND:${utcStamp(endOf(event))}`,
        `SUMMARY:${icsText(event.title)}`,
        event.description && `DESCRIPTION:${icsText(event.description)}`,
        event.location && `LOCATION:${icsText(event.location)}`,
        `URL:${pageUrl}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug || 'event'}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
