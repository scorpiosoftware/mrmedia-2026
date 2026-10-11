<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EventSeatBookingTest extends TestCase
{
    use RefreshDatabase;

    private function makeEvent(int $capacity): Event
    {
        return Event::create([
            'slug'            => 'workshop',
            'title'           => 'Workshop',
            'type'            => 'training',
            'mode'            => 'offline',
            'starts_at'       => now()->addWeek(),
            'capacity'        => $capacity,
            'is_published'    => true,
            'required_fields' => ['name', 'email'],
        ]);
    }

    private function register(Event $event, int $attendees = 1)
    {
        return $this->postJson("/spa/events/{$event->id}/submit", [
            'name'      => 'Visitor',
            'email'     => 'visitor@example.com',
            'attendees' => $attendees,
        ]);
    }

    /**
     * Simulates another request registering `$seats` seats right after this request has
     * counted the taken seats but before it claims the version — the window the version guards.
     */
    private function competingRegistrationAfterRead(Event $event, int $seats): void
    {
        $fired = false;
        DB::listen(function ($query) use ($event, $seats, &$fired) {
            if ($fired || ! str_contains(strtolower($query->sql), 'sum(')) {
                return;
            }
            $fired = true;
            DB::table('event_submissions')->insert([
                'event_id'   => $event->id,
                'name'       => 'Competitor',
                'email'      => 'competitor@example.com',
                'attendees'  => $seats,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('events')->where('id', $event->id)->increment('version');
        });
    }

    public function test_registration_bumps_the_event_version()
    {
        $event = $this->makeEvent(capacity: 5);

        $this->register($event)->assertOk();

        $this->assertSame(1, $event->fresh()->version);
    }

    public function test_loser_of_a_race_for_the_last_seat_is_told_the_event_is_full()
    {
        $event = $this->makeEvent(capacity: 1);
        $this->competingRegistrationAfterRead($event, seats: 1);

        $this->register($event)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Not enough spots left for this event.');

        // Only the competitor's registration exists, and only its claim bumped the version.
        $this->assertSame(1, (int) EventSubmission::sum('attendees'));
        $this->assertSame(1, $event->fresh()->version);
    }

    public function test_conflicting_registration_retries_when_seats_remain()
    {
        $event = $this->makeEvent(capacity: 3);
        $this->competingRegistrationAfterRead($event, seats: 1);

        $this->register($event, attendees: 2)->assertOk();

        $this->assertSame(3, (int) EventSubmission::sum('attendees'));
        $this->assertSame(2, $event->fresh()->version);
    }

    public function test_cannot_book_more_seats_than_remain()
    {
        $event = $this->makeEvent(capacity: 2);

        $this->register($event, attendees: 3)->assertStatus(422);
        $this->assertSame(0, EventSubmission::count());
    }
}
