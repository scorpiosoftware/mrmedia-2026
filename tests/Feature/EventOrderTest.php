<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventOrderTest extends TestCase
{
    use RefreshDatabase;

    private function makeEvent(string $slug, string $startsAt, int $sortOrder): Event
    {
        return Event::create([
            'slug'            => $slug,
            'title'           => ucfirst($slug),
            'type'            => 'training',
            'mode'            => 'offline',
            'starts_at'       => $startsAt,
            'is_published'    => true,
            'sort_order'      => $sortOrder,
            'required_fields' => ['name', 'email'],
        ]);
    }

    public function test_reorder_sets_the_display_order_on_the_dashboard_and_public_site(): void
    {
        $early = $this->makeEvent('early', '2026-11-05 10:00:00', 0);
        $late = $this->makeEvent('late', '2026-12-05 10:00:00', 1);

        $user = User::factory()->create()->givePermissionTo('events.manage');

        $this->actingAs($user)
            ->postJson('/spa/admin/events/reorder', ['ids' => [$late->id, $early->id]])
            ->assertOk()
            ->assertJsonPath('0.slug', 'late');

        $this->actingAs($user)->getJson('/spa/admin/events')->assertJsonPath('0.slug', 'late');
        $this->getJson('/api/events')->assertJsonPath('0.slug', 'late')->assertJsonPath('1.slug', 'early');
    }

    public function test_reorder_requires_the_events_permission(): void
    {
        $event = $this->makeEvent('early', '2026-11-05 10:00:00', 0);
        $user = User::factory()->create()->givePermissionTo('projects.manage');

        $this->actingAs($user)
            ->postJson('/spa/admin/events/reorder', ['ids' => [$event->id]])
            ->assertForbidden();
    }
}
