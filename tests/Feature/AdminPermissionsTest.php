<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPermissionsTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create()->assignRole(Permissions::superAdminRole());
    }

    public function test_config_permissions_are_synced_with_the_starter_roles(): void
    {
        foreach (Permissions::names() as $name) {
            $this->assertDatabaseHas('permissions', ['name' => $name, 'guard_name' => 'web']);
        }
        $this->assertTrue(Role::where('name', 'Editor')->first()->hasPermissionTo('projects.manage'));
    }

    public function test_sections_are_closed_without_their_permission(): void
    {
        $user = User::factory()->create()->givePermissionTo('projects.manage');

        $this->actingAs($user)->getJson('/spa/admin/projects')->assertOk();
        $this->actingAs($user)->getJson('/spa/admin/inbox')->assertForbidden();
        $this->actingAs($user)->getJson('/spa/admin/users')->assertForbidden();
        // Profile is open to every signed-in user.
        $this->actingAs($user)->getJson('/spa/admin/profile')->assertOk();
    }

    public function test_super_admin_passes_every_check_and_session_lists_all_permissions(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin)->getJson('/spa/admin/inbox')->assertOk();
        $this->actingAs($admin)->getJson('/spa/user')
            ->assertOk()
            ->assertJsonPath('is_super_admin', true)
            ->assertJsonCount(count(Permissions::names()), 'permissions');
    }

    public function test_role_permissions_apply_to_the_session(): void
    {
        $user = User::factory()->create()->assignRole('Editor');

        $this->actingAs($user)->getJson('/spa/user')
            ->assertJsonPath('roles', ['Editor'])
            ->assertJsonFragment(['content.manage']);
        $this->actingAs($user)->getJson('/spa/admin/content')->assertOk();
        $this->actingAs($user)->getJson('/spa/admin/email-settings')->assertForbidden();
    }

    public function test_admin_can_create_a_user_with_roles_and_permissions(): void
    {
        $this->actingAs($this->superAdmin())->postJson('/spa/admin/users', [
            'name' => 'Sara',
            'email' => 'sara@example.com',
            'password' => 'secret-pass-123',
            'password_confirmation' => 'secret-pass-123',
            'roles' => ['Support'],
            'permissions' => ['popup.manage'],
        ])->assertOk()->assertJsonPath('roles', ['Support']);

        $sara = User::where('email', 'sara@example.com')->first();
        $this->assertTrue($sara->hasRole('Support'));
        $this->assertTrue($sara->can('popup.manage'));
        $this->assertTrue($sara->can('inbox.manage'));
        $this->assertFalse($sara->can('users.manage'));
    }

    public function test_manager_cannot_grant_access_they_do_not_have(): void
    {
        $manager = User::factory()->create()->givePermissionTo('users.manage', 'inbox.manage');

        // Not a permission they hold.
        $this->actingAs($manager)->postJson('/spa/admin/users', [
            'name' => 'X', 'email' => 'x@example.com',
            'password' => 'secret-pass-123', 'password_confirmation' => 'secret-pass-123',
            'permissions' => ['site-settings.manage'],
        ])->assertUnprocessable();

        // The super admin role.
        $this->actingAs($manager)->postJson('/spa/admin/users', [
            'name' => 'Y', 'email' => 'y@example.com',
            'password' => 'secret-pass-123', 'password_confirmation' => 'secret-pass-123',
            'roles' => [Permissions::superAdminRole()],
        ])->assertUnprocessable();

        // Within their own access is fine.
        $this->actingAs($manager)->postJson('/spa/admin/users', [
            'name' => 'Z', 'email' => 'z@example.com',
            'password' => 'secret-pass-123', 'password_confirmation' => 'secret-pass-123',
            'permissions' => ['inbox.manage'],
        ])->assertOk();
    }

    public function test_manager_cannot_change_a_super_admin(): void
    {
        $manager = User::factory()->create()->givePermissionTo('users.manage');
        $admin = $this->superAdmin();

        $this->actingAs($manager)->deleteJson("/spa/admin/users/{$admin->id}")->assertForbidden();
    }

    public function test_last_super_admin_is_protected_and_nobody_deletes_themselves(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin)->deleteJson("/spa/admin/users/{$admin->id}")->assertUnprocessable();
        $this->actingAs($admin)->postJson("/spa/admin/users/{$admin->id}", [
            'name' => $admin->name, 'email' => $admin->email, 'roles' => [],
        ])->assertUnprocessable();
        $this->assertTrue($admin->fresh()->hasRole(Permissions::superAdminRole()));
    }

    public function test_roles_can_be_managed_but_the_super_admin_role_is_fixed(): void
    {
        $admin = $this->superAdmin();

        $id = $this->actingAs($admin)->postJson('/spa/admin/roles', [
            'name' => 'Marketing',
            'permissions' => ['popup.manage', 'marquee.manage'],
        ])->assertOk()->json('id');

        $this->actingAs($admin)->postJson("/spa/admin/roles/{$id}", [
            'name' => 'Marketing Team',
            'permissions' => ['popup.manage'],
        ])->assertOk()->assertJsonPath('permissions', ['popup.manage']);

        $super = Role::where('name', Permissions::superAdminRole())->first();
        $this->actingAs($admin)->deleteJson("/spa/admin/roles/{$super->id}")->assertUnprocessable();

        $this->actingAs($admin)->deleteJson("/spa/admin/roles/{$id}")->assertOk();
        $this->assertDatabaseMissing('roles', ['name' => 'Marketing Team']);
    }
}
