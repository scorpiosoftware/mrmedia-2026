import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, TOO_LARGE_MESSAGE } from '@/lib/upload-limits';
import AdminLayout from '@/components/admin/AdminLayout';
import { LOGO_DARK_SRC, LOGO_SRC } from '@/lib/brand-logos';
import { THEME_COLOR_KEYS, themeVars } from '@/lib/site-theme';
import {
    ArrowUpRight,
    Check,
    Globe,
    Image as ImageIcon,
    Loader2,
    Monitor,
    Moon,
    Palette,
    Save,
    Sun,
    Trash2,
    Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const COLOR_KEYS = THEME_COLOR_KEYS.map((c) => c.key);
const LABEL =
    'mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase';
const INPUT =
    'w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none';

function Card({ title, subtitle, Icon, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white">
            <div className="flex items-start gap-3 border-b border-[#E8EAF6] px-6 py-4">
                {Icon && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EAF6] text-[#213C93]">
                        <Icon size={17} />
                    </div>
                )}
                <div>
                    <h2 className="font-bold text-[#0D1B4B]">{title}</h2>
                    {subtitle && (
                        <p className="mt-0.5 text-sm text-[#5A6A9A]">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className="space-y-5 p-6">{children}</div>
        </div>
    );
}

function Choice({ options, value, onChange }) {
    return (
        <div className="grid gap-2 sm:grid-cols-3">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-start text-sm font-semibold transition-all ${
                        value === o.value
                            ? 'border-[#213C93] bg-[#213C93]/5 text-[#213C93] ring-2 ring-[#213C93]/20'
                            : 'border-[#D1D5E8] text-[#0D1B4B] hover:border-[#213C93]/40'
                    }`}
                >
                    {o.Icon && <o.Icon size={16} className="shrink-0" />}
                    <span className="flex-1">
                        {o.label}
                        {o.hint && (
                            <span className="block text-xs font-normal text-[#5A6A9A]">
                                {o.hint}
                            </span>
                        )}
                    </span>
                    {value === o.value && (
                        <Check size={15} className="shrink-0" />
                    )}
                </button>
            ))}
        </div>
    );
}

// Requirements per branding slot — shown as tips and enforced by the server.
const BRANDING_SLOTS = [
    {
        field: 'logo_url',
        label: 'Logo — Light Backgrounds',
        endpoint: '/spa/admin/site-settings/upload-logo',
        fallback: LOGO_SRC,
        previewBg: 'bg-white',
        tip: (
            <>
                Shown on white/light areas, like the navbar once the page
                scrolls. Recommended{' '}
                <strong className="font-semibold text-[#213C93]">
                    512 × 512 px
                </strong>{' '}
                or larger, at least 128 × 128 px. Use a{' '}
                <strong className="font-semibold text-[#213C93]">
                    transparent PNG or WebP
                </strong>{' '}
                with a dark/coloured mark. It's fitted inside a square, so a
                square-ish logo with little empty margin looks best.
            </>
        ),
    },
    {
        field: 'logo_dark_url',
        label: 'Logo — Dark Backgrounds',
        endpoint: '/spa/admin/site-settings/upload-logo',
        fallback: LOGO_DARK_SRC,
        previewBg: 'bg-[#0D1B4B]',
        tip: (
            <>
                Shown on dark/coloured areas: the top of the navbar, dark mode,
                the hero, About card and banner. Recommended{' '}
                <strong className="font-semibold text-[#213C93]">
                    512 × 512 px
                </strong>{' '}
                or larger, at least 128 × 128 px. Use a{' '}
                <strong className="font-semibold text-[#213C93]">
                    transparent PNG or WebP
                </strong>{' '}
                with a light/white mark. Leave empty to reuse the
                light-background logo.
            </>
        ),
    },
    {
        field: 'favicon_url',
        label: 'Site Icon (Favicon)',
        endpoint: '/spa/admin/site-settings/upload-favicon',
        fallback: '/favicon.svg',
        previewBg: 'bg-[#F1F1F0]',
        favicon: true,
        tip: (
            <>
                The small icon in browser tabs, bookmarks and phone home
                screens. Must be a{' '}
                <strong className="font-semibold text-[#213C93]">
                    square PNG
                </strong>
                , at least 48 × 48 px —{' '}
                <strong className="font-semibold text-[#213C93]">
                    512 × 512 px
                </strong>{' '}
                recommended. Keep it simple and bold: it's shown as small as 16
                px.
            </>
        ),
    },
];

/** One branding upload: preview on a matching background, upload/replace/remove, tips and errors. */
function BrandingUpload({ slot, value, onChange }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const upload = async (file) => {
        if (!file) return;
        setError('');
        const allowed = slot.favicon
            ? ['image/png']
            : ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setError(
                slot.favicon
                    ? 'The site icon must be a PNG file.'
                    : 'Only JPG, PNG or WebP images are allowed.',
            );
            return;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
            setError(TOO_LARGE_MESSAGE);
            return;
        }
        setUploading(true);
        try {
            const body = new FormData();
            body.append('image', file);
            const res = await fetch(slot.endpoint, {
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

    const src = value || slot.fallback;

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {slot.favicon ? (
                /* Favicon shown inside a mock browser tab */
                <div className="w-44 shrink-0 overflow-hidden rounded-lg border border-[#D1D5E8] bg-[#E8EAF6]">
                    <div className="flex gap-1 px-2 pt-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5A6A9A]/40" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5A6A9A]/40" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5A6A9A]/40" />
                    </div>
                    <div className="mx-2 mt-1.5 flex items-center gap-1.5 rounded-t-md bg-white px-2 py-1.5">
                        <img
                            src={src}
                            alt=""
                            className="h-4 w-4 shrink-0 object-contain"
                        />
                        <span className="truncate text-[10px] font-semibold text-[#0D1B4B]">
                            Website tab
                        </span>
                    </div>
                    <div className="flex h-14 items-center justify-center bg-white">
                        <img
                            src={src}
                            alt=""
                            className="h-10 w-10 rounded-lg object-contain"
                        />
                    </div>
                </div>
            ) : (
                <div
                    className={`flex h-28 w-44 shrink-0 items-center justify-center rounded-lg border border-[#D1D5E8] p-3 ${slot.previewBg}`}
                >
                    <img
                        src={src}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            )}

            <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="me-auto text-sm font-bold text-[#0D1B4B]">
                        {slot.label}
                        {!value && (
                            <span className="ms-2 text-xs font-normal text-[#5A6A9A]">
                                (using default)
                            </span>
                        )}
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E8EAF6] px-3.5 py-2 text-xs font-semibold text-[#213C93] transition-colors hover:bg-[#D1D5E8]">
                        {uploading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Upload size={14} />
                        )}
                        {uploading
                            ? 'Uploading…'
                            : value
                              ? 'Replace'
                              : 'Upload'}
                        <input
                            type="file"
                            accept={
                                slot.favicon
                                    ? 'image/png'
                                    : 'image/jpeg,image/png,image/webp'
                            }
                            disabled={uploading}
                            className="hidden"
                            onChange={(e) => {
                                upload(e.target.files?.[0]);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            title="Remove and use the default"
                            className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
                <p className="text-xs leading-relaxed text-[#5A6A9A]">
                    {slot.tip} Max {MAX_UPLOAD_LABEL} and 6000 px per side.
                </p>
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        </div>
    );
}

function Swatches({ colors }) {
    return (
        <div className="flex h-10 overflow-hidden rounded-lg">
            {[
                'dark',
                'primary',
                'primary_light',
                'accent',
                'accent_bright',
                'background',
            ].map((k) => (
                <span
                    key={k}
                    className="flex-1"
                    style={{ backgroundColor: colors[k] }}
                />
            ))}
        </div>
    );
}

/** A miniature of the public site, rendered with the same theme tokens the real pages use. */
function ThemePreview({ theme, colors, siteName, tagline }) {
    return (
        <div
            style={themeVars(theme, colors)}
            className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-brand-bg shadow-[0_8px_32px_rgba(13,27,75,0.10)]"
        >
            {/* Navbar */}
            <div className="flex items-center justify-between bg-brand-dark px-4 py-2.5">
                <span className="text-sm font-black text-white">
                    {siteName || 'Site name'}
                </span>
                <span className="rounded-full bg-brand-gold px-3 py-1 text-[10px] font-bold text-brand-dark">
                    Get Started
                </span>
            </div>
            {/* Hero */}
            <div className="bg-brand-gradient px-5 py-7 text-center">
                <span className="inline-block rounded-full bg-white/15 px-3 py-0.5 text-[10px] font-bold tracking-widest text-brand-yellow uppercase">
                    Welcome
                </span>
                <p className="mt-2 text-lg leading-tight font-black text-white">
                    {tagline || 'Your tagline here'}
                </p>
                <span className="btn-gold-shimmer mt-3 inline-block rounded-full px-4 py-1.5 text-[11px] font-bold text-brand-dark">
                    Start Your Project
                </span>
            </div>
            {/* Cards */}
            <div className="grid grid-cols-2 gap-3 p-4">
                {['Brand Strategy', 'Digital Marketing'].map((title) => (
                    <div
                        key={title}
                        className="rounded-xl border border-border bg-white p-3"
                    >
                        <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-brand-blue">
                            <ArrowUpRight size={14} />
                        </span>
                        <p className="text-xs font-bold text-brand-dark">
                            {title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Muted body text
                        </p>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-center gap-2 px-4 pb-4">
                <span className="rounded-full bg-brand-blue px-4 py-1.5 text-[11px] font-bold text-white">
                    Primary button
                </span>
                <span className="rounded-full border-2 border-brand-blue px-4 py-1 text-[11px] font-bold text-brand-blue">
                    Outline
                </span>
            </div>
        </div>
    );
}

export default function SiteSettings() {
    const [form, setForm] = useState(null);
    const [themes, setThemes] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetch('/spa/admin/site-settings', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    setThemes(data.themes ?? {});
                    setForm(data.settings);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const set = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSavedMsg('');
        setErrorMsg('');
    };

    const presetColors = (key) =>
        Object.fromEntries(COLOR_KEYS.map((k) => [k, themes[key]?.[k]]));

    const activeColors =
        form?.theme === 'custom'
            ? { ...presetColors('classic'), ...(form.custom_colors ?? {}) }
            : presetColors(form?.theme);

    const chooseTheme = (key) => {
        if (key === 'custom' && !form.custom_colors) {
            // Start the custom palette from whatever theme was selected, so it's a tweak, not a blank slate.
            setForm((prev) => ({
                ...prev,
                theme: 'custom',
                custom_colors: activeColors,
            }));
        } else {
            set('theme', key);
        }
    };

    const setCustomColor = (key, value) =>
        set('custom_colors', { ...activeColors, [key]: value });

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch('/spa/admin/site-settings', {
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
                setForm(json.settings);
                setSavedMsg(
                    'Settings saved! Visitors see them on their next page load.',
                );
                setTimeout(() => setSavedMsg(''), 4000);
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
                        Could not load the site settings.
                    </p>
                )}
            </div>
        );
    }

    return (
        <AdminLayout
            title="Site Settings"
            actions={
                <>
                    {savedMsg && (
                        <span className="hidden items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 sm:flex">
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
            <div className="grid gap-6 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-3">
                    {/* Identity */}
                    <Card
                        Icon={Globe}
                        title="Website Identity"
                        subtitle="Used in browser tabs, search results and link previews."
                    >
                        <div>
                            <label className={LABEL}>Website Name</label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    type="text"
                                    value={form.site_name ?? ''}
                                    onChange={(e) =>
                                        set('site_name', e.target.value)
                                    }
                                    placeholder="🇬🇧 English (required)"
                                    maxLength={100}
                                    className={INPUT}
                                />
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={form.site_name_ar ?? ''}
                                    onChange={(e) =>
                                        set('site_name_ar', e.target.value)
                                    }
                                    placeholder="🇸🇦 Arabic"
                                    maxLength={100}
                                    className={`${INPUT} font-arabic`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL}>Tagline</label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    type="text"
                                    value={form.tagline ?? ''}
                                    onChange={(e) =>
                                        set('tagline', e.target.value)
                                    }
                                    placeholder="🇬🇧 English"
                                    maxLength={160}
                                    className={INPUT}
                                />
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={form.tagline_ar ?? ''}
                                    onChange={(e) =>
                                        set('tagline_ar', e.target.value)
                                    }
                                    placeholder="🇸🇦 Arabic"
                                    maxLength={160}
                                    className={`${INPUT} font-arabic`}
                                />
                            </div>
                        </div>
                        <div className="rounded-xl bg-[#F1F1F0] px-4 py-3">
                            <p className="mb-1 text-xs font-semibold text-[#5A6A9A]">
                                Home page tab title
                            </p>
                            <p className="truncate text-sm font-semibold text-[#0D1B4B]">
                                {form.tagline
                                    ? `${form.site_name} | ${form.tagline}`
                                    : form.site_name}
                            </p>
                        </div>
                    </Card>

                    {/* Branding */}
                    <Card
                        Icon={ImageIcon}
                        title="Logos & Site Icon"
                        subtitle="Upload, then click Save to publish. Removing one goes back to the default artwork."
                    >
                        {BRANDING_SLOTS.map((slot, i) => (
                            <div
                                key={slot.field}
                                className={
                                    i
                                        ? 'border-t border-[#E8EAF6] pt-5'
                                        : undefined
                                }
                            >
                                <BrandingUpload
                                    slot={slot}
                                    value={form[slot.field]}
                                    onChange={(url) => set(slot.field, url)}
                                />
                            </div>
                        ))}
                    </Card>

                    {/* Defaults */}
                    <Card
                        Icon={Monitor}
                        title="Language & Appearance"
                        subtitle="What first-time visitors see. Anyone who switches language or dark mode keeps their own choice."
                    >
                        <div>
                            <label className={LABEL}>Default Language</label>
                            <Choice
                                value={form.default_locale}
                                onChange={(v) => set('default_locale', v)}
                                options={[
                                    {
                                        value: 'en',
                                        label: 'English',
                                        hint: 'Left-to-right',
                                    },
                                    {
                                        value: 'ar',
                                        label: 'العربية',
                                        hint: 'Right-to-left',
                                    },
                                ]}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Default Appearance</label>
                            <Choice
                                value={form.default_appearance}
                                onChange={(v) => set('default_appearance', v)}
                                options={[
                                    {
                                        value: 'system',
                                        label: 'System',
                                        hint: "Follows the visitor's device",
                                        Icon: Monitor,
                                    },
                                    {
                                        value: 'light',
                                        label: 'Light',
                                        Icon: Sun,
                                    },
                                    {
                                        value: 'dark',
                                        label: 'Dark',
                                        Icon: Moon,
                                    },
                                ]}
                            />
                        </div>
                    </Card>

                    {/* Theme */}
                    <Card
                        Icon={Palette}
                        title="Theme"
                        subtitle="Colours for the public website. The admin panel keeps its own look."
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(themes).map(([key, preset]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => chooseTheme(key)}
                                    className={`rounded-xl border p-3 text-start transition-all ${
                                        form.theme === key
                                            ? 'border-[#213C93] ring-2 ring-[#213C93]/20'
                                            : 'border-[#D1D5E8] hover:border-[#213C93]/40'
                                    }`}
                                >
                                    <Swatches colors={preset} />
                                    <span className="mt-2 flex items-center justify-between text-sm font-semibold text-[#0D1B4B]">
                                        {preset.name}
                                        {form.theme === key && (
                                            <Check
                                                size={15}
                                                className="text-[#213C93]"
                                            />
                                        )}
                                    </span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => chooseTheme('custom')}
                                className={`rounded-xl border p-3 text-start transition-all ${
                                    form.theme === 'custom'
                                        ? 'border-[#213C93] ring-2 ring-[#213C93]/20'
                                        : 'border-dashed border-[#D1D5E8] hover:border-[#213C93]/40'
                                }`}
                            >
                                {form.custom_colors ? (
                                    <Swatches colors={form.custom_colors} />
                                ) : (
                                    <div className="flex h-10 items-center justify-center rounded-lg bg-[conic-gradient(at_center,#213C93,#0F766E,#DDB50E,#B91C1C,#5B21B6,#213C93)] opacity-70" />
                                )}
                                <span className="mt-2 flex items-center justify-between text-sm font-semibold text-[#0D1B4B]">
                                    Custom
                                    {form.theme === 'custom' && (
                                        <Check
                                            size={15}
                                            className="text-[#213C93]"
                                        />
                                    )}
                                </span>
                            </button>
                        </div>

                        {form.theme === 'custom' && (
                            <div className="grid gap-4 border-t border-[#E8EAF6] pt-5 sm:grid-cols-2">
                                {THEME_COLOR_KEYS.map(
                                    ({ key, label, hint }) => (
                                        <div key={key}>
                                            <label className={LABEL}>
                                                {label}{' '}
                                                <span className="font-normal tracking-normal normal-case">
                                                    — {hint}
                                                </span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={activeColors[key]}
                                                    onChange={(e) =>
                                                        setCustomColor(
                                                            key,
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-[#D1D5E8] bg-white p-1"
                                                />
                                                <input
                                                    type="text"
                                                    value={activeColors[key]}
                                                    onChange={(e) =>
                                                        setCustomColor(
                                                            key,
                                                            e.target.value,
                                                        )
                                                    }
                                                    maxLength={7}
                                                    className={`${INPUT} font-mono uppercase`}
                                                />
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Live preview */}
                <div className="lg:col-span-2">
                    <div className="space-y-3 lg:sticky lg:top-[calc(var(--admin-header-h,0px)+1.5rem)]">
                        <p className="text-xs font-bold tracking-widest text-[#213C93] uppercase">
                            Live Preview
                        </p>
                        <ThemePreview
                            theme={form.theme}
                            colors={activeColors}
                            siteName={form.site_name}
                            tagline={form.tagline}
                        />
                        <p className="text-xs text-[#5A6A9A]">
                            A miniature of the website using the selected
                            colours. Text and buttons with poor contrast here
                            will look the same on the site.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
