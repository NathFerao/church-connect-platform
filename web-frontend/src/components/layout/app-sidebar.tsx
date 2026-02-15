'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Bell,
  Heart,
  BookOpen,
  Calendar,
  Users,
  LogOut,
  MessageSquare,
  Settings,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Announcements', href: '/announcements', icon: Bell },
  { label: 'Prayer Requests', href: '/prayers', icon: Heart },
  { label: 'Testimonies', href: '/testimonies', icon: BookOpen },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const church = useAuthStore((s) => s.church);
  const { primary } = useThemeStore();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const churchName = church?.name || 'Church';
  const logoUrl = getImageUrl(church?.logoUrl);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-4">
          {logoUrl ? (
            <div className="w-10 h-10 flex-shrink-0 rounded-lg border bg-white overflow-hidden">
              <img
                src={logoUrl}
                alt={churchName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primary }}
            >
              {churchName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{churchName}</p>
            <p className="text-xs text-muted-foreground">Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ label, href, icon: Icon }) => {
                const active = pathname.startsWith(href);
                
                if (label === 'Settings' && !['CHURCH_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      onClick={() => router.push(href)}
                      isActive={active}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}