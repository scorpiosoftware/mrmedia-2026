import AdminLayout from '@/components/admin/AdminLayout';
import { Check, Save, Search, X } from 'lucide-react';
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
    image: 'Image URL',
};

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
                            <span className="h-px flex-1 bg-[#D1D5E8]" />
                        </h2>

                        <div className="space-y-3">
                            {rows.map((item) => {
                                const isLong =
                                    item.type === 'textarea' ||
                                    item.type === 'html';
                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-[#D1D5E8] bg-white p-5 transition-colors hover:border-[#213C93]/30"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <code className="rounded-md bg-[#E8EAF6] px-2 py-0.5 font-mono text-xs break-all text-[#213C93]">
                                                {item.key}
                                            </code>
                                            <span className="flex-shrink-0 rounded-full bg-[#F1F1F0] px-2 py-0.5 text-xs text-[#5A6A9A]">
                                                {TYPE_LABELS[item.type] ??
                                                    item.type}
                                            </span>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {/* English */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                                    🇬🇧 English
                                                </label>
                                                {isLong ? (
                                                    <textarea
                                                        value={
                                                            item.en_value ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            updateItem(
                                                                item.id,
                                                                'en_value',
                                                                e.target.value,
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
                                                            item.en_value ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            updateItem(
                                                                item.id,
                                                                'en_value',
                                                                e.target.value,
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
                                                            item.ar_value ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            updateItem(
                                                                item.id,
                                                                'ar_value',
                                                                e.target.value,
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
                                                            item.ar_value ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            updateItem(
                                                                item.id,
                                                                'ar_value',
                                                                e.target.value,
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
