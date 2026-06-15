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
        'whatsapp_number',
        'whatsapp_visible',
    ];

    public static function getCurrent(): ?self
    {
        return self::first();
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
