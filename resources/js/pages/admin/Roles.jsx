import AdminLayout from '@/components/admin/AdminLayout';
import PermissionPicker from '@/components/admin/PermissionPicker';
import { useApp } from '@/context/AppContext';
import {
    Check,
    Crown,
    Loader2,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
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

const EMPTY_FORM = { name: '', permissions: [] };

export default function AdminRoles() {
    const { user: me, refreshUser } = useApp();
    const [data, setData] = useState({ roles: [], groups: {} });
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [savedMsg, setSavedMsg] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        fetch('/spa/admin/roles', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                if (json) setData(json);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(load, []);

    // Permission name → its description, for the chips on each role card.
    const descriptions = useMemo(
        () =>
            Object.fromEntries(
                Object.values(data.groups).flatMap((g) =>
                    Object.entries(g.permissions),
                ),
            ),
        [data.groups],
    );
    const groupLabelOf = useMemo(
        () =>
            Object.fromEntries(
                Object.values(data.groups).flatMap((g) =>
                    Object.keys(g.permissions).map((p) => [p, g.label]),
                ),
            ),
        [data.groups],
    );

    const grantable = me?.is_super_admin ? null : (me?.permissions ?? []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
        setErrorMsg('');
    };

    const openEdit = (role) => {
        setEditingId(role.id);
        setForm({ name: role.name, permissions: role.permissions });
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
                    ? `/spa/admin/roles/${editingId}`
                    : '/spa/admin/roles',
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
                flash(editingId ? 'Role updated!' : 'Role created!');
                // Your own access may come from this role.
                refreshUser();
                closeForm();
                load();
            } else {
                setErrorMsg(firstError(json, 'Failed to save role.'));
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (role) => {
        const who = role.users_count
            ? ` ${role.users_count} user${role.users_count === 1 ? '' : 's'} will lose the access it gives.`
            : '';
        if (!confirm(`Delete the "${role.name}" role?${who}`)) return;
        setErrorMsg('');
        try {
            const res = await fetch(`/spa/admin/roles/${role.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': getCsrf(),
                    Accept: 'application/json',
                },
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                flash('Role deleted.');
                refreshUser();
                load();
            } else {
                setErrorMsg(firstError(json, 'Failed to delete role.'));
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        }
    };

    return (
        <AdminLayout
            title="Roles"
            actions={
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    <Plus size={15} />
                    Add Role
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
                            {editingId ? 'Edit Role' : 'New Role'}
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
                        <div className="sm:max-w-sm">
                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                Role Name
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                    }))
                                }
                                required
                                placeholder="e.g. Content Editor"
                                className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                            />
                        </div>

                        <div>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <label className="block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Permissions
                                </label>
                                <span className="text-xs text-[#5A6A9A]">
                                    {form.permissions.length} selected
                                </span>
                            </div>
                            <PermissionPicker
                                groups={data.groups}
                                value={form.permissions}
                                onChange={(p) =>
                                    setForm((f) => ({ ...f, permissions: p }))
                                }
                                grantable={grantable}
                            />
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
                            {saving ? 'Saving…' : 'Save Role'}
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
            ) : data.roles.length === 0 ? (
                <div className="py-24 text-center text-[#5A6A9A]">
                    <ShieldCheck
                        size={40}
                        className="mx-auto mb-3 opacity-30"
                    />
                    <p className="font-medium">No roles yet</p>
                    <p className="text-sm">
                        Click "Add Role" to bundle permissions together.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.roles.map((role) => (
                        <div
                            key={role.id}
                            className="rounded-2xl border border-[#D1D5E8] bg-white p-5"
                        >
                            <div className="flex flex-wrap items-start gap-4">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${
                                        role.is_super_admin
                                            ? 'bg-amber-500'
                                            : 'bg-[#213C93]'
                                    }`}
                                >
                                    {role.is_super_admin ? (
                                        <Crown size={20} />
                                    ) : (
                                        <ShieldCheck size={20} />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <h3 className="truncate font-bold text-[#0D1B4B]">
                                            {role.name}
                                        </h3>
                                        <span className="rounded-full bg-[#F1F1F0] px-2.5 py-0.5 text-xs font-semibold text-[#5A6A9A]">
                                            {role.users_count} user
                                            {role.users_count === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                    {role.is_super_admin ? (
                                        <p className="text-sm text-[#5A6A9A]">
                                            Full access to every section,
                                            including ones added later. This
                                            role can't be edited or deleted.
                                        </p>
                                    ) : role.permissions.length === 0 ? (
                                        <p className="text-sm text-[#5A6A9A]">
                                            No permissions yet.
                                        </p>
                                    ) : (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {role.permissions.map((p) => (
                                                <span
                                                    key={p}
                                                    title={descriptions[p] ?? p}
                                                    className="rounded-full bg-[#E8EAF6] px-2.5 py-0.5 text-xs font-semibold text-[#213C93]"
                                                >
                                                    {groupLabelOf[p] ?? p}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {!role.is_super_admin && (
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            onClick={() => openEdit(role)}
                                            title="Edit"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role)}
                                            title="Delete"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 size={15} />
                                        </button>
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
