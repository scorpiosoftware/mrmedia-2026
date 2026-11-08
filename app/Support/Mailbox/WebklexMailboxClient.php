<?php

namespace App\Support\Mailbox;

use Carbon\Carbon;
use RuntimeException;
use Throwable;
use Webklex\PHPIMAP\Client;
use Webklex\PHPIMAP\ClientManager;
use Webklex\PHPIMAP\Folder;
use Webklex\PHPIMAP\Message;

/**
 * IMAP access through webklex/php-imap (pure PHP — no imap extension needed).
 */
class WebklexMailboxClient implements MailboxClient
{
    private ?Client $client = null;

    public function connect(array $account): void
    {
        $encryption = match ($account['encryption'] ?? 'ssl') {
            'tls', 'starttls' => 'starttls',
            'none', '', null  => false,
            default           => 'ssl',
        };

        $this->client = (new ClientManager([
            'options' => [
                'fetch'       => \Webklex\PHPIMAP\IMAP::FT_PEEK, // never mark messages as read
                'sequence'    => \Webklex\PHPIMAP\IMAP::ST_UID,
                'fetch_body'  => true,
                'fetch_flags' => false,
                'soft_fail'   => true,  // one broken message must not stop the rest
                'rfc822'      => true,
                'fetch_order' => 'asc',
            ],
        ]))->make([
            'host'          => $account['host'],
            'port'          => $account['port'],
            'encryption'    => $encryption,
            'validate_cert' => true,
            'username'      => $account['username'],
            'password'      => $account['password'],
            'protocol'      => 'imap',
            'timeout'       => 30,
        ]);

        $this->client->connect();
    }

    public function disconnect(): void
    {
        try {
            $this->client?->disconnect();
        } catch (Throwable) {
            // already gone
        }
        $this->client = null;
    }

    public function folders(): array
    {
        return $this->client()->getFolders(false)
            ->map(fn (Folder $folder) => $folder->path)
            ->values()
            ->all();
    }

    public function uidValidity(string $folder): ?int
    {
        $status = $this->folder($folder)->examine();

        return isset($status['uidvalidity']) ? (int) $status['uidvalidity'] : null;
    }

    public function count(string $folder): int
    {
        $status = $this->folder($folder)->examine();

        return (int) ($status['exists'] ?? 0);
    }

    public function fetch(string $folder, int $afterUid, int $sinceDays, int $limit): iterable
    {
        $query = $this->folder($folder)->query()
            ->leaveUnread()
            ->setFetchBody(true)
            ->setFetchOrder('asc')
            ->limit($limit);

        $query = $afterUid > 0
            ? $query->whereUid(($afterUid + 1).':*')
            : $query->whereSince(Carbon::now()->subDays($sinceDays));

        foreach ($query->get() as $message) {
            $uid = (int) $message->getUid();
            // "N:*" always matches the newest message, even when it's older than N.
            if ($uid <= $afterUid) {
                continue;
            }

            yield $this->map($message, $uid);
        }
    }

    public function append(string $folder, string $rawMessage): void
    {
        $this->folder($folder)->appendMessage($rawMessage, ['\\Seen'], Carbon::now());
    }

    private function client(): Client
    {
        return $this->client ?? throw new RuntimeException('Not connected to the mailbox.');
    }

    private function folder(string $path): Folder
    {
        return $this->client()->getFolderByPath($path)
            ?? $this->client()->getFolder($path)
            ?? throw new RuntimeException("Mailbox folder \"{$path}\" was not found.");
    }

    private function map(Message $message, int $uid): FetchedEmail
    {
        $raw = (string) ($message->getHeader()?->raw ?? '');
        $headers = $this->rawHeaders($raw);

        $from = $this->addresses($message->getFrom())[0] ?? ['address' => '', 'name' => null];

        $attachments = [];
        foreach ($message->getAttachments() as $attachment) {
            $content = (string) $attachment->content;
            $contentId = $attachment->id ? trim((string) $attachment->id, '<> ') : null;
            $attachments[] = [
                'name'       => (string) ($attachment->name ?: 'attachment'),
                'mime'       => (string) ($attachment->content_type ?: 'application/octet-stream'),
                'content'    => $content,
                'content_id' => $contentId,
                'inline'     => $contentId !== null && strtolower((string) $attachment->disposition) !== 'attachment',
            ];
        }

        try {
            $date = $message->getDate()?->toDate();
        } catch (Throwable) {
            $date = null;
        }

        return new FetchedEmail(
            uid: $uid,
            messageId: $this->firstId($headers['message-id'] ?? null),
            inReplyTo: $this->firstId($headers['in-reply-to'] ?? null),
            references: $this->ids($headers['references'] ?? null),
            from: $from,
            replyTo: $this->addresses($message->getReplyTo())[0]['address'] ?? null,
            to: array_column($this->addresses($message->getTo()), 'address'),
            cc: array_column($this->addresses($message->getCc()), 'address'),
            subject: trim((string) $message->getSubject()) ?: '(no subject)',
            date: $date,
            text: $message->hasTextBody() ? (string) $message->getTextBody() : null,
            html: $message->hasHTMLBody() ? (string) $message->getHTMLBody() : null,
            attachments: $attachments,
            sentByThisSite: isset($headers['x-mrmedia-mail']),
        );
    }

    /** Unfolded raw header lines, keyed by lower-case name (first occurrence wins). */
    private function rawHeaders(string $raw): array
    {
        $headers = [];
        $unfolded = preg_replace("/\r?\n[ \t]+/", ' ', $raw);
        foreach (preg_split("/\r?\n/", (string) $unfolded) as $line) {
            if (preg_match('/^([A-Za-z0-9-]+):\s*(.*)$/', $line, $m)) {
                $headers[strtolower($m[1])] ??= trim($m[2]);
            }
        }

        return $headers;
    }

    /** @return array<int, string> */
    private function ids(?string $value): array
    {
        preg_match_all('/<([^<>\s]+)>/', (string) $value, $m);

        return $m[1];
    }

    private function firstId(?string $value): ?string
    {
        return $this->ids($value)[0] ?? (trim((string) $value, " <>") ?: null);
    }

    /** @return array<int, array{address: string, name: ?string}> */
    private function addresses($attribute): array
    {
        if (! $attribute) {
            return [];
        }

        $out = [];
        foreach ($attribute->toArray() as $address) {
            $mail = is_object($address) ? ($address->mail ?? null) : (string) $address;
            if ($mail && filter_var($mail, FILTER_VALIDATE_EMAIL)) {
                $name = is_object($address) ? ($address->personal ?? null) : null;
                $out[] = ['address' => strtolower($mail), 'name' => $name ? trim((string) $name, ' "') : null];
            }
        }

        return $out;
    }
}
