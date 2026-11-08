import AdminLayout from '@/components/admin/AdminLayout';
import {
    BarList,
    ColumnChart,
    formatDuration,
    formatNumber,
    Heatmap,
    Legend,
    LineChart,
    SegmentedBar,
    SERIES,
    Sparkline,
} from '@/components/admin/stats/charts';
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Clock,
    ExternalLink,
    EyeOff,
    Minus,
    RefreshCw,
    Table2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const RANGES = [
    { key: 'today', label: 'Today', previous: 'yesterday' },
    { key: '7d', label: '7 days', previous: 'previous 7 days' },
    { key: '30d', label: '30 days', previous: 'previous 30 days' },
    { key: '90d', label: '90 days', previous: 'previous 90 days' },
    { key: '12m', label: '12 months', previous: 'previous 12 months' },
];
const RANGE_KEY = 'mm_stats_range';
const REFRESH_MS = 60_000;

const CHANNEL_LABELS = {
    direct: 'Direct / typed',
    social: 'Social media',
    search: 'Search engines',
    referral: 'Other websites',
    campaign: 'Campaigns (UTM)',
};
const DEVICE_LABELS = {
    desktop: 'Desktop',
    mobile: 'Mobile',
    tablet: 'Tablet',
};
const LOCALE_LABELS = { en: 'English', ar: 'Arabic' };
const regionNames =
    typeof Intl.DisplayNames === 'function'
        ? new Intl.DisplayNames(['en'], { type: 'region' })
        : null;
const countryLabel = (code) =>
    code === 'Other' ? 'Other' : (regionNames?.of(code) ?? code);

function readRange() {
    try {
        const saved = localStorage.getItem(RANGE_KEY);
        return RANGES.some((r) => r.key === saved) ? saved : '30d';
    } catch {
        return '30d';
    }
}

function saveRange(range) {
    try {
        localStorage.setItem(RANGE_KEY, range);
    } catch {
        // per-browser convenience only
    }
}

/* ---------- formatting ---------- */

const parseDay = (key) => new Date(`${key}T00:00:00`);

function bucketLabel(bucket) {
    if (bucket === 'hour') return (key) => `${String(key).padStart(2, '0')}:00`;
    if (bucket === 'month')
        return (key) =>
            parseDay(`${key}-01`).toLocaleDateString('en', { month: 'short' });
    return (key) =>
        parseDay(key).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
        });
}

function bucketTitle(bucket) {
    if (bucket === 'hour')
        return (key) =>
            `${String(key).padStart(2, '0')}:00 – ${String((Number(key) + 1) % 24).padStart(2, '0')}:00`;
    if (bucket === 'month')
        return (key) =>
            parseDay(`${key}-01`).toLocaleDateString('en', {
                month: 'long',
                year: 'numeric',
            });
    return (key) =>
        parseDay(key).toLocaleDateString('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
}

function formatMoney(value, currency) {
    if (value == null) return '—';
    return `${formatNumber(Math.round(value))} ${currency}`;
}

const formatPercent = (value) => (value == null ? '—' : `${value}%`);

function formatDate(iso, withTime = false) {
    if (!iso) return '';
    return new Date(iso).toLocaleString(
        'en',
        withTime
            ? { dateStyle: 'medium', timeStyle: 'short' }
            : { dateStyle: 'medium' },
    );
}

function timeAgo(iso) {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return formatDate(iso);
}

/* ---------- small pieces ---------- */

function Card({ title, subtitle, action, children, className = '' }) {
    return (
        <section
            className={`min-w-0 rounded-2xl border border-[#E3E6F0] bg-white p-5 shadow-[0_1px_2px_rgba(13,27,75,0.04)] ${className}`}
        >
            {(title || action) && (
                <header className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-sm font-semibold text-[#0D1B4B]">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-[#5A6A9A]">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

/** Chart ↔ table switch, so every charted value can also be read without hovering. */
function ViewToggle({ table, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!table)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E3E6F0] px-2.5 py-1 text-xs font-medium text-[#5A6A9A] transition hover:bg-[#F5F6FA] hover:text-[#0D1B4B]"
        >
            {table ? <BarChart3 size={13} /> : <Table2 size={13} />}
            {table ? 'Chart' : 'Table'}
        </button>
    );
}

/**
 * Change versus the previous period. Rates compare in percentage points; colour says whether
 * the move is good (it's paired with an arrow and a sign, never colour alone).
 */
function Delta({
    value,
    previous,
    goodWhenUp = true,
    points = false,
    previousLabel,
}) {
    if (value == null || previous == null) return null;
    const title = `Previous period (${previousLabel}): ${previous}${points ? '%' : ''}`;

    let text;
    let diff;
    if (points) {
        diff = Math.round((value - previous) * 10) / 10;
        text = `${diff > 0 ? '+' : ''}${diff} pts`;
    } else if (previous === 0) {
        if (value === 0)
            return (
                <span className="text-xs text-[#898781]" title={title}>
                    No change
                </span>
            );
        return (
            <span
                className="inline-flex items-center gap-0.5 rounded-full bg-[#EAF6EA] px-1.5 py-0.5 text-xs font-semibold text-[#006300]"
                title={title}
            >
                <ArrowUpRight size={12} /> New
            </span>
        );
    } else {
        diff = Math.round(((value - previous) / previous) * 1000) / 10;
        text = `${diff > 0 ? '+' : ''}${diff}%`;
    }

    if (diff === 0) {
        return (
            <span
                className="inline-flex items-center gap-0.5 rounded-full bg-[#F1F2F6] px-1.5 py-0.5 text-xs font-semibold text-[#5A6A9A]"
                title={title}
            >
                <Minus size={12} /> 0{points ? ' pts' : '%'}
            </span>
        );
    }

    const good = diff > 0 === goodWhenUp;
    const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${good ? 'bg-[#EAF6EA] text-[#006300]' : 'bg-[#FBECEC] text-[#B42323]'}`}
            title={title}
        >
            <Icon size={12} /> {text}
        </span>
    );
}

function StatCard({ label, value, delta, hint, trend, size = 'lg' }) {
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-[#E3E6F0] bg-white p-4 shadow-[0_1px_2px_rgba(13,27,75,0.04)] sm:p-5">
            <p className="text-xs font-medium text-[#5A6A9A]">{label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
                <div className="min-w-0">
                    <p
                        className={`font-semibold text-[#0D1B4B] ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}
                    >
                        {value}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {delta}
                        {hint && (
                            <span className="text-xs text-[#898781]">
                                {hint}
                            </span>
                        )}
                    </div>
                </div>
                {trend}
            </div>
        </div>
    );
}

const EVENT_STATUS = {
    open: {
        label: 'Open',
        icon: CheckCircle2,
        className: 'bg-[#EAF6EA] text-[#006300] ring-[#0ca30c]/30',
    },
    full: {
        label: 'Full',
        icon: AlertCircle,
        className: 'bg-[#FDF0EA] text-[#A4441C] ring-[#ec835a]/40',
    },
    ended: {
        label: 'Ended',
        icon: Clock,
        className: 'bg-[#F1F2F6] text-[#5A6A9A] ring-[#D1D5E8]',
    },
    draft: {
        label: 'Draft',
        icon: EyeOff,
        className: 'bg-white text-[#5A6A9A] ring-[#D1D5E8]',
    },
};

function StatusBadge({ status }) {
    const s = EVENT_STATUS[status] ?? EVENT_STATUS.ended;
    const Icon = s.icon;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.className}`}
        >
            <Icon size={12} /> {s.label}
        </span>
    );
}

/** Thin meter: blue fill on a lighter blue track. */
function Meter({ value, max = 100 }) {
    const pct = max ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="h-1.5 w-20 rounded-full bg-[#DCE8F8]">
            <div
                className="h-1.5 rounded-full bg-[#2a78d6]"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function LiveBadge({ realtime }) {
    if (!realtime) return null;
    const live = realtime.visitors > 0;
    return (
        <span
            className="inline-flex items-center gap-2 rounded-full border border-[#E3E6F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0D1B4B]"
            title={`Visitors who opened a page in the last ${realtime.minutes} minutes`}
        >
            <span className="relative flex h-2 w-2">
                {live && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0ca30c] opacity-60" />
                )}
                <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-[#0ca30c]' : 'bg-[#C3C7D6]'}`}
                />
            </span>
            <span className="tabular-nums">{realtime.visitors}</span>
            <span className="font-normal text-[#5A6A9A]">online now</span>
        </span>
    );
}

function Th({ children, align = 'right' }) {
    return (
        <th
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap text-[#5A6A9A] ${align === 'left' ? 'text-left' : 'text-right'}`}
        >
            {children}
        </th>
    );
}

function Td({ children, align = 'right', className = '' }) {
    return (
        <td
            className={`px-3 py-3 whitespace-nowrap text-[#0D1B4B] tabular-nums ${align === 'left' ? 'text-left' : 'text-right'} ${className}`}
        >
            {children}
        </td>
    );
}

/* ---------- sections ---------- */

function Kpis({ data, previousLabel }) {
    const k = data.kpis;
    const delta = (key, opts = {}) => (
        <Delta
            value={k[key].value}
            previous={k[key].previous}
            previousLabel={previousLabel}
            {...opts}
        />
    );
    const trend = (key, color) => (
        <Sparkline values={data.series.map((d) => d[key])} color={color} />
    );
    const newShare = k.visitors.value
        ? Math.round((k.new_visitors.value / k.visitors.value) * 100)
        : null;

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Unique visitors"
                    value={formatNumber(k.visitors.value)}
                    delta={delta('visitors')}
                    trend={trend('visitors', SERIES[1])}
                />
                <StatCard
                    label="Page views"
                    value={formatNumber(k.views.value)}
                    delta={delta('views')}
                    trend={trend('views', SERIES[0])}
                />
                <StatCard
                    label="Event registrations"
                    value={formatNumber(k.registrations.value)}
                    delta={delta('registrations')}
                    hint={`${formatNumber(k.attendees.value)} seats`}
                    trend={trend('registrations', SERIES[0])}
                />
                <StatCard
                    label="Event page conversion"
                    value={formatPercent(k.conversion_rate.value)}
                    delta={delta('conversion_rate', { points: true })}
                    hint={`of ${formatNumber(k.event_visitors.value)} event visitors`}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                <StatCard
                    size="sm"
                    label="Sessions"
                    value={formatNumber(k.sessions.value)}
                    delta={delta('sessions')}
                />
                <StatCard
                    size="sm"
                    label="Avg. time on page"
                    value={formatDuration(k.avg_duration.value)}
                    delta={delta('avg_duration')}
                />
                <StatCard
                    size="sm"
                    label="Bounce rate"
                    value={formatPercent(k.bounce_rate.value)}
                    delta={delta('bounce_rate', {
                        points: true,
                        goodWhenUp: false,
                    })}
                />
                <StatCard
                    size="sm"
                    label="New visitors"
                    value={formatNumber(k.new_visitors.value)}
                    delta={delta('new_visitors')}
                    hint={newShare != null ? `${newShare}% of visitors` : null}
                />
                <StatCard
                    size="sm"
                    label="Contact messages"
                    value={formatNumber(k.messages.value)}
                    delta={delta('messages')}
                />
                <StatCard
                    size="sm"
                    label="Registration value"
                    value={formatMoney(k.revenue.value, data.currency)}
                    delta={delta('revenue')}
                />
            </div>
        </>
    );
}

function TrafficCard({ data }) {
    const [table, setTable] = useState(false);
    const series = [
        { key: 'views', label: 'Page views', color: SERIES[0], area: true },
        { key: 'visitors', label: 'Unique visitors', color: SERIES[1] },
    ];
    const fx = bucketLabel(data.bucket);
    const ft = bucketTitle(data.bucket);

    return (
        <Card
            title="Traffic"
            subtitle={
                data.bucket === 'hour'
                    ? 'Page views and visitors by hour, today'
                    : `Page views and visitors per ${data.bucket}`
            }
            action={<ViewToggle table={table} onChange={setTable} />}
        >
            {table ? (
                <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-[#E3E6F0]">
                                <Th align="left">Period</Th>
                                <Th>Page views</Th>
                                <Th>Visitors</Th>
                                <Th>Registrations</Th>
                                <Th>Messages</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...data.series].reverse().map((d) => (
                                <tr
                                    key={d.key}
                                    className="border-b border-[#F0F1F5]"
                                >
                                    <Td align="left">{ft(d.key)}</Td>
                                    <Td>{formatNumber(d.views)}</Td>
                                    <Td>{formatNumber(d.visitors)}</Td>
                                    <Td>{formatNumber(d.registrations)}</Td>
                                    <Td>{formatNumber(d.messages)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <>
                    <div className="mb-3">
                        <Legend items={series} />
                    </div>
                    <LineChart
                        data={data.series}
                        series={series}
                        formatX={fx}
                        formatTitle={ft}
                        label="Page views and unique visitors over time"
                    />
                </>
            )}
        </Card>
    );
}

function LeadsCard({ data }) {
    const series = [
        {
            key: 'registrations',
            label: 'Event registrations',
            color: SERIES[0],
        },
        { key: 'messages', label: 'Contact messages', color: SERIES[1] },
    ];
    const k = data.kpis;
    return (
        <Card
            title="Leads"
            subtitle="Registrations and contact form messages received"
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Legend items={series} shape="box" />
                <span className="text-xs text-[#5A6A9A]">
                    Total{' '}
                    <b className="font-semibold text-[#0D1B4B]">
                        {formatNumber(k.registrations.value + k.messages.value)}
                    </b>
                </span>
            </div>
            <ColumnChart
                data={data.series}
                series={series}
                formatX={bucketLabel(data.bucket)}
                formatTitle={bucketTitle(data.bucket)}
                label="Registrations and contact messages over time"
            />
        </Card>
    );
}

function SourcesCard({ data }) {
    return (
        <Card
            title="Traffic sources"
            subtitle="How visitors arrived (sessions)"
        >
            <SegmentedBar
                items={data.channels}
                formatLabel={(k) => CHANNEL_LABELS[k] ?? k}
            />
            <h3 className="mt-6 mb-3 text-xs font-semibold tracking-wide text-[#5A6A9A] uppercase">
                Top referring sites
            </h3>
            <BarList
                items={data.referrers}
                empty="No visits from other sites yet"
            />
        </Card>
    );
}

function EventsCard({ data }) {
    const events = data.events;
    return (
        <Card
            title="Event landing pages"
            subtitle="Visits and registrations for each event in this period"
        >
            {events.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#898781]">
                    No event page visits or registrations in this period.
                </p>
            ) : (
                <div className="-mx-5 overflow-x-auto px-5">
                    <table className="w-full min-w-[880px] text-sm">
                        <thead>
                            <tr className="border-b border-[#E3E6F0]">
                                <Th align="left">Event</Th>
                                <Th align="left">Status</Th>
                                <Th>Page views</Th>
                                <Th>Visitors</Th>
                                <Th>Avg. time</Th>
                                <Th>Registrations</Th>
                                <Th>Conversion</Th>
                                <Th>Seats booked</Th>
                                <Th>Value</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((e) => (
                                <tr
                                    key={e.id}
                                    className="border-b border-[#F0F1F5] last:border-0 hover:bg-[#FAFBFD]"
                                >
                                    <Td align="left" className="max-w-[260px]">
                                        <a
                                            href={`/events/${e.slug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group inline-flex max-w-full items-center gap-1 font-semibold hover:text-[#213C93]"
                                        >
                                            <span className="truncate">
                                                {e.title}
                                            </span>
                                            <ExternalLink
                                                size={12}
                                                className="shrink-0 opacity-0 transition group-hover:opacity-60"
                                            />
                                        </a>
                                        <span className="block text-xs font-normal text-[#898781]">
                                            {formatDate(e.starts_at)} ·{' '}
                                            {e.type === 'training'
                                                ? 'Training'
                                                : 'Event'}
                                        </span>
                                    </Td>
                                    <Td align="left">
                                        <StatusBadge status={e.status} />
                                    </Td>
                                    <Td className="font-semibold">
                                        {formatNumber(e.views)}
                                    </Td>
                                    <Td>{formatNumber(e.visitors)}</Td>
                                    <Td>{formatDuration(e.avg_duration)}</Td>
                                    <Td>
                                        <span className="font-semibold">
                                            {formatNumber(e.registrations)}
                                        </span>
                                        {e.attendees > e.registrations && (
                                            <span className="block text-xs text-[#898781]">
                                                {formatNumber(e.attendees)}{' '}
                                                people
                                            </span>
                                        )}
                                    </Td>
                                    <Td>
                                        <div className="flex items-center justify-end gap-2">
                                            {e.conversion_rate != null && (
                                                <Meter
                                                    value={e.conversion_rate}
                                                    max={Math.max(
                                                        20,
                                                        e.conversion_rate,
                                                    )}
                                                />
                                            )}
                                            <span className="w-12">
                                                {formatPercent(
                                                    e.conversion_rate,
                                                )}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>
                                        {e.capacity ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Meter
                                                    value={e.booked}
                                                    max={e.capacity}
                                                />
                                                <span className="w-16">
                                                    {e.booked}/{e.capacity}
                                                </span>
                                            </div>
                                        ) : (
                                            <span>
                                                {e.booked}{' '}
                                                <span className="text-xs text-[#898781]">
                                                    (no limit)
                                                </span>
                                            </span>
                                        )}
                                    </Td>
                                    <Td>
                                        {formatMoney(e.revenue, data.currency)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

function TopPagesCard({ data }) {
    return (
        <Card title="Top pages" subtitle="Most viewed pages">
            {data.top_pages.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#898781]">
                    No page views in this period.
                </p>
            ) : (
                <div className="-mx-5 overflow-x-auto px-5">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#E3E6F0]">
                                <Th align="left">Page</Th>
                                <Th>Views</Th>
                                <Th>Visitors</Th>
                                <Th>Avg. time</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.top_pages.map((p) => (
                                <tr
                                    key={p.path}
                                    className="border-b border-[#F0F1F5] last:border-0"
                                >
                                    <Td align="left" className="max-w-[220px]">
                                        <span className="block truncate font-medium">
                                            {p.title}
                                        </span>
                                        <span className="block truncate text-xs text-[#898781]">
                                            {p.path}
                                        </span>
                                    </Td>
                                    <Td className="font-semibold">
                                        {formatNumber(p.views)}
                                    </Td>
                                    <Td>{formatNumber(p.visitors)}</Td>
                                    <Td>{formatDuration(p.avg_duration)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

const WEEKDAY_NAMES = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

function HeatmapCard({ data }) {
    const [table, setTable] = useState(false);
    const grid = data.heatmap;
    let peak = null;
    grid.forEach((row, d) =>
        row.forEach((v, h) => {
            if (v > 0 && (!peak || v > peak.v)) peak = { d, h, v };
        }),
    );

    return (
        <Card
            title="Busiest hours"
            subtitle={
                peak
                    ? `Peak: ${WEEKDAY_NAMES[peak.d]}s around ${String(peak.h).padStart(2, '0')}:00 (${data.timezone})`
                    : `Page views by weekday and hour (${data.timezone})`
            }
            action={<ViewToggle table={table} onChange={setTable} />}
        >
            {table ? (
                <div className="max-h-72 overflow-auto">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-[#E3E6F0]">
                                <Th align="left">Hour</Th>
                                {WEEKDAY_NAMES.map((d) => (
                                    <Th key={d}>{d.slice(0, 3)}</Th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 24 }, (_, h) => (
                                <tr
                                    key={h}
                                    className="border-b border-[#F0F1F5]"
                                >
                                    <Td align="left">
                                        {String(h).padStart(2, '0')}:00
                                    </Td>
                                    {grid.map((row, d) => (
                                        <Td key={d}>{row[h] || '·'}</Td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Heatmap grid={grid} label="Page views by weekday and hour" />
            )}
        </Card>
    );
}

function AudienceCards({ data }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card title="Devices" subtitle="Unique visitors">
                <SegmentedBar
                    items={['desktop', 'mobile', 'tablet'].map((key) => ({
                        key,
                        value:
                            data.devices.find((d) => d.key === key)?.value ?? 0,
                    }))}
                    formatLabel={(k) => DEVICE_LABELS[k] ?? k}
                />
            </Card>
            <Card title="Language" subtitle="Site language visitors used">
                <SegmentedBar
                    items={['en', 'ar'].map((key) => ({
                        key,
                        value:
                            data.locales.find((d) => d.key === key)?.value ?? 0,
                    }))}
                    formatLabel={(k) => LOCALE_LABELS[k] ?? k}
                />
            </Card>
            <Card title="Browsers" subtitle="Unique visitors">
                <BarList items={data.browsers} />
            </Card>
            <Card title="Operating systems" subtitle="Unique visitors">
                <BarList items={data.os} />
            </Card>
        </div>
    );
}

function CampaignsCard({ data }) {
    return (
        <Card
            title="Campaigns"
            subtitle="Visits from links tagged with utm_source / utm_campaign"
        >
            {data.campaigns.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#898781]">
                    No tagged campaign visits yet. Add{' '}
                    <code className="rounded bg-[#F1F2F6] px-1">
                        ?utm_source=instagram&amp;utm_campaign=…
                    </code>{' '}
                    to links you share to track them here.
                </p>
            ) : (
                <div className="-mx-5 overflow-x-auto px-5">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#E3E6F0]">
                                <Th align="left">Campaign</Th>
                                <Th align="left">Source / medium</Th>
                                <Th>Sessions</Th>
                                <Th>Visitors</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.campaigns.map((c, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-[#F0F1F5] last:border-0"
                                >
                                    <Td align="left" className="font-medium">
                                        {c.campaign || '(not set)'}
                                    </Td>
                                    <Td align="left" className="text-[#5A6A9A]">
                                        {c.source || '(not set)'}
                                        {c.medium ? ` / ${c.medium}` : ''}
                                    </Td>
                                    <Td className="font-semibold">
                                        {formatNumber(c.sessions)}
                                    </Td>
                                    <Td>{formatNumber(c.visitors)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

function ActivityCard({ data }) {
    const regs = data.recent_registrations;
    const live = data.realtime;
    return (
        <Card title="Latest activity">
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-[#5A6A9A] uppercase">
                Online now
            </h3>
            {live.pages.length === 0 ? (
                <p className="mb-5 text-sm text-[#898781]">
                    Nobody on the site in the last {live.minutes} minutes.
                </p>
            ) : (
                <ul className="mb-5 space-y-1.5">
                    {live.pages.map((p) => (
                        <li
                            key={p.path}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            <span className="truncate text-[#0D1B4B]">
                                {p.path}
                            </span>
                            <span className="shrink-0 font-semibold text-[#0D1B4B] tabular-nums">
                                {p.visitors}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-[#5A6A9A] uppercase">
                Recent registrations
            </h3>
            {regs.length === 0 ? (
                <p className="text-sm text-[#898781]">No registrations yet.</p>
            ) : (
                <ul className="divide-y divide-[#F0F1F5]">
                    {regs.map((r) => (
                        <li
                            key={r.id}
                            className="flex items-center justify-between gap-3 py-2 text-sm"
                        >
                            <span className="min-w-0">
                                <span className="block truncate font-medium text-[#0D1B4B]">
                                    {r.event_title ?? 'Deleted event'}
                                </span>
                                <span className="text-xs text-[#898781]">
                                    {r.attendees}{' '}
                                    {r.attendees === 1 ? 'seat' : 'seats'}
                                    {r.total_price != null &&
                                        ` · ${formatMoney(r.total_price, data.currency)}`}
                                </span>
                            </span>
                            <span className="shrink-0 text-xs text-[#898781]">
                                {timeAgo(r.created_at)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

/* ---------- page ---------- */

export default function Statistics() {
    const [range, setRange] = useState(readRange);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatedAt, setUpdatedAt] = useState(null);

    const load = useCallback(async (selected, signal) => {
        setLoading(true);
        try {
            const res = await fetch(`/spa/admin/statistics?range=${selected}`, {
                credentials: 'include',
                signal,
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error();
            setData(await res.json());
            setUpdatedAt(new Date());
            setError('');
        } catch (e) {
            if (e.name !== 'AbortError')
                setError('Could not load statistics. Try refreshing.');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load(range, controller.signal);
        // Keep the numbers (and "online now") fresh while the page stays open.
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') load(range);
        }, REFRESH_MS);
        return () => {
            controller.abort();
            clearInterval(timer);
        };
    }, [range, load]);

    const choose = (key) => {
        saveRange(key);
        setRange(key);
    };

    const rangeInfo = RANGES.find((r) => r.key === range);
    const noTraffic = data && !data.tracking_since;

    return (
        <AdminLayout
            title="Statistics"
            actions={<LiveBadge realtime={data?.realtime} />}
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div
                    role="radiogroup"
                    aria-label="Date range"
                    className="inline-flex flex-wrap rounded-xl border border-[#E3E6F0] bg-white p-1"
                >
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            type="button"
                            role="radio"
                            aria-checked={range === r.key}
                            onClick={() => choose(r.key)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${range === r.key ? 'bg-[#213C93] text-white shadow-sm' : 'text-[#5A6A9A] hover:bg-[#F5F6FA] hover:text-[#0D1B4B]'}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#5A6A9A]">
                    {data && (
                        <span>
                            {formatDate(data.from)}
                            {data.from !== data.to &&
                                ` – ${formatDate(data.to)}`}
                            {updatedAt &&
                                ` · updated ${updatedAt.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => load(range)}
                        disabled={loading}
                        aria-label="Refresh statistics"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E6F0] bg-white text-[#5A6A9A] transition hover:text-[#213C93] disabled:opacity-60"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? 'animate-spin' : ''}
                        />
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {!data ? (
                <div className="flex justify-center py-24">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
                </div>
            ) : (
                // While a new range loads, keep the previous numbers on screen, dimmed — no layout jump.
                <div
                    className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}
                >
                    {noTraffic && (
                        <div className="rounded-xl border border-[#C9D8F5] bg-[#F1F6FF] px-4 py-3 text-sm text-[#213C93]">
                            Visitor tracking is on. Numbers will appear here as
                            people visit the site (visits by signed-in staff are
                            not counted).
                        </div>
                    )}
                    <Kpis data={data} previousLabel={rangeInfo.previous} />
                    <TrafficCard data={data} />
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="min-w-0 lg:col-span-3">
                            <LeadsCard data={data} />
                        </div>
                        <div className="min-w-0 lg:col-span-2">
                            <SourcesCard data={data} />
                        </div>
                    </div>
                    <EventsCard data={data} />
                    <AudienceCards data={data} />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <TopPagesCard data={data} />
                        <HeatmapCard data={data} />
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <CampaignsCard data={data} />
                        <ActivityCard data={data} />
                    </div>
                    {data.countries.length > 0 && (
                        <Card title="Countries" subtitle="Unique visitors">
                            <BarList
                                items={data.countries}
                                formatLabel={countryLabel}
                            />
                        </Card>
                    )}
                    <p className="text-xs text-[#898781]">
                        Visitors are counted with an anonymous id stored in
                        their browser; no IP addresses or personal details are
                        kept. Days and hours use the {data.timezone} timezone.
                    </p>
                </div>
            )}
        </AdminLayout>
    );
}
