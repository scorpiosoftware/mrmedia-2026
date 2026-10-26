<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventSubmissionController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    // Outcomes of one registration attempt
    private const REGISTERED = 'registered';
    private const FULL = 'full';
    private const CONFLICT = 'conflict';

    /** POST /spa/events/{event}/submit — public registration for an event or training course */
    public function store(Request $request, Event $event): JsonResponse
    {
        if (! $event->is_published) {
            return response()->json(['message' => 'This event is not open for registration.'], 404);
        }

        // `code` lets the page show the message in the visitor's language.
        if (! $event->registrationOpen()) {
            return response()->json(['message' => 'Registration for this event has closed.', 'code' => 'closed'], 422);
        }

        $required = $event->required_fields ?: ['name', 'email'];
        $rule = fn (string $field) => in_array($field, $required, true) ? 'required' : 'nullable';

        $data = $request->validate([
            'name'      => [$rule('name'), 'string', 'max:255'],
            'email'     => [$rule('email'), 'email', 'max:255'],
            // Country code + local number, e.g. "+964 7701234567".
            'phone'     => [$rule('phone'), 'string', 'max:30', 'regex:/^\+\d{1,4} [\d\s-]{4,20}$/'],
            'company'   => [$rule('company'), 'string', 'max:255'],
            'attendees' => ['nullable', 'integer', 'min:1', 'max:100'],
            'message'   => [$rule('message'), 'string', 'max:2000'],
        ]);

        $attendees = $data['attendees'] ?? 1;

        // Another registration claimed the event's version first — re-count and try again.
        // Each retry sees that registration, so it either fits in what's left or is told the event is full.
        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            $result = $this->tryRegister($event->id, $data, $attendees);

            if ($result !== self::CONFLICT) {
                return $result === self::FULL
                    ? response()->json(['message' => 'Not enough spots left for this event.', 'code' => 'full'], 422)
                    : response()->json(['message' => 'Submission received successfully.']);
            }

            usleep(random_int(10_000, 50_000)); // jitter so colliding requests don't retry in lockstep
        }

        return response()->json(['message' => 'Many people are registering right now. Please try again.', 'code' => 'busy'], 409);
    }

    /**
     * Count seats and insert the registration as one unit, guarded by the event's version:
     * the UPDATE … WHERE version = <what we read> succeeds for exactly one of any concurrent
     * requests; the others change nothing and report a conflict.
     */
    private function tryRegister(int $eventId, array $data, int $attendees): string
    {
        // The second argument retries on database-level lock errors (e.g. SQLite "database is locked", MySQL deadlocks).
        return DB::transaction(function () use ($eventId, $data, $attendees) {
            $event = Event::findOrFail($eventId);

            if ($event->capacity) {
                $taken = (int) $event->submissions()->sum('attendees');

                if ($taken + $attendees > $event->capacity) {
                    return self::FULL;
                }

                $claimed = Event::whereKey($event->id)
                    ->where('version', $event->version)
                    ->update(['version' => $event->version + 1]);

                if (! $claimed) {
                    return self::CONFLICT;
                }
            }

            // Priced server-side from the event, never from the request.
            $event->submissions()->create([
                'name'      => $data['name'],
                'email'     => $data['email'],
                'phone'     => $data['phone'] ?? null,
                'company'   => $data['company'] ?? null,
                'attendees' => $attendees,
                'message'   => $data['message'] ?? null,
                ...$event->priceFor($attendees),
            ]);

            return self::REGISTERED;
        }, 3);
    }
}
