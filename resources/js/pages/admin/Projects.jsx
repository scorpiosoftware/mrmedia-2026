import AdminLayout from '@/components/admin/AdminLayout';
import {
    ArrowDown,
    ArrowUp,
    Check,
    ExternalLink,
    Globe,
    Image as ImageIcon,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Upload,
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

const CATEGORIES = [
    { value: 'brand', label: 'Brand' },
    { value: 'digital', label: 'Digital' },
    { value: 'media', label: 'Media' },
];

const COLOR_SWATCHES = [
    '#213C93',
    '#2E52C9',
    '#192E74',
    '#DDB50E',
    '#FCD532',
    '#0D1B4B',
];

const EMPTY_FORM = {
    title: '',
    title_ar: '',
    category: 'brand',
    client: '',
    client_ar: '',
    description: '',
    description_ar: '',
    external_url: '',
    image_url: '',
    color: COLOR_SWATCHES[0],
    is_published: true,
};

export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [savedMsg, setSavedMsg] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const loadProjects = () => {
        setLoading(true);
        fetch('/spa/admin/projects', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setProjects(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(loadProjects, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    };

    const openEdit = (project) => {
        setEditingId(project.id);
        setForm({
            title: project.title ?? '',
            title_ar: project.title_ar ?? '',
            category: project.category ?? 'brand',
            client: project.client ?? '',
            client_ar: project.client_ar ?? '',
            description: project.description ?? '',
            description_ar: project.description_ar ?? '',
            external_url: project.external_url ?? '',
            image_url: project.image_url ?? '',
            color: project.color ?? COLOR_SWATCHES[0],
            is_published: !!project.is_published,
        });
        setFormOpen(true);
    };

    const set = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const closeForm = () => {
        setFormOpen(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setUploadError('');
    };

    const handleImageUpload = async (file) => {
        if (!file) return;
        setUploadError('');

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setUploadError('Only JPG, PNG or WebP images are allowed.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setUploadError('Image must be 2MB or smaller.');
            return;
        }

        setUploading(true);
        try {
            const body = new FormData();
            body.append('image', file);
            const res = await fetch('/spa/admin/projects/upload-image', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body,
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                set('image_url', json.url);
            } else {
                setUploadError(json?.message || 'Upload failed.');
            }
        } catch {
            setUploadError('Network error during upload.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            const url = editingId
                ? `/spa/admin/projects/${editingId}`
                : '/spa/admin/projects';
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
                    editingId ? 'Project updated!' : 'Project created!',
                );
                setTimeout(() => setSavedMsg(''), 3000);
                closeForm();
                loadProjects();
            } else {
                setErrorMsg(json?.message || 'Failed to save project.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (project) => {
        if (!confirm(`Delete "${project.title}"?`)) return;
        try {
            const res = await fetch(`/spa/admin/projects/${project.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': getCsrf(),
                    Accept: 'application/json',
                },
            });
            if (res.ok) loadProjects();
        } catch {
            setErrorMsg('Failed to delete project.');
        }
    };

    const togglePublished = async (project) => {
        try {
            const res = await fetch(`/spa/admin/projects/${project.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({
                    title: project.title,
                    title_ar: project.title_ar,
                    category: project.category,
                    client: project.client,
                    client_ar: project.client_ar,
                    description: project.description,
                    description_ar: project.description_ar,
                    external_url: project.external_url,
                    image_url: project.image_url,
                    color: project.color,
                    is_published: !project.is_published,
                }),
            });
            if (res.ok) loadProjects();
        } catch {
            setErrorMsg('Failed to update project.');
        }
    };

    const move = async (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= projects.length) return;
        const reordered = [...projects];
        [reordered[index], reordered[target]] = [
            reordered[target],
            reordered[index],
        ];
        setProjects(reordered);
        try {
            await fetch('/spa/admin/projects/reorder', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
            });
        } catch {
            setErrorMsg('Failed to reorder projects.');
            loadProjects();
        }
    };

    return (
        <AdminLayout
            title="Projects"
            actions={
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    <Plus size={15} />
                    Add Project
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
                            {editingId ? 'Edit Project' : 'New Project'}
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Category
                                </label>
                                <select
                                    value={form.category}
                                    onChange={(e) =>
                                        set('category', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    External Link (optional)
                                </label>
                                <input
                                    type="url"
                                    value={form.external_url}
                                    onChange={(e) =>
                                        set('external_url', e.target.value)
                                    }
                                    placeholder="https://..."
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                Client
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    type="text"
                                    value={form.client}
                                    onChange={(e) =>
                                        set('client', e.target.value)
                                    }
                                    placeholder="Client name (English)"
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={form.client_ar}
                                    onChange={(e) =>
                                        set('client_ar', e.target.value)
                                    }
                                    placeholder="اسم العميل"
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                Project Image (optional)
                            </label>
                            <div className="flex items-start gap-4">
                                {form.image_url ? (
                                    <img
                                        src={form.image_url}
                                        alt=""
                                        className="h-20 w-32 shrink-0 rounded-lg border border-[#D1D5E8] object-cover"
                                    />
                                ) : (
                                    <div
                                        className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#D1D5E8] text-white"
                                        style={{ backgroundColor: form.color }}
                                    >
                                        <ImageIcon
                                            size={20}
                                            className="opacity-70"
                                        />
                                    </div>
                                )}

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E8EAF6] px-4 py-2 text-xs font-semibold text-[#213C93] transition-colors hover:bg-[#D1D5E8]">
                                            {uploading ? (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Upload size={14} />
                                            )}
                                            {uploading
                                                ? 'Uploading…'
                                                : 'Upload Image'}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                disabled={uploading}
                                                className="hidden"
                                                onChange={(e) => {
                                                    handleImageUpload(
                                                        e.target.files?.[0],
                                                    );
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        {form.image_url && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    set('image_url', '')
                                                }
                                                className="text-xs font-semibold text-[#5A6A9A] transition-colors hover:text-red-600"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#5A6A9A]">
                                        Recommended size{' '}
                                        <strong className="font-semibold text-[#213C93]">
                                            1200 × 900 px
                                        </strong>{' '}
                                        (4:3) — JPG, PNG or WebP, up to 2MB.
                                        Images are cropped to fill a 4:3 card,
                                        so keep the subject centred. Falls back
                                        to the accent color below when no image
                                        is set.
                                    </p>
                                    {uploadError && (
                                        <p className="text-xs text-red-600">
                                            {uploadError}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 pt-1">
                                        {COLOR_SWATCHES.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => set('color', c)}
                                                title={c}
                                                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                                                    form.color === c
                                                        ? 'scale-110 border-[#0D1B4B]'
                                                        : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
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
                                    rows={4}
                                    placeholder="English description"
                                    className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                                <textarea
                                    dir="rtl"
                                    value={form.description_ar}
                                    onChange={(e) =>
                                        set('description_ar', e.target.value)
                                    }
                                    rows={4}
                                    placeholder="الوصف بالعربية"
                                    className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
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
                            {saving ? 'Saving…' : 'Save Project'}
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
            ) : projects.length === 0 ? (
                <div className="py-24 text-center text-[#5A6A9A]">
                    <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No projects yet</p>
                    <p className="text-sm">
                        Click "Add Project" to showcase your first piece of
                        work.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {projects.map((project, i) => (
                        <div
                            key={project.id}
                            className="rounded-2xl border border-[#D1D5E8] bg-white p-5"
                        >
                            <div className="flex flex-wrap items-center gap-4">
                                <div
                                    className="h-16 w-24 shrink-0 rounded-lg bg-cover bg-center"
                                    style={{
                                        backgroundColor: project.color,
                                        backgroundImage: project.image_url
                                            ? `url(${project.image_url})`
                                            : undefined,
                                    }}
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-[#213C93]/10 px-2.5 py-0.5 text-xs font-bold tracking-wider text-[#213C93] uppercase">
                                            {project.category}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                project.is_published
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-[#F1F1F0] text-[#5A6A9A]'
                                            }`}
                                        >
                                            {project.is_published
                                                ? 'Published'
                                                : 'Hidden'}
                                        </span>
                                    </div>
                                    <h3 className="truncate font-bold text-[#0D1B4B]">
                                        {project.title}
                                    </h3>
                                    {project.client && (
                                        <p className="text-xs text-[#5A6A9A]">
                                            {project.client}
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
                                        disabled={i === projects.length - 1}
                                        title="Move down"
                                        className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                                    >
                                        <ArrowDown size={15} />
                                    </button>
                                    {project.external_url && (
                                        <a
                                            href={project.external_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open link"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <ExternalLink size={15} />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => togglePublished(project)}
                                        title={
                                            project.is_published
                                                ? 'Hide from site'
                                                : 'Publish to site'
                                        }
                                        className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                    >
                                        <Globe size={15} />
                                    </button>
                                    <button
                                        onClick={() => openEdit(project)}
                                        title="Edit"
                                        className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project)}
                                        title="Delete"
                                        className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
