<?php

namespace Database\Seeders;

use App\Models\User;
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
            User::query()->firstOrCreate(
                ['email' => $user['email']],
                [
                    'name'              => $user['name'],
                    'password'          => Hash::make($user['password']),
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
