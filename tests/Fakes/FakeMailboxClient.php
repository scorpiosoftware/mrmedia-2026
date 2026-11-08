<?php

namespace Tests\Fakes;

use App\Support\Mailbox\FetchedEmail;
use App\Support\Mailbox\MailboxClient;
use RuntimeException;

/** In-memory mailbox for tests. */
class FakeMailboxClient implements MailboxClient
{
    /** @var array<int, FetchedEmail> */
    public array $messages = [];

    public array $folders = ['INBOX', 'INBOX.Sent', 'INBOX.Drafts', 'INBOX.spam'];

    public int $uidValidity = 1001;

    public ?string $failWith = null;

    public array $connectedWith = [];

    /** @var array<int, array{folder: string, raw: string}> */
    public array $appended = [];

    /** @var array<int, array{afterUid: int, sinceDays: int}> */
    public array $fetchCalls = [];

    public function connect(array $account): void
    {
        if ($this->failWith) {
            throw new RuntimeException($this->failWith);
        }
        $this->connectedWith = $account;
    }

    public function disconnect(): void {}

    public function folders(): array
    {
        return $this->folders;
    }

    public function uidValidity(string $folder): ?int
    {
        return $this->uidValidity;
    }

    public function count(string $folder): int
    {
        return count($this->messages);
    }

    public function fetch(string $folder, int $afterUid, int $sinceDays, int $limit): iterable
    {
        $this->fetchCalls[] = ['afterUid' => $afterUid, 'sinceDays' => $sinceDays];

        return array_slice(array_values(array_filter($this->messages, fn (FetchedEmail $m) => $m->uid > $afterUid)), 0, $limit);
    }

    public function append(string $folder, string $rawMessage): void
    {
        $this->appended[] = ['folder' => $folder, 'raw' => $rawMessage];
    }
}
