<?php

use App\Support\Permissions;
use Illuminate\Database\Migrations\Migration;

/** Creates the statistics.view permission added to config/permissions.php. */
return new class extends Migration
{
    public function up(): void
    {
        Permissions::sync();
    }

    public function down(): void
    {
        // Permissions::sync() removes permissions that are no longer in the config.
    }
};
