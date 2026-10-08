import {
    Award,
    BarChart3,
    Camera,
    Globe,
    Image,
    Layers,
    Lightbulb,
    Megaphone,
    MessageSquare,
    Monitor,
    Palette,
    PenTool,
    Rocket,
    Smartphone,
    Star,
    Target,
    TrendingUp,
    Users,
    Video,
    Zap,
} from 'lucide-react';

/**
 * Curated icon set admins can assign to a Service. Stored as the string key
 * (e.g. "star") since a React component can't be persisted to the database.
 */
export const SERVICE_ICON_OPTIONS = [
    { key: 'star', label: 'Star', Icon: Star },
    { key: 'bar-chart-3', label: 'Analytics', Icon: BarChart3 },
    { key: 'image', label: 'Content', Icon: Image },
    { key: 'monitor', label: 'Web/App', Icon: Monitor },
    { key: 'globe', label: 'Global/Media', Icon: Globe },
    { key: 'megaphone', label: 'PR/Ads', Icon: Megaphone },
    { key: 'camera', label: 'Photography', Icon: Camera },
    { key: 'video', label: 'Video', Icon: Video },
    { key: 'palette', label: 'Design', Icon: Palette },
    { key: 'pen-tool', label: 'Branding', Icon: PenTool },
    { key: 'smartphone', label: 'Mobile', Icon: Smartphone },
    { key: 'trending-up', label: 'Growth', Icon: TrendingUp },
    { key: 'target', label: 'Strategy', Icon: Target },
    { key: 'users', label: 'Audience', Icon: Users },
    { key: 'zap', label: 'Performance', Icon: Zap },
    { key: 'award', label: 'Awards', Icon: Award },
    { key: 'layers', label: 'Solutions', Icon: Layers },
    { key: 'message-square', label: 'Communication', Icon: MessageSquare },
    { key: 'lightbulb', label: 'Ideas', Icon: Lightbulb },
    { key: 'rocket', label: 'Launch', Icon: Rocket },
];

const ICON_MAP = Object.fromEntries(
    SERVICE_ICON_OPTIONS.map((o) => [o.key, o.Icon]),
);

/** Looks up a service icon component by its stored key, falling back to Star for unknown/missing keys. */
export function getServiceIcon(key) {
    return ICON_MAP[key] ?? Star;
}
