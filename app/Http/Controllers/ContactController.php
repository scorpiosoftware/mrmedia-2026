<?php

namespace App\Http\Controllers;

use App\Mail\ContactFormMail;
use App\Models\EmailSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['required', 'email', 'max:255'],
            'service' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $settings = EmailSettings::getCurrent();

        if (! $settings || ! $settings->to_address) {
            return response()->json(['message' => 'Contact form is not configured yet.'], 503);
        }

        $settings->applyToMailer();

        Mail::to($settings->to_address)->send(
            new ContactFormMail(
                senderName:  $data['name'],
                senderEmail: $data['email'],
                service:     $data['service'],
                message:     $data['message'],
            )
        );

        return response()->json(['message' => 'Message sent successfully.']);
    }
}
