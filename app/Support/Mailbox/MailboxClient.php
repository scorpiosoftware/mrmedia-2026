<?php

namespace App\Support\Mailbox;

/**
 * Reads (and appends to) the site's mailbox. The real implementation talks IMAP
 * (WebklexMailboxClient); tests swap in a fake.
 */
interface MailboxClient
{
    /** @param  array{host: string, port: int, encryption: ?string, username: string, password: string}  $account */
    public function connect(array $account): void;

    public function disconnect(): void;

    /** @return array<int, string> every folder path, e.g. ["INBOX", "INBOX.Sent", "INBOX.spam"] */
    public function folders(): array;

    /** The folder's UIDVALIDITY — when it changes, previously seen UIDs no longer mean anything. */
    public function uidValidity(string $folder): ?int;

    /** Number of messages in the folder. */
    public function count(string $folder): int;

    /**
     * Oldest-first emails with a UID above `$afterUid` — or, when `$afterUid` is 0, those
     * received in the last `$sinceDays` days. At most `$limit`. Leaves them unread in the mailbox.
     *
     * @return iterable<FetchedEmail>
     */
    public function fetch(string $folder, int $afterUid, int $sinceDays, int $limit): iterable;

    /** Stores a raw RFC 822 message in the folder, marked as read (used for the Sent folder). */
    public function append(string $folder, string $rawMessage): void;
}
