<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\StoresUploadedImages;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EventController extends Controller
{
    use StoresUploadedImages;

    private const UPLOAD_DIR = 'events';

    /** GET /spa/admin/events — all events with submission counts, newest first */
    public function index(): JsonResponse
    {
        return response()->json(
            Event::withCount('submissions')->latest('starts_at')->get()
        );
    }

    /** POST /spa/admin/events */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateEvent($request);
        $data['slug'] = $this->generateUniqueSlug($data['title']);

        $event = Event::create($data);

        return response()->json($event);
    }

    /** POST /spa/admin/events/{event} */
    public function update(Request $request, Event $event): JsonResponse
    {
        $data = $this->validateEvent($request);

        $event->update($data);

        return response()->json($event);
    }

    /** DELETE /spa/admin/events/{event} */
    public function destroy(Event $event): JsonResponse
    {
        $this->forgetStoredImage($event->image_url);
        $this->forgetStoredImage($event->trainer_image_url);
        foreach ($event->testimonials ?? [] as $testimonial) {
            $this->forgetStoredImage($testimonial['avatar_url'] ?? null);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted.']);
    }

    /** GET /spa/admin/events/{event}/submissions */
    public function submissions(Event $event): JsonResponse
    {
        return response()->json(
            $event->submissions()->latest()->get()
        );
    }

    /** DELETE /spa/admin/events/{event}/submissions/{submission} */
    public function destroySubmission(Event $event, EventSubmission $submission): JsonResponse
    {
        if ($submission->event_id !== $event->id) {
            return response()->json(['message' => 'Submission does not belong to this event.'], 404);
        }

        $submission->delete();

        return response()->json(['message' => 'Submission deleted.']);
    }

    private function validateEvent(Request $request): array
    {
        $data = $request->validate([
            'title'           => ['required', 'string', 'max:255'],
            'title_ar'        => ['nullable', 'string', 'max:255'],
            'type'            => ['required', 'string', 'in:event,training'],
            'mode'            => ['required', 'string', 'in:online,offline'],
            'description'     => ['nullable', 'string', 'max:5000'],
            'description_ar'  => ['nullable', 'string', 'max:5000'],
            'location'        => ['nullable', 'string', 'max:255'],
            'location_ar'     => ['nullable', 'string', 'max:255'],
            'starts_at'       => ['required', 'date'],
            'ends_at'         => ['nullable', 'date', 'after_or_equal:starts_at'],
            'capacity'        => ['nullable', 'integer', 'min:1'],
            'price'           => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'image_url'       => ['nullable', 'string', 'max:2048'],
            'is_published'    => ['boolean'],

            // Registration form — which fields the public form requires
            'required_fields'   => ['nullable', 'array'],
            'required_fields.*' => ['string', 'in:name,email,phone,company,message'],

            // About the Event
            'target_audience'    => ['nullable', 'string', 'max:2000'],
            'target_audience_ar' => ['nullable', 'string', 'max:2000'],

            // Learning Outcomes / Agenda
            'agenda'                    => ['nullable', 'array'],
            'agenda.*.title'            => ['nullable', 'string', 'max:255'],
            'agenda.*.title_ar'         => ['nullable', 'string', 'max:255'],
            'agenda.*.description'      => ['nullable', 'string', 'max:2000'],
            'agenda.*.description_ar'   => ['nullable', 'string', 'max:2000'],

            // Trainer / Speaker
            'trainer_name'               => ['nullable', 'string', 'max:255'],
            'trainer_name_ar'            => ['nullable', 'string', 'max:255'],
            'trainer_title'              => ['nullable', 'string', 'max:255'],
            'trainer_title_ar'           => ['nullable', 'string', 'max:255'],
            'trainer_bio'                => ['nullable', 'string', 'max:5000'],
            'trainer_bio_ar'             => ['nullable', 'string', 'max:5000'],
            'trainer_image_url'          => ['nullable', 'string', 'max:2048'],
            'trainer_credentials'        => ['nullable', 'array'],
            'trainer_credentials.*.text'    => ['nullable', 'string', 'max:255'],
            'trainer_credentials.*.text_ar' => ['nullable', 'string', 'max:255'],

            // Registration
            'payment_note'    => ['nullable', 'string', 'max:2000'],
            'payment_note_ar' => ['nullable', 'string', 'max:2000'],

            // Testimonials
            'testimonials'              => ['nullable', 'array'],
            'testimonials.*.quote'      => ['nullable', 'string', 'max:2000'],
            'testimonials.*.quote_ar'   => ['nullable', 'string', 'max:2000'],
            'testimonials.*.name'       => ['nullable', 'string', 'max:255'],
            'testimonials.*.role'       => ['nullable', 'string', 'max:255'],
            'testimonials.*.role_ar'    => ['nullable', 'string', 'max:255'],
            'testimonials.*.avatar_url' => ['nullable', 'string', 'max:2048'],

            // FAQ
            'faqs'               => ['nullable', 'array'],
            'faqs.*.question'    => ['nullable', 'string', 'max:500'],
            'faqs.*.question_ar' => ['nullable', 'string', 'max:500'],
            'faqs.*.answer'      => ['nullable', 'string', 'max:3000'],
            'faqs.*.answer_ar'   => ['nullable', 'string', 'max:3000'],

            // Final CTA
            'cta_heading'      => ['nullable', 'string', 'max:255'],
            'cta_heading_ar'   => ['nullable', 'string', 'max:255'],
            'cta_subheading'   => ['nullable', 'string', 'max:1000'],
            'cta_subheading_ar' => ['nullable', 'string', 'max:1000'],

            // Per-event section heading overrides (blank → site-wide default label)
            'section_titles'   => ['nullable', 'array:agenda,agenda_ar,trainer,trainer_ar,payment,payment_ar,cta_button,cta_button_ar'],
            'section_titles.*' => ['nullable', 'string', 'max:255'],
        ]);

        $required = $data['required_fields'] ?? [];
        if (! in_array('email', $required, true) && ! in_array('phone', $required, true)) {
            throw ValidationException::withMessages([
                'required_fields' => 'At least one of Email or Phone must be required, so a registrant can always be reached.',
            ]);
        }

        return $data;
    }

    /** Generates a URL-safe slug from the title, appending -2, -3, … on collision. */
    private function generateUniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'event';
        $slug = $base;
        $i = 2;

        while (Event::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
