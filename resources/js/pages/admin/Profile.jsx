import AdminLayout from '@/components/admin/AdminLayout';
import { Check, Eye, EyeOff, Loader2, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const EMPTY_PASSWORD_FORM = {
    current_password: '',
    password: '',
    password_confirmation: '',
};

export default function AdminProfile() {
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetch('/spa/admin/profile', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                setAccount(data);
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
        setSavedMsg('');
        setErrorMsg('');
        try {
            const res = await fetch('/spa/admin/profile/password', {
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
                setSavedMsg('Password updated!');
                setForm(EMPTY_PASSWORD_FORM);
                setTimeout(() => setSavedMsg(''), 3000);
            } else {
                const firstError = json?.errors
                    ? Object.values(json.errors)[0]?.[0]
                    : null;
                setErrorMsg(firstError || json?.message || 'Failed to update password.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
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
            title="Profile"
            actions={
                savedMsg && (
                    <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        <Check size={12} /> {savedMsg}
                    </span>
                )
            }
        >
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Account info */}
                <div className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white">
                    <div className="border-b border-[#E8EAF6] px-6 py-5">
                        <h2 className="font-bold text-[#0D1B4B]">Account</h2>
                    </div>
                    <div className="flex items-center gap-4 p-6">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8EAF6] text-[#213C93]">
                            <UserCircle size={28} />
                        </div>
                        <div>
                            <p className="font-bold text-[#0D1B4B]">
                                {account?.name || '—'}
                            </p>
                            <p className="text-sm text-[#5A6A9A]">
                                {account?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Change password */}
                <form onSubmit={handleSave}>
                    <div className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white">
                        <div className="border-b border-[#E8EAF6] px-6 py-5">
                            <h2 className="font-bold text-[#0D1B4B]">
                                Change Password
                            </h2>
                            <p className="mt-0.5 text-sm text-[#5A6A9A]">
                                Update the password you use to sign in to this
                                admin panel
                            </p>
                        </div>

                        <div className="space-y-5 p-6">
                            {errorMsg && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={form.current_password}
                                        onChange={(e) =>
                                            set('current_password', e.target.value)
                                        }
                                        required
                                        autoComplete="current-password"
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 pr-11 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent((v) => !v)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-[#5A6A9A] hover:text-[#213C93]"
                                    >
                                        {showCurrent ? (
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={(e) =>
                                                set('password', e.target.value)
                                            }
                                            required
                                            autoComplete="new-password"
                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 pr-11 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew((v) => !v)}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#5A6A9A] hover:text-[#213C93]"
                                        >
                                            {showNew ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={form.password_confirmation}
                                        onChange={(e) =>
                                            set(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        autoComplete="new-password"
                                        className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-[#E8EAF6] px-6 py-4">
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
                                {saving ? 'Saving…' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
