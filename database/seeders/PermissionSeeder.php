<?php

namespace Database\Seeders;

use App\Support\Permissions;
use Illuminate\Database\Seeder;

/** Creates the dashboard permissions and starter roles from config/permissions.php. */
class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        Permissions::sync();
    }
}
