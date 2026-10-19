import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useBrandLogos } from '@/hooks/use-content';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
    Briefcase,
    Calendar,
    FileText,
    GalleryHorizontal,
    Inbox,
    LogOut,
    Megaphone,
    Palette,
    Mail,
    Share2,
    ShieldCheck,
    Sparkles,
    UserCircle,
    Users,
} from 'lucide-react';
import { ADMIN_SECTIONS, homePathFor } from '@/lib/admin-sections';

const NAV_ICONS = {
    '/admin/content': FileText,
    '/admin/projects': Briefcase,
    '/admin/services': Sparkles,
    '/admin/marquee': Megaphone,
    '/admin/popup': GalleryHorizontal,
    '/admin/events': Calendar,
    '/admin/inbox': Inbox,
    '/admin/social-links': Share2,
    '/admin/site-settings': Palette,
    '/admin/email-settings': Mail,
    '/admin/users': Users,
    '/admin/roles': ShieldCheck,
    '/admin/profile': UserCircle,
};

export default function AdminLayout({ title, actions, children }) {
    const { user, logout, can } = useApp();
    const navItems = ADMIN_SECTIONS.filter((s) => can(s.permission));
    const logos = useBrandLogos();
    const navigate = useNavigate();
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    // Expose the sticky header's live height (it changes as actions/messages wrap)
    // as --admin-header-h, so page-level sticky bars can sit just below it.
    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;
        const observer = new ResizeObserver(() =>
            setHeaderHeight(header.offsetHeight),
        );
        observer.observe(header);
        return () => observer.disconnect();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login', { replace: true });
    };

    return (
        <TooltipProvider delayDuration={0}>
            <SidebarProvider defaultOpen>
                <Sidebar
                    collapsible="icon"
                    className="border-r border-[#D1D5E8]"
                >
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" asChild>
                                    <NavLink to={homePathFor(user)}>
                                        <img
                                            src={logos.onDark}
                                            alt=""
                                            className="h-6 w-6 object-contain"
                                        />
                                        <span className="font-bold text-white">
                                            mrmedia admin
                                        </span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Manage</SidebarGroupLabel>
                            <SidebarMenu>
                                {navItems.map(({ to, label }) => {
                                    const Icon = NAV_ICONS[to];
                                    return (
                                        <SidebarMenuItem key={to}>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={{ children: label }}
                                            >
                                                <NavLink
                                                    to={to}
                                                    className={({
                                                        isActive,
                                                    }) =>
                                                        isActive
                                                            ? 'bg-[#213C93]/10 font-semibold text-[#213C93]'
                                                            : ''
                                                    }
                                                >
                                                    <Icon />
                                                    <span>{label}</span>
                                                </NavLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <div className="truncate px-2 py-1.5 text-xs text-[#5A6A9A]">
                                    {user?.email}
                                    {user?.roles?.length > 0 && (
                                        <span className="block truncate text-[11px] font-semibold text-[#213C93]">
                                            {user.roles.join(', ')}
                                        </span>
                                    )}
                                </div>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={handleLogout}>
                                    <LogOut />
                                    <span>Logout</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset
                    className="bg-[#F1F1F0]"
                    style={{ '--admin-header-h': `${headerHeight}px` }}
                >
                    <header
                        ref={headerRef}
                        className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#D1D5E8] bg-white/80 px-4 py-4 backdrop-blur sm:px-6"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <SidebarTrigger className="-ml-1" />
                            <h1 className="truncate text-lg font-bold text-[#0D1B4B]">
                                {title}
                            </h1>
                        </div>
                        {actions && (
                            <div className="flex shrink-0 items-center gap-3">
                                {actions}
                            </div>
                        )}
                    </header>

                    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
