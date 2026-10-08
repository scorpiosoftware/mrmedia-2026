import AdminLayout from '@/components/admin/AdminLayout';
import {
    getSocialIcon,
    getSocialLabel,
    SOCIAL_PLATFORM_OPTIONS,
} from '@/lib/social-platforms';
import {
    ArrowDown,
    ArrowUp,
    Check,
    Globe,
    Loader2,
    Pencil,
    Plus,
    Share2,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const EMPTY_FORM = {
    platform: SOCIAL_PLATFORM_OPTIONS[0].key,
    label: '',
    url: '',
    is_published: true,
};

export default function AdminSocialLinks() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [savedMsg, setSavedMsg] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadLinks = () => {
        setLoading(true);
        fetch('/spa/admin/social-links', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setLinks(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(loadLinks, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    };

    const openEdit = (link) => {
        setEditingId(link.id);
        setForm({
            platform: link.platform ?? SOCIAL_PLATFORM_OPTIONS[0].key,
            label: link.label ?? '',
            url: link.url ?? '',
            is_published: !!link.is_published,
        });
        setFormOpen(true);
    };

    const set = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const closeForm = () => {
        setFormOpen(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            const url = editingId
                ? `/spa/admin/social-links/${editingId}`
                : '/spa/admin/social-links';
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify(form),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setSavedMsg(editingId ? 'Link updated!' : 'Link created!');
                setTimeout(() => setSavedMsg(''), 3000);
                closeForm();
                loadLinks();
            } else {
                setErrorMsg(json?.message || 'Failed to save link.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (link) => {
        if (!confirm(`Delete "${link.label || getSocialLabel(link.platform)}"?`))
            return;
        try {
            const res = await fetch(`/spa/admin/social-links/${link.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': getCsrf(),
                    Accept: 'application/json',
                },
            });
            if (res.ok) loadLinks();
        } catch {
            setErrorMsg('Failed to delete link.');
        }
    };

    const togglePublished = async (link) => {
        try {
            const res = await fetch(`/spa/admin/social-links/${link.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({
                    platform: link.platform,
                    label: link.label,
                    url: link.url,
                    is_published: !link.is_published,
                }),
            });
            if (res.ok) loadLinks();
        } catch {
            setErrorMsg('Failed to update link.');
        }
    };

    const move = async (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= links.length) return;
        const reordered = [...links];
        [reordered[index], reordered[target]] = [
            reordered[target],
            reordered[index],
        ];
        setLinks(reordered);
        try {
            await fetch('/spa/admin/social-links/reorder', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ ids: reordered.map((l) => l.id) }),
            });
        } catch {
            setErrorMsg('Failed to reorder links.');
            loadLinks();
        }
    };

    return (
        <AdminLayout
            title="Social Media"
            actions={
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    <Plus size={15} />
                    Add Link
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
                            {editingId ? 'Edit Link' : 'New Link'}
                        </h2>
                        <button
                            type="button"
                            onClick={closeForm}
                            className="text-[#5A6A9A] hover:text-[#0D1B4B]"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-5 p-6">
                        <div>
                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                Platform
                            </label>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                                {SOCIAL_PLATFORM_OPTIONS.map(
                                    ({ key, label, Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            title={label}
                                            onClick={() => set('platform', key)}
                                            className={`flex aspect-square items-center justify-center rounded-xl border transition-colors ${
                                                form.platform === key
                                                    ? 'border-[#213C93] bg-[#213C93] text-white'
                                                    : 'border-[#D1D5E8] bg-[#F1F1F0] text-[#5A6A9A] hover:border-[#213C93]/50 hover:text-[#213C93]'
                                            }`}
                                        >
                                            <Icon size={18} />
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={(e) =>
                                        set('label', e.target.value)
                                    }
                                    placeholder={getSocialLabel(form.platform)}
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                                <p className="mt-1.5 text-xs text-[#5A6A9A]">
                                    Optional — used as the link's accessible
                                    name. Defaults to the platform name.
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    URL
                                </label>
                                <input
                                    type="url"
                                    dir="ltr"
                                    value={form.url}
                                    onChange={(e) => set('url', e.target.value)}
                                    required
                                    placeholder="https://instagram.com/mrmedia"
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                set('is_published', !form.is_published)
                            }
                            className={`inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                form.is_published
                                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                                    : 'border-[#D1D5E8] bg-[#F1F1F0] text-[#5A6A9A] hover:border-[#213C93]/40'
                            }`}
                        >
                            <span
                                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${form.is_published ? 'bg-green-500' : 'bg-[#D1D5E8]'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_published ? 'translate-x-4' : 'translate-x-0'}`}
                                />
                            </span>
                            {form.is_published
                                ? 'Published on site'
                                : 'Hidden from site'}
                        </button>
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
                            {saving ? 'Saving…' : 'Save Link'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 size={28} className="animate-spin text-[#213C93]" />
                </div>
            ) : links.length === 0 ? (
                <div className="py-24 text-center text-[#5A6A9A]">
                    <Share2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No social links yet</p>
                    <p className="text-sm">
                        Click "Add Link" to show your first profile in the
                        footer.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link, i) => {
                        const Icon = getSocialIcon(link.platform);
                        return (
                            <div
                                key={link.id}
                                className="rounded-2xl border border-[#D1D5E8] bg-white p-5"
                            >
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#213C93] text-white">
                                        <Icon size={20} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    link.is_published
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-[#F1F1F0] text-[#5A6A9A]'
                                                }`}
                                            >
                                                {link.is_published
                                                    ? 'Published'
                                                    : 'Hidden'}
                                            </span>
                                        </div>
                                        <h3 className="truncate font-bold text-[#0D1B4B]">
                                            {link.label ||
                                                getSocialLabel(link.platform)}
                                        </h3>
                                        <p
                                            dir="ltr"
                                            className="truncate text-xs text-[#5A6A9A]"
                                        >
                                            {link.url}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            onClick={() => move(i, -1)}
                                            disabled={i === 0}
                                            title="Move up"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                                        >
                                            <ArrowUp size={15} />
                                        </button>
                                        <button
                                            onClick={() => move(i, 1)}
                                            disabled={i === links.length - 1}
                                            title="Move down"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                                        >
                                            <ArrowDown size={15} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                togglePublished(link)
                                            }
                                            title={
                                                link.is_published
                                                    ? 'Hide from site'
                                                    : 'Publish to site'
                                            }
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Globe size={15} />
                                        </button>
                                        <button
                                            onClick={() => openEdit(link)}
                                            title="Edit"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link)}
                                            title="Delete"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </AdminLayout>
    );
}
