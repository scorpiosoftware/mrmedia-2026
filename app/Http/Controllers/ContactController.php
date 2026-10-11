<?php

namespace App\Http\Controllers;

use App\Mail\ContactFormMail;
use App\Models\ContactMessage;
use App\Models\EmailSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ContactController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            // Country code + local number, e.g. "+964 7701234567".
            'phone'   => ['required', 'string', 'max:32', 'regex:/^\+\d{1,4} [\d\s-]{4,20}$/'],
            'email'   => ['nullable', 'email', 'max:255'],
            'service' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
            // Honeypot: a field real users never see, so anything in it is a bot.
            'website' => ['nullable', 'string', 'max:255'],
        ]);

        $isSpam = filled($data['website'] ?? null);

        $contactMessage = ContactMessage::create([
            'name'       => $data['name'],
            'phone'      => $data['phone'],
            'email'      => $data['email'] ?? null,
            'service'    => $data['service'] ?? null,
            'message'    => $data['message'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'is_spam'    => $isSpam,
        ]);

        // Bots get the same response a human gets, so they can't probe what was rejected.
        if ($isSpam) {
            return response()->json(['message' => 'Message sent successfully.']);
        }

        $this->notifyByEmail($contactMessage);

        return response()->json(['message' => 'Message sent successfully.']);
    }

    /**
     * Emails the enquiry to the configured inbox. The message is already stored, so a
     * misconfigured or failing mailer is recorded against the row instead of failing
     * the request and losing the enquiry.
     */
    private function notifyByEmail(ContactMessage $contactMessage): void
    {
        $settings = EmailSettings::getCurrent();

        if (! $settings || ! $settings->to_address) {
            $contactMessage->update(['mail_error' => 'Contact email is not configured.']);

            return;
        }

        try {
            $settings->applyToMailer();

            Mail::to($settings->to_address)->send(
                new ContactFormMail(
                    senderName:  $contactMessage->name,
                    senderPhone: $contactMessage->phone,
                    senderEmail: $contactMessage->email,
                    service:     $contactMessage->service,
                    body:        $contactMessage->message,
                )
            );

            $contactMessage->update(['mail_delivered' => true, 'mail_error' => null]);
        } catch (Throwable $e) {
            Log::error('Contact form email failed', [
                'contact_message_id' => $contactMessage->id,
                'exception' => $e->getMessage(),
            ]);

            $contactMessage->update(['mail_error' => $e->getMessage()]);
        }
    }
}
