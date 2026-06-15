import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Home from '@/pages/Home';
import AdminLogin from '@/pages/admin/Login';
import ContentEditor from '@/pages/admin/ContentEditor';
import EmailSettings from '@/pages/admin/EmailSettings';

function RequireAuth({ children }) {
    const { user, userLoading } = useApp();

    if (userLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
                <div className="h-10 w-10 rounded-full border-4 border-[#213C93] border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/admin/login" replace />;
    return children;
}

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            {/* Redirect legacy Laravel auth URLs to our admin login */}
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/register" element={<Navigate to="/admin/login" replace />} />
            <Route path="/dashboard" element={<Navigate to="/admin/content" replace />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
                path="/admin/content"
                element={
                    <RequireAuth>
                        <ContentEditor />
                    </RequireAuth>
                }
            />
            <Route
                path="/admin/email-settings"
                element={
                    <RequireAuth>
                        <EmailSettings />
                    </RequireAuth>
                }
            />
            <Route path="/admin" element={<Navigate to="/admin/content" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
