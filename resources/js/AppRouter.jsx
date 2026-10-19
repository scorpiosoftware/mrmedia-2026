import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ADMIN_SECTIONS, homePathFor } from '@/lib/admin-sections';
import { applyThemeVars, themeVars } from '@/lib/site-theme';
import Home from '@/pages/Home';

// Only visitors who open an event need this page — keep it out of the home page's bundle.
const EventDetails = lazy(() => import('@/pages/EventDetails'));

// Admin screens are only ever needed by logged-in staff, not public visitors —
// code-split them so the public site's bundle doesn't pay for admin code.
const AdminLogin = lazy(() => import('@/pages/admin/Login'));
const ContentEditor = lazy(() => import('@/pages/admin/ContentEditor'));
const AdminInbox = lazy(() => import('@/pages/admin/Inbox'));
const AdminEvents = lazy(() => import('@/pages/admin/Events'));
const AdminProjects = lazy(() => import('@/pages/admin/Projects'));
const AdminServices = lazy(() => import('@/pages/admin/Services'));
const AdminMarquee = lazy(() => import('@/pages/admin/MarqueeBanner'));
const AdminPopup = lazy(() => import('@/pages/admin/Popup'));
const AdminSiteSettings = lazy(() => import('@/pages/admin/SiteSettings'));
const AdminSocialLinks = lazy(() => import('@/pages/admin/SocialLinks'));
const EmailSettings = lazy(() => import('@/pages/admin/EmailSettings'));
const AdminProfile = lazy(() => import('@/pages/admin/Profile'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const AdminRoles = lazy(() => import('@/pages/admin/Roles'));
const AdminNoAccess = lazy(() => import('@/pages/admin/NoAccess'));

function RouteFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
        </div>
    );
}

/**
 * Signed-in guard for admin pages. With `permission`, a user who lacks it sees a
 * "no access" page instead (the API refuses those endpoints too).
 */
function RequireAuth({ permission, children }) {
    const { user, userLoading, can } = useApp();

    if (userLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F1F0]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#213C93] border-t-transparent" />
            </div>
        );
    }

    if (!user) return <Navigate to="/admin/login" replace />;
    if (!can(permission)) return <AdminNoAccess />;
    return children;
}

/** /admin (and /dashboard) → the first section this user may open. */
function AdminHome() {
    const { user } = useApp();
    return (
        <RequireAuth>
            <Navigate to={homePathFor(user)} replace />
        </RequireAuth>
    );
}

// Route path → page component; each route's permission comes from ADMIN_SECTIONS.
const ADMIN_PAGES = {
    '/admin/content': ContentEditor,
    '/admin/projects': AdminProjects,
    '/admin/services': AdminServices,
    '/admin/marquee': AdminMarquee,
    '/admin/popup': AdminPopup,
    '/admin/events': AdminEvents,
    '/admin/inbox': AdminInbox,
    '/admin/social-links': AdminSocialLinks,
    '/admin/site-settings': AdminSiteSettings,
    '/admin/email-settings': EmailSettings,
    '/admin/users': AdminUsers,
    '/admin/roles': AdminRoles,
    '/admin/profile': AdminProfile,
};

/** Applies the dashboard's colour theme on public pages; the admin panel keeps its own brand colours. */
function SiteThemeApplier() {
    const { pathname } = useLocation();
    const { siteSettings } = useApp();
    const isAdmin = pathname.startsWith('/admin');

    useEffect(() => {
        applyThemeVars(
            isAdmin ? {} : themeVars(siteSettings?.theme, siteSettings?.colors),
        );
    }, [isAdmin, siteSettings]);

    return null;
}

export default function AppRouter() {
    return (
        <Suspense fallback={<RouteFallback />}>
            <SiteThemeApplier />
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
                    element={<Navigate to="/admin" replace />}
                />

                <Route path="/admin/login" element={<AdminLogin />} />
                {ADMIN_SECTIONS.map(({ to, permission }) => {
                    const Page = ADMIN_PAGES[to];
                    return (
                        <Route
                            key={to}
                            path={to}
                            element={
                                <RequireAuth permission={permission}>
                                    <Page />
                                </RequireAuth>
                            }
                        />
                    );
                })}
                <Route path="/admin" element={<AdminHome />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
