<?php

namespace App\Console\Commands;

use App\Models\EmailSettings;
use App\Support\Mailbox\MailboxClient;
use App\Support\Mailbox\MailboxSync;
use Illuminate\Console\Command;
use Throwable;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Sets up RECEIVING email (IMAP) for the dashboard Inbox. Sending (SMTP) is not touched.
 *
 *   php artisan mail:imap-setup
 *   php artisan mail:imap-setup --host=moalloul.com --username=info@moalloul.com --same-password --no-interaction
 *   php artisan mail:imap-setup --disable
 */
class ImapSetupCommand extends Command
{
    protected $signature = 'mail:imap-setup
        {--host= : Incoming mail server, e.g. moalloul.com}
        {--port=993 : IMAP port (993 for SSL/TLS)}
        {--encryption=ssl : ssl, tls (STARTTLS) or none}
        {--username= : Mailbox login, e.g. info@moalloul.com}
        {--password= : Mailbox password (prompted when left out; avoid typing it on the command line)}
        {--same-password : Use the password already saved for sending (SMTP)}
        {--folder=INBOX : Folder to read new mail from}
        {--sent-folder= : Folder for copies of emails sent from the dashboard (detected when left out; "none" to turn off)}
        {--skip-test : Save without testing the connection}
        {--disable : Stop receiving email (keeps the other settings)}';

    protected $description = 'Set up receiving email (IMAP) for the dashboard Inbox — SMTP sending settings are left unchanged';

    public function handle(MailboxClient $client): int
    {
        $settings = EmailSettings::getCurrent();
        if (! $settings) {
            $this->error('Save the sending (SMTP) settings in the dashboard first: Email Settings.');

            return self::FAILURE;
        }

        if ($this->option('disable')) {
            $settings->update(['imap_enabled' => false]);
            $this->info('Receiving email is turned off.');

            return self::SUCCESS;
        }

        $interactive = $this->input->isInteractive();

        $host = $this->option('host')
            ?: ($interactive ? text('Incoming mail server (IMAP host)', default: $settings->imap_host ?: (string) $settings->host, required: true) : $settings->imap_host);
        $username = $this->option('username')
            ?: ($interactive ? text('Mailbox username', default: $settings->imap_username ?: (string) $settings->username, required: true) : $settings->imap_username);

        $password = $this->option('password');
        if (! $password && $this->option('same-password')) {
            $password = $settings->password;
        }
        if (! $password && $interactive) {
            $useSmtp = $settings->password && strcasecmp((string) $settings->username, (string) $username) === 0
                && confirm('Use the same password as the sending (SMTP) account?', default: true);
            $password = $useSmtp ? $settings->password : password('Mailbox password', required: true);
        }
        $password = $password ?: $settings->imap_password;

        if (! $host || ! $username || ! $password) {
            $this->error('Host, username and password are required (use --host, --username and --password or --same-password).');

            return self::FAILURE;
        }

        $account = [
            'host'       => $host,
            'port'       => (int) $this->option('port'),
            'encryption' => $this->option('encryption'),
            'username'   => $username,
            'password'   => $password,
        ];
        $folder = $this->option('folder') ?: 'INBOX';
        $sentFolder = $this->option('sent-folder');

        if (! $this->option('skip-test')) {
            $this->line("Connecting to {$host}:{$account['port']} as {$username}…");

            try {
                $client->connect($account);
                $folders = $client->folders();
                $messages = $client->count($folder);
                $client->disconnect();
            } catch (Throwable $e) {
                $client->disconnect();
                $this->error('Could not connect: '.$e->getMessage());
                $this->line('Nothing was saved. Check the host, port, username and password (cPanel → Email Accounts → Connect Devices).');

                return self::FAILURE;
            }

            if (! in_array($folder, $folders, true)) {
                $this->error("Folder \"{$folder}\" does not exist. Folders: ".implode(', ', $folders));

                return self::FAILURE;
            }

            $sentFolder ??= MailboxSync::guessSentFolder($folders);
            $this->info("Connected. {$folder} has {$messages} message(s).");
            $this->line('Folders: '.implode(', ', $folders));
        }

        if ($sentFolder === 'none') {
            $sentFolder = null;
        }

        $changedAccount = $settings->imap_host !== $host || $settings->imap_username !== $username || $settings->imap_folder !== $folder;

        $settings->update([
            'imap_enabled'     => true,
            'imap_host'        => $host,
            'imap_port'        => $account['port'],
            'imap_encryption'  => $account['encryption'],
            'imap_username'    => $username,
            'imap_password'    => $password,
            'imap_folder'      => $folder,
            'imap_sent_folder' => $sentFolder,
            'imap_error'       => null,
            // A different mailbox starts fresh (the last 30 days are imported on the first fetch).
            ...($changedAccount ? ['imap_last_uid' => 0, 'imap_uidvalidity' => null] : []),
        ]);

        $this->newLine();
        $this->table(['Setting', 'Value'], [
            ['Server', "{$host}:{$account['port']} ({$account['encryption']})"],
            ['Username', $username],
            ['Reads from', $folder],
            ['Saves sent copies to', $sentFolder ?: '— (off)'],
        ]);
        $this->info('Receiving email is on. SMTP (sending) settings were not changed.');
        $this->newLine();
        $this->line('Next:');
        $this->line('  1. Fetch now:  php artisan mail:fetch');
        $this->line('  2. Make sure the scheduler runs every minute (cPanel → Cron Jobs):');
        $this->line('     * * * * * cd '.base_path().' && php artisan schedule:run >> /dev/null 2>&1');

        return self::SUCCESS;
    }
}
