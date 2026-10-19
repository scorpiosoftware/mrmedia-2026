<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['email' => 'admin@mrmedia.com',      'name' => 'Admin User', 'password' => 'password'],
            ['email' => 'admin@scorpiosoft.tech', 'name' => 'Admin User', 'password' => '123456789'],
        ];

        foreach ($users as $user) {
            // firstOrCreate, not updateOrCreate: once an account exists, re-seeding
            // must never reset a password someone has since changed (e.g. via the
            // admin Profile page).
            $account = User::query()->firstOrCreate(
                ['email' => $user['email']],
                [
                    'name'              => $user['name'],
                    'password'          => Hash::make($user['password']),
                    'email_verified_at' => now(),
                ],
            );

            // The seeded accounts are the site owners — give them full access unless
            // someone has already assigned them a role.
            if ($account->roles()->doesntExist()) {
                $account->assignRole(Permissions::superAdminRole());
            }
        }
    }
}
