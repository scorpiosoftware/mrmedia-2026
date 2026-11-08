<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class EmailSettings extends Model
{
    protected $fillable = [
        'driver',
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'from_address',
        'from_name',
        'to_address',
        'signature',
        'whatsapp_number',
        'whatsapp_visible',
        // Receiving (IMAP) — set with `php artisan mail:imap-setup`
        'imap_enabled',
        'imap_host',
        'imap_port',
        'imap_encryption',
        'imap_username',
        'imap_password',
        'imap_folder',
        'imap_sent_folder',
        'imap_uidvalidity',
        'imap_last_uid',
        'imap_synced_at',
        'imap_error',
    ];

    protected $hidden = ['password', 'imap_password'];

    protected $casts = [
        'imap_enabled'     => 'boolean',
        'imap_port'        => 'integer',
        'imap_uidvalidity' => 'integer',
        'imap_last_uid'    => 'integer',
        'imap_synced_at'   => 'datetime',
    ];

    public static function getCurrent(): ?self
    {
        return self::first();
    }

    public function setImapPasswordAttribute(?string $value): void
    {
        $this->attributes['imap_password'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getImapPasswordAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    /** Receiving is switched on and has everything it needs to connect. */
    public function imapReady(): bool
    {
        return $this->imap_enabled && $this->imap_host && $this->imap_username && $this->imap_password;
    }

    /** What the dashboard shows about receiving (never the password). */
    public function imapStatus(): array
    {
        return [
            'enabled'     => $this->imapReady(),
            'username'    => $this->imap_username,
            'sent_folder' => $this->imap_sent_folder,
            'synced_at'   => $this->imap_synced_at?->toIso8601String(),
            'error'       => $this->imap_error,
        ];
    }

    public function setPasswordAttribute(?string $value): void
    {
        $this->attributes['password'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getPasswordAttribute(?string $value): ?string
    {
        if (! $value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    public function applyToMailer(): void
    {
        config([
            'mail.default'                          => $this->driver,
            'mail.mailers.smtp.host'                => $this->host,
            'mail.mailers.smtp.port'                => $this->port,
            'mail.mailers.smtp.username'            => $this->username,
            'mail.mailers.smtp.password'            => $this->password,
            'mail.mailers.smtp.encryption'          => $this->encryption,
            'mail.from.address'                     => $this->from_address,
            'mail.from.name'                        => $this->from_name,
        ]);
    }
}
