import AdminLayout from '@/components/admin/AdminLayout';
import PermissionPicker from '@/components/admin/PermissionPicker';
import { useApp } from '@/context/AppContext';
import {
    Check,
    Crown,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Users as UsersIcon,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

function firstError(json, fallback) {
    const first = json?.errors ? Object.values(json.errors)[0]?.[0] : null;
    return first || json?.message || fallback;
}

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [],
    permissions: [],
};

const INPUT_CLASS =
    'w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none';
const LABEL_CLASS =
    'mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase';

export default function AdminUsers() {
    const { user: me, refreshUser } = useApp();
    const [data, setData] = useState({
        users: [],
        roles: [],
        groups: {},
        super_admin_role: 'Super Admin',
    });
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [savedMsg, setSavedMsg] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        fetch('/spa/admin/users', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                if (json) setData(json);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(load, []);

    const superRole = data.super_admin_role;
    // Managers who aren't super admins can only hand out what they hold themselves.
    const grantable = me?.is_super_admin ? null : (me?.permissions ?? []);
    const assignableRoles = data.roles.filter(
        (r) => me?.is_super_admin || r.name !== superRole,
    );

    // Permissions the selected roles already give — shown locked in the picker.
    const viaRoles = useMemo(
        () =>
            data.roles
                .filter((r) => form.roles.includes(r.name))
                .flatMap((r) => r.permissions),
        [data.roles, form.roles],
    );
    const formIsSuperAdmin = form.roles.includes(superRole);

    const set = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const toggleRole = (name) =>
        set(
            'roles',
            form.roles.includes(name)
                ? form.roles.filter((r) => r !== name)
                : [...form.roles, name],
        );

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
        setErrorMsg('');
    };

    const openEdit = (u) => {
        setEditingId(u.id);
        setForm({
            ...EMPTY_FORM,
            name: u.name,
            email: u.email,
            roles: u.roles,
            permissions: u.permissions,
        });
        setFormOpen(true);
        setErrorMsg('');
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const flash = (msg) => {
        setSavedMsg(msg);
        setTimeout(() => setSavedMsg(''), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch(
                editingId
                    ? `/spa/admin/users/${editingId}`
                    : '/spa/admin/users',
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrf(),
                    },
                    body: JSON.stringify(form),
                },
            );
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                flash(editingId ? 'User updated!' : 'User created!');
                // Editing yourself can change what you're allowed to see.
                if (editingId === me?.id) refreshUser();
                closeForm();
                load();
            } else {
                setErrorMsg(firstError(json, 'Failed to save user.'));
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (u) => {
        if (
            !confirm(
                `Delete ${u.name} (${u.email})? They will no longer be able to sign in.`,
            )
        )
            return;
        setErrorMsg('');
        try {
            const res = await fetch(`/spa/admin/users/${u.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': getCsrf(),
                    Accept: 'application/json',
                },
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                flash('User deleted.');
                load();
            } else {
                setErrorMsg(firstError(json, 'Failed to delete user.'));
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        }
    };

    // Only a super admin may change a super admin's account (the API enforces it too).
    const canEdit = (u) => me?.is_super_admin || !u.is_super_admin;

    return (
        <AdminLayout
            title="Users"
            actions={
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    <Plus size={15} />
                    Add User
                </button>
            }
        >
            {errorMsg && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMsg}
                </div>
            )}
            {savedMsg && (
                <div className="mb-6 flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <Check size={14} /> {savedMsg}
                </div>
            )}

            {formOpen && (
                <form
                    onSubmit={handleSave}
                    className="mb-8 overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white"
                >
                    <div className="flex items-center justify-between border-b border-[#E8EAF6] px-6 py-5">
                        <h2 className="font-bold text-[#0D1B4B]">
                            {editingId ? 'Edit User' : 'New User'}
                        </h2>
                        <button
                            type="button"
                            onClick={closeForm}
                            className="text-[#5A6A9A] hover:text-[#0D1B4B]"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-6 p-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className={LABEL_CLASS}>Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        set('name', e.target.value)
                                    }
                                    required
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Email</label>
                                <input
                                    type="email"
                                    dir="ltr"
                                    value={form.email}
                                    onChange={(e) =>
                                        set('email', e.target.value)
                                    }
                                    required
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) =>
                                        set('password', e.target.value)
                                    }
                                    required={!editingId}
                                    autoComplete="new-password"
                                    placeholder={
                                        editingId
                                            ? 'Leave blank to keep the current password'
                                            : ''
                                    }
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={(e) =>
                                        set(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    required={
                                        !editingId || form.password !== ''
                                    }
                                    autoComplete="new-password"
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={LABEL_CLASS}>Roles</label>
                            {assignableRoles.length === 0 ? (
                                <p className="text-sm text-[#5A6A9A]">
                                    No roles yet — create one on the Roles page.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {assignableRoles.map((r) => {
                                        const on = form.roles.includes(r.name);
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() =>
                                                    toggleRole(r.name)
                                                }
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                                                    on
                                                        ? 'border-[#213C93] bg-[#213C93] text-white'
                                                        : 'border-[#D1D5E8] bg-[#F1F1F0] text-[#5A6A9A] hover:border-[#213C93]/50 hover:text-[#213C93]'
                                                }`}
                                            >
                                                {r.name === superRole && (
                                                    <Crown size={13} />
                                                )}
                                                {on && r.name !== superRole && (
                                                    <Check size={13} />
                                                )}
                                                {r.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={LABEL_CLASS}>
                                Extra Permissions
                            </label>
                            {formIsSuperAdmin ? (
                                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {superRole} has access to every section — no
                                    extra permissions needed.
                                </p>
                            ) : (
                                <>
                                    <p className="mb-3 text-xs text-[#5A6A9A]">
                                        Granted directly to this user, on top of
                                        their roles.
                                    </p>
                                    <PermissionPicker
                                        groups={data.groups}
                                        value={form.permissions}
                                        onChange={(p) => set('permissions', p)}
                                        inherited={viaRoles}
                                        grantable={grantable}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-[#E8EAF6] px-6 py-4">
                        <button
                            type="button"
                            onClick={closeForm}
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9] disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <Check size={15} />
                            )}
                            {saving ? 'Saving…' : 'Save User'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2
                        size={28}
                        className="animate-spin text-[#213C93]"
                    />
                </div>
            ) : data.users.length === 0 ? (
                <div className="py-24 text-center text-[#5A6A9A]">
                    <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No users yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.users.map((u) => (
                        <div
                            key={u.id}
                            className="rounded-2xl border border-[#D1D5E8] bg-white p-5"
                        >
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#213C93] text-lg font-bold text-white uppercase">
                                    {u.name.charAt(0)}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <h3 className="truncate font-bold text-[#0D1B4B]">
                                            {u.name}
                                        </h3>
                                        {u.id === me?.id && (
                                            <span className="rounded-full bg-[#213C93]/10 px-2 py-0.5 text-xs font-semibold text-[#213C93]">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        dir="ltr"
                                        className="truncate text-xs text-[#5A6A9A]"
                                    >
                                        {u.email}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {u.roles.map((r) => (
                                            <span
                                                key={r}
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    r === superRole
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-[#E8EAF6] text-[#213C93]'
                                                }`}
                                            >
                                                {r === superRole && (
                                                    <Crown size={11} />
                                                )}
                                                {r}
                                            </span>
                                        ))}
                                        {u.permissions.length > 0 && (
                                            <span className="rounded-full bg-[#F1F1F0] px-2.5 py-0.5 text-xs font-semibold text-[#5A6A9A]">
                                                +{u.permissions.length} extra
                                                permission
                                                {u.permissions.length === 1
                                                    ? ''
                                                    : 's'}
                                            </span>
                                        )}
                                        {u.roles.length === 0 &&
                                            u.permissions.length === 0 && (
                                                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                                                    No access
                                                </span>
                                            )}
                                    </div>
                                </div>

                                {canEdit(u) && (
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            onClick={() => openEdit(u)}
                                            title="Edit"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        {u.id !== me?.id && (
                                            <button
                                                onClick={() => handleDelete(u)}
                                                title="Delete"
                                                className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
