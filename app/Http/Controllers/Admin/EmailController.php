<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AdminEmail;
use App\Models\ContactMessage;
use App\Models\Email;
use App\Models\EmailSettings;
use App\Support\Mailbox\MailboxSync;
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
 * Email in the dashboard Inbox. Sending goes through the SMTP account in Email Settings;
 * received mail is fetched over IMAP (MailboxSync, `php artisan mail:fetch`).
 */
class EmailController extends Controller
{
    private const MAX_RECIPIENTS = 20;

    private const ATTACHMENT_RULES = ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,gif,webp,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip'];

    // Images embedded in a received email (cid:) are inlined up to this size each.
    private const MAX_INLINE_IMAGE_BYTES = 3 * 1024 * 1024;

    /* ------------------------------------------------------------------ lists */

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

    /** GET /spa/admin/mail?filter=all|unread — received emails, newest first, with how long each conversation is. */
    public function received(Request $request): JsonResponse
    {
        $query = Email::where('direction', 'inbound')
            ->with('contactMessage:id,name')
            ->addSelect([
                'thread_size' => Email::from('emails as t')
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('t.thread_id', 'emails.thread_id'),
            ])
            ->orderByDesc('sent_at')
            ->orderByDesc('id');

        if ($request->get('filter') === 'unread') {
            $query->where('is_read', false);
        }

        return response()->json([
            'emails'  => $query->paginate(20)->withQueryString(),
            'counts'  => $this->counts(),
            'mailbox' => EmailSettings::getCurrent()?->imapStatus() ?? ['enabled' => false],
        ]);
    }

    /** GET /spa/admin/emails/{email}/thread — the whole conversation, oldest first. Marks received emails read. */
    public function thread(Email $email): JsonResponse
    {
        $emails = Email::with('user:id,name')
            ->where('thread_id', $email->thread_id ?? $email->id)
            ->orderByRaw('COALESCE(sent_at, created_at)')
            ->orderBy('id')
            ->get();

        Email::whereIn('id', $emails->where('direction', 'inbound')->where('is_read', false)->pluck('id'))
            ->update(['is_read' => true]);

        return response()->json([
            'emails'          => $emails->each(fn (Email $e) => $e->is_read = true)->values(),
            'contact_message' => $email->contactMessage,
            'counts'          => $this->counts(),
        ]);
    }

    /**
     * GET /spa/admin/emails/{email}/html?images=1 — a received email's HTML, ready for the
     * sandboxed viewer: no scripts, embedded images inlined, remote images blocked unless asked for.
     */
    public function html(Request $request, Email $email): JsonResponse
    {
        $html = (string) $email->body_html;
        abort_if($html === '', 404);

        $html = preg_replace('#<script\b[^>]*>.*?</script\s*>#is', '', $html);
        $html = $this->inlineEmbeddedImages($email, (string) $html);

        $remote = (bool) preg_match('/(src|background)\s*=\s*["\']?\s*https?:|url\(\s*["\']?\s*https?:/i', $html);
        $images = $request->boolean('images') ? ' https: http:' : '';
        $csp = "default-src 'none'; img-src data:{$images}; style-src 'unsafe-inline'{$images}; font-src data:{$images}";

        $document = '<!DOCTYPE html><html><head><meta charset="utf-8">'
            .'<meta http-equiv="Content-Security-Policy" content="'.$csp.'">'
            .'<base target="_blank">'
            // flow-root: child margins count toward the body's height, so the viewer can size the frame exactly.
            .'<style>html,body{margin:0;padding:0}body{display:flow-root;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,sans-serif;font-size:14px;line-height:1.6;color:#0D1B4B;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}</style>'
            .'</head><body>'.$html.'</body></html>';

        return response()->json(['html' => $document, 'remote_images' => $remote]);
    }

    /** POST /spa/admin/emails/{email}/read — body: { is_read: bool } */
    public function markRead(Request $request, Email $email): JsonResponse
    {
        $data = $request->validate(['is_read' => ['required', 'boolean']]);
        $email->update(['is_read' => $data['is_read']]);

        return response()->json(['email' => $email->fresh(), 'counts' => $this->counts()]);
    }

    /** POST /spa/admin/mail/sync — check the mailbox for new mail now. */
    public function sync(MailboxSync $sync): JsonResponse
    {
        $settings = EmailSettings::getCurrent();
        if (! $settings?->imapReady()) {
            return response()->json(['message' => 'Receiving email is not set up yet (php artisan mail:imap-setup).'], 422);
        }

        try {
            $result = $sync->sync($settings);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not check the mailbox: '.Str::limit($e->getMessage(), 300),
                'mailbox' => $settings->fresh()->imapStatus(),
            ], 422);
        }

        return response()->json([
            'stored'  => $result['stored'],
            'mailbox' => $settings->fresh()->imapStatus(),
            'counts'  => $this->counts(),
        ]);
    }

    /* ---------------------------------------------------------------- sending */

    /** POST /spa/admin/emails — a new email. Body: to, cc?, bcc?, subject, body, attachments[]? */
    public function store(Request $request, MailboxSync $sync): JsonResponse
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

        return $this->deliver($email, $sync);
    }

    /** POST /spa/admin/inbox/{contactMessage}/reply — answer a contact form message by email. */
    public function reply(Request $request, ContactMessage $contactMessage, MailboxSync $sync): JsonResponse
    {
        if (! $contactMessage->email) {
            return response()->json(['message' => 'This message has no email address to reply to.'], 422);
        }

        $data = $this->validateReply($request);

        $recipients = $this->recipients(['to' => $contactMessage->email, 'cc' => $data['cc'] ?? null]);
        $this->discardFailedAttempt($data['replaces'] ?? null, $contactMessage->id);

        // Thread with everything already exchanged with this visitor (our replies and theirs).
        $conversation = $contactMessage->emails()->where('status', '!=', 'failed')->get(['message_id', 'thread_id']);

        $email = $this->createEmail($request, [
            ...$recipients,
            'contact_message_id' => $contactMessage->id,
            'thread_id'          => $conversation->first()?->thread_id,
            'subject'            => $data['subject'],
            'body'               => $data['body'],
            'in_reply_to'        => $conversation->last()?->message_id,
            'references'         => $this->referencesOf($conversation->pluck('message_id')->all()),
        ]);

        return $this->deliver($email, $sync, $request->boolean('quote', true) ? AdminEmail::quoteOf($contactMessage) : null);
    }

    /** POST /spa/admin/emails/{email}/reply — answer a received email (or follow up on a sent one). */
    public function replyToEmail(Request $request, Email $email, MailboxSync $sync): JsonResponse
    {
        $data = $this->validateReply($request);

        $to = $email->direction === 'inbound' ? $email->replyAddress() : implode(',', $email->to ?? []);
        $recipients = $this->recipients(['to' => $to, 'cc' => $data['cc'] ?? null]);
        $this->discardFailedAttempt($data['replaces'] ?? null, $email->contact_message_id);

        $reply = $this->createEmail($request, [
            ...$recipients,
            'contact_message_id' => $email->contact_message_id,
            'thread_id'          => $email->thread_id ?? $email->id,
            'subject'            => $data['subject'],
            'body'               => $data['body'],
            'in_reply_to'        => $email->message_id,
            'references'         => $this->referencesOf([...explode(' ', (string) $email->references), $email->message_id]),
        ]);

        if ($email->direction === 'inbound' && ! $email->is_read) {
            $email->update(['is_read' => true]);
        }

        return $this->deliver($reply, $sync, $request->boolean('quote', true) ? AdminEmail::quoteOf($email) : null);
    }

    /** POST /spa/admin/emails/{email}/resend — try a failed email again. */
    public function resend(Email $email, MailboxSync $sync): JsonResponse
    {
        abort_unless($email->direction === 'outbound' && $email->status === 'failed', 422, 'Only failed emails can be sent again.');

        $parent = $email->in_reply_to ? Email::where('message_id', $email->in_reply_to)->first() : null;

        return $this->deliver($email, $sync, AdminEmail::quoteOf($parent ?? $email->contactMessage));
    }

    /** GET /spa/admin/emails/{email}/attachments/{index} */
    public function attachment(Email $email, int $index): StreamedResponse
    {
        $file = $email->attachments[$index] ?? null;
        abort_unless($file && ! empty($file['path']) && Storage::disk('local')->exists($file['path']), 404);

        return Storage::disk('local')->download($file['path'], $file['name']);
    }

    /** DELETE /spa/admin/emails/{email} — removes it from the dashboard (not from anyone's mailbox). */
    public function destroy(Email $email): JsonResponse
    {
        $this->deleteAttachments($email);
        $email->delete();

        return response()->json(['message' => 'Email deleted.', 'counts' => $this->counts()]);
    }

    /* ---------------------------------------------------------------- helpers */

    private function validateReply(Request $request): array
    {
        return $request->validate([
            'cc'            => ['nullable', 'string', 'max:2000'],
            'subject'       => ['required', 'string', 'max:255'],
            'body'          => ['required', 'string', 'max:50000'],
            'quote'         => ['boolean'],
            'attachments'   => ['nullable', 'array', 'max:5'],
            'attachments.*' => self::ATTACHMENT_RULES,
            'replaces'      => ['nullable', 'integer'],
        ]);
    }

    /** References header: the conversation's Message-IDs, oldest first, capped so it stays a sane length. */
    private function referencesOf(array $ids): ?string
    {
        $ids = array_values(array_unique(array_filter(array_map('trim', $ids))));

        return $ids ? implode(' ', array_slice($ids, -10)) : null;
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

        $email = Email::create([
            ...$attributes,
            'direction'    => 'outbound',
            'user_id'      => $request->user()->id,
            'from_address' => $settings->from_address,
            'from_name'    => $settings->from_name,
            'attachments'  => $this->storeAttachments($request->file('attachments', [])) ?: null,
            'message_id'   => Email::newMessageId($settings->from_address),
            'status'       => 'failed', // until the mail server accepts it
            'is_read'      => true,
        ]);

        // A new conversation starts with this email.
        if (! $email->thread_id) {
            $email->update(['thread_id' => $email->id]);
        }

        return $email;
    }

    /**
     * Sends through the configured SMTP account; a failure is kept (with the error) so it can be
     * retried. Once sent, a copy goes to the mailbox's Sent folder (after the response, so it never slows sending).
     */
    private function deliver(Email $email, MailboxSync $sync, ?array $quoted = null): JsonResponse
    {
        $settings = $this->settings();

        try {
            $settings->applyToMailer();
            $sent = Mail::to($email->to)->send(new AdminEmail($email, $settings->signature, $quoted));

            $email->update(['status' => 'sent', 'error' => null, 'sent_at' => now()]);
            $email->contactMessage?->update(['replied_at' => now(), 'is_read' => true, 'read_at' => $email->contactMessage->read_at ?? now()]);

            $raw = $sent?->getSymfonySentMessage()?->toString();
            if ($raw && $settings->imapReady() && $settings->imap_sent_folder) {
                \Illuminate\Support\defer(fn () => $sync->appendToSent($settings, $raw));
            }
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

    /** Replaces cid: references with the embedded images themselves (data: URIs). */
    private function inlineEmbeddedImages(Email $email, string $html): string
    {
        $byCid = collect($email->attachments ?? [])
            ->filter(fn ($a) => ! empty($a['content_id']) && ! empty($a['path']) && str_starts_with($a['mime'] ?? '', 'image/')
                && ($a['size'] ?? 0) <= self::MAX_INLINE_IMAGE_BYTES)
            ->keyBy(fn ($a) => strtolower($a['content_id']));

        if ($byCid->isEmpty()) {
            return $html;
        }

        return preg_replace_callback('/cid:([^"\'\s)>]+)/i', function ($m) use ($byCid) {
            $a = $byCid->get(strtolower(urldecode($m[1])));
            if (! $a || ! Storage::disk('local')->exists($a['path'])) {
                return $m[0];
            }

            return 'data:'.$a['mime'].';base64,'.base64_encode(Storage::disk('local')->get($a['path']));
        }, $html);
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
            if (empty($file['path'])) {
                continue;
            }
            Storage::disk('local')->delete($file['path']);
            Storage::disk('local')->deleteDirectory(dirname($file['path']));
        }
    }

    private function counts(): array
    {
        $outbound = Email::where('direction', 'outbound');
        $inbound = Email::where('direction', 'inbound');

        return [
            'sent'            => (clone $outbound)->count(),
            'failed'          => (clone $outbound)->where('status', 'failed')->count(),
            'received'        => (clone $inbound)->count(),
            'received_unread' => (clone $inbound)->where('is_read', false)->count(),
        ];
    }
}
