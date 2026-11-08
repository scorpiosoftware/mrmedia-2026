<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\EventSubmission;
use App\Models\PageView;
use App\Models\SiteContent;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * GET /spa/admin/statistics?range=today|7d|30d|90d|12m — everything the Statistics page shows,
 * for the chosen range and (for the change badges) the same-length period just before it.
 */
class StatisticsController extends Controller
{
    private const RANGES = ['today', '7d', '30d', '90d', '12m'];

    private string $tz;

    public function index(Request $request): JsonResponse
    {
        $range = in_array($request->get('range'), self::RANGES, true) ? $request->get('range') : '30d';
        $this->tz = config('analytics.timezone');

        [$from, $to, $prevFrom, $prevTo] = $this->periods($range);
        $bucket = match ($range) {
            'today' => 'hour',
            '12m'   => 'month',
            default => 'day',
        };

        $current = $this->kpis($from, $to);
        $previous = $this->kpis($prevFrom, $prevTo);

        return response()->json([
            'range'          => $range,
            'from'           => $from->toDateString(),
            'to'             => $to->toDateString(),
            'previous_from'  => $prevFrom->toDateString(),
            'previous_to'    => $prevTo->toDateString(),
            'timezone'       => $this->tz,
            'bucket'         => $bucket,
            'tracking_since' => PageView::min('local_date'),
            'currency'       => SiteContent::getAllForLocale('en')['events.currency'] ?? 'IQD',
            'realtime'       => $this->realtime(),
            'kpis'           => collect($current)->map(fn ($value, $key) => [
                'value'    => $value,
                'previous' => $previous[$key],
            ]),
            'series'         => $this->series($from, $to, $bucket),
            'events'         => $this->events($from, $to),
            'top_pages'      => $this->topPages($from, $to),
            'channels'       => $this->channels($from, $to),
            'referrers'      => $this->entryBreakdown($from, $to, 'referrer_host'),
            'campaigns'      => $this->campaigns($from, $to),
            'devices'        => $this->visitorBreakdown($from, $to, 'device'),
            'browsers'       => $this->visitorBreakdown($from, $to, 'browser', 6),
            'os'             => $this->visitorBreakdown($from, $to, 'os', 6),
            'locales'        => $this->visitorBreakdown($from, $to, 'locale'),
            'countries'      => $this->visitorBreakdown($from, $to, 'country', 8),
            'heatmap'        => $this->heatmap($from, $to),
            'recent_registrations' => $this->recentRegistrations(),
        ]);
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable, 2: CarbonImmutable, 3: CarbonImmutable} */
    private function periods(string $range): array
    {
        $today = CarbonImmutable::now($this->tz)->startOfDay();

        if ($range === '12m') {
            $from = $today->startOfMonth()->subMonths(11);
            $prevFrom = $from->subMonths(12);

            return [$from, $today, $prevFrom, $from->subDay()];
        }

        $days = ['today' => 1, '7d' => 7, '30d' => 30, '90d' => 90][$range];
        $from = $today->subDays($days - 1);

        return [$from, $today, $from->subDays($days), $from->subDay()];
    }

    private function views(CarbonImmutable $from, CarbonImmutable $to): Builder
    {
        return PageView::query()->betweenDays($from->toDateString(), $to->toDateString());
    }

    /** UTC moments for the start of `from` and the end of `to` in the statistics timezone. */
    private function utcBounds(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return [$from->startOfDay()->utc(), $to->endOfDay()->utc()];
    }

    private function kpis(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $totals = $this->views($from, $to)
            ->selectRaw('COUNT(*) as views')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->selectRaw('AVG(duration_seconds) as avg_duration')
            ->first();

        $newVisitors = $this->views($from, $to)->where('is_new_visitor', true)->distinct()->count('visitor_id');

        $singlePageSessions = DB::query()->fromSub(
            $this->views($from, $to)->select('session_id')->groupBy('session_id')->havingRaw('COUNT(*) = 1'),
            'single',
        )->count();

        $eventVisitors = $this->views($from, $to)->where('page_type', 'event')->distinct()->count('visitor_id');

        $bounds = $this->utcBounds($from, $to);
        $submissions = EventSubmission::whereBetween('created_at', $bounds)
            ->selectRaw('COUNT(*) as registrations, COALESCE(SUM(attendees), 0) as attendees, COALESCE(SUM(total_price), 0) as revenue')
            ->first();

        $sessions = (int) $totals->sessions;
        $registrations = (int) $submissions->registrations;

        return [
            'views'            => (int) $totals->views,
            'visitors'         => (int) $totals->visitors,
            'sessions'         => $sessions,
            'new_visitors'     => $newVisitors,
            'avg_duration'     => $totals->avg_duration !== null ? (int) round($totals->avg_duration) : null,
            'pages_per_session' => $sessions ? round($totals->views / $sessions, 2) : null,
            'bounce_rate'      => $sessions ? round($singlePageSessions / $sessions * 100, 1) : null,
            'event_visitors'   => $eventVisitors,
            'registrations'    => $registrations,
            'attendees'        => (int) $submissions->attendees,
            'revenue'          => (float) $submissions->revenue,
            'conversion_rate'  => $eventVisitors ? round($registrations / $eventVisitors * 100, 1) : null,
            'messages'         => ContactMessage::genuine()->whereBetween('created_at', $bounds)->count(),
        ];
    }

    /** Views, visitors, registrations and messages per hour / day / month, with empty buckets filled in. */
    private function series(CarbonImmutable $from, CarbonImmutable $to, string $bucket): array
    {
        $keyExpr = match ($bucket) {
            'hour'  => 'local_hour',
            'month' => 'SUBSTR(local_date, 1, 7)',
            default => 'local_date',
        };

        $traffic = $this->views($from, $to)
            ->selectRaw("{$keyExpr} as bucket, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors")
            ->groupByRaw($keyExpr)
            ->get()
            ->keyBy(fn ($row) => (string) $row->bucket);

        // Leads are few, so bucket them in PHP (timezone-correct on any database).
        $keyFor = fn ($date) => match ($bucket) {
            'hour'  => (string) $date->setTimezone($this->tz)->hour,
            'month' => $date->setTimezone($this->tz)->format('Y-m'),
            default => $date->setTimezone($this->tz)->toDateString(),
        };
        $bounds = $this->utcBounds($from, $to);
        $registrations = EventSubmission::whereBetween('created_at', $bounds)->pluck('created_at')
            ->countBy(fn ($d) => $keyFor(CarbonImmutable::parse($d)));
        $messages = ContactMessage::genuine()->whereBetween('created_at', $bounds)->pluck('created_at')
            ->countBy(fn ($d) => $keyFor(CarbonImmutable::parse($d)));

        $keys = match ($bucket) {
            'hour'  => array_map('strval', range(0, 23)),
            'month' => collect(CarbonPeriod::create($from, '1 month', $to))->map->format('Y-m')->all(),
            default => collect(CarbonPeriod::create($from, '1 day', $to))->map->toDateString()->all(),
        };

        return array_map(fn ($key) => [
            'key'           => $key,
            'views'         => (int) ($traffic[$key]->views ?? 0),
            'visitors'      => (int) ($traffic[$key]->visitors ?? 0),
            'registrations' => (int) ($registrations[$key] ?? 0),
            'messages'      => (int) ($messages[$key] ?? 0),
        ], $keys);
    }

    /** Landing-page performance for every event that had visits or registrations in the range. */
    private function events(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $traffic = $this->views($from, $to)
            ->whereNotNull('event_id')
            ->selectRaw('event_id, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors, AVG(duration_seconds) as avg_duration')
            ->groupBy('event_id')
            ->get()
            ->keyBy('event_id');

        $leads = EventSubmission::whereBetween('created_at', $this->utcBounds($from, $to))
            ->selectRaw('event_id, COUNT(*) as registrations, SUM(attendees) as attendees, COALESCE(SUM(total_price), 0) as revenue')
            ->groupBy('event_id')
            ->get()
            ->keyBy('event_id');

        $ids = $traffic->keys()->merge($leads->keys())->unique();
        if ($ids->isEmpty()) {
            return [];
        }

        return Event::whereIn('id', $ids)
            ->withSum('submissions', 'attendees')
            ->get()
            ->map(function (Event $event) use ($traffic, $leads) {
                $t = $traffic[$event->id] ?? null;
                $l = $leads[$event->id] ?? null;
                $visitors = (int) ($t->visitors ?? 0);
                $registrations = (int) ($l->registrations ?? 0);
                $booked = (int) $event->submissions_sum_attendees;

                return [
                    'id'              => $event->id,
                    'title'           => $event->title,
                    'slug'            => $event->slug,
                    'type'            => $event->type,
                    'starts_at'       => $event->startsAtLocal()->toIso8601String(),
                    'status'          => $this->eventStatus($event, $booked),
                    'capacity'        => $event->capacity,
                    'booked'          => $booked,
                    'views'           => (int) ($t->views ?? 0),
                    'visitors'        => $visitors,
                    'avg_duration'    => isset($t->avg_duration) ? (int) round($t->avg_duration) : null,
                    'registrations'   => $registrations,
                    'attendees'       => (int) ($l->attendees ?? 0),
                    'revenue'         => (float) ($l->revenue ?? 0),
                    'conversion_rate' => $visitors ? round($registrations / $visitors * 100, 1) : null,
                ];
            })
            ->sortByDesc('views')
            ->values()
            ->all();
    }

    private function eventStatus(Event $event, int $booked): string
    {
        return match (true) {
            ! $event->is_published                              => 'draft',
            ! $event->registrationOpen()                        => 'ended',
            $event->capacity && $booked >= $event->capacity     => 'full',
            default                                             => 'open',
        };
    }

    private function topPages(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $rows = $this->views($from, $to)
            ->selectRaw('path, page_type, event_id, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors, AVG(duration_seconds) as avg_duration')
            ->groupBy('path', 'page_type', 'event_id')
            ->orderByDesc('views')
            ->limit(10)
            ->get();

        $titles = Event::whereIn('id', $rows->pluck('event_id')->filter())->pluck('title', 'id');

        return $rows->map(fn ($row) => [
            'path'         => $row->path,
            'title'        => $row->page_type === 'home' ? 'Home page' : ($titles[$row->event_id] ?? $row->path),
            'type'         => $row->page_type,
            'views'        => (int) $row->views,
            'visitors'     => (int) $row->visitors,
            'avg_duration' => $row->avg_duration !== null ? (int) round($row->avg_duration) : null,
        ])->all();
    }

    /** Sessions by how visitors arrived, in a fixed order so colours stay put. */
    private function channels(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $counts = $this->views($from, $to)
            ->where('is_entry', true)
            ->selectRaw('source, COUNT(*) as total')
            ->groupBy('source')
            ->pluck('total', 'source');

        return collect(['direct', 'social', 'search', 'referral', 'campaign'])
            ->map(fn ($key) => ['key' => $key, 'value' => (int) ($counts[$key] ?? 0)])
            ->all();
    }

    private function entryBreakdown(CarbonImmutable $from, CarbonImmutable $to, string $column, int $limit = 8): array
    {
        return $this->views($from, $to)
            ->where('is_entry', true)
            ->whereNotNull($column)
            ->selectRaw("{$column} as label, COUNT(*) as value")
            ->groupBy($column)
            ->orderByDesc('value')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => ['key' => $row->label, 'value' => (int) $row->value])
            ->all();
    }

    private function campaigns(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return $this->views($from, $to)
            ->where('is_entry', true)
            ->where('source', 'campaign')
            ->selectRaw('utm_source, utm_medium, utm_campaign, COUNT(*) as sessions, COUNT(DISTINCT visitor_id) as visitors')
            ->groupBy('utm_source', 'utm_medium', 'utm_campaign')
            ->orderByDesc('sessions')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'source'   => $row->utm_source,
                'medium'   => $row->utm_medium,
                'campaign' => $row->utm_campaign,
                'sessions' => (int) $row->sessions,
                'visitors' => (int) $row->visitors,
            ])
            ->all();
    }

    /** Unique visitors per value of a column; values past `limit` fold into "Other". */
    private function visitorBreakdown(CarbonImmutable $from, CarbonImmutable $to, string $column, int $limit = 5): array
    {
        $rows = $this->views($from, $to)
            ->whereNotNull($column)
            ->selectRaw("{$column} as label, COUNT(DISTINCT visitor_id) as value")
            ->groupBy($column)
            ->orderByDesc('value')
            ->get()
            ->map(fn ($row) => ['key' => (string) $row->label, 'value' => (int) $row->value]);

        return $this->foldOther($rows, $limit);
    }

    private function foldOther(Collection $rows, int $limit): array
    {
        if ($rows->count() <= $limit) {
            return $rows->values()->all();
        }

        return $rows->take($limit - 1)
            ->push(['key' => 'Other', 'value' => $rows->slice($limit - 1)->sum('value')])
            ->values()
            ->all();
    }

    /** 7 × 24 grid of page views by weekday (0 = Monday) and hour, in the statistics timezone. */
    private function heatmap(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $counts = $this->views($from, $to)
            ->selectRaw('local_weekday, local_hour, COUNT(*) as total')
            ->groupBy('local_weekday', 'local_hour')
            ->get();

        $grid = array_fill(0, 7, array_fill(0, 24, 0));
        foreach ($counts as $row) {
            $grid[(int) $row->local_weekday][(int) $row->local_hour] = (int) $row->total;
        }

        return $grid;
    }

    private function realtime(): array
    {
        $since = now()->subMinutes(config('analytics.realtime_minutes'));
        $recent = PageView::where('viewed_at', '>=', $since);

        return [
            'minutes'  => config('analytics.realtime_minutes'),
            'visitors' => (clone $recent)->distinct()->count('visitor_id'),
            'pages'    => (clone $recent)
                ->selectRaw('path, COUNT(DISTINCT visitor_id) as visitors')
                ->groupBy('path')
                ->orderByDesc('visitors')
                ->limit(5)
                ->get()
                ->map(fn ($row) => ['path' => $row->path, 'visitors' => (int) $row->visitors])
                ->all(),
        ];
    }

    /** Latest registrations, without registrant details (this page doesn't need events access). */
    private function recentRegistrations(): array
    {
        return EventSubmission::with('event:id,title,slug')
            ->latest()
            ->limit(6)
            ->get(['id', 'event_id', 'attendees', 'total_price', 'created_at'])
            ->map(fn (EventSubmission $s) => [
                'id'          => $s->id,
                'event_title' => $s->event?->title,
                'event_slug'  => $s->event?->slug,
                'attendees'   => (int) $s->attendees,
                'total_price' => $s->total_price !== null ? (float) $s->total_price : null,
                'created_at'  => $s->created_at?->toIso8601String(),
            ])
            ->all();
    }
}
