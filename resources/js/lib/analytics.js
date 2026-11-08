/**
 * First-party page-view tracking for the dashboard's Statistics page (PageViewController).
 * The visitor is an anonymous random id kept in localStorage — no cookies, no personal data.
 * A session ends after 30 minutes without a page view.
 */

const VISITOR_KEY = 'mm_vid';
const SESSION_KEY = 'mm_sid';
const SESSION_SEEN_KEY = 'mm_sid_seen';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Fallbacks for when storage is blocked (private mode, strict settings): the visit still counts, once.
const memory = {};

function read(storage, key) {
    try {
        return window[storage].getItem(key) ?? memory[key] ?? null;
    } catch {
        return memory[key] ?? null;
    }
}

function write(storage, key, value) {
    memory[key] = value;

    try {
        window[storage].setItem(key, value);
    } catch {
        // storage unavailable — the in-memory copy covers this page load
    }
}

function uuid() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (
            c ^
            (window.crypto.getRandomValues(new Uint8Array(1))[0] &
                (15 >> (c / 4)))
        ).toString(16),
    );
}

function visitorId() {
    let id = read('localStorage', VISITOR_KEY);

    if (!id) {
        id = uuid();
        write('localStorage', VISITOR_KEY, id);
    }

    return id;
}

/** The current session id, and whether this page view starts it. */
function session() {
    const now = Date.now();
    let id = read('sessionStorage', SESSION_KEY);
    const lastSeen = Number(read('sessionStorage', SESSION_SEEN_KEY) || 0);
    const isEntry = !id || now - lastSeen > SESSION_TIMEOUT_MS;

    if (isEntry) {
        id = uuid();
        write('sessionStorage', SESSION_KEY, id);
    }

    write('sessionStorage', SESSION_SEEN_KEY, String(now));

    return { id, isEntry };
}

let current = null; // { id, startedAt, visibleMs, visibleSince }

function elapsedSeconds(view) {
    const visible =
        view.visibleMs +
        (view.visibleSince ? Date.now() - view.visibleSince : 0);

    return Math.round(visible / 1000);
}

/** Reports time on the current page. Safe to call repeatedly — the server keeps the longest report. */
function reportDuration() {
    if (!current?.id) {
        return;
    }

    const body = JSON.stringify({
        visitor_id: visitorId(),
        seconds: elapsedSeconds(current),
    });
    const url = `/spa/track/${current.id}/leave`;

    try {
        if (
            navigator.sendBeacon?.(
                url,
                new Blob([body], { type: 'application/json' }),
            )
        ) {
            return;
        }
    } catch {
        // fall through to fetch
    }

    fetch(url, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
}

let listening = false;

function listen() {
    if (listening) {
        return;
    }

    listening = true;
    // Only count time the tab is actually visible, and report whenever it's hidden
    // (mobile browsers often never fire pagehide).
    document.addEventListener('visibilitychange', () => {
        if (!current) {
            return;
        }

        if (document.visibilityState === 'hidden') {
            if (current.visibleSince) {
                current.visibleMs += Date.now() - current.visibleSince;
                current.visibleSince = null;
            }

            reportDuration();
        } else {
            current.visibleSince = Date.now();
        }
    });
    window.addEventListener('pagehide', reportDuration);
}

/** Trims to the server's length limits so an over-long value can't get the whole view rejected. */
function clip(value, max) {
    return value ? value.slice(0, max) : null;
}

/** Records a view of `pathname` (public pages only — the server ignores anything else). */
export function trackPageView(pathname, locale) {
    if (current) {
        reportDuration();
    }

    listen();

    const { id: sessionId, isEntry } = session();
    const params = new URLSearchParams(window.location.search);
    const view = {
        id: null,
        visibleMs: 0,
        visibleSince:
            document.visibilityState === 'visible' ? Date.now() : null,
    };
    current = view;

    fetch('/spa/track', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify({
            visitor_id: visitorId(),
            session_id: sessionId,
            is_entry: isEntry,
            path: pathname.slice(0, 255),
            // Where the visit came from only matters for the session's first page.
            referrer: isEntry ? clip(document.referrer, 2048) : null,
            utm_source: isEntry ? clip(params.get('utm_source'), 100) : null,
            utm_medium: isEntry ? clip(params.get('utm_medium'), 100) : null,
            utm_campaign: isEntry
                ? clip(params.get('utm_campaign'), 100)
                : null,
            locale,
        }),
    })
        .then((r) => (r.status === 201 ? r.json() : null))
        .then((json) => {
            if (json?.id) {
                view.id = json.id;
            }
        })
        .catch(() => {});
}
