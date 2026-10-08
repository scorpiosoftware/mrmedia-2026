import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { LOGO_SRC } from '@/lib/brand-logos';
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
    LogOut,
    Mail,
    Share2,
    Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/admin/content', label: 'Content', Icon: FileText },
    { to: '/admin/projects', label: 'Projects', Icon: Briefcase },
    { to: '/admin/services', label: 'Services', Icon: Sparkles },
    { to: '/admin/events', label: 'Events & Training', Icon: Calendar },
    { to: '/admin/social-links', label: 'Social Media', Icon: Share2 },
    { to: '/admin/email-settings', label: 'Email Settings', Icon: Mail },
];

export default function AdminLayout({ title, actions, children }) {
    const { user, logout } = useApp();
    const navigate = useNavigate();

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
                                    <NavLink to="/admin/content">
                                        <img
                                            src={LOGO_SRC}
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
                                {NAV_ITEMS.map(({ to, label, Icon }) => (
                                    <SidebarMenuItem key={to}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={{ children: label }}
                                        >
                                            <NavLink
                                                to={to}
                                                className={({ isActive }) =>
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
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <div className="truncate px-2 py-1.5 text-xs text-[#5A6A9A]">
                                    {user?.email}
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

                <SidebarInset className="bg-[#F1F1F0]">
                    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#D1D5E8] bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
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
