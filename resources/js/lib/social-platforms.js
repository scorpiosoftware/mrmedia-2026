import {
    AtSign,
    Dribbble,
    Facebook,
    Ghost,
    Github,
    Globe,
    Instagram,
    Link,
    Linkedin,
    MessageCircle,
    Music2,
    Pin,
    Send,
    Twitch,
    Twitter,
    Youtube,
} from 'lucide-react';

/**
 * Platforms an admin can pick for a social link. Stored as the string key
 * (e.g. "tiktok") since a React component can't be persisted to the database.
 */
export const SOCIAL_PLATFORM_OPTIONS = [
    { key: 'instagram', label: 'Instagram', Icon: Instagram },
    { key: 'facebook', label: 'Facebook', Icon: Facebook },
    { key: 'tiktok', label: 'TikTok', Icon: Music2 },
    { key: 'twitter', label: 'X / Twitter', Icon: Twitter },
    { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
    { key: 'youtube', label: 'YouTube', Icon: Youtube },
    { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
    { key: 'telegram', label: 'Telegram', Icon: Send },
    { key: 'snapchat', label: 'Snapchat', Icon: Ghost },
    { key: 'pinterest', label: 'Pinterest', Icon: Pin },
    { key: 'threads', label: 'Threads', Icon: AtSign },
    { key: 'github', label: 'GitHub', Icon: Github },
    { key: 'behance', label: 'Behance', Icon: Dribbble },
    { key: 'twitch', label: 'Twitch', Icon: Twitch },
    { key: 'website', label: 'Website', Icon: Globe },
    { key: 'link', label: 'Other', Icon: Link },
];

const PLATFORM_MAP = Object.fromEntries(
    SOCIAL_PLATFORM_OPTIONS.map((o) => [o.key, o]),
);

/** Looks up a platform icon component by its stored key, falling back to a generic link icon. */
export function getSocialIcon(key) {
    return PLATFORM_MAP[key]?.Icon ?? Link;
}

/** Human-readable platform name for a stored key, used as the default link label. */
export function getSocialLabel(key) {
    return PLATFORM_MAP[key]?.label ?? 'Link';
}
