import { userCan } from '@/lib/permissions';

/**
 * Dashboard sections in sidebar order, each with the permission (config/permissions.php)
 * needed to open it. `permission: null` means every signed-in user can open it.
 * Icons live in AdminLayout so the public bundle (which loads the router) stays lean.
 */
export const ADMIN_SECTIONS = [
    { to: '/admin/content', label: 'Content', permission: 'content.manage' },
    { to: '/admin/projects', label: 'Projects', permission: 'projects.manage' },
    { to: '/admin/services', label: 'Services', permission: 'services.manage' },
    {
        to: '/admin/marquee',
        label: 'Scrolling Banner',
        permission: 'marquee.manage',
    },
    { to: '/admin/popup', label: 'Popup', permission: 'popup.manage' },
    {
        to: '/admin/events',
        label: 'Events & Training',
        permission: 'events.manage',
    },
    { to: '/admin/inbox', label: 'Inbox', permission: 'inbox.manage' },
    {
        to: '/admin/social-links',
        label: 'Social Media',
        permission: 'social-links.manage',
    },
    {
        to: '/admin/site-settings',
        label: 'Site Settings',
        permission: 'site-settings.manage',
    },
    {
        to: '/admin/email-settings',
        label: 'Email Settings',
        permission: 'email-settings.manage',
    },
    { to: '/admin/users', label: 'Users', permission: 'users.manage' },
    { to: '/admin/roles', label: 'Roles', permission: 'roles.manage' },
    { to: '/admin/profile', label: 'Profile', permission: null },
];

/** The first section a user can open — where /admin and the login page send them. */
export function homePathFor(user) {
    return (
        ADMIN_SECTIONS.find((s) => userCan(user, s.permission))?.to ??
        '/admin/profile'
    );
}
