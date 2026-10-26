<?php

namespace Tests\Feature;

use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class EventScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** `startsAt` is the wall-clock time as typed in the dashboard, e.g. '2026-11-05 10:00'. */
    private function makeEvent(string $startsAt, string $timezone = 'Asia/Baghdad'): Event
    {
        return Event::create([
            'slug'            => 'workshop',
            'title'           => 'Workshop',
            'type'            => 'training',
            'mode'            => 'offline',
            'starts_at'       => $startsAt,
            'timezone'        => $timezone,
            'is_published'    => true,
            'required_fields' => ['name', 'email'],
        ]);
    }

    private function register(Event $event)
    {
        return $this->postJson("/spa/events/{$event->id}/submit", [
            'name'  => 'Visitor',
            'email' => 'visitor@example.com',
        ]);
    }

    public function test_api_returns_the_typed_time_with_the_venue_offset(): void
    {
        Carbon::setTestNow('2026-11-01 00:00:00');
        $this->makeEvent('2026-11-05 10:00:00');

        $this->getJson('/api/events/workshop')
            ->assertOk()
            ->assertJsonPath('starts_at', '2026-11-05T10:00:00+03:00')
            ->assertJsonPath('timezone', 'Asia/Baghdad')
            ->assertJsonPath('registration_open', true);
    }

    public function test_registration_closes_once_the_event_starts_in_the_venue_timezone(): void
    {
        // 10:00 in Baghdad is 07:00 UTC.
        $event = $this->makeEvent('2026-11-05 10:00:00');

        Carbon::setTestNow('2026-11-05 06:59:00');
        $this->register($event)->assertOk();

        Carbon::setTestNow('2026-11-05 07:00:00');
        $this->register($event)
            ->assertStatus(422)
            ->assertJsonPath('code', 'closed');

        $this->assertSame(1, $event->submissions()->count());
        $this->getJson('/api/events/workshop')->assertJsonPath('registration_open', false);
    }

    public function test_full_event_reports_a_code(): void
    {
        Carbon::setTestNow('2026-11-01 00:00:00');
        $event = $this->makeEvent('2026-11-05 10:00:00');
        $event->update(['capacity' => 1]);

        $this->register($event)->assertOk();
        $this->register($event)->assertStatus(422)->assertJsonPath('code', 'full');
    }
}
