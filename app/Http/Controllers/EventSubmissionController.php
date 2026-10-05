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

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:30'],
            'company'   => ['nullable', 'string', 'max:255'],
            'attendees' => ['nullable', 'integer', 'min:1', 'max:100'],
            'message'   => ['nullable', 'string', 'max:2000'],
        ]);

        if ($event->capacity) {
            $taken = $event->submissions()->sum('attendees');
            $requested = $data['attendees'] ?? 1;

            if ($taken + $requested > $event->capacity) {
                return response()->json(['message' => 'Not enough spots left for this event.'], 422);
            }
        }

        $event->submissions()->create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'company'   => $data['company'] ?? null,
            'attendees' => $data['attendees'] ?? 1,
            'message'   => $data['message'] ?? null,
        ]);

        return response()->json(['message' => 'Submission received successfully.']);
    }
}
