<?php

namespace App\Support\Mailbox;

use Carbon\CarbonInterface;

/**
 * One email read from the mailbox, independent of the IMAP library used to read it.
 */
final class FetchedEmail
{
    /**
     * @param  array<int, string>  $references  Message-IDs, without angle brackets
     * @param  array{address: string, name: ?string}  $from
     * @param  array<int, string>  $to
     * @param  array<int, string>  $cc
     * @param  array<int, array{name: string, mime: string, content: string, content_id: ?string, inline: bool}>  $attachments
     */
    public function __construct(
        public readonly int $uid,
        public readonly ?string $messageId,
        public readonly ?string $inReplyTo,
        public readonly array $references,
        public readonly array $from,
        public readonly ?string $replyTo,
        public readonly array $to,
        public readonly array $cc,
        public readonly string $subject,
        public readonly ?CarbonInterface $date,
        public readonly ?string $text,
        public readonly ?string $html,
        public readonly array $attachments = [],
        // Set on emails this site sent itself (contact form notifications, test emails), which are skipped.
        public readonly bool $sentByThisSite = false,
    ) {}
}
