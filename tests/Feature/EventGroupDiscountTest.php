<?php

namespace Tests\Feature;

use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventGroupDiscountTest extends TestCase
{
    use RefreshDatabase;

    private function makeEvent(array $overrides = []): Event
    {
        return Event::create([
            'slug'                         => 'workshop',
            'title'                        => 'Workshop',
            'type'                         => 'training',
            'mode'                         => 'offline',
            'starts_at'                    => now()->addWeek(),
            'price'                        => 50000,
            'group_discount_percent'       => 10,
            'group_discount_min_attendees' => 2,
            'is_published'                 => true,
            'required_fields'              => ['name', 'email'],
            ...$overrides,
        ]);
    }

    public function test_single_attendee_pays_full_price()
    {
        $this->assertSame(
            ['unit_price' => 50000.0, 'discount_percent' => 0.0, 'total_price' => 50000.0],
            $this->makeEvent()->priceFor(1),
        );
    }

    public function test_discount_applies_from_the_minimum_attendees()
    {
        $event = $this->makeEvent(['group_discount_min_attendees' => 3]);

        $this->assertSame(100000.0, $event->priceFor(2)['total_price']);
        $this->assertSame(135000.0, $event->priceFor(3)['total_price']);
    }

    public function test_free_event_has_no_price()
    {
        $this->assertNull($this->makeEvent(['price' => null])->priceFor(4)['total_price']);
    }

    public function test_submission_stores_server_computed_total()
    {
        $event = $this->makeEvent();

        $this->postJson("/spa/events/{$event->id}/submit", [
            'name'        => 'Sara',
            'email'       => 'sara@example.com',
            'attendees'   => 4,
            'total_price' => 1, // ignored — the server prices the registration
        ])->assertOk();

        $this->assertDatabaseHas('event_submissions', [
            'event_id'         => $event->id,
            'attendees'        => 4,
            'discount_percent' => 10,
            'total_price'      => 180000,
        ]);
    }

    public function test_public_api_exposes_group_discount()
    {
        $this->makeEvent();

        $this->getJson('/api/events/workshop')
            ->assertOk()
            ->assertJsonPath('group_discount.percent', 10)
            ->assertJsonPath('group_discount.min_attendees', 2);
    }
}
