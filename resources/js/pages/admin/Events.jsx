import AdminLayout from '@/components/admin/AdminLayout';
import {
    Calendar,
    Check,
    ExternalLink,
    Globe,
    Image as ImageIcon,
    ListChecks,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    Upload,
    Users,
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
    type: 'event',
    mode: 'offline',
    description: '',
    description_ar: '',
    location: '',
    location_ar: '',
    starts_at: '',
    ends_at: '',
    capacity: '',
    price: '',
    image_url: '',
    is_published: true,
};

function toDatetimeLocal(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso));
}

export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [savedMsg, setSavedMsg] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const [submissionsFor, setSubmissionsFor] = useState(null); // event object
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    const loadEvents = () => {
        setLoading(true);
        fetch('/spa/admin/events', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setEvents(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(loadEvents, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    };

    const openEdit = (event) => {
        setEditingId(event.id);
        setForm({
            title: event.title ?? '',
            title_ar: event.title_ar ?? '',
            type: event.type ?? 'event',
            mode: event.mode ?? 'offline',
            description: event.description ?? '',
            description_ar: event.description_ar ?? '',
            location: event.location ?? '',
            location_ar: event.location_ar ?? '',
            starts_at: toDatetimeLocal(event.starts_at),
            ends_at: toDatetimeLocal(event.ends_at),
            capacity: event.capacity ?? '',
            price: event.price ?? '',
            image_url: event.image_url ?? '',
            is_published: !!event.is_published,
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
            const res = await fetch('/spa/admin/events/upload-image', {
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
                ? `/spa/admin/events/${editingId}`
                : '/spa/admin/events';
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({
                    ...form,
                    capacity:
                        form.capacity === '' ? null : Number(form.capacity),
                    price: form.price === '' ? null : Number(form.price),
                    ends_at: form.ends_at || null,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setSavedMsg(editingId ? 'Event updated!' : 'Event created!');
                setTimeout(() => setSavedMsg(''), 3000);
                closeForm();
                loadEvents();
            } else {
                setErrorMsg(json?.message || 'Failed to save event.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (event) => {
        if (
            !confirm(
                `Delete "${event.title}"? This also removes its submissions.`,
            )
        )
            return;
        try {
            const res = await fetch(`/spa/admin/events/${event.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': getCsrf(),
                    Accept: 'application/json',
                },
            });
            if (res.ok) loadEvents();
        } catch {
            setErrorMsg('Failed to delete event.');
        }
    };

    const togglePublished = async (event) => {
        try {
            const res = await fetch(`/spa/admin/events/${event.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({
                    title: event.title,
                    title_ar: event.title_ar,
                    type: event.type,
                    mode: event.mode,
                    description: event.description,
                    description_ar: event.description_ar,
                    location: event.location,
                    location_ar: event.location_ar,
                    starts_at: event.starts_at,
                    ends_at: event.ends_at,
                    capacity: event.capacity,
                    price: event.price,
                    image_url: event.image_url,
                    is_published: !event.is_published,
                }),
            });
            if (res.ok) loadEvents();
        } catch {
            setErrorMsg('Failed to update event.');
        }
    };

    const openSubmissions = (event) => {
        setSubmissionsFor(event);
        setSubmissionsLoading(true);
        fetch(`/spa/admin/events/${event.id}/submissions`, {
            credentials: 'include',
        })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setSubmissions(data);
                setSubmissionsLoading(false);
            })
            .catch(() => setSubmissionsLoading(false));
    };

    const deleteSubmission = async (submission) => {
        if (!confirm(`Remove submission from ${submission.name}?`)) return;
        try {
            const res = await fetch(
                `/spa/admin/events/${submissionsFor.id}/submissions/${submission.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'X-CSRF-TOKEN': getCsrf(),
                        Accept: 'application/json',
                    },
                },
            );
            if (res.ok) {
                setSubmissions((prev) =>
                    prev.filter((s) => s.id !== submission.id),
                );
                loadEvents();
            }
        } catch {
            setErrorMsg('Failed to delete submission.');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
            </div>
        );
    }

    return (
        <AdminLayout
            title="Events & Training"
            actions={
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    <Plus size={15} />
                    Add Event
                </button>
            }
        >
            <div>
                {savedMsg && (
                    <div className="mb-6 flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        <Check size={14} /> {savedMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {errorMsg}
                    </div>
                )}

                {/* Create / edit form */}
                {formOpen && (
                    <form
                        onSubmit={handleSave}
                        className="mb-8 overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white"
                    >
                        <div className="flex items-center justify-between border-b border-[#E8EAF6] px-6 py-5">
                            <h2 className="font-bold text-[#0D1B4B]">
                                {editingId ? 'Edit Event' : 'New Event'}
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
                            {/* Title (EN / AR) */}
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
                                        Type
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={(e) =>
                                            set('type', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    >
                                        <option value="event">Event</option>
                                        <option value="training">
                                            Training Course
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        Session
                                    </label>
                                    <select
                                        value={form.mode}
                                        onChange={(e) =>
                                            set('mode', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    >
                                        <option value="offline">
                                            In-Person (Offline)
                                        </option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        Capacity (optional)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.capacity}
                                        onChange={(e) =>
                                            set('capacity', e.target.value)
                                        }
                                        placeholder="Unlimited"
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        Price (IQD, optional)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={form.price}
                                        onChange={(e) =>
                                            set('price', e.target.value)
                                        }
                                        placeholder="Free"
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        Starts At
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.starts_at}
                                        onChange={(e) =>
                                            set('starts_at', e.target.value)
                                        }
                                        required
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        Ends At (optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.ends_at}
                                        onChange={(e) =>
                                            set('ends_at', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Location (EN / AR) */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    {form.mode === 'online'
                                        ? 'Platform / Link'
                                        : 'Location'}
                                </label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                            🇬🇧 English
                                        </label>
                                        <input
                                            type="text"
                                            value={form.location}
                                            onChange={(e) =>
                                                set('location', e.target.value)
                                            }
                                            placeholder={
                                                form.mode === 'online'
                                                    ? 'Zoom link / Google Meet'
                                                    : 'Riyadh, Saudi Arabia'
                                            }
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
                                            value={form.location_ar}
                                            onChange={(e) =>
                                                set(
                                                    'location_ar',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="الرياض، المملكة العربية السعودية"
                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Event Image (optional)
                                </label>
                                <div className="flex items-start gap-4">
                                    {form.image_url ? (
                                        <img
                                            src={form.image_url}
                                            alt=""
                                            className="h-20 w-32 shrink-0 rounded-lg border border-[#D1D5E8] object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#D1D5E8] text-[#5A6A9A]">
                                            <ImageIcon size={20} />
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
                                                1600 × 900 px
                                            </strong>{' '}
                                            (16:9) — JPG, PNG or WebP, up to
                                            2MB. Images are cropped to fill a
                                            16:9 banner, so keep the subject
                                            centred.
                                        </p>
                                        {uploadError && (
                                            <p className="text-xs text-red-600">
                                                {uploadError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description (EN / AR) */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Description
                                </label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                            🇬🇧 English
                                        </label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) =>
                                                set(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            rows={4}
                                            className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                            🇸🇦 Arabic
                                        </label>
                                        <textarea
                                            dir="rtl"
                                            value={form.description_ar}
                                            onChange={(e) =>
                                                set(
                                                    'description_ar',
                                                    e.target.value,
                                                )
                                            }
                                            rows={4}
                                            className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                    </div>
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
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Check size={15} />
                                )}
                                {saving ? 'Saving…' : 'Save Event'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Events list */}
                {events.length === 0 ? (
                    <div className="py-24 text-center text-[#5A6A9A]">
                        <Calendar
                            size={40}
                            className="mx-auto mb-3 opacity-30"
                        />
                        <p className="font-medium">No events yet</p>
                        <p className="text-sm">
                            Click "Add Event" to create your first event or
                            training course.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="rounded-2xl border border-[#D1D5E8] bg-white p-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                                                    event.type === 'training'
                                                        ? 'bg-[#DDB50E]/15 text-[#9A7A0A]'
                                                        : 'bg-[#213C93]/10 text-[#213C93]'
                                                }`}
                                            >
                                                {event.type === 'training'
                                                    ? 'Training'
                                                    : 'Event'}
                                            </span>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    event.is_published
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-[#F1F1F0] text-[#5A6A9A]'
                                                }`}
                                            >
                                                {event.is_published
                                                    ? 'Published'
                                                    : 'Hidden'}
                                            </span>
                                            <span className="rounded-full bg-[#E8EAF6] px-2.5 py-0.5 text-xs font-semibold text-[#213C93]">
                                                {event.mode === 'online'
                                                    ? 'Online'
                                                    : 'In-Person'}
                                            </span>
                                            <span className="rounded-full bg-[#F1F1F0] px-2.5 py-0.5 text-xs font-semibold text-[#0D1B4B]">
                                                {event.price
                                                    ? `${Number(event.price).toLocaleString()} IQD`
                                                    : 'Free'}
                                            </span>
                                        </div>
                                        <h3 className="truncate font-bold text-[#0D1B4B]">
                                            {event.title}
                                        </h3>
                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5A6A9A]">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />{' '}
                                                {formatDate(event.starts_at)}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} />{' '}
                                                    {event.location}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Users size={12} />
                                                {event.submissions_count}{' '}
                                                submission
                                                {event.submissions_count === 1
                                                    ? ''
                                                    : 's'}
                                                {event.capacity
                                                    ? ` / ${event.capacity} capacity`
                                                    : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        {event.slug && (
                                            <a
                                                href={`/events/${event.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="View live page"
                                                className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                            >
                                                <ExternalLink size={15} />
                                            </a>
                                        )}
                                        <button
                                            onClick={() =>
                                                openSubmissions(event)
                                            }
                                            title="View submissions"
                                            className="flex items-center gap-1.5 rounded-lg bg-[#E8EAF6] px-3 py-1.5 text-xs font-semibold text-[#213C93] transition-colors hover:bg-[#D1D5E8]"
                                        >
                                            <ListChecks size={13} />
                                            Submissions
                                        </button>
                                        <button
                                            onClick={() =>
                                                togglePublished(event)
                                            }
                                            title={
                                                event.is_published
                                                    ? 'Hide from site'
                                                    : 'Publish to site'
                                            }
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Globe size={15} />
                                        </button>
                                        <button
                                            onClick={() => openEdit(event)}
                                            title="Edit"
                                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93]"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event)}
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
            </div>

            {/* Submissions drawer */}
            {submissionsFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setSubmissionsFor(null)}
                    />
                    <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#E8EAF6] bg-white px-6 py-4">
                            <div>
                                <h2 className="font-bold text-[#0D1B4B]">
                                    Submissions
                                </h2>
                                <p className="text-xs text-[#5A6A9A]">
                                    {submissionsFor.title}
                                </p>
                            </div>
                            <button
                                onClick={() => setSubmissionsFor(null)}
                                className="text-[#5A6A9A] hover:text-[#0D1B4B]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            {submissionsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2
                                        size={24}
                                        className="animate-spin text-[#213C93]"
                                    />
                                </div>
                            ) : submissions.length === 0 ? (
                                <p className="py-10 text-center text-sm text-[#5A6A9A]">
                                    No submissions yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {submissions.map((s) => (
                                        <div
                                            key={s.id}
                                            className="rounded-xl border border-[#E8EAF6] p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-[#0D1B4B]">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-xs text-[#5A6A9A]">
                                                        {s.email}
                                                        {s.phone
                                                            ? ` · ${s.phone}`
                                                            : ''}
                                                    </p>
                                                    {s.company && (
                                                        <p className="text-xs text-[#5A6A9A]">
                                                            {s.company}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span className="rounded-full bg-[#E8EAF6] px-2 py-0.5 text-xs font-semibold text-[#213C93]">
                                                        {s.attendees} attendee
                                                        {s.attendees === 1
                                                            ? ''
                                                            : 's'}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            deleteSubmission(s)
                                                        }
                                                        className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {s.message && (
                                                <p className="mt-2 text-sm text-[#0D1B4B]/80">
                                                    {s.message}
                                                </p>
                                            )}
                                            <p className="mt-2 text-[11px] text-[#5A6A9A]">
                                                {formatDate(s.created_at)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
