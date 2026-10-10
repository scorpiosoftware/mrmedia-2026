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
        $pick = fn (?string $en, ?string $ar) => $locale === 'ar' && $ar ? $ar : $en;

        $agenda = collect($event->agenda ?? [])
            ->map(fn ($item) => [
                'title'       => $pick($item['title'] ?? null, $item['title_ar'] ?? null),
                'description' => $pick($item['description'] ?? null, $item['description_ar'] ?? null),
            ])
            ->filter(fn ($item) => $item['title'] || $item['description'])
            ->values();

        $trainer = $event->trainer_name ? [
            'name'        => $pick($event->trainer_name, $event->trainer_name_ar),
            'title'       => $pick($event->trainer_title, $event->trainer_title_ar),
            'bio'         => $pick($event->trainer_bio, $event->trainer_bio_ar),
            'image_url'   => $event->trainer_image_url,
            'credentials' => collect($event->trainer_credentials ?? [])
                ->map(fn ($c) => $pick($c['text'] ?? null, $c['text_ar'] ?? null))
                ->filter()
                ->values(),
        ] : null;

        $testimonials = collect($event->testimonials ?? [])
            ->map(fn ($item) => [
                'quote'      => $pick($item['quote'] ?? null, $item['quote_ar'] ?? null),
                'name'       => $item['name'] ?? null,
                'role'       => $pick($item['role'] ?? null, $item['role_ar'] ?? null),
                'avatar_url' => $item['avatar_url'] ?? null,
            ])
            ->filter(fn ($item) => $item['quote'])
            ->values();

        $faqs = collect($event->faqs ?? [])
            ->map(fn ($item) => [
                'question' => $pick($item['question'] ?? null, $item['question_ar'] ?? null),
                'answer'   => $pick($item['answer'] ?? null, $item['answer_ar'] ?? null),
            ])
            ->filter(fn ($item) => $item['question'] && $item['answer'])
            ->values();

        return [
            'id'              => $event->id,
            'slug'            => $event->slug,
            'title'           => $pick($event->title, $event->title_ar),
            'type'            => $event->type,
            'mode'            => $event->mode,
            'description'     => $pick($event->description, $event->description_ar),
            'target_audience' => $pick($event->target_audience, $event->target_audience_ar),
            'location'        => $pick($event->location, $event->location_ar),
            'starts_at'       => $event->starts_at,
            'ends_at'         => $event->ends_at,
            'capacity'        => $event->capacity,
            'price'           => $event->price !== null ? (float) $event->price : null,
            'image_url'       => $event->image_url,
            'required_fields' => $event->required_fields ?: ['name', 'email'],
            'remaining'       => $event->capacity
                ? max(0, $event->capacity - (int) $event->submissions_sum_attendees)
                : null,
            'agenda'          => $agenda,
            'trainer'         => $trainer,
            'payment_note'    => $pick($event->payment_note, $event->payment_note_ar),
            'testimonials'    => $testimonials,
            'faqs'            => $faqs,
            'cta'             => ($event->cta_heading || $event->cta_subheading) ? [
                'heading'    => $pick($event->cta_heading, $event->cta_heading_ar),
                'subheading' => $pick($event->cta_subheading, $event->cta_subheading_ar),
            ] : null,
        ];
    }
}
