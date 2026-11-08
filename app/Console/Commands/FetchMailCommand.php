<?php

namespace App\Console\Commands;

use App\Models\EmailSettings;
use App\Support\Mailbox\MailboxSync;
use Illuminate\Console\Command;
use Throwable;

/**
 * Pulls new emails from the mailbox into the dashboard Inbox. Scheduled every minute
 * (routes/console.php); safe to run by hand.
 */
class FetchMailCommand extends Command
{
    protected $signature = 'mail:fetch
        {--days=30 : On the first fetch, import mail from this many days back}
        {--all : Keep fetching until the mailbox is caught up (instead of one batch)}';

    protected $description = 'Fetch new emails from the mailbox (IMAP) into the dashboard Inbox';

    public function handle(MailboxSync $sync): int
    {
        $settings = EmailSettings::getCurrent();

        if (! $settings?->imapReady()) {
            $this->line('Receiving email is not set up. Run: php artisan mail:imap-setup');

            return self::SUCCESS;
        }

        $total = 0;
        try {
            do {
                $result = $sync->sync($settings->refresh(), (int) $this->option('days'));
                $total += $result['stored'];
            } while ($this->option('all') && $result['more']);
        } catch (Throwable $e) {
            $this->error('Fetching mail failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info("Fetched {$total} new email(s).".($result['more'] && ! $this->option('all') ? ' More are waiting — they come in on the next run (or use --all).' : ''));

        return self::SUCCESS;
    }
}
