import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import EventDetails from '@/pages/EventDetails';
import Home from '@/pages/Home';

// Admin screens are only ever needed by logged-in staff, not public visitors —
// code-split them so the public site's bundle doesn't pay for admin code.
const AdminLogin = lazy(() => import('@/pages/admin/Login'));
const ContentEditor = lazy(() => import('@/pages/admin/ContentEditor'));
const AdminInbox = lazy(() => import('@/pages/admin/Inbox'));
const AdminEvents = lazy(() => import('@/pages/admin/Events'));
const AdminProjects = lazy(() => import('@/pages/admin/Projects'));
const AdminServices = lazy(() => import('@/pages/admin/Services'));
const AdminSocialLinks = lazy(() => import('@/pages/admin/SocialLinks'));
const EmailSettings = lazy(() => import('@/pages/admin/EmailSettings'));

function RouteFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
        </div>
    );
}

function RequireAuth({ children }) {
    const { user, userLoading } = useApp();

    if (userLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
            </div>
        );
    }

    if (!user) return <Navigate to="/admin/login" replace />;
    return children;
}

export default function AppRouter() {
    return (
        <Suspense fallback={<RouteFallback />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/events/:slug" element={<EventDetails />} />

                {/* Redirect legacy Laravel auth URLs to our admin login */}
                <Route
                    path="/login"
                    element={<Navigate to="/admin/login" replace />}
                />
                <Route
                    path="/register"
                    element={<Navigate to="/admin/login" replace />}
                />
                <Route
                    path="/dashboard"
                    element={<Navigate to="/admin/content" replace />}
                />

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
                <Route
                    path="/admin/events"
                    element={
                        <RequireAuth>
                            <AdminEvents />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/admin/projects"
                    element={
                        <RequireAuth>
                            <AdminProjects />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/admin/services"
                    element={
                        <RequireAuth>
                            <AdminServices />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/admin/inbox"
                    element={
                        <RequireAuth>
                            <AdminInbox />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/admin/social-links"
                    element={
                        <RequireAuth>
                            <AdminSocialLinks />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/admin"
                    element={<Navigate to="/admin/content" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
