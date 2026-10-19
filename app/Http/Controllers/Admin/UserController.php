<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

/**
 * Dashboard users and what they can access. Guard rails: only a super admin can grant the
 * super admin role or touch a super admin's account, other managers can only grant access
 * they hold themselves, nobody can delete themselves, and the last super admin can't be removed.
 */
class UserController extends Controller
{
    use PasswordValidationRules;

    /** GET /spa/admin/users — users, plus the roles and permission groups to pick from */
    public function index(): JsonResponse
    {
        $users = User::with('roles', 'permissions')->orderBy('name')->get()
            ->map(fn (User $user) => $this->present($user));

        return response()->json([
            'users' => $users,
            'roles' => Role::where('guard_name', Permissions::guard())->with('permissions')->orderBy('name')->get()
                ->map(fn (Role $role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name')->values(),
                ]),
            'groups' => Permissions::groups(),
            'super_admin_role' => Permissions::superAdminRole(),
        ]);
    }

    /** POST /spa/admin/users */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateUser($request);

        $this->authorizeGrants($request->user(), new User, $data['roles'], $data['permissions']);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'email_verified_at' => now(),
        ]);
        $user->syncRoles($data['roles']);
        $user->syncPermissions($data['permissions']);

        return response()->json($this->present($user->fresh(['roles', 'permissions'])));
    }

    /** POST /spa/admin/users/{user} — password is optional; blank keeps the current one */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->guardSuperAdminTarget($request->user(), $user);

        $data = $this->validateUser($request, $user);

        $this->authorizeGrants($request->user(), $user, $data['roles'], $data['permissions']);

        if (Permissions::isSuperAdmin($user)
            && ! in_array(Permissions::superAdminRole(), $data['roles'], true)
            && $this->superAdminCount() <= 1) {
            throw ValidationException::withMessages([
                'roles' => 'This is the only '.Permissions::superAdminRole().' — give the role to someone else first.',
            ]);
        }

        $user->fill(['name' => $data['name'], 'email' => $data['email']]);
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();
        $user->syncRoles($data['roles']);
        $user->syncPermissions($data['permissions']);

        return response()->json($this->present($user->fresh(['roles', 'permissions'])));
    }

    /** DELETE /spa/admin/users/{user} */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json(['message' => "You can't delete your own account."], 422);
        }

        $this->guardSuperAdminTarget($request->user(), $user);

        if (Permissions::isSuperAdmin($user) && $this->superAdminCount() <= 1) {
            return response()->json(['message' => "You can't delete the only ".Permissions::superAdminRole().'.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    private function present(User $user): array
    {
        return [
            ...$user->only('id', 'name', 'email', 'created_at'),
            'roles' => $user->roles->pluck('name')->values(),
            'permissions' => $user->permissions->pluck('name')->values(),
            'is_super_admin' => Permissions::isSuperAdmin($user),
        ];
    }

    private function validateUser(Request $request, ?User $user = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => $user
                ? ['nullable', 'string', Password::default(), 'confirmed']
                : $this->passwordRules(),
            'roles' => ['array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', Permissions::guard())],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(Permissions::names())],
        ]);

        $data['roles'] = array_values(array_unique($data['roles'] ?? []));
        $data['permissions'] = array_values(array_unique($data['permissions'] ?? []));

        return $data;
    }

    /** Only a super admin may edit or delete a super admin's account. */
    private function guardSuperAdminTarget(User $actor, User $target): void
    {
        if (Permissions::isSuperAdmin($target) && ! Permissions::isSuperAdmin($actor)) {
            abort(403, 'Only a '.Permissions::superAdminRole().' can change this account.');
        }
    }

    /**
     * A manager who isn't a super admin can't hand out more than they have: newly added
     * roles and permissions must be within their own permissions, and never the super admin role.
     */
    private function authorizeGrants(User $actor, User $target, array $roles, array $permissions): void
    {
        if (Permissions::isSuperAdmin($actor)) {
            return;
        }

        $own = Permissions::effectiveFor($actor);
        $addedRoles = array_diff($roles, $target->exists ? $target->getRoleNames()->all() : []);
        $addedPermissions = array_diff($permissions, $target->exists ? $target->getPermissionNames()->all() : []);

        if (in_array(Permissions::superAdminRole(), $addedRoles, true)) {
            throw ValidationException::withMessages(['roles' => 'Only a '.Permissions::superAdminRole().' can grant that role.']);
        }

        $rolePermissions = Role::whereIn('name', $addedRoles)->with('permissions')->get()
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'));

        $beyond = collect($addedPermissions)->merge($rolePermissions)->diff($own)->unique()->values();
        if ($beyond->isNotEmpty()) {
            throw ValidationException::withMessages([
                'permissions' => "You can't grant access you don't have yourself: ".$beyond->implode(', ').'.',
            ]);
        }
    }

    private function superAdminCount(): int
    {
        return User::role(Permissions::superAdminRole())->count();
    }
}
