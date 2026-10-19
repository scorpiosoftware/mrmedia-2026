<?php

/*
|--------------------------------------------------------------------------
| Admin dashboard permissions
|--------------------------------------------------------------------------
|
| The single source of truth for what can be granted in the dashboard.
| Each group is one dashboard section; each permission is what a role or
| user needs to open that section and use its endpoints.
|
| After changing this file run:  php artisan permissions:sync
| (creates new permissions, removes ones no longer listed, adds missing roles).
|
*/

return [

    // Guard the permissions and roles belong to (the admin SPA logs in on `web`).
    'guard' => 'web',

    // Holders of this role pass every permission check (Gate::before) and it can't be
    // edited or deleted from the dashboard.
    'super_admin_role' => 'Super Admin',

    'groups' => [
        'content' => [
            'label' => 'Content',
            'permissions' => [
                'content.manage' => 'Edit site texts, images and contact details',
            ],
        ],
        'projects' => [
            'label' => 'Projects',
            'permissions' => [
                'projects.manage' => 'Create, edit, reorder and delete projects',
            ],
        ],
        'services' => [
            'label' => 'Services',
            'permissions' => [
                'services.manage' => 'Create, edit, reorder and delete services',
            ],
        ],
        'marquee' => [
            'label' => 'Scrolling Banner',
            'permissions' => [
                'marquee.manage' => 'Edit the scrolling banner',
            ],
        ],
        'popup' => [
            'label' => 'Popup',
            'permissions' => [
                'popup.manage' => 'Edit the home page popup',
            ],
        ],
        'events' => [
            'label' => 'Events & Training',
            'permissions' => [
                'events.manage' => 'Create, edit and delete events and view their registrations',
            ],
        ],
        'inbox' => [
            'label' => 'Inbox',
            'permissions' => [
                'inbox.manage' => 'Read and delete contact messages',
            ],
        ],
        'social_links' => [
            'label' => 'Social Media',
            'permissions' => [
                'social-links.manage' => 'Create, edit, reorder and delete social links',
            ],
        ],
        'site_settings' => [
            'label' => 'Site Settings',
            'permissions' => [
                'site-settings.manage' => 'Edit branding, theme and section visibility',
            ],
        ],
        'email_settings' => [
            'label' => 'Email Settings',
            'permissions' => [
                'email-settings.manage' => 'Edit mail server and WhatsApp settings',
            ],
        ],
        'users' => [
            'label' => 'Users',
            'permissions' => [
                'users.manage' => 'Create, edit and delete dashboard users and grant them roles/permissions',
            ],
        ],
        'roles' => [
            'label' => 'Roles',
            'permissions' => [
                'roles.manage' => 'Create, edit and delete roles',
            ],
        ],
    ],

    // Starter roles created by permissions:sync when missing. Once a role exists its
    // permissions are managed from the dashboard and never overwritten by a sync.
    'roles' => [
        'Editor' => [
            'content.manage',
            'projects.manage',
            'services.manage',
            'marquee.manage',
            'popup.manage',
            'events.manage',
            'social-links.manage',
        ],
        'Support' => [
            'inbox.manage',
            'events.manage',
        ],
    ],

];
