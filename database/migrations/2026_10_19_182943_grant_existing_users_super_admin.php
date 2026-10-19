<?php

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

/**
 * Before roles existed every account could use the whole dashboard. Create the permissions
 * from config/permissions.php and make every existing account a super admin so nobody is
 * locked out; access can be narrowed from the Users page afterwards.
 */
return new class extends Migration
{
    public function up(): void
    {
        Permissions::sync();

        User::query()->each(fn (User $user) => $user->assignRole(Permissions::superAdminRole()));
    }

    public function down(): void
    {
        Role::where('name', Permissions::superAdminRole())->first()?->users()->detach();
    }
};
