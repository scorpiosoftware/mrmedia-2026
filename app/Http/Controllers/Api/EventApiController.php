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
            ->map(function (Event $event) use ($locale) {
                return [
                    'id'          => $event->id,
                    'title'       => $locale === 'ar' && $event->title_ar ? $event->title_ar : $event->title,
                    'type'        => $event->type,
                    'description' => $locale === 'ar' && $event->description_ar ? $event->description_ar : $event->description,
                    'location'    => $locale === 'ar' && $event->location_ar ? $event->location_ar : $event->location,
                    'starts_at'   => $event->starts_at,
                    'ends_at'     => $event->ends_at,
                    'capacity'    => $event->capacity,
                    'image_url'   => $event->image_url,
                    'remaining'   => $event->capacity
                        ? max(0, $event->capacity - (int) $event->submissions_sum_attendees)
                        : null,
                ];
            });

        return response()->json($events);
    }
}
