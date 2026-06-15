import { Head, router, usePage } from '@inertiajs/react';
import { Check, Globe, Save, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

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

const TYPE_LABELS = { text: 'Text', textarea: 'Long Text', html: 'HTML', image: 'Image URL' };

export default function ContentEditor({ contents }) {
    const { flash } = usePage().props;
    const [items, setItems] = useState(contents ?? []);
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('all');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const sections = useMemo(() => {
        const seen = new Set(['all']);
        items.forEach((i) => seen.add(i.section));
        return Array.from(seen);
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter((item) => {
            const matchSection = activeSection === 'all' || item.section === activeSection;
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                item.key.includes(q) ||
                (item.en_value ?? '').toLowerCase().includes(q) ||
                (item.ar_value ?? '').toLowerCase().includes(q);
            return matchSection && matchSearch;
        });
    }, [items, activeSection, search]);

    const grouped = useMemo(() => {
        return filtered.reduce((acc, item) => {
            (acc[item.section] = acc[item.section] ?? []).push(item);
            return acc;
        }, {});
    }, [filtered]);

    const update = (id, field, value) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
        setSaved(false);
    };

    const handleSave = () => {
        setSaving(true);
        router.post(
            '/admin/content',
            {
                items: items.map(({ id, en_value, ar_value }) => ({ id, en_value, ar_value })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Content Editor – Admin" />

            <div className="min-h-screen bg-[#F1F1F0]">
                {/* Top bar */}
                <header className="sticky top-0 z-40 bg-[#213C93] text-white shadow-brand">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <Globe size={20} className="text-[#FCD532]" />
                            <div>
                                <p className="text-xs text-white/60">Mr.MEDIA</p>
                                <p className="font-bold text-sm">Content Editor</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {saved && (
                                <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                                    <Check size={12} />
                                    Saved
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-full bg-[#DDB50E] px-5 py-2 text-sm font-bold text-[#0D1B4B] hover:bg-[#FCD532] disabled:opacity-60 transition-colors"
                            >
                                <Save size={14} />
                                {saving ? 'Saving…' : 'Save All'}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
                    {/* Flash message */}
                    {flash?.success && (
                        <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                            <Check size={16} />
                            {flash.success}
                        </div>
                    )}

                    {/* Search + filter bar */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6A9A]" />
                            <input
                                type="search"
                                placeholder="Search by key or value…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-[#D1D5E8] bg-white pl-9 pr-4 py-2.5 text-sm focus:border-[#213C93] focus:outline-none focus:ring-2 focus:ring-[#213C93]/20"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A9A] hover:text-[#0D1B4B]">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {sections.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setActiveSection(s)}
                                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors capitalize ${
                                        activeSection === s
                                            ? 'bg-[#213C93] text-white'
                                            : 'bg-white border border-[#D1D5E8] text-[#213C93] hover:border-[#213C93]'
                                    }`}
                                >
                                    {s === 'all' ? 'All Sections' : (SECTION_LABELS[s] ?? s)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content groups */}
                    {Object.entries(grouped).map(([section, sectionItems]) => (
                        <div key={section} className="mb-8">
                            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#213C93]">
                                <span className="h-px flex-1 bg-[#D1D5E8]" />
                                {SECTION_LABELS[section] ?? section}
                                <span className="h-px flex-1 bg-[#D1D5E8]" />
                            </h2>

                            <div className="space-y-4">
                                {sectionItems.map((item) => {
                                    const isLong = item.type === 'textarea' || item.type === 'html';
                                    return (
                                        <div
                                            key={item.id}
                                            className="rounded-2xl bg-white border border-[#D1D5E8] p-5 hover:border-[#213C93]/30 transition-colors"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <code className="rounded-md bg-[#E8EAF6] px-2 py-0.5 text-xs font-mono text-[#213C93]">
                                                    {item.key}
                                                </code>
                                                <span className="text-xs text-[#5A6A9A] bg-[#F1F1F0] px-2 py-0.5 rounded-full">
                                                    {TYPE_LABELS[item.type] ?? item.type}
                                                </span>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {/* English */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#5A6A9A] mb-1.5">
                                                        🇬🇧 English
                                                    </label>
                                                    {isLong ? (
                                                        <textarea
                                                            value={item.en_value ?? ''}
                                                            onChange={(e) => update(item.id, 'en_value', e.target.value)}
                                                            rows={3}
                                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 resize-y"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={item.en_value ?? ''}
                                                            onChange={(e) => update(item.id, 'en_value', e.target.value)}
                                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:outline-none focus:ring-2 focus:ring-[#213C93]/20"
                                                        />
                                                    )}
                                                </div>

                                                {/* Arabic */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#5A6A9A] mb-1.5">
                                                        🇸🇦 Arabic
                                                    </label>
                                                    {isLong ? (
                                                        <textarea
                                                            dir="rtl"
                                                            value={item.ar_value ?? ''}
                                                            onChange={(e) => update(item.id, 'ar_value', e.target.value)}
                                                            rows={3}
                                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 resize-y font-arabic"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            dir="rtl"
                                                            value={item.ar_value ?? ''}
                                                            onChange={(e) => update(item.id, 'ar_value', e.target.value)}
                                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-3 py-2 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:outline-none focus:ring-2 focus:ring-[#213C93]/20 font-arabic"
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
                            <p className="text-sm">Try a different search or section filter.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
