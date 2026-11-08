<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventSubmission;
use App\Models\PageView;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StatisticsTest extends TestCase
{
    use RefreshDatabase;

    private const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    private function event(array $attrs = []): Event
    {
        return Event::create(array_merge([
            'slug' => 'growth-workshop',
            'title' => 'Growth Workshop',
            'type' => 'training',
            'mode' => 'offline',
            'starts_at' => now()->addWeek(),
            'is_published' => true,
            'capacity' => 20,
            'price' => 100,
        ], $attrs));
    }

    private function track(array $payload = [], string $ua = self::BROWSER)
    {
        return $this->withHeaders(['User-Agent' => $ua])->postJson('/spa/track', array_merge([
            'visitor_id' => (string) Str::uuid(),
            'session_id' => (string) Str::uuid(),
            'is_entry' => true,
            'path' => '/',
            'locale' => 'ar',
        ], $payload));
    }

    public function test_home_page_view_is_recorded_with_source_and_device(): void
    {
        $this->track([
            'referrer' => 'https://l.facebook.com/l.php?u=x',
        ])->assertCreated()->assertJsonStructure(['id']);

        $view = PageView::sole();
        $this->assertSame('home', $view->page_type);
        $this->assertSame('social', $view->source);
        $this->assertSame('l.facebook.com', $view->referrer_host);
        $this->assertSame('mobile', $view->device);
        $this->assertSame('iOS', $view->os);
        $this->assertSame('ar', $view->locale);
        $this->assertTrue($view->is_new_visitor);
    }

    public function test_event_page_view_is_linked_to_its_event(): void
    {
        $event = $this->event();

        $this->track(['path' => '/events/growth-workshop', 'utm_source' => 'instagram', 'utm_campaign' => 'launch'])->assertCreated();

        $view = PageView::sole();
        $this->assertSame($event->id, $view->event_id);
        $this->assertSame('event', $view->page_type);
        $this->assertSame('campaign', $view->source);
    }

    public function test_unknown_pages_drafts_bots_and_staff_are_not_recorded(): void
    {
        $this->event(['slug' => 'secret', 'is_published' => false]);

        $this->track(['path' => '/events/secret'])->assertNoContent();
        $this->track(['path' => '/admin/events'])->assertNoContent();
        $this->track([], 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')->assertNoContent();
        $this->actingAs(User::factory()->create());
        $this->track()->assertNoContent();

        $this->assertSame(0, PageView::count());
    }

    public function test_returning_visitor_and_referrer_only_on_entry(): void
    {
        $visitor = (string) Str::uuid();
        $session = (string) Str::uuid();

        $this->track(['visitor_id' => $visitor, 'session_id' => $session, 'referrer' => 'https://www.google.com/'])->assertCreated();
        $this->track(['visitor_id' => $visitor, 'session_id' => $session, 'is_entry' => false, 'referrer' => 'https://www.google.com/'])->assertCreated();

        [$first, $second] = PageView::orderBy('id')->get();
        $this->assertSame('search', $first->source);
        $this->assertSame('google.com', $first->referrer_host);
        $this->assertNull($second->source);
        $this->assertNull($second->referrer_host);
        $this->assertFalse($second->is_new_visitor);
    }

    public function test_time_on_page_keeps_the_longest_report_and_is_capped(): void
    {
        $visitor = (string) Str::uuid();
        $id = $this->track(['visitor_id' => $visitor])->json('id');

        $this->postJson("/spa/track/{$id}/leave", ['visitor_id' => $visitor, 'seconds' => 40])->assertNoContent();
        $this->postJson("/spa/track/{$id}/leave", ['visitor_id' => $visitor, 'seconds' => 12])->assertNoContent();
        $this->assertSame(40, PageView::find($id)->duration_seconds);

        // Another visitor can't change it, and huge values are capped.
        $this->postJson("/spa/track/{$id}/leave", ['visitor_id' => (string) Str::uuid(), 'seconds' => 99])->assertNoContent();
        $this->assertSame(40, PageView::find($id)->duration_seconds);
        $this->postJson("/spa/track/{$id}/leave", ['visitor_id' => $visitor, 'seconds' => 999999])->assertNoContent();
        $this->assertSame(config('analytics.max_duration_seconds'), PageView::find($id)->duration_seconds);
    }

    public function test_statistics_require_the_permission(): void
    {
        $this->getJson('/spa/admin/statistics')->assertUnauthorized();
        $this->actingAs(User::factory()->create()->givePermissionTo('projects.manage'))
            ->getJson('/spa/admin/statistics')->assertForbidden();
        $this->actingAs(User::factory()->create()->givePermissionTo('statistics.view'))
            ->getJson('/spa/admin/statistics')->assertOk();
    }

    public function test_statistics_summarise_visits_and_event_conversion(): void
    {
        $event = $this->event();
        $visitorA = (string) Str::uuid();
        $visitorB = (string) Str::uuid();
        $session = (string) Str::uuid();

        $this->track(['visitor_id' => $visitorA, 'session_id' => $session])->assertCreated();
        $this->track(['visitor_id' => $visitorA, 'session_id' => $session, 'is_entry' => false, 'path' => '/events/growth-workshop'])->assertCreated();
        $this->track(['visitor_id' => $visitorB, 'path' => '/events/growth-workshop'])->assertCreated();

        EventSubmission::create([
            'event_id' => $event->id, 'name' => 'Mohammad Alloul', 'email' => 'info@moalloul.com',
            'attendees' => 2, 'unit_price' => 100, 'discount_percent' => 0, 'total_price' => 200,
        ]);

        $admin = User::factory()->create()->assignRole(Permissions::superAdminRole());
        $res = $this->actingAs($admin)->getJson('/spa/admin/statistics?range=7d')->assertOk();

        $res->assertJsonPath('kpis.views.value', 3)
            ->assertJsonPath('kpis.visitors.value', 2)
            ->assertJsonPath('kpis.sessions.value', 2)
            ->assertJsonPath('kpis.bounce_rate.value', 50)
            ->assertJsonPath('kpis.registrations.value', 1)
            ->assertJsonPath('kpis.attendees.value', 2)
            ->assertJsonPath('kpis.event_visitors.value', 2)
            ->assertJsonPath('kpis.conversion_rate.value', 50)
            ->assertJsonPath('events.0.slug', 'growth-workshop')
            ->assertJsonPath('events.0.views', 2)
            ->assertJsonPath('events.0.registrations', 1)
            ->assertJsonPath('events.0.status', 'open')
            ->assertJsonPath('realtime.visitors', 2)
            ->assertJsonCount(7, 'series')
            ->assertJsonPath('series.6.views', 3)
            ->assertJsonPath('recent_registrations.0.event_title', 'Growth Workshop')
            ->assertJsonMissing(['name' => 'Mohammad Alloul']);

        // The 12-month view buckets by month.
        $this->actingAs($admin)->getJson('/spa/admin/statistics?range=12m')
            ->assertOk()
            ->assertJsonPath('bucket', 'month')
            ->assertJsonCount(12, 'series');

        $this->actingAs($admin)->getJson('/spa/admin/statistics?range=today')
            ->assertOk()
            ->assertJsonCount(24, 'series');
    }
}
