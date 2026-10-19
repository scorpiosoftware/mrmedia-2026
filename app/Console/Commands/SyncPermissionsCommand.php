<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Console\Command;

/**
 * Brings the permission tables in line with config/permissions.php. Safe to re-run.
 */
class SyncPermissionsCommand extends Command
{
    protected $signature = 'permissions:sync
        {--super-admin=* : Email(s) of users to give the super admin role}';

    protected $description = 'Sync dashboard permissions and starter roles from config/permissions.php';

    public function handle(): int
    {
        $result = Permissions::sync();

        $this->line('Permissions created: '.($result['created'] ? implode(', ', $result['created']) : 'none'));
        $this->line('Permissions removed: '.($result['deleted'] ? implode(', ', $result['deleted']) : 'none'));
        $this->line('Roles created: '.($result['roles'] ? implode(', ', $result['roles']) : 'none'));

        foreach ($this->option('super-admin') as $email) {
            $user = User::where('email', $email)->first();
            if (! $user) {
                $this->error("No user with email {$email}.");

                return self::FAILURE;
            }
            $user->assignRole(Permissions::superAdminRole());
            $this->info("{$email} is now ".Permissions::superAdminRole().'.');
        }

        return self::SUCCESS;
    }
}
