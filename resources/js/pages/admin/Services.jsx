import AdminLayout from '@/components/admin/AdminLayout';
import { getServiceIcon, SERVICE_ICON_OPTIONS } from '@/lib/service-icons';
import {
    ArrowDown,
    ArrowUp,
    Check,
    Globe,
    Loader2,
    Pencil,
    Plus,
    Sparkles,
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
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    icon: SERVICE_ICON_OPTIONS[0].key,
    is_published: true,
};

export default function AdminServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [savedMsg, setSavedMsg] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadServices = () => {
        setLoading(true);
        fetch('/spa/admin/services', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setServices(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(loadServices, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    };

    const openEdit = (service) => {
        setEditingId(service.id);
        setForm({
            title: service.title ?? '',
            title_ar: service.title_ar ?? '',
            description: service.description ?? '',
            description_ar: service.description_ar ?? '',
            icon: service.icon ?? SERVICE_ICON_OPTIONS[0].key,
            is_published: !!service.is_published,
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
                ? `/spa/admin/services/${editingId}`
                : '/spa/admin/services';
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
                setSavedMsg(
                    editingId ? 'Service updated!' : 'Service created!',
                );
                setTimeout(() => setSavedMsg(''), 3000);
                closeForm();
                loadServices();
            } else {
                setErrorMsg(json?.message || 'Failed to save service.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (service) => {
        if (!confirm(`Delete "${service.title}"?`)) return;
        try {
            const res = await fetch(`/spa/admin/services/${service.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': getCsrf(),
                    Accept: 'application/json',
                },
            });
            if (res.ok) loadServices();
        } catch {
            setErrorMsg('Failed to delete service.');
        }
    };

    const togglePublished = async (service) => {
        try {
            const res = await fetch(`/spa/admin/services/${service.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({
                    title: service.title,
                    title_ar: service.title_ar,
                    description: service.description,
                    description_ar: service.description_ar,
                    icon: service.icon,
                    is_published: !service.is_published,
                }),
            });
            if (res.ok) loadServices();
        } catch {
            setErrorMsg('Failed to update service.');
        }
    };

    const move = async (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= services.length) return;
        const reordered = [...services];
        [reordered[index], reordered[target]] = [
            reordered[target],
            reordered[index],
        ];
        setServices(reordered);
        try {
            await fetch('/spa/admin/services/reorder', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
            });
        } catch {
            setErrorMsg('Failed to reorder services.');
            loadServices();
        }
    };

    return (
        <AdminLayout
            title="Services"
            actions={
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    <Plus size={15} />
                    Add Service
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
                            {editingId ? 'Edit Service' : 'New Service'}
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
                                Title
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                        🇬🇧 English
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) =>
                                            set('title', e.target.value)
                                        }
                                        required
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                        🇸🇦 Arabic
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={form.title_ar}
                                        onChange={(e) =>
                                            set('title_ar', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                Description
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        set('description', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="English description"
                                    className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                                <textarea
                                    dir="rtl"
                                    value={form.description_ar}
                                    onChange={(e) =>
                                        set('description_ar', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="الوصف بالعربية"
                                    className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                Icon
                            </label>
                            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                                {SERVICE_ICON_OPTIONS.map(
                                    ({ key, label, Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            title={label}
                                            onClick={() => set('icon', key)}
                                            className={`flex aspect-square items-center justify-center rounded-xl border transition-colors ${
                                                form.icon === key
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
                            {saving ? 'Saving…' : 'Save Service'}
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
            ) : services.length === 0 ? (
                <div className="py-24 text-center text-[#5A6A9A]">
                    <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No services yet</p>
                    <p className="text-sm">
                        Click "Add Service" to list your first offering.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map((service, i) => {
                        const Icon = getServiceIcon(service.icon);
                        return (
                            <div
                                key={service.id}
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
                                                    service.is_published
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-[#F1F1F0] text-[#5A6A9A]'
                                                }`}
                                            >
                                                {service.is_published
                                                    ? 'Published'
                                                    : 'Hidden'}
                                            </span>
                                        </div>
                                        <h3 className="truncate font-bold text-[#0D1B4B]">
                                            {service.title}
                                        </h3>
                                        {service.description && (
                                            <p className="truncate text-xs text-[#5A6A9A]">
                                                {service.description}
                                            </p>
                                        )}
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
                                            disabled={i === services.length - 1}
                                            title="Move down"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                                        >
                                            <ArrowDown size={15} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                togglePublished(service)
                                            }
                                            title={
                                                service.is_published
                                                    ? 'Hide from site'
                                                    : 'Publish to site'
                                            }
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Globe size={15} />
                                        </button>
                                        <button
                                            onClick={() => openEdit(service)}
                                            title="Edit"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(service)
                                            }
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
