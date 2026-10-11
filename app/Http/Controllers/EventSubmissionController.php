<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventSubmissionController extends Controller
{
    /** POST /spa/events/{event}/submit — public registration for an event or training course */
    public function store(Request $request, Event $event): JsonResponse
    {
        if (! $event->is_published) {
            return response()->json(['message' => 'This event is not open for registration.'], 404);
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

        if ($event->capacity) {
            $taken = $event->submissions()->sum('attendees');
            $requested = $data['attendees'] ?? 1;

            if ($taken + $requested > $event->capacity) {
                return response()->json(['message' => 'Not enough spots left for this event.'], 422);
            }
        }

        $attendees = $data['attendees'] ?? 1;

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

        return response()->json(['message' => 'Submission received successfully.']);
    }
}
