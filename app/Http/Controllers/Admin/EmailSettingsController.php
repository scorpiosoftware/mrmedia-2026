<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = EmailSettings::getCurrent();

        if (! $settings) {
            return response()->json(null);
        }

        return response()->json([
            'driver'           => $settings->driver,
            'host'             => $settings->host,
            'port'             => $settings->port,
            'username'         => $settings->username,
            'has_password'     => (bool) $settings->getRawOriginal('password'),
            'encryption'       => $settings->encryption,
            'from_address'     => $settings->from_address,
            'from_name'        => $settings->from_name,
            'to_address'       => $settings->to_address,
            'whatsapp_number'   => $settings->whatsapp_number,
            'whatsapp_visible'  => (bool) $settings->whatsapp_visible,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'driver'          => ['required', 'string', 'in:smtp,sendmail,log'],
            'host'            => ['nullable', 'string', 'max:255'],
            'port'            => ['nullable', 'integer', 'min:1', 'max:65535'],
            'username'        => ['nullable', 'string', 'max:255'],
            'password'        => ['nullable', 'string', 'max:255'],
            'encryption'      => ['nullable', 'string', 'in:tls,ssl,starttls'],
            'from_address'    => ['required', 'email', 'max:255'],
            'from_name'       => ['required', 'string', 'max:255'],
            'to_address'      => ['nullable', 'email', 'max:255'],
            'whatsapp_number'  => ['nullable', 'string', 'max:30'],
            'whatsapp_visible' => ['boolean'],
        ]);

        $settings = EmailSettings::getCurrent() ?? new EmailSettings();

        // Only update password if a new one was provided
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $settings->fill($data)->save();

        return response()->json(['message' => 'Email settings saved.']);
    }

    public function testSend(Request $request): JsonResponse
    {
        $request->validate([
            'to' => ['required', 'email'],
        ]);

        $settings = EmailSettings::getCurrent();

        if (! $settings) {
            return response()->json(['message' => 'No email settings configured.'], 422);
        }

        $settings->applyToMailer();

        try {
            \Illuminate\Support\Facades\Mail::raw(
                'This is a test email from your Mr.MEDIA admin panel. Your email configuration is working correctly.',
                function ($message) use ($request, $settings) {
                    $message->to($request->to)
                            ->subject('Mr.MEDIA — Test Email');
                }
            );

            return response()->json(['message' => 'Test email sent successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to send: ' . $e->getMessage()], 422);
        }
    }
}
