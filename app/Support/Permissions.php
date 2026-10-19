<?php

namespace App\Support;

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Reads the dashboard permission catalogue from config/permissions.php and keeps the
 * spatie permission/role tables in step with it.
 */
class Permissions
{
    public static function guard(): string
    {
        return config('permissions.guard', 'web');
    }

    public static function superAdminRole(): string
    {
        return config('permissions.super_admin_role', 'Super Admin');
    }

    /** @return array<string, array{label: string, permissions: array<string, string>}> */
    public static function groups(): array
    {
        return config('permissions.groups', []);
    }

    /** @return list<string> every permission name defined in the config */
    public static function names(): array
    {
        return collect(self::groups())
            ->flatMap(fn (array $group) => array_keys($group['permissions']))
            ->values()
            ->all();
    }

    public static function isSuperAdmin(?User $user): bool
    {
        return (bool) $user?->hasRole(self::superAdminRole());
    }

    /**
     * Permission names a user effectively holds (super admins hold all of them).
     *
     * @return list<string>
     */
    public static function effectiveFor(User $user): array
    {
        return self::isSuperAdmin($user)
            ? self::names()
            : $user->getAllPermissions()->pluck('name')->intersect(self::names())->values()->all();
    }

    /**
     * The signed-in user as the admin SPA sees it — what it needs to show/hide sections.
     *
     * @return array<string, mixed>
     */
    public static function sessionPayload(User $user): array
    {
        return [
            ...$user->only('id', 'name', 'email'),
            'roles' => $user->getRoleNames()->values()->all(),
            'permissions' => self::effectiveFor($user),
            'is_super_admin' => self::isSuperAdmin($user),
        ];
    }

    /**
     * Creates missing permissions, deletes ones no longer in the config, and creates the
     * super admin role plus any missing starter roles. Existing roles keep their permissions.
     *
     * @return array{created: list<string>, deleted: list<string>, roles: list<string>}
     */
    public static function sync(): array
    {
        $guard = self::guard();
        $names = self::names();

        $created = [];
        foreach ($names as $name) {
            $permission = Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
            if ($permission->wasRecentlyCreated) {
                $created[] = $name;
            }
        }

        $stale = Permission::where('guard_name', $guard)->whereNotIn('name', $names)->get();
        $deleted = $stale->pluck('name')->all();
        $stale->each->delete();

        $roles = [];
        $super = Role::firstOrCreate(['name' => self::superAdminRole(), 'guard_name' => $guard]);
        if ($super->wasRecentlyCreated) {
            $roles[] = $super->name;
        }

        foreach (config('permissions.roles', []) as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => $guard]);
            if ($role->wasRecentlyCreated) {
                $role->syncPermissions(array_values(array_intersect($rolePermissions, $names)));
                $roles[] = $roleName;
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return ['created' => $created, 'deleted' => $deleted, 'roles' => $roles];
    }
}
