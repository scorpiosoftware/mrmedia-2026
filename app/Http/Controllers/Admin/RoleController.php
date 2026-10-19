<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

/**
 * Roles and the permissions they bundle. The super admin role is fixed (it passes every
 * check), and managers who aren't super admins can only add permissions they hold.
 */
class RoleController extends Controller
{
    /** GET /spa/admin/roles — roles with their permissions, plus the permission groups */
    public function index(): JsonResponse
    {
        $roles = Role::where('guard_name', Permissions::guard())
            ->with('permissions')->withCount('users')->orderBy('name')->get()
            ->map(fn (Role $role) => $this->present($role));

        return response()->json([
            'roles' => $roles,
            'groups' => Permissions::groups(),
        ]);
    }

    /** POST /spa/admin/roles */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateRole($request);
        $this->authorizeGrants($request, [], $data['permissions']);

        $role = Role::create(['name' => $data['name'], 'guard_name' => Permissions::guard()]);
        $role->syncPermissions($data['permissions']);

        return response()->json($this->present($role->load('permissions')->loadCount('users')));
    }

    /** POST /spa/admin/roles/{role} */
    public function update(Request $request, Role $role): JsonResponse
    {
        $this->guardSuperAdminRole($role);

        $data = $this->validateRole($request, $role);
        $this->authorizeGrants($request, $role->permissions->pluck('name')->all(), $data['permissions']);

        $role->update(['name' => $data['name']]);
        $role->syncPermissions($data['permissions']);

        return response()->json($this->present($role->load('permissions')->loadCount('users')));
    }

    /** DELETE /spa/admin/roles/{role} — users keep their other roles and direct permissions */
    public function destroy(Role $role): JsonResponse
    {
        $this->guardSuperAdminRole($role);

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    private function present(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name')->values(),
            'users_count' => $role->users_count ?? 0,
            'is_super_admin' => $role->name === Permissions::superAdminRole(),
        ];
    }

    private function validateRole(Request $request, ?Role $role = null): array
    {
        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::notIn([Permissions::superAdminRole()]),
                Rule::unique('roles', 'name')->where('guard_name', Permissions::guard())->ignore($role?->id),
            ],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(Permissions::names())],
        ]);

        $data['permissions'] = array_values(array_unique($data['permissions'] ?? []));

        return $data;
    }

    private function guardSuperAdminRole(Role $role): void
    {
        if ($role->name === Permissions::superAdminRole()) {
            abort(422, 'The '.Permissions::superAdminRole().' role always has every permission and can\'t be changed.');
        }
    }

    /** @param list<string> $current */
    private function authorizeGrants(Request $request, array $current, array $permissions): void
    {
        $actor = $request->user();
        if (Permissions::isSuperAdmin($actor)) {
            return;
        }

        $beyond = collect($permissions)->diff($current)->diff(Permissions::effectiveFor($actor))->values();
        if ($beyond->isNotEmpty()) {
            throw ValidationException::withMessages([
                'permissions' => "You can't grant access you don't have yourself: ".$beyond->implode(', ').'.',
            ]);
        }
    }
}
