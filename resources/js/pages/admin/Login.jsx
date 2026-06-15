import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function AdminLogin() {
    const { login, user } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) navigate('/admin/content', { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/admin/content', { replace: true });
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-gradient flex items-center justify-center px-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-[#DDB50E]/10 blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <p className="text-3xl font-black text-white">
                        Mr.<span className="text-[#FCD532]">MEDIA</span>
                    </p>
                    <p className="mt-1 text-sm text-white/60">Admin Dashboard</p>
                </div>

                {/* Card */}
                <div className="rounded-3xl bg-white p-8 shadow-brand">
                    <h1 className="mb-6 text-xl font-bold text-[#0D1B4B]">Sign in to continue</h1>

                    {error && (
                        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#213C93] mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:outline-none focus:ring-2 focus:ring-[#213C93]/20"
                                placeholder="admin@mrmedia.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#213C93] mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-3 pr-11 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:outline-none focus:ring-2 focus:ring-[#213C93]/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A9A] hover:text-[#213C93]"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#213C93] py-3.5 text-sm font-bold text-white hover:bg-[#2E52C9] disabled:opacity-60 transition-colors"
                        >
                            {loading ? (
                                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                                <LogIn size={16} />
                            )}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-white/40">
                    © 2026 Mr.MEDIA · Admin Portal
                </p>
            </div>
        </div>
    );
}
