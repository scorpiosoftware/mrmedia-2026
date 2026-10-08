import AdminLayout from '@/components/admin/AdminLayout';
import { Check, Eye, EyeOff, Loader2, MessageCircle, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const DEFAULT_FORM = {
    driver: 'smtp',
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    from_address: '',
    from_name: '',
    to_address: '',
    whatsapp_number: '',
    whatsapp_visible: true,
};

export default function EmailSettings() {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [hasPassword, setHasPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [testing, setTesting] = useState(false);
    const [testMsg, setTestMsg] = useState('');
    const [testError, setTestError] = useState('');

    useEffect(() => {
        fetch('/spa/admin/email-settings', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    setHasPassword(data.has_password ?? false);
                    setForm({
                        driver: data.driver ?? 'smtp',
                        host: data.host ?? '',
                        port: data.port ?? 587,
                        username: data.username ?? '',
                        password: '',
                        encryption: data.encryption ?? 'tls',
                        from_address: data.from_address ?? '',
                        from_name: data.from_name ?? '',
                        to_address: data.to_address ?? '',
                        whatsapp_number: data.whatsapp_number ?? '',
                        whatsapp_visible: data.whatsapp_visible ?? true,
                    });
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

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch('/spa/admin/email-settings', {
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
                setSavedMsg('Settings saved!');
                if (form.password) setHasPassword(true);
                setForm((prev) => ({ ...prev, password: '' }));
                setTimeout(() => setSavedMsg(''), 3000);
            } else {
                setErrorMsg(json?.message || 'Failed to save settings.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (e) => {
        e.preventDefault();
        setTesting(true);
        setTestMsg('');
        setTestError('');
        try {
            const res = await fetch('/spa/admin/email-settings/test', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ to: testEmail }),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setTestMsg(json.message || 'Test email sent!');
                setTimeout(() => setTestMsg(''), 5000);
            } else {
                setTestError(json.message || 'Test failed.');
            }
        } catch {
            setTestError('Network error.');
        } finally {
            setTesting(false);
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
            title="Email Settings"
            actions={
                savedMsg && (
                    <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        <Check size={12} /> {savedMsg}
                    </span>
                )
            }
        >
            <div className="mx-auto max-w-3xl space-y-6">
                {/* SMTP Settings */}
                <form onSubmit={handleSave}>
                    <div className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white">
                        <div className="border-b border-[#E8EAF6] px-6 py-5">
                            <h2 className="font-bold text-[#0D1B4B]">
                                SMTP Configuration
                            </h2>
                            <p className="mt-0.5 text-sm text-[#5A6A9A]">
                                Configure your outgoing mail server
                            </p>
                        </div>

                        <div className="space-y-5 p-6">
                            {errorMsg && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {errorMsg}
                                </div>
                            )}

                            {/* Driver */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Mail Driver
                                </label>
                                <select
                                    value={form.driver}
                                    onChange={(e) =>
                                        set('driver', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                >
                                    <option value="smtp">SMTP</option>
                                    <option value="log">
                                        Log (development)
                                    </option>
                                    <option value="sendmail">Sendmail</option>
                                </select>
                            </div>

                            {form.driver === 'smtp' && (
                                <>
                                    {/* Host + Port */}
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="sm:col-span-2">
                                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                                SMTP Host
                                            </label>
                                            <input
                                                type="text"
                                                value={form.host}
                                                onChange={(e) =>
                                                    set('host', e.target.value)
                                                }
                                                placeholder="smtp.gmail.com"
                                                className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                                Port
                                            </label>
                                            <input
                                                type="number"
                                                value={form.port}
                                                onChange={(e) =>
                                                    set(
                                                        'port',
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ),
                                                    )
                                                }
                                                placeholder="587"
                                                className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Encryption */}
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                            Encryption
                                        </label>
                                        <select
                                            value={form.encryption ?? ''}
                                            onChange={(e) =>
                                                set(
                                                    'encryption',
                                                    e.target.value || null,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        >
                                            <option value="tls">
                                                TLS (recommended)
                                            </option>
                                            <option value="ssl">SSL</option>
                                            <option value="starttls">
                                                STARTTLS
                                            </option>
                                            <option value="">None</option>
                                        </select>
                                    </div>

                                    {/* Username + Password */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                value={form.username}
                                                onChange={(e) =>
                                                    set(
                                                        'username',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="you@gmail.com"
                                                autoComplete="off"
                                                className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                                Password
                                                {hasPassword && (
                                                    <span className="ml-2 font-normal text-green-600 normal-case">
                                                        (saved — leave blank to
                                                        keep)
                                                    </span>
                                                )}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={form.password}
                                                    onChange={(e) =>
                                                        set(
                                                            'password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={
                                                        hasPassword
                                                            ? '••••••••'
                                                            : 'App password or SMTP password'
                                                    }
                                                    autoComplete="new-password"
                                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 pr-11 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (v) => !v,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#5A6A9A] hover:text-[#213C93]"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* From + To */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        From Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.from_name}
                                        onChange={(e) =>
                                            set('from_name', e.target.value)
                                        }
                                        required
                                        placeholder="Mr.MEDIA"
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        From Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.from_address}
                                        onChange={(e) =>
                                            set('from_address', e.target.value)
                                        }
                                        required
                                        placeholder="noreply@mrmedia.com"
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Contact Form Recipient
                                </label>
                                <input
                                    type="email"
                                    value={form.to_address}
                                    onChange={(e) =>
                                        set('to_address', e.target.value)
                                    }
                                    placeholder="admin@mrmedia.com"
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                                <p className="mt-1.5 text-xs text-[#5A6A9A]">
                                    Contact form submissions will be sent to
                                    this address.
                                </p>
                            </div>

                            <div className="border-t border-[#E8EAF6] pt-2">
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#25D366] uppercase">
                                    WhatsApp Number
                                </label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[#25D366]">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="h-4 w-4"
                                        >
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={form.whatsapp_number}
                                        onChange={(e) =>
                                            set(
                                                'whatsapp_number',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="+1 234 567 8900"
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] py-3 pr-4 pl-10 text-sm text-[#0D1B4B] focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 focus:outline-none"
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-[#5A6A9A]">
                                    Include country code (e.g. +966501234567).
                                </p>

                                {/* Visibility toggle */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        set(
                                            'whatsapp_visible',
                                            !form.whatsapp_visible,
                                        )
                                    }
                                    className={`mt-3 inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                        form.whatsapp_visible
                                            ? 'border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20'
                                            : 'border-[#D1D5E8] bg-[#F1F1F0] text-[#5A6A9A] hover:border-[#213C93]/40'
                                    }`}
                                >
                                    {/* Track */}
                                    <span
                                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${form.whatsapp_visible ? 'bg-[#25D366]' : 'bg-[#D1D5E8]'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.whatsapp_visible ? 'translate-x-4' : 'translate-x-0'}`}
                                        />
                                    </span>
                                    {form.whatsapp_visible
                                        ? 'Button visible on site'
                                        : 'Button hidden from site'}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-[#E8EAF6] px-6 py-4">
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
                                {saving ? 'Saving…' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Test Email */}
                <form onSubmit={handleTest}>
                    <div className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white">
                        <div className="border-b border-[#E8EAF6] px-6 py-5">
                            <h2 className="font-bold text-[#0D1B4B]">
                                Send Test Email
                            </h2>
                            <p className="mt-0.5 text-sm text-[#5A6A9A]">
                                Verify your configuration by sending a test
                                message
                            </p>
                        </div>
                        <div className="space-y-4 p-6">
                            {testMsg && (
                                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    <Check size={15} /> {testMsg}
                                </div>
                            )}
                            {testError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {testError}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => {
                                        setTestEmail(e.target.value);
                                        setTestMsg('');
                                        setTestError('');
                                    }}
                                    required
                                    placeholder="recipient@example.com"
                                    className="flex-1 rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={testing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#DDB50E] px-5 py-2.5 text-sm font-bold whitespace-nowrap text-[#0D1B4B] transition-colors hover:bg-[#FCD532] disabled:opacity-60"
                                >
                                    {testing ? (
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Send size={15} />
                                    )}
                                    {testing ? 'Sending…' : 'Send Test'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
