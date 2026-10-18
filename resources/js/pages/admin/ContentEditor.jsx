import AdminLayout from '@/components/admin/AdminLayout';
import {
    Check,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Loader2,
    Plus,
    Save,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const SECTION_LABELS = {
    nav: 'Navigation',
    hero: 'Hero Section',
    stats: 'Statistics',
    services: 'Services',
    portfolio: 'Portfolio',
    about: 'About',
    testimonials: 'Testimonials',
    contact: 'Contact',
    footer: 'Footer',
};

const TYPE_LABELS = {
    text: 'Text',
    textarea: 'Long Text',
    html: 'HTML',
    image: 'Image',
};

// Contact details that can have several entries: the original `contact.{kind}`
// row is entry #1; extra entries are stored as `contact.{kind}_2`, `_3`, …
const CONTACT_LIST_KINDS = [
    { kind: 'email', label: 'Email' },
    { kind: 'phone', label: 'Phone' },
    { kind: 'address', label: 'Address' },
];
const EXTRA_CONTACT_KEY = /^contact\.(email|phone|address)_\d+$/;

// Size guidance for each image slot, matched to how the website displays it.
const IMAGE_TIPS = {
    'hero.image': {
        size: '1200 × 1200 px',
        ratio: '1:1 square',
        note: 'Optional — when set, the hero switches to two columns: text on one side, this image on the other (stacked on phones). Cropped to a square with rounded corners, so keep the subject centred. Transparent PNGs (e.g. a product or person cut-out) work well over the brand gradient.',
    },
    'about.image': {
        size: '1200 × 900 px',
        ratio: '4:3',
        note: 'Cropped to fill a 4:3 card. A stats badge covers the bottom, so keep faces and key details in the upper-middle area. Optional — without an image the animated logo card is shown.',
    },
};
const DEFAULT_IMAGE_TIP = {
    size: '1200 × 900 px',
    ratio: '4:3',
    note: 'Images are cropped to fill their frame, so keep the subject centred.',
};

/** Upload control for `image` content rows — same rules as project & event images. One image serves both languages. */
function ContentImageField({ item, onChange }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const url = item.en_value || '';
    const tip = IMAGE_TIPS[item.key] ?? DEFAULT_IMAGE_TIP;

    const upload = async (file) => {
        if (!file) return;
        setError('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Only JPG, PNG or WebP images are allowed.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be 2MB or smaller.');
            return;
        }
        setUploading(true);
        try {
            const body = new FormData();
            body.append('image', file);
            const res = await fetch('/spa/admin/content/upload-image', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body,
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) onChange(json.url);
            else
                setError(
                    json?.errors?.image?.[0] ||
                        json?.message ||
                        'Upload failed.',
                );
        } catch {
            setError('Network error during upload.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {url ? (
                <img
                    src={url}
                    alt=""
                    className="h-27 w-36 shrink-0 rounded-lg border border-[#D1D5E8] object-cover"
                />
            ) : (
                <div className="flex h-27 w-36 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#D1D5E8] text-[#5A6A9A]">
                    <ImageIcon size={22} />
                </div>
            )}
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E8EAF6] px-4 py-2 text-xs font-semibold text-[#213C93] transition-colors hover:bg-[#D1D5E8]">
                        {uploading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Upload size={14} />
                        )}
                        {uploading
                            ? 'Uploading…'
                            : url
                              ? 'Replace Image'
                              : 'Upload Image'}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={uploading}
                            className="hidden"
                            onChange={(e) => {
                                upload(e.target.files?.[0]);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {url && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="text-xs font-semibold text-[#5A6A9A] transition-colors hover:text-red-600"
                        >
                            Remove
                        </button>
                    )}
                </div>
                <p className="text-xs text-[#5A6A9A]">
                    Recommended size{' '}
                    <strong className="font-semibold text-[#213C93]">
                        {tip.size}
                    </strong>{' '}
                    ({tip.ratio}) — JPG, PNG or WebP, up to 2MB, max 6000 px per
                    side. {tip.note}
                </p>
                <p className="text-xs text-[#5A6A9A]">
                    The same image is used on the English and Arabic site. Click
                    “Save All” to publish.
                </p>
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        </div>
    );
}

// Home-page sections that can be switched off — must match SiteSetting::TOGGLEABLE_SECTIONS.
const TOGGLEABLE_SECTIONS = [
    'hero',
    'stats',
    'services',
    'portfolio',
    'events',
    'about',
    'testimonials',
    'contact',
];
const TOGGLE_LABELS = { ...SECTION_LABELS, events: 'Events' };

/**
 * Show/hide switches for each home-page section. Saved on its own (instantly, not with
 * "Save All") and stored apart from the content, so hiding a section never changes its text.
 */
function SectionVisibilityPanel({ hidden, onChange }) {
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState('');

    const toggle = async (id) => {
        const next = hidden.includes(id)
            ? hidden.filter((s) => s !== id)
            : [...hidden, id];
        const previous = hidden;
        onChange(next); // optimistic
        setSavingId(id);
        setError('');
        try {
            const res = await fetch('/spa/admin/site-settings/sections', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ hidden_sections: next }),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                onChange(json.hidden_sections ?? next);
            } else {
                onChange(previous);
                setError(json?.message || 'Failed to update. Please try again.');
            }
        } catch {
            onChange(previous);
            setError('Network error. Please try again.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="mb-8 rounded-2xl border border-[#D1D5E8] bg-white p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-bold text-[#0D1B4B]">
                    Show on website
                </h2>
                <p className="text-xs text-[#5A6A9A]">
                    Changes apply instantly. Hiding a section keeps its content —
                    switch it back on any time.
                </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {TOGGLEABLE_SECTIONS.map((id) => {
                    const shown = !hidden.includes(id);
                    return (
                        <button
                            key={id}
                            type="button"
                            role="switch"
                            aria-checked={shown}
                            disabled={savingId !== null}
                            onClick={() => toggle(id)}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-colors disabled:cursor-wait ${
                                shown
                                    ? 'border-[#213C93]/30 bg-[#E8EAF6]/60'
                                    : 'border-dashed border-[#D1D5E8] bg-[#F1F1F0]'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                {savingId === id ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin text-[#213C93]"
                                    />
                                ) : shown ? (
                                    <Eye size={14} className="text-[#213C93]" />
                                ) : (
                                    <EyeOff
                                        size={14}
                                        className="text-[#5A6A9A]"
                                    />
                                )}
                                <span
                                    className={`text-sm font-semibold ${shown ? 'text-[#0D1B4B]' : 'text-[#5A6A9A] line-through'}`}
                                >
                                    {TOGGLE_LABELS[id] ?? id}
                                </span>
                            </span>
                            {/* Switch */}
                            <span
                                aria-hidden="true"
                                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${shown ? 'bg-[#213C93]' : 'bg-[#C5CAE0]'}`}
                            >
                                <span
                                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${shown ? 'start-4.5' : 'start-0.5'}`}
                                />
                            </span>
                        </button>
                    );
                })}
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export default function ContentEditor() {
    const [items, setItems] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [focusId, setFocusId] = useState(null); // newly added row to scroll to + focus
    const [hiddenSections, setHiddenSections] = useState([]);

    useEffect(() => {
        fetch('/spa/admin/site-settings', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) =>
                setHiddenSections(data?.settings?.hidden_sections ?? []),
            )
            .catch(() => {});
    }, []);

    // Once a newly added contact entry has rendered, bring it into view and focus its English field.
    useEffect(() => {
        if (focusId === null) return;
        const row = document.getElementById(`content-row-${focusId}`);
        if (!row) return;
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.querySelector('input, textarea')?.focus({ preventScroll: true });
        setFocusId(null);
    }, [focusId, items]);

    // Load all content rows
    useEffect(() => {
        fetch('/spa/admin/content', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setItems(data);
                setFetchLoading(false);
            })
            .catch(() => setFetchLoading(false));
    }, []);

    const sections = useMemo(() => {
        const seen = new Set(['all']);
        items.forEach((i) => seen.add(i.section));
        return Array.from(seen);
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter((item) => {
            // Keep whatever's actively being edited visible even if the edit itself
            // makes it stop matching the search/section — it shouldn't vanish out
            // from under the field the admin is typing into.
            if (item.id === editingId) return true;

            const matchSection =
                activeSection === 'all' || item.section === activeSection;
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                item.key.includes(q) ||
                (item.en_value ?? '').toLowerCase().includes(q) ||
                (item.ar_value ?? '').toLowerCase().includes(q);
            return matchSection && matchSearch;
        });
    }, [items, activeSection, search, editingId]);

    const grouped = useMemo(() => {
        return filtered.reduce((acc, item) => {
            (acc[item.section] = acc[item.section] ?? []).push(item);
            return acc;
        }, {});
    }, [filtered]);

    const updateItem = (id, field, value) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item,
            ),
        );
        setSavedMsg('');
    };

    const addContactEntry = async (kind) => {
        setErrorMsg('');
        try {
            const res = await fetch('/spa/admin/content/contact-entry', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ kind }),
            });
            const row = await res.json().catch(() => null);
            if (!res.ok || !row) {
                setErrorMsg(row?.message || 'Failed to add entry.');
                return;
            }
            // Insert after the last existing entry of the same kind so it shows up
            // next to its siblings; other unsaved edits in `items` are kept.
            setItems((prev) => {
                const base = `contact.${kind}`;
                const lastIndex = prev.reduce(
                    (last, item, i) =>
                        item.key === base || item.key.startsWith(`${base}_`)
                            ? i
                            : last,
                    -1,
                );
                const next = [...prev];
                next.splice(lastIndex + 1, 0, row);
                return next;
            });
            setEditingId(row.id);
            setFocusId(row.id);
        } catch {
            setErrorMsg('Network error. Please try again.');
        }
    };

    const deleteContactEntry = async (item) => {
        if (!confirm(`Delete ${item.key}?`)) return;
        setErrorMsg('');
        try {
            const res = await fetch(`/spa/admin/content/${item.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
            });
            if (res.ok) {
                setItems((prev) => prev.filter((i) => i.id !== item.id));
            } else {
                const json = await res.json().catch(() => ({}));
                setErrorMsg(json?.message || 'Failed to delete entry.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch('/spa/admin/content', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({
                    items: items.map(({ id, en_value, ar_value }) => ({
                        id,
                        en_value,
                        ar_value,
                    })),
                }),
            });
            if (res.ok) {
                setSavedMsg('All changes saved!');
                setTimeout(() => setSavedMsg(''), 3000);
            } else {
                setErrorMsg('Failed to save. Please try again.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
            </div>
        );
    }

    return (
        <AdminLayout
            title="Content Editor"
            actions={
                <>
                    {savedMsg && (
                        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            <Check size={12} />
                            {savedMsg}
                        </span>
                    )}
                    {errorMsg && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            {errorMsg}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-[#DDB50E] px-5 py-2 text-sm font-bold text-[#0D1B4B] transition-colors hover:bg-[#FCD532] disabled:opacity-60"
                    >
                        <Save size={14} />
                        {saving ? 'Saving…' : 'Save All'}
                    </button>
                </>
            }
        >
            <div>
                <SectionVisibilityPanel
                    hidden={hiddenSections}
                    onChange={setHiddenSections}
                />

                {/* Search + section filter */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative max-w-md min-w-55 flex-1">
                        <Search
                            size={15}
                            className="absolute top-1/2 left-3 -translate-y-1/2 text-[#5A6A9A]"
                        />
                        <input
                            type="search"
                            placeholder="Search by key or value…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-[#D1D5E8] bg-white py-2.5 pr-9 pl-9 text-sm focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#5A6A9A] hover:text-[#0D1B4B]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sections.map((s) => (
                            <button
                                key={s}
                                onClick={() => setActiveSection(s)}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                                    activeSection === s
                                        ? 'bg-[#213C93] text-white'
                                        : 'border border-[#D1D5E8] bg-white text-[#213C93] hover:border-[#213C93]'
                                }`}
                            >
                                {s === 'all' ? 'All' : (SECTION_LABELS[s] ?? s)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content rows grouped by section */}
                {Object.entries(grouped).map(([section, rows]) => (
                    <div key={section} className="mb-8">
                        <h2 className="mb-4 flex items-center gap-3 text-xs font-bold tracking-widest text-[#213C93] uppercase">
                            <span className="h-px flex-1 bg-[#D1D5E8]" />
                            {SECTION_LABELS[section] ?? section}
                            {hiddenSections.includes(section) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F1F0] px-2 py-0.5 text-[10px] tracking-normal text-[#5A6A9A] normal-case">
                                    <EyeOff size={10} />
                                    Hidden on website
                                </span>
                            )}
                            <span className="h-px flex-1 bg-[#D1D5E8]" />
                        </h2>

                        {section === 'contact' && (
                            <div className="sticky top-[calc(var(--admin-header-h,0px)+0.75rem)] z-30 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-[#D1D5E8] bg-white/95 px-4 py-3 shadow-[0_4px_16px_rgba(33,60,147,0.08)] backdrop-blur">
                                <span className="me-1 text-xs text-[#5A6A9A]">
                                    Add another contact detail:
                                </span>
                                {CONTACT_LIST_KINDS.map(({ kind, label }) => (
                                    <button
                                        key={kind}
                                        type="button"
                                        onClick={() => addContactEntry(kind)}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-[#E8EAF6] px-3 py-1.5 text-xs font-semibold text-[#213C93] transition-colors hover:bg-[#D1D5E8]"
                                    >
                                        <Plus size={12} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3">
                            {rows.map((item) => {
                                const isLong =
                                    item.type === 'textarea' ||
                                    item.type === 'html';
                                return (
                                    <div
                                        key={item.id}
                                        id={`content-row-${item.id}`}
                                        className="rounded-2xl border border-[#D1D5E8] bg-white p-5 transition-colors hover:border-[#213C93]/30"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <code className="rounded-md bg-[#E8EAF6] px-2 py-0.5 font-mono text-xs break-all text-[#213C93]">
                                                {item.key}
                                            </code>
                                            <div className="flex flex-shrink-0 items-center gap-2">
                                                <span className="rounded-full bg-[#F1F1F0] px-2 py-0.5 text-xs text-[#5A6A9A]">
                                                    {TYPE_LABELS[item.type] ??
                                                        item.type}
                                                </span>
                                                {EXTRA_CONTACT_KEY.test(
                                                    item.key,
                                                ) && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteContactEntry(
                                                                item,
                                                            )
                                                        }
                                                        title="Delete this entry"
                                                        className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {item.type === 'image' ? (
                                            <ContentImageField
                                                item={item}
                                                onChange={(url) => {
                                                    updateItem(
                                                        item.id,
                                                        'en_value',
                                                        url,
                                                    );
                                                    updateItem(
                                                        item.id,
                                                        'ar_value',
                                                        url,
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {/* English */}
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                                        🇬🇧 English
                                                    </label>
                                                    {isLong ? (
                                                        <textarea
                                                            value={
                                                                item.en_value ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'en_value',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onFocus={() =>
                                                                setEditingId(
                                                                    item.id,
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                setEditingId(
                                                                    (id) =>
                                                                        id ===
                                                                        item.id
                                                                            ? null
                                                                            : id,
                                                                )
                                                            }
                                                            rows={3}
                                                            className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={
                                                                item.en_value ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'en_value',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onFocus={() =>
                                                                setEditingId(
                                                                    item.id,
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                setEditingId(
                                                                    (id) =>
                                                                        id ===
                                                                        item.id
                                                                            ? null
                                                                            : id,
                                                                )
                                                            }
                                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                                        />
                                                    )}
                                                </div>

                                                {/* Arabic */}
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                                        🇸🇦 Arabic
                                                    </label>
                                                    {isLong ? (
                                                        <textarea
                                                            dir="rtl"
                                                            value={
                                                                item.ar_value ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'ar_value',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onFocus={() =>
                                                                setEditingId(
                                                                    item.id,
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                setEditingId(
                                                                    (id) =>
                                                                        id ===
                                                                        item.id
                                                                            ? null
                                                                            : id,
                                                                )
                                                            }
                                                            rows={3}
                                                            className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            dir="rtl"
                                                            value={
                                                                item.ar_value ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'ar_value',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onFocus={() =>
                                                                setEditingId(
                                                                    item.id,
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                setEditingId(
                                                                    (id) =>
                                                                        id ===
                                                                        item.id
                                                                            ? null
                                                                            : id,
                                                                )
                                                            }
                                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="py-24 text-center text-[#5A6A9A]">
                        <Search size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No content found</p>
                        <p className="text-sm">
                            Try a different search or section filter.
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
