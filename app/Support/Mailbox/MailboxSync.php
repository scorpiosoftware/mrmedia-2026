<?php

namespace App\Support\Mailbox;

use App\Models\ContactMessage;
use App\Models\Email;
use App\Models\EmailSettings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Pulls new emails from the mailbox (IMAP) into the dashboard Inbox and saves copies
 * of emails sent from the dashboard to the mailbox's Sent folder.
 *
 * Received emails that answer something sent from the dashboard (matched on the
 * In-Reply-To / References headers) join that conversation — including the contact
 * message it started from.
 */
class MailboxSync
{
    public const BATCH = 50;

    // Bigger attachments are listed but not downloaded; open them in webmail.
    public const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

    public function __construct(private readonly MailboxClient $client) {}

    /** The account details the client needs. */
    public static function account(EmailSettings $settings): array
    {
        return [
            'host'       => $settings->imap_host,
            'port'       => $settings->imap_port ?: 993,
            'encryption' => $settings->imap_encryption ?: 'ssl',
            'username'   => $settings->imap_username,
            'password'   => (string) $settings->imap_password,
        ];
    }

    /**
     * Fetches new mail. Returns how many emails were stored. Connection problems are saved
     * on the settings (shown in the dashboard) and re-thrown.
     *
     * @return array{stored: int, skipped: int, more: bool}
     */
    public function sync(EmailSettings $settings, int $sinceDays = 30): array
    {
        // One sync at a time — the scheduler and a "Check now" click can overlap.
        $lock = Cache::lock('mailbox-sync', 300);
        if (! $lock->get()) {
            return ['stored' => 0, 'skipped' => 0, 'more' => false];
        }

        try {
            $this->client->connect(self::account($settings));
            $folder = $settings->imap_folder ?: 'INBOX';

            // A new UIDVALIDITY means the server renumbered the folder: start over by date
            // (duplicates are still caught by Message-ID).
            $validity = $this->client->uidValidity($folder);
            $lastUid = $validity !== null && $settings->imap_uidvalidity !== null && $validity !== $settings->imap_uidvalidity
                ? 0
                : (int) $settings->imap_last_uid;

            $stored = 0;
            $skipped = 0;
            $seen = 0;
            foreach ($this->client->fetch($folder, $lastUid, $sinceDays, self::BATCH) as $fetched) {
                $seen++;
                $this->store($fetched, $settings) ? $stored++ : $skipped++;
                $lastUid = max($lastUid, $fetched->uid);
            }

            $settings->update([
                'imap_uidvalidity' => $validity,
                'imap_last_uid'    => $lastUid,
                'imap_synced_at'   => now(),
                'imap_error'       => null,
            ]);

            return ['stored' => $stored, 'skipped' => $skipped, 'more' => $seen >= self::BATCH];
        } catch (Throwable $e) {
            $settings->update(['imap_error' => Str::limit($e->getMessage(), 1000), 'imap_synced_at' => now()]);
            throw $e;
        } finally {
            $this->client->disconnect();
            $lock->release();
        }
    }

    /** Saves one fetched email; false when it's skipped (already stored, or sent by this site). */
    public function store(FetchedEmail $fetched, EmailSettings $settings): bool
    {
        if ($fetched->sentByThisSite) {
            return false;
        }

        $messageId = $fetched->messageId
            ?: 'imap-'.($settings->imap_uidvalidity ?? 0).'-'.$fetched->uid.'@'.($settings->imap_host ?: 'mailbox');

        if (Email::where('message_id', $messageId)->exists()) {
            return false;
        }

        $parent = $this->findParent($fetched);

        $email = Email::create([
            'direction'          => 'inbound',
            'contact_message_id' => $parent?->contact_message_id,
            'thread_id'          => $parent?->thread_id ?? $parent?->id,
            'from_address'       => $fetched->from['address'] ?: 'unknown@unknown',
            'from_name'          => $fetched->from['name'],
            'reply_to_address'   => $fetched->replyTo && $fetched->replyTo !== $fetched->from['address'] ? $fetched->replyTo : null,
            'to'                 => $fetched->to,
            'cc'                 => $fetched->cc ?: null,
            'subject'            => Str::limit($fetched->subject, 250, ''),
            'body'               => $this->plainText($fetched),
            'body_html'          => $fetched->html ?: null,
            'attachments'        => $this->storeAttachments($fetched->attachments) ?: null,
            'message_id'         => Str::limit($messageId, 250, ''),
            'in_reply_to'        => $fetched->inReplyTo,
            'references'         => $fetched->references ? implode(' ', $fetched->references) : null,
            'status'             => 'received',
            'is_read'            => false,
            'imap_uid'           => $fetched->uid,
            'sent_at'            => $fetched->date ?? now(),
        ]);

        if (! $email->thread_id) {
            $email->update(['thread_id' => $email->id]);
        }

        // A visitor answered our reply: bring their contact message back to the top as unread.
        if ($email->contact_message_id) {
            ContactMessage::whereKey($email->contact_message_id)->update(['is_read' => false]);
        }

        return true;
    }

    /**
     * Saves a copy of an email sent from the dashboard to the mailbox's Sent folder, so it
     * also shows in webmail / Outlook. Best effort: a failure is logged, never shown as a send failure.
     */
    public function appendToSent(EmailSettings $settings, string $rawMessage): void
    {
        if (! $settings->imapReady() || ! $settings->imap_sent_folder) {
            return;
        }

        try {
            $this->client->connect(self::account($settings));
            $this->client->append($settings->imap_sent_folder, $rawMessage);
        } catch (Throwable $e) {
            Log::warning('Could not save a sent email to the mailbox Sent folder', ['exception' => $e->getMessage()]);
        } finally {
            $this->client->disconnect();
        }
    }

    /** Best guess at the mailbox's Sent folder, e.g. "INBOX.Sent" on cPanel. */
    public static function guessSentFolder(array $folders): ?string
    {
        foreach (['INBOX.Sent', 'Sent', 'INBOX/Sent', 'Sent Items', 'INBOX.Sent Items', 'Sent Messages'] as $name) {
            foreach ($folders as $folder) {
                if (strcasecmp($folder, $name) === 0) {
                    return $folder;
                }
            }
        }

        foreach ($folders as $folder) {
            if (preg_match('/(^|[.\/])sent/i', $folder)) {
                return $folder;
            }
        }

        return null;
    }

    /** The email it answers: the newest stored email whose Message-ID it references. */
    private function findParent(FetchedEmail $fetched): ?Email
    {
        $ids = array_values(array_unique(array_filter([$fetched->inReplyTo, ...$fetched->references])));

        return $ids ? Email::whereIn('message_id', $ids)->orderByDesc('id')->first() : null;
    }

    private function plainText(FetchedEmail $fetched): string
    {
        $text = trim((string) $fetched->text);
        if ($text === '' && $fetched->html) {
            $html = preg_replace('#<(style|script|head)[^>]*>.*?</\1>#is', '', $fetched->html);
            $html = preg_replace('#<(br|/p|/div|/tr|/h[1-6]|/li)\b[^>]*>#i', "\n", (string) $html);
            $text = trim(html_entity_decode(strip_tags((string) $html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $text = preg_replace("/\n{3,}/", "\n\n", $text);
        }

        return Str::limit($text, 200000, '');
    }

    /** @return array<int, array{name: string, path: ?string, size: int, mime: string, content_id: ?string, inline: bool}> */
    private function storeAttachments(array $attachments): array
    {
        return collect($attachments)->map(function (array $a) {
            $size = strlen($a['content']);
            $name = Str::limit(preg_replace('/[^\pL\pN._\- ]+/u', '_', $a['name']) ?: 'attachment', 150, '');
            $path = null;

            if ($size <= self::MAX_ATTACHMENT_BYTES) {
                $path = 'email-attachments/'.Str::uuid().'/'.$name;
                Storage::disk('local')->put($path, $a['content']);
            }

            return [
                'name'       => $name,
                'path'       => $path,
                'size'       => $size,
                'mime'       => $a['mime'],
                'content_id' => $a['content_id'],
                'inline'     => $a['inline'],
            ];
        })->all();
    }
}
