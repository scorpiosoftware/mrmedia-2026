<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class EventApiController extends Controller
{
    /** GET /api/events?locale=en|ar — published events for the public site, soonest first */
    public function index(Request $request)
    {
        $locale = $request->get('locale') === 'ar' ? 'ar' : 'en';

        $events = Event::where('is_published', true)
            ->withSum('submissions', 'attendees')
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Event $event) => $this->present($event, $locale));

        return response()->json($events);
    }

    /** GET /api/events/{slug}?locale=en|ar — a single published event, for its detail page */
    public function show(Request $request, string $slug)
    {
        $locale = $request->get('locale') === 'ar' ? 'ar' : 'en';

        $event = Event::where('slug', $slug)
            ->where('is_published', true)
            ->withSum('submissions', 'attendees')
            ->first();

        if (! $event) {
            return response()->json(['message' => 'Event not found.'], 404);
        }

        return response()->json($this->present($event, $locale));
    }

    private function present(Event $event, string $locale): array
    {
        return [
            'id'          => $event->id,
            'slug'        => $event->slug,
            'title'       => $locale === 'ar' && $event->title_ar ? $event->title_ar : $event->title,
            'type'        => $event->type,
            'mode'        => $event->mode,
            'description' => $locale === 'ar' && $event->description_ar ? $event->description_ar : $event->description,
            'location'    => $locale === 'ar' && $event->location_ar ? $event->location_ar : $event->location,
            'starts_at'   => $event->starts_at,
            'ends_at'     => $event->ends_at,
            'capacity'    => $event->capacity,
            'price'       => $event->price !== null ? (float) $event->price : null,
            'image_url'   => $event->image_url,
            'remaining'   => $event->capacity
                ? max(0, $event->capacity - (int) $event->submissions_sum_attendees)
                : null,
        ];
    }
}
