// "Only N left" kicks in at this many seats, or at this share of capacity, whichever is larger.
const LOW_SEATS = 5;
const LOW_SHARE = 0.2;

/**
 * Seat availability for an event from the public API, as display text.
 * Returns null for events without a capacity (unlimited seats).
 */
export function seatsStatus(event, t) {
    if (event.remaining === null || event.remaining === undefined) return null;

    const count = event.remaining;
    if (count <= 0) return { text: t('events.full'), full: true, low: false };

    const low = count <= Math.max(LOW_SEATS, Math.ceil(event.capacity * LOW_SHARE));
    const key = low ? 'events.seats_low' : 'events.seats_available';
    return { text: t(key).replace('{count}', count.toLocaleString()), full: false, low };
}
