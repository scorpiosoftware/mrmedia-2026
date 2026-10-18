import AdminLayout from '@/components/admin/AdminLayout';
import { MarqueeStrip } from '@/components/portfolio/MarqueeBanner';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Card,
    getCsrf,
    INPUT,
    LABEL,
    Segmented,
    Toggle,
} from '@/components/admin/form-controls';

const EMPTY_PHRASE = { text: '', text_ar: '', style: 'solid' };

const PHRASE_STYLES = [
    { value: 'solid', label: 'Solid' },
    { value: 'highlight', label: 'Highlight' },
    { value: 'outline', label: 'Outline' },
];

const SEPARATORS = [
    { value: 'sparkle', label: '✦ Sparkle' },
    { value: 'star', label: '★ Star' },
    { value: 'diamond', label: '◆ Diamond' },
    { value: 'dot', label: '● Dot' },
    { value: 'asterisk', label: '✱ Asterisk' },
    { value: 'logo', label: 'Logo' },
    { value: 'none', label: 'None' },
];

const FONT_SIZES = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
];

const COLOR_PRESETS = [
    {
        name: 'Brand Blue',
        background_color: '#213C93',
        text_color: '#FFFFFF',
        highlight_color: '#FCD532',
    },
    {
        name: 'Gold',
        background_color: '#DDB50E',
        text_color: '#0D1B4B',
        highlight_color: '#FFFFFF',
    },
    {
        name: 'Midnight',
        background_color: '#0D1B4B',
        text_color: '#FFFFFF',
        highlight_color: '#DDB50E',
    },
    {
        name: 'Light',
        background_color: '#FFFFFF',
        text_color: '#0D1B4B',
        highlight_color: '#213C93',
    },
];

function ColorField({ label, value, onChange }) {
    return (
        <div>
            <label className={LABEL}>{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-[#D1D5E8] bg-white p-1"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={7}
                    className={`${INPUT} font-mono uppercase`}
                />
            </div>
        </div>
    );
}

export default function MarqueeBannerAdmin() {
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [previewArabic, setPreviewArabic] = useState(false);

    useEffect(() => {
        fetch('/spa/admin/marquee', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) setForm({ ...data, phrases: data.phrases ?? [] });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const set = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSavedMsg('');
        setErrorMsg('');
    };

    const updatePhrase = (index, patch) =>
        set(
            'phrases',
            form.phrases.map((p, i) => (i === index ? { ...p, ...patch } : p)),
        );

    const movePhrase = (index, dir) => {
        const target = index + dir;
        if (target < 0 || target >= form.phrases.length) return;
        const next = [...form.phrases];
        [next[index], next[target]] = [next[target], next[index]];
        set('phrases', next);
    };

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch('/spa/admin/marquee', {
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
                setForm({ ...json, phrases: json.phrases ?? [] });
                setSavedMsg('Banner saved!');
                setTimeout(() => setSavedMsg(''), 3000);
            } else {
                setErrorMsg(
                    json?.message || 'Failed to save. Please try again.',
                );
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !form) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
                {loading ? (
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
                ) : (
                    <p className="text-sm text-[#5A6A9A]">
                        Could not load the banner settings.
                    </p>
                )}
            </div>
        );
    }

    // Preview mirrors what the public API sends: blank phrases are skipped, Arabic falls back to English.
    const previewBanner = {
        ...form,
        phrases: form.phrases
            .map((p) => ({
                text: previewArabic && p.text_ar?.trim() ? p.text_ar : p.text,
                style: p.style,
            }))
            .filter((p) => p.text?.trim()),
    };

    return (
        <AdminLayout
            title="Scrolling Banner"
            actions={
                <>
                    {savedMsg && (
                        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            <Check size={12} />
                            {savedMsg}
                        </span>
                    )}
                    {errorMsg && (
                        <span
                            className="max-w-xs truncate rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                            title={errorMsg}
                        >
                            {errorMsg}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-[#DDB50E] px-5 py-2 text-sm font-bold text-[#0D1B4B] transition-colors hover:bg-[#FCD532] disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Save size={14} />
                        )}
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Live preview */}
                <div className="z-30 overflow-hidden rounded-2xl border border-[#D1D5E8] bg-[#F1F1F0] shadow-[0_8px_32px_rgba(33,60,147,0.12)] lg:sticky lg:top-[calc(var(--admin-header-h,0px)+0.75rem)]">
                    <div className="flex items-center justify-between gap-3 border-b border-[#D1D5E8] bg-white px-4 py-2.5">
                        <span className="text-xs font-bold tracking-widest text-[#213C93] uppercase">
                            Live Preview
                            {!form.is_enabled && (
                                <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 font-semibold tracking-normal text-amber-700 normal-case">
                                    Hidden on site
                                </span>
                            )}
                        </span>
                        <Segmented
                            value={previewArabic ? 'ar' : 'en'}
                            onChange={(v) => setPreviewArabic(v === 'ar')}
                            options={[
                                { value: 'en', label: 'English' },
                                { value: 'ar', label: 'Arabic' },
                            ]}
                        />
                    </div>
                    {previewBanner.phrases.length ? (
                        <MarqueeStrip banner={previewBanner} />
                    ) : (
                        <p className="px-4 py-8 text-center text-sm text-[#5A6A9A]">
                            Add at least one phrase to see the banner.
                        </p>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Phrases */}
                    <div className="lg:col-span-3">
                        <Card
                            title="Phrases"
                            subtitle="Shown in this order, looping continuously. Arabic falls back to English when left blank."
                        >
                            <Toggle
                                checked={form.is_enabled}
                                onChange={(v) => set('is_enabled', v)}
                                onLabel="Banner visible on site"
                                offLabel="Banner hidden from site"
                            />

                            <div className="space-y-3">
                                {form.phrases.map((phrase, index) => (
                                    <div
                                        key={index}
                                        className="space-y-3 rounded-xl border border-[#D1D5E8] bg-white p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-[#5A6A9A]">
                                                {phrase.text ||
                                                    `Phrase ${index + 1}`}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        movePhrase(index, -1)
                                                    }
                                                    disabled={index === 0}
                                                    className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        movePhrase(index, 1)
                                                    }
                                                    disabled={
                                                        index ===
                                                        form.phrases.length - 1
                                                    }
                                                    className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        set(
                                                            'phrases',
                                                            form.phrases.filter(
                                                                (_, i) =>
                                                                    i !== index,
                                                            ),
                                                        )
                                                    }
                                                    className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <input
                                                type="text"
                                                value={phrase.text}
                                                onChange={(e) =>
                                                    updatePhrase(index, {
                                                        text: e.target.value,
                                                    })
                                                }
                                                placeholder="🇬🇧 English"
                                                maxLength={120}
                                                className={INPUT}
                                            />
                                            <input
                                                type="text"
                                                dir="rtl"
                                                value={phrase.text_ar ?? ''}
                                                onChange={(e) =>
                                                    updatePhrase(index, {
                                                        text_ar: e.target.value,
                                                    })
                                                }
                                                placeholder="🇸🇦 Arabic"
                                                maxLength={120}
                                                className={`${INPUT} font-arabic`}
                                            />
                                        </div>
                                        <Segmented
                                            value={phrase.style}
                                            onChange={(v) =>
                                                updatePhrase(index, {
                                                    style: v,
                                                })
                                            }
                                            options={PHRASE_STYLES}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    set('phrases', [
                                        ...form.phrases,
                                        { ...EMPTY_PHRASE },
                                    ])
                                }
                                disabled={form.phrases.length >= 30}
                                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#D1D5E8] px-4 py-2 text-xs font-semibold text-[#213C93] transition-colors hover:border-[#213C93]/40 hover:bg-[#E8EAF6] disabled:opacity-40"
                            >
                                <Plus size={14} />
                                Add Phrase
                            </button>
                        </Card>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        {/* Motion */}
                        <Card title="Motion">
                            <div>
                                <label className={LABEL}>
                                    Speed{' '}
                                    <span className="font-normal normal-case">
                                        — {form.speed} px/s
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min={10}
                                    max={300}
                                    step={5}
                                    value={form.speed}
                                    onChange={(e) =>
                                        set('speed', Number(e.target.value))
                                    }
                                    className="w-full accent-[#213C93]"
                                />
                                <div className="mt-1 flex justify-between text-xs text-[#5A6A9A]">
                                    <span>Slow</span>
                                    <span>Fast</span>
                                </div>
                            </div>
                            <div>
                                <label className={LABEL}>Direction</label>
                                <Segmented
                                    value={form.direction}
                                    onChange={(v) => set('direction', v)}
                                    options={[
                                        {
                                            value: 'left',
                                            label: 'Left',
                                            Icon: ArrowLeft,
                                        },
                                        {
                                            value: 'right',
                                            label: 'Right',
                                            Icon: ArrowRight,
                                        },
                                    ]}
                                />
                            </div>
                            <Toggle
                                checked={form.pause_on_hover}
                                onChange={(v) => set('pause_on_hover', v)}
                                onLabel="Pauses on hover"
                                offLabel="Keeps moving on hover"
                            />
                        </Card>

                        {/* Appearance */}
                        <Card title="Appearance">
                            <div>
                                <label className={LABEL}>Color Presets</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_PRESETS.map(
                                        ({ name, ...colors }) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        ...colors,
                                                    }))
                                                }
                                                className="inline-flex items-center gap-2 rounded-full border border-[#D1D5E8] bg-white py-1 ps-1 pe-3 text-xs font-semibold text-[#0D1B4B] transition-colors hover:border-[#213C93]"
                                            >
                                                <span
                                                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
                                                    style={{
                                                        backgroundColor:
                                                            colors.background_color,
                                                        color: colors.highlight_color,
                                                        boxShadow:
                                                            'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                                    }}
                                                >
                                                    A
                                                </span>
                                                {name}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                                <ColorField
                                    label="Background"
                                    value={form.background_color}
                                    onChange={(v) => set('background_color', v)}
                                />
                                <ColorField
                                    label="Text"
                                    value={form.text_color}
                                    onChange={(v) => set('text_color', v)}
                                />
                                <ColorField
                                    label="Highlight"
                                    value={form.highlight_color}
                                    onChange={(v) => set('highlight_color', v)}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>Text Size</label>
                                <Segmented
                                    value={form.font_size}
                                    onChange={(v) => set('font_size', v)}
                                    options={FONT_SIZES}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>Separator</label>
                                <Segmented
                                    value={form.separator}
                                    onChange={(v) => set('separator', v)}
                                    options={SEPARATORS}
                                />
                            </div>
                            <div className="flex flex-col items-start gap-3">
                                <Toggle
                                    checked={form.tilted}
                                    onChange={(v) => set('tilted', v)}
                                    onLabel="Tilted ribbon"
                                    offLabel="Straight banner"
                                />
                                <Toggle
                                    checked={form.double_row}
                                    onChange={(v) => set('double_row', v)}
                                    onLabel="Two rows (opposite directions)"
                                    offLabel="Single row"
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
