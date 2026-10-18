import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/upload-limits';
import AdminLayout from '@/components/admin/AdminLayout';
import {
    Card,
    getCsrf,
    INPUT,
    LABEL,
    Segmented,
    Toggle,
} from '@/components/admin/form-controls';
import { PopupCarousel } from '@/components/portfolio/PopupCarousel';
import {
    Check,
    ChevronDown,
    ChevronUp,
    Eye,
    Image as ImageIcon,
    Loader2,
    Save,
    Trash2,
    Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Must match Popup::MAX_SLIDES and the shared upload limits.
const MAX_SLIDES = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const FREQUENCIES = [
    { value: 'once', label: 'Once per visitor' },
    { value: 'session', label: 'Once per visit' },
    { value: 'always', label: 'Every page load' },
];
const FREQUENCY_HELP = {
    once: 'Shown until the visitor closes it. Saving changes here shows it again to everyone — handy for a new campaign.',
    session: 'Shown again each time the visitor comes back in a new browser session.',
    always: 'Shown every time the home page loads. Use sparingly — it can annoy returning visitors.',
};

const ASPECT_RATIOS = [
    { value: '1/1', label: 'Square 1:1', size: '1080 × 1080 px' },
    { value: '4/5', label: 'Portrait 4:5', size: '1080 × 1350 px' },
    { value: '16/9', label: 'Landscape 16:9', size: '1600 × 900 px' },
];

async function uploadSlideImage(file) {
    const body = new FormData();
    body.append('image', file);
    const res = await fetch('/spa/admin/popup/upload-image', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.errors?.image?.[0] || json?.message || 'Upload failed.');
    }
    return json.url;
}

export default function PopupAdmin() {
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        fetch('/spa/admin/popup', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) setForm({ ...data, slides: data.slides ?? [] });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const set = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSavedMsg('');
        setErrorMsg('');
    };

    const updateSlide = (index, patch) =>
        set(
            'slides',
            form.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
        );

    const moveSlide = (index, dir) => {
        const target = index + dir;
        if (target < 0 || target >= form.slides.length) return;
        const next = [...form.slides];
        [next[index], next[target]] = [next[target], next[index]];
        set('slides', next);
    };

    const removeSlide = (index) =>
        set(
            'slides',
            form.slides.filter((_, i) => i !== index),
        );

    // Uploads one file at a time (server throttle + memory), adding a slide for each.
    const addFiles = async (fileList) => {
        setUploadError('');
        const room = MAX_SLIDES - form.slides.length;
        const files = Array.from(fileList ?? []).slice(0, room);
        if (!files.length) {
            if (room <= 0) setUploadError(`A popup can have at most ${MAX_SLIDES} slides.`);
            return;
        }
        setUploading(true);
        const added = [];
        const problems = [];
        for (const file of files) {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                problems.push(`${file.name}: only JPG, PNG or WebP.`);
                continue;
            }
            if (file.size > MAX_UPLOAD_BYTES) {
                problems.push(`${file.name}: must be ${MAX_UPLOAD_LABEL} or smaller.`);
                continue;
            }
            try {
                const url = await uploadSlideImage(file);
                added.push({ image_url: url, link_url: '', alt: '', alt_ar: '' });
            } catch (e) {
                problems.push(`${file.name}: ${e.message}`);
            }
        }
        if (added.length) {
            setForm((prev) => ({ ...prev, slides: [...prev.slides, ...added] }));
            setSavedMsg('');
        }
        if (fileList.length > room) {
            problems.push(`Only ${MAX_SLIDES} slides are allowed — extra files were skipped.`);
        }
        setUploadError(problems.join(' '));
        setUploading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch('/spa/admin/popup', {
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
                setForm({ ...json, slides: json.slides ?? [] });
                setSavedMsg('Popup saved!');
                setTimeout(() => setSavedMsg(''), 3000);
            } else {
                setErrorMsg(json?.message || 'Failed to save. Please try again.');
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
                    <p className="text-sm text-[#5A6A9A]">Could not load the popup settings.</p>
                )}
            </div>
        );
    }

    const aspect = ASPECT_RATIOS.find((a) => a.value === form.aspect_ratio) ?? ASPECT_RATIOS[0];
    const canAddMore = form.slides.length < MAX_SLIDES;

    return (
        <AdminLayout
            title="Popup"
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
                        type="button"
                        onClick={() => setShowPreview(true)}
                        disabled={!form.slides.length}
                        className="inline-flex items-center gap-2 rounded-full border border-[#D1D5E8] bg-white px-4 py-2 text-sm font-semibold text-[#213C93] transition-colors hover:border-[#213C93] disabled:opacity-50"
                    >
                        <Eye size={14} />
                        Preview
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="inline-flex items-center gap-2 rounded-full bg-[#DDB50E] px-5 py-2 text-sm font-bold text-[#0D1B4B] transition-colors hover:bg-[#FCD532] disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <Card
                    title="Visibility"
                    subtitle="A popup window with an image carousel, shown on the home page."
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <Toggle
                            checked={form.is_enabled}
                            onChange={(v) => set('is_enabled', v)}
                            onLabel="Popup is ON"
                            offLabel="Popup is OFF"
                        />
                        {form.is_enabled && !form.slides.length && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Add at least one slide — an empty popup is never shown.
                            </span>
                        )}
                    </div>

                    <div>
                        <label className={LABEL}>How often</label>
                        <Segmented
                            options={FREQUENCIES}
                            value={form.frequency}
                            onChange={(v) => set('frequency', v)}
                        />
                        <p className="mt-2 text-xs text-[#5A6A9A]">{FREQUENCY_HELP[form.frequency]}</p>
                    </div>

                    <div className="max-w-xs">
                        <label className={LABEL}>Delay before showing (seconds)</label>
                        <input
                            type="number"
                            min={0}
                            max={60}
                            value={form.delay_seconds}
                            onChange={(e) => set('delay_seconds', Number(e.target.value))}
                            className={INPUT}
                        />
                    </div>
                </Card>

                <Card title="Carousel">
                    <div>
                        <label className={LABEL}>Image shape</label>
                        <Segmented
                            options={ASPECT_RATIOS}
                            value={form.aspect_ratio}
                            onChange={(v) => set('aspect_ratio', v)}
                        />
                        <p className="mt-2 text-xs text-[#5A6A9A]">
                            Recommended size <strong className="font-semibold text-[#213C93]">{aspect.size}</strong>.
                            Images are cropped to fill this shape, so keep the important part centred.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-4">
                        <Toggle
                            checked={form.autoplay}
                            onChange={(v) => set('autoplay', v)}
                            onLabel="Auto-advance ON"
                            offLabel="Auto-advance OFF"
                        />
                        {form.autoplay && (
                            <div className="w-48">
                                <label className={LABEL}>Seconds per slide</label>
                                <input
                                    type="number"
                                    min={2}
                                    max={30}
                                    value={form.interval_seconds}
                                    onChange={(e) => set('interval_seconds', Number(e.target.value))}
                                    className={INPUT}
                                />
                            </div>
                        )}
                    </div>
                </Card>

                <Card
                    title={`Slides (${form.slides.length}/${MAX_SLIDES})`}
                    subtitle={`Shown in this order. JPG, PNG or WebP, up to ${MAX_UPLOAD_LABEL} each — converted to WebP automatically.`}
                >
                    {form.slides.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#D1D5E8] py-10 text-center text-sm text-[#5A6A9A]">
                            <ImageIcon size={28} className="mx-auto mb-2 opacity-40" />
                            No slides yet — upload one or more images below.
                        </div>
                    )}

                    {form.slides.map((slide, i) => (
                        <div
                            key={slide.image_url}
                            className="flex flex-col gap-4 rounded-xl border border-[#D1D5E8] p-4 sm:flex-row"
                        >
                            <img
                                src={slide.image_url}
                                alt=""
                                className="w-full shrink-0 rounded-lg border border-[#D1D5E8] object-cover sm:w-32"
                                style={{ aspectRatio: form.aspect_ratio }}
                            />
                            <div className="grid flex-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className={LABEL}>Description (English)</label>
                                    <input
                                        type="text"
                                        value={slide.alt ?? ''}
                                        maxLength={160}
                                        placeholder="What the image shows"
                                        onChange={(e) => updateSlide(i, { alt: e.target.value })}
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Description (Arabic)</label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={slide.alt_ar ?? ''}
                                        maxLength={160}
                                        onChange={(e) => updateSlide(i, { alt_ar: e.target.value })}
                                        className={`${INPUT} font-arabic`}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={LABEL}>Link when clicked (optional)</label>
                                    <input
                                        type="text"
                                        value={slide.link_url ?? ''}
                                        maxLength={2048}
                                        placeholder="https://…, /events/…, or #contact"
                                        onChange={(e) => updateSlide(i, { link_url: e.target.value })}
                                        className={INPUT}
                                    />
                                </div>
                            </div>
                            <div className="flex shrink-0 items-start gap-1 sm:flex-col">
                                <button
                                    type="button"
                                    onClick={() => moveSlide(i, -1)}
                                    disabled={i === 0}
                                    title="Move up"
                                    className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#E8EAF6] hover:text-[#213C93] disabled:opacity-30"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveSlide(i, 1)}
                                    disabled={i === form.slides.length - 1}
                                    title="Move down"
                                    className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-[#E8EAF6] hover:text-[#213C93] disabled:opacity-30"
                                >
                                    <ChevronDown size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeSlide(i)}
                                    title="Remove slide"
                                    className="rounded-lg p-2 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="space-y-2">
                        <label
                            className={`inline-flex items-center gap-2 rounded-xl bg-[#E8EAF6] px-4 py-2.5 text-sm font-semibold text-[#213C93] transition-colors ${
                                canAddMore && !uploading ? 'cursor-pointer hover:bg-[#D1D5E8]' : 'cursor-not-allowed opacity-60'
                            }`}
                        >
                            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                            {uploading ? 'Uploading…' : 'Upload images'}
                            <input
                                type="file"
                                accept={ACCEPTED_TYPES.join(',')}
                                multiple
                                disabled={!canAddMore || uploading}
                                className="hidden"
                                onChange={(e) => {
                                    addFiles(e.target.files);
                                    e.target.value = '';
                                }}
                            />
                        </label>
                        <p className="text-xs text-[#5A6A9A]">
                            You can select several images at once. Click “Save” to publish your changes.
                        </p>
                        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                    </div>
                </Card>
            </div>

            {showPreview && form.slides.length > 0 && (
                <PopupCarousel
                    popup={{
                        ...form,
                        slides: form.slides.map((s) => ({ ...s, link_url: null })), // links off in the preview
                    }}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </AdminLayout>
    );
}
