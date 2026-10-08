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
            'email'   => ['required', 'email', 'max:255'],
            'service' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            // Honeypot: a field real users never see, so anything in it is a bot.
            'website' => ['nullable', 'string', 'max:255'],
        ]);

        $isSpam = filled($data['website'] ?? null);

        $contactMessage = ContactMessage::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'service'    => $data['service'],
            'message'    => $data['message'],
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
