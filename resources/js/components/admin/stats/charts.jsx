import { useEffect, useRef, useState } from 'react';

/*
 * Lightweight SVG charts for the Statistics page. Colours come from a palette validated for
 * colour-blind separation (categorical slots in fixed order — a series keeps its colour);
 * marks are thin, gridlines are solid hairlines, and every chart has hover/focus readouts
 * plus a table (or printed numbers) so no value is hover-only.
 */

export const SERIES = [
    '#2a78d6',
    '#eb6834',
    '#1baf7a',
    '#eda100',
    '#e87ba4',
    '#008300',
    '#6250d6',
    '#e34948',
];
// Text set inside a coloured fill: white, except near-black on yellow.
export const INK_ON = { '#eda100': '#0b0b0b' };
// Sequential blue (light → dark) for magnitude, e.g. the busiest-hours heatmap.
export const BLUE_RAMP = [
    '#cde2fb',
    '#b7d3f6',
    '#9ec5f4',
    '#86b6ef',
    '#6da7ec',
    '#5598e7',
    '#3987e5',
    '#2a78d6',
    '#256abf',
    '#1c5cab',
    '#184f95',
    '#104281',
    '#0d366b',
];

const INK = '#0D1B4B';
const INK_2 = '#5A6A9A';
const MUTED = '#898781';
const GRID = '#ECEDF2';
const BASELINE = '#D1D5E8';

const nf = new Intl.NumberFormat('en');
const compact = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

/** 1,284 under ten thousand; 12.9K above. */
export function formatNumber(value) {
    if (value == null) return '—';
    return Math.abs(value) >= 10000 ? compact.format(value) : nf.format(value);
}

export function formatDuration(seconds) {
    if (seconds == null) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
}

/** Live width of an element, for drawing SVG at its real size. */
export function useWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) =>
            setWidth(Math.floor(entry.contentRect.width)),
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, width];
}

/** A clean axis maximum and its ticks (0, 25, 50 … / 0, 1K, 2K …). */
function niceScale(max, count = 4) {
    if (max <= 0)
        return {
            max: count,
            ticks: Array.from({ length: count + 1 }, (_, i) => i),
        };
    const rough = max / count;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10]
        .map((m) => m * magnitude)
        .find((s) => s >= rough);
    const niceStep = Math.max(1, step);
    const top = Math.ceil(max / niceStep) * niceStep;
    const ticks = [];
    for (let v = 0; v <= top + 1e-9; v += niceStep) ticks.push(Math.round(v));
    return { max: top, ticks };
}

function axisLabel(value, top) {
    return top >= 10000 ? compact.format(value) : nf.format(value);
}

/** Evenly spaced indices for x-axis labels so they never collide. */
function labelIndices(n, width, minGap = 72) {
    if (n <= 1) return [0];
    const max = Math.max(2, Math.floor(width / minGap));
    const step = Math.ceil((n - 1) / (max - 1));
    const out = [];
    for (let i = 0; i < n; i += step) out.push(i);
    if (
        out[out.length - 1] !== n - 1 &&
        n - 1 - out[out.length - 1] >= step / 2
    )
        out.push(n - 1);
    return out;
}

export function Legend({ items, shape = 'line' }) {
    return (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5A6A9A]">
            {items.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                    {shape === 'line' ? (
                        <span
                            className="h-0.5 w-3.5 rounded-full"
                            style={{ background: item.color }}
                        />
                    ) : (
                        <span
                            className="h-2.5 w-2.5 rounded-[3px]"
                            style={{ background: item.color }}
                        />
                    )}
                    {item.label}
                </li>
            ))}
        </ul>
    );
}

/** Floating readout; values lead, labels follow, series keyed by a short line. */
function Tooltip({ x, y, width, title, rows }) {
    if (x == null) return null;
    const flip = x > width - 190;
    return (
        <div
            className="pointer-events-none absolute z-10 min-w-36 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs shadow-lg"
            style={{
                left: flip ? undefined : x + 12,
                right: flip ? width - x + 12 : undefined,
                top: Math.max(0, y),
            }}
            role="status"
        >
            <p className="mb-1 font-medium text-[#5A6A9A]">{title}</p>
            {rows.map((row) => (
                <p key={row.label} className="flex items-center gap-2 py-0.5">
                    {row.color && (
                        <span
                            className="h-0.5 w-3 shrink-0 rounded-full"
                            style={{ background: row.color }}
                        />
                    )}
                    <span className="font-semibold text-[#0D1B4B] tabular-nums">
                        {row.value}
                    </span>
                    <span className="text-[#5A6A9A]">{row.label}</span>
                </p>
            ))}
        </div>
    );
}

const PAD = { top: 12, right: 12, bottom: 28, left: 44 };

function YGrid({ scale, innerW, innerH }) {
    return scale.ticks.map((t) => {
        const y = PAD.top + innerH - (t / scale.max) * innerH;
        return (
            <g key={t}>
                <line
                    x1={PAD.left}
                    x2={PAD.left + innerW}
                    y1={y}
                    y2={y}
                    stroke={t === 0 ? BASELINE : GRID}
                    strokeWidth="1"
                />
                <text
                    x={PAD.left - 8}
                    y={y}
                    dy="0.32em"
                    textAnchor="end"
                    fontSize="11"
                    fill={MUTED}
                    className="tabular-nums"
                >
                    {axisLabel(t, scale.max)}
                </text>
            </g>
        );
    });
}

/**
 * Line chart over time with a snapping crosshair and one tooltip listing every series.
 * `series`: [{ key, label, color, area? }]; `data`: [{ key, [seriesKey]: number }].
 */
export function LineChart({
    data,
    series,
    formatX,
    formatTitle,
    height = 260,
    label,
}) {
    const [ref, width] = useWidth();
    const [active, setActive] = useState(null);
    const n = data.length;
    const innerW = Math.max(0, width - PAD.left - PAD.right);
    const innerH = height - PAD.top - PAD.bottom;
    const scale = niceScale(
        Math.max(0, ...data.flatMap((d) => series.map((s) => d[s.key]))),
    );
    const x = (i) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = (v) => PAD.top + innerH - (v / scale.max) * innerH;

    const pick = (clientX) => {
        const rect = ref.current.getBoundingClientRect();
        const rel = clientX - rect.left - PAD.left;
        setActive(
            Math.max(
                0,
                Math.min(
                    n - 1,
                    Math.round(n <= 1 ? 0 : (rel / innerW) * (n - 1)),
                ),
            ),
        );
    };

    const onKey = (e) => {
        if (e.key === 'ArrowRight')
            setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
        else if (e.key === 'ArrowLeft')
            setActive((a) => Math.max(0, (a ?? n) - 1));
        else return;
        e.preventDefault();
    };

    return (
        <div ref={ref} className="relative w-full" style={{ height }}>
            {width > 0 && (
                <svg
                    width={width}
                    height={height}
                    role="img"
                    aria-label={label}
                    tabIndex={0}
                    onKeyDown={onKey}
                    onBlur={() => setActive(null)}
                    className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#213C93]/30"
                >
                    <YGrid scale={scale} innerW={innerW} innerH={innerH} />
                    {labelIndices(n, innerW).map((i) => (
                        <text
                            key={i}
                            x={x(i)}
                            y={height - 8}
                            textAnchor={
                                n > 1 && i === 0
                                    ? 'start'
                                    : n > 1 && i === n - 1
                                      ? 'end'
                                      : 'middle'
                            }
                            fontSize="11"
                            fill={MUTED}
                        >
                            {formatX(data[i].key)}
                        </text>
                    ))}
                    {series.map((s) => {
                        const points = data.map(
                            (d, i) => `${x(i)},${y(d[s.key])}`,
                        );
                        return (
                            <g key={s.key}>
                                {s.area && n > 1 && (
                                    <path
                                        d={`M${x(0)},${y(0)} L${points.join(' L')} L${x(n - 1)},${y(0)} Z`}
                                        fill={s.color}
                                        fillOpacity="0.1"
                                    />
                                )}
                                {n > 1 ? (
                                    <polyline
                                        points={points.join(' ')}
                                        fill="none"
                                        stroke={s.color}
                                        strokeWidth="2"
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />
                                ) : (
                                    <circle
                                        cx={x(0)}
                                        cy={y(data[0][s.key])}
                                        r="4"
                                        fill={s.color}
                                    />
                                )}
                            </g>
                        );
                    })}
                    {active != null && (
                        <g>
                            <line
                                x1={x(active)}
                                x2={x(active)}
                                y1={PAD.top}
                                y2={PAD.top + innerH}
                                stroke={BASELINE}
                                strokeWidth="1"
                            />
                            {series.map((s) => (
                                <circle
                                    key={s.key}
                                    cx={x(active)}
                                    cy={y(data[active][s.key])}
                                    r="4.5"
                                    fill={s.color}
                                    stroke="#fff"
                                    strokeWidth="2"
                                />
                            ))}
                        </g>
                    )}
                    <rect
                        x={PAD.left}
                        y={PAD.top}
                        width={innerW}
                        height={innerH}
                        fill="transparent"
                        onPointerMove={(e) => pick(e.clientX)}
                        onPointerDown={(e) => pick(e.clientX)}
                        onPointerLeave={() => setActive(null)}
                    />
                </svg>
            )}
            {active != null && (
                <Tooltip
                    x={x(active)}
                    y={PAD.top}
                    width={width}
                    title={formatTitle(data[active].key)}
                    rows={series.map((s) => ({
                        label: s.label,
                        value: nf.format(data[active][s.key]),
                        color: s.color,
                    }))}
                />
            )}
        </div>
    );
}

/** Rounded top, square base, for a column growing from the baseline. */
function columnPath(x, y, w, h) {
    if (h <= 0) return '';
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/** Grouped columns per time bucket (thin, ≤ 24px, 2px gap inside a group), with a per-bucket readout. */
export function ColumnChart({
    data,
    series,
    formatX,
    formatTitle,
    height = 220,
    label,
}) {
    const [ref, width] = useWidth();
    const [active, setActive] = useState(null);
    const n = data.length;
    const innerW = Math.max(0, width - PAD.left - PAD.right);
    const innerH = height - PAD.top - PAD.bottom;
    const scale = niceScale(
        Math.max(0, ...data.flatMap((d) => series.map((s) => d[s.key]))),
    );
    const band = n ? innerW / n : 0;
    const gap = 2;
    const barW = Math.max(
        1,
        Math.min(24, (band * 0.7 - gap * (series.length - 1)) / series.length),
    );
    const groupW = barW * series.length + gap * (series.length - 1);
    const y = (v) => PAD.top + innerH - (v / scale.max) * innerH;
    const cx = (i) => PAD.left + band * i + band / 2;

    const onKey = (e) => {
        if (e.key === 'ArrowRight')
            setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
        else if (e.key === 'ArrowLeft')
            setActive((a) => Math.max(0, (a ?? n) - 1));
        else return;
        e.preventDefault();
    };

    return (
        <div ref={ref} className="relative w-full" style={{ height }}>
            {width > 0 && (
                <svg
                    width={width}
                    height={height}
                    role="img"
                    aria-label={label}
                    tabIndex={0}
                    onKeyDown={onKey}
                    onBlur={() => setActive(null)}
                    className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#213C93]/30"
                >
                    <YGrid scale={scale} innerW={innerW} innerH={innerH} />
                    {labelIndices(n, innerW, 64).map((i) => (
                        <text
                            key={i}
                            x={cx(i)}
                            y={height - 8}
                            textAnchor="middle"
                            fontSize="11"
                            fill={MUTED}
                        >
                            {formatX(data[i].key)}
                        </text>
                    ))}
                    {data.map((d, i) => (
                        <g
                            key={d.key}
                            opacity={active == null || active === i ? 1 : 0.45}
                        >
                            {series.map((s, si) => {
                                const bx =
                                    cx(i) - groupW / 2 + si * (barW + gap);
                                const by = y(d[s.key]);
                                return (
                                    <path
                                        key={s.key}
                                        d={columnPath(
                                            bx,
                                            by,
                                            barW,
                                            PAD.top + innerH - by,
                                        )}
                                        fill={s.color}
                                    />
                                );
                            })}
                            <rect
                                x={PAD.left + band * i}
                                y={PAD.top}
                                width={band}
                                height={innerH}
                                fill="transparent"
                                onPointerEnter={() => setActive(i)}
                                onPointerDown={() => setActive(i)}
                                onPointerLeave={() => setActive(null)}
                            />
                        </g>
                    ))}
                </svg>
            )}
            {active != null && (
                <Tooltip
                    x={cx(active)}
                    y={PAD.top}
                    width={width}
                    title={formatTitle(data[active].key)}
                    rows={series.map((s) => ({
                        label: s.label,
                        value: nf.format(data[active][s.key]),
                        color: s.color,
                    }))}
                />
            )}
        </div>
    );
}

/** Ranked horizontal bars, single colour, value printed at the end of every row. */
export function BarList({
    items,
    formatLabel = (k) => k,
    formatValue = formatNumber,
    color = SERIES[0],
    empty = 'No data yet',
}) {
    if (!items?.length || items.every((i) => !i.value)) {
        return (
            <p className="py-6 text-center text-sm text-[#898781]">{empty}</p>
        );
    }
    const max = Math.max(...items.map((i) => i.value));
    const total = items.reduce((sum, i) => sum + i.value, 0);
    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li
                    key={item.key}
                    title={`${formatLabel(item.key)}: ${nf.format(item.value)} (${Math.round((item.value / total) * 100)}%)`}
                >
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-[#0D1B4B]">
                            {formatLabel(item.key)}
                        </span>
                        <span className="shrink-0 text-[#0D1B4B] tabular-nums">
                            <span className="font-semibold">
                                {formatValue(item.value)}
                            </span>
                            <span className="ml-1.5 text-xs text-[#898781]">
                                {Math.round((item.value / total) * 100)}%
                            </span>
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EEF1F8]">
                        <div
                            className="h-2 rounded-full"
                            style={{
                                width: `${Math.max(2, (item.value / max) * 100)}%`,
                                background: color,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/**
 * One whole split into parts: a thin bar (2px surface gap between parts) above a legend table
 * that carries each part's name, amount and share. Colours follow the item's position in the
 * fixed `items` order, so a part never changes colour when another is empty.
 */
export function SegmentedBar({
    items,
    formatLabel = (k) => k,
    empty = 'No data yet',
}) {
    const total = items.reduce((sum, i) => sum + i.value, 0);
    if (!total)
        return (
            <p className="py-6 text-center text-sm text-[#898781]">{empty}</p>
        );
    const colored = items.map((item, i) => ({
        ...item,
        color: SERIES[i % SERIES.length],
    }));
    return (
        <div>
            <div
                className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full"
                role="img"
                aria-label={colored
                    .map(
                        (i) =>
                            `${formatLabel(i.key)} ${Math.round((i.value / total) * 100)}%`,
                    )
                    .join(', ')}
            >
                {colored
                    .filter((i) => i.value > 0)
                    .map((i) => (
                        <div
                            key={i.key}
                            className="h-full"
                            style={{
                                width: `${(i.value / total) * 100}%`,
                                background: i.color,
                            }}
                            title={`${formatLabel(i.key)}: ${nf.format(i.value)}`}
                        />
                    ))}
            </div>
            <table className="mt-4 w-full text-sm">
                <tbody>
                    {colored.map((i) => (
                        <tr
                            key={i.key}
                            className="border-b border-[#F0F1F5] last:border-0"
                        >
                            <td className="py-1.5">
                                <span className="flex items-center gap-2 text-[#0D1B4B]">
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                        style={{ background: i.color }}
                                    />
                                    {formatLabel(i.key)}
                                </span>
                            </td>
                            <td className="py-1.5 text-right font-semibold text-[#0D1B4B] tabular-nums">
                                {nf.format(i.value)}
                            </td>
                            <td className="w-14 py-1.5 text-right text-xs text-[#898781] tabular-nums">
                                {Math.round((i.value / total) * 100)}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

/** 7 × 24 page views by weekday and hour, one-hue sequential scale with a less → more key. */
export function Heatmap({ grid, label }) {
    const [ref, width] = useWidth();
    const [active, setActive] = useState(null); // { d, h, x, y }
    const max = Math.max(0, ...grid.flat());
    const left = 36;
    const gap = 2;
    const cell = width
        ? Math.max(6, Math.floor((width - left - gap * 23) / 24))
        : 0;
    // Rows stay tall enough for their weekday label on narrow screens.
    const rowH = Math.max(14, Math.min(cell, 22));
    const top = 4;
    const svgH = top + 7 * (rowH + gap) + 20;
    const color = (v) =>
        v === 0
            ? '#F1F2F6'
            : BLUE_RAMP[
                  Math.min(
                      BLUE_RAMP.length - 1,
                      Math.floor((v / max) * (BLUE_RAMP.length - 1)),
                  )
              ];

    return (
        <div>
            <div ref={ref} className="relative w-full" style={{ height: svgH }}>
                {width > 0 && (
                    <svg
                        width={width}
                        height={svgH}
                        role="img"
                        aria-label={label}
                    >
                        {WEEKDAYS.map((d, di) => (
                            <text
                                key={d}
                                x={0}
                                y={top + di * (rowH + gap) + rowH / 2}
                                dy="0.32em"
                                fontSize="11"
                                fill={MUTED}
                            >
                                {d}
                            </text>
                        ))}
                        {grid.map((row, di) =>
                            row.map((v, h) => {
                                const x = left + h * (cell + gap);
                                const y = top + di * (rowH + gap);
                                const isActive =
                                    active?.d === di && active?.h === h;
                                return (
                                    <rect
                                        key={`${di}-${h}`}
                                        x={x}
                                        y={y}
                                        width={cell}
                                        height={rowH}
                                        rx="3"
                                        fill={color(v)}
                                        stroke={isActive ? INK : 'none'}
                                        strokeWidth="1.5"
                                        onPointerEnter={() =>
                                            setActive({
                                                d: di,
                                                h,
                                                x: x + cell / 2,
                                                y,
                                            })
                                        }
                                        onPointerLeave={() => setActive(null)}
                                    />
                                );
                            }),
                        )}
                        {[0, 6, 12, 18, 23].map((h) => (
                            <text
                                key={h}
                                x={left + h * (cell + gap) + cell / 2}
                                y={svgH - 4}
                                textAnchor="middle"
                                fontSize="11"
                                fill={MUTED}
                            >
                                {hourLabel(h)}
                            </text>
                        ))}
                    </svg>
                )}
                {active && (
                    <Tooltip
                        x={active.x}
                        y={active.y + rowH + 4}
                        width={width}
                        title={`${WEEKDAYS[active.d]} ${hourLabel(active.h)}–${hourLabel((active.h + 1) % 24)}`}
                        rows={[
                            {
                                label: 'page views',
                                value: nf.format(grid[active.d][active.h]),
                            },
                        ]}
                    />
                )}
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 text-xs text-[#898781]">
                Less
                <span className="flex gap-[2px]">
                    {[0, 2, 4, 6, 8, 10, 12].map((i) => (
                        <span
                            key={i}
                            className="h-2.5 w-4 rounded-[2px]"
                            style={{ background: BLUE_RAMP[i] }}
                        />
                    ))}
                </span>
                More
            </div>
        </div>
    );
}

/** Tiny trend line for a stat card: the series in muted ink, the latest point in the accent. */
export function Sparkline({
    values,
    color = SERIES[0],
    width = 96,
    height = 32,
}) {
    if (!values?.length || values.length < 2) return null;
    const max = Math.max(1, ...values);
    const step = (width - 6) / (values.length - 1);
    const pts = values.map((v, i) => [
        3 + i * step,
        height - 3 - (v / max) * (height - 6),
    ]);
    const last = pts[pts.length - 1];
    return (
        <svg
            width={width}
            height={height}
            aria-hidden="true"
            className="shrink-0"
        >
            <polyline
                points={pts.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke={INK_2}
                strokeOpacity="0.45"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <circle
                cx={last[0]}
                cy={last[1]}
                r="3"
                fill={color}
                stroke="#fff"
                strokeWidth="1.5"
            />
        </svg>
    );
}
