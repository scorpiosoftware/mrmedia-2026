<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AdminEmail;
use App\Models\ContactMessage;
use App\Models\Email;
use App\Models\EmailSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

/**
 * Sending email from the dashboard Inbox through the SMTP account in Email Settings:
 * replies to contact messages, new emails, and the Sent list.
 */
class EmailController extends Controller
{
    private const MAX_RECIPIENTS = 20;

    private const ATTACHMENT_RULES = ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,gif,webp,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip'];

    /** GET /spa/admin/emails?status=all|failed — sent emails, newest first. */
    public function index(Request $request): JsonResponse
    {
        $query = Email::with('user:id,name', 'contactMessage:id,name')
            ->where('direction', 'outbound')
            ->latest();

        if ($request->get('status') === 'failed') {
            $query->where('status', 'failed');
        }

        return response()->json([
            'emails' => $query->paginate(20)->withQueryString(),
            'counts' => $this->counts(),
        ]);
    }

    /** POST /spa/admin/emails — a new email. Body: to, cc?, bcc?, subject, body, attachments[]? */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'to'            => ['required', 'string', 'max:2000'],
            'cc'            => ['nullable', 'string', 'max:2000'],
            'bcc'           => ['nullable', 'string', 'max:2000'],
            'subject'       => ['required', 'string', 'max:255'],
            'body'          => ['required', 'string', 'max:50000'],
            'attachments'   => ['nullable', 'array', 'max:5'],
            'attachments.*' => self::ATTACHMENT_RULES,
            'replaces'      => ['nullable', 'integer'],
        ]);

        $recipients = $this->recipients($data);
        $this->discardFailedAttempt($data['replaces'] ?? null);

        $email = $this->createEmail($request, [
            ...$recipients,
            'subject' => $data['subject'],
            'body'    => $data['body'],
        ]);

        return $this->deliver($email);
    }

    /** POST /spa/admin/inbox/{contactMessage}/reply — answer a contact form message by email. */
    public function reply(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        if (! $contactMessage->email) {
            return response()->json(['message' => 'This message has no email address to reply to.'], 422);
        }

        $data = $request->validate([
            'cc'            => ['nullable', 'string', 'max:2000'],
            'subject'       => ['required', 'string', 'max:255'],
            'body'          => ['required', 'string', 'max:50000'],
            'quote'         => ['boolean'],
            'attachments'   => ['nullable', 'array', 'max:5'],
            'attachments.*' => self::ATTACHMENT_RULES,
            'replaces'      => ['nullable', 'integer'],
        ]);

        $recipients = $this->recipients(['to' => $contactMessage->email, 'cc' => $data['cc'] ?? null]);
        $this->discardFailedAttempt($data['replaces'] ?? null, $contactMessage->id);

        // Thread replies to the same visitor together in their mail app.
        $previous = $contactMessage->emails()->where('status', 'sent')->orderBy('id')->pluck('message_id');

        $email = $this->createEmail($request, [
            ...$recipients,
            'contact_message_id' => $contactMessage->id,
            'subject'            => $data['subject'],
            'body'               => $data['body'],
            'in_reply_to'        => $previous->last(),
            'references'         => $previous->implode(' ') ?: null,
        ]);

        return $this->deliver($email, $request->boolean('quote', true) ? $contactMessage : null);
    }

    /** POST /spa/admin/emails/{email}/resend — try a failed email again. */
    public function resend(Email $email): JsonResponse
    {
        abort_unless($email->direction === 'outbound' && $email->status === 'failed', 422, 'Only failed emails can be sent again.');

        return $this->deliver($email, $email->contactMessage);
    }

    /** GET /spa/admin/emails/{email}/attachments/{index} */
    public function attachment(Email $email, int $index): StreamedResponse
    {
        $file = $email->attachments[$index] ?? null;
        abort_unless($file && Storage::disk('local')->exists($file['path']), 404);

        return Storage::disk('local')->download($file['path'], $file['name']);
    }

    /** DELETE /spa/admin/emails/{email} — removes it from the Sent list (not from the recipient's mailbox). */
    public function destroy(Email $email): JsonResponse
    {
        $this->deleteAttachments($email);
        $email->delete();

        return response()->json(['message' => 'Email deleted.', 'counts' => $this->counts()]);
    }

    /**
     * "a@x.com, b@y.com; c@z.com" → validated, de-duplicated lists.
     *
     * @return array{to: array<int, string>, cc: ?array<int, string>, bcc: ?array<int, string>}
     */
    private function recipients(array $data): array
    {
        $lists = [];
        foreach (['to', 'cc', 'bcc'] as $field) {
            $addresses = collect(preg_split('/[\s,;]+/', (string) ($data[$field] ?? ''), -1, PREG_SPLIT_NO_EMPTY))
                ->map(fn ($a) => trim($a, " <>\t\n\r"))
                ->filter()
                ->unique(fn ($a) => strtolower($a))
                ->values();

            $invalid = $addresses->reject(fn ($a) => filter_var($a, FILTER_VALIDATE_EMAIL));
            if ($invalid->isNotEmpty()) {
                throw ValidationException::withMessages([$field => 'Not a valid email address: '.$invalid->implode(', ')]);
            }

            $lists[$field] = $addresses->all();
        }

        if (! $lists['to']) {
            throw ValidationException::withMessages(['to' => 'Add at least one recipient.']);
        }
        if (count($lists['to']) + count($lists['cc']) + count($lists['bcc']) > self::MAX_RECIPIENTS) {
            throw ValidationException::withMessages(['to' => 'An email can have at most '.self::MAX_RECIPIENTS.' recipients.']);
        }

        return ['to' => $lists['to'], 'cc' => $lists['cc'] ?: null, 'bcc' => $lists['bcc'] ?: null];
    }

    /** Sending again from the composer after a failure replaces that failed copy instead of piling up duplicates. */
    private function discardFailedAttempt(?int $id, ?int $contactMessageId = null): void
    {
        $failed = $id ? Email::whereKey($id)
            ->where('direction', 'outbound')
            ->where('status', 'failed')
            ->where('contact_message_id', $contactMessageId)
            ->first() : null;

        if ($failed) {
            $this->deleteAttachments($failed);
            $failed->delete();
        }
    }

    private function createEmail(Request $request, array $attributes): Email
    {
        $settings = $this->settings();

        return Email::create([
            ...$attributes,
            'direction'    => 'outbound',
            'user_id'      => $request->user()->id,
            'from_address' => $settings->from_address,
            'from_name'    => $settings->from_name,
            'attachments'  => $this->storeAttachments($request->file('attachments', [])) ?: null,
            'message_id'   => Email::newMessageId($settings->from_address),
            'status'       => 'failed', // until the mail server accepts it
        ]);
    }

    /** Sends through the configured SMTP account; a failure is kept (with the error) so it can be retried. */
    private function deliver(Email $email, ?ContactMessage $quoted = null): JsonResponse
    {
        $settings = $this->settings();

        try {
            $settings->applyToMailer();
            Mail::to($email->to)->send(new AdminEmail($email, $settings->signature, $quoted));

            $email->update(['status' => 'sent', 'error' => null, 'sent_at' => now()]);
            $email->contactMessage?->update(['replied_at' => now(), 'is_read' => true, 'read_at' => $email->contactMessage->read_at ?? now()]);
        } catch (Throwable $e) {
            Log::error('Dashboard email failed', ['email_id' => $email->id, 'exception' => $e->getMessage()]);
            $email->update(['status' => 'failed', 'error' => Str::limit($e->getMessage(), 1000)]);

            return response()->json([
                'message' => 'The email could not be sent: '.Str::limit($e->getMessage(), 300),
                'email'   => $email->fresh()->load('user:id,name'),
                'counts'  => $this->counts(),
            ], 422);
        }

        return response()->json([
            'message' => 'Email sent.',
            'email'   => $email->fresh()->load('user:id,name'),
            'counts'  => $this->counts(),
        ]);
    }

    private function settings(): EmailSettings
    {
        $settings = EmailSettings::getCurrent();

        if (! $settings || ! $settings->from_address) {
            throw ValidationException::withMessages(['email' => 'Set up the mail server in Email Settings before sending emails.']);
        }

        return $settings;
    }

    /**
     * @param  array<int, UploadedFile>  $files
     * @return array<int, array{name: string, path: string, size: int, mime: string}>
     */
    private function storeAttachments(array $files): array
    {
        return collect($files)->map(function (UploadedFile $file) {
            $name = Str::limit(preg_replace('/[^\pL\pN._\- ]+/u', '_', $file->getClientOriginalName()), 150, '');

            return [
                'name' => $name ?: 'attachment',
                'path' => $file->store('email-attachments/'.Str::uuid(), 'local'),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType() ?: 'application/octet-stream',
            ];
        })->all();
    }

    private function deleteAttachments(Email $email): void
    {
        foreach ($email->attachments ?? [] as $file) {
            Storage::disk('local')->delete($file['path']);
            Storage::disk('local')->deleteDirectory(dirname($file['path']));
        }
    }

    private function counts(): array
    {
        $outbound = Email::where('direction', 'outbound');

        return [
            'sent'   => (clone $outbound)->count(),
            'failed' => (clone $outbound)->where('status', 'failed')->count(),
        ];
    }
}
