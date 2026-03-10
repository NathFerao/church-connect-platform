'use client';

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Bell, Heart, BookOpen,
  Calendar, Users, MessageSquare, Settings,
  Moon, Sun, LogOut, Building2, UserPlus
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator
} from "../ui/sidebar"
import { useThemeStore } from "@/lib/stores/theme.store"
import { useAuthStore } from "@/lib/stores/auth.store"

const MAIN_NAV = [
  { label: 'Dashboard',       url: '/dashboard',      icon: LayoutDashboard },
  { label: 'Announcements',   url: '/announcements',  icon: Bell },
  { label: 'Prayer Requests', url: '/prayers',        icon: Heart },
  { label: 'Testimonies',     url: '/testimonies',    icon: BookOpen },
  { label: 'Events',          url: '/events',         icon: Calendar },
  { label: 'Members',         url: '/members',        icon: Users },
  { label: 'Messages',        url: '/messages',       icon: MessageSquare },
];

const SETTINGS_NAV = [
  { label: 'Settings',        url: '/settings',       icon: Settings },
];

const CHURCH_ADMIN_NAV = [
  { label: 'Manage Members',  url: '/admin/members',  icon: UserPlus },
];

const SUPER_ADMIN_NAV = [
  { label: 'All Churches',    url: '/admin/churches', icon: Building2 },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleDark } = useThemeStore();
  const logout = useAuthStore((s) => s.logout);
  const userRole = useAuthStore((s) => s.user?.role);

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isChurchAdmin = userRole === 'CHURCH_ADMIN' || isSuperAdmin;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Sidebar collapsible="offcanvas">
      {/* ✅ Add overflow-hidden to prevent horizontal scroll */}
      <SidebarContent className="overflow-x-hidden">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {MAIN_NAV.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.label}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings - visible to all */}
        <SidebarGroup>
          <SidebarMenu>
            {SETTINGS_NAV.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.label}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Church Admin Section */}
        {isChurchAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              {/* ✅ Add truncate to prevent label overflow */}
              <SidebarGroupLabel className="truncate">Church Admin</SidebarGroupLabel>
              <SidebarMenu>
                {CHURCH_ADMIN_NAV.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.label}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              {/* ✅ Add truncate to prevent label overflow */}
              <SidebarGroupLabel className="truncate">Super Admin</SidebarGroupLabel>
              <SidebarMenu>
                {SUPER_ADMIN_NAV.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.label}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleDark}
              tooltip={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun /> : <Moon />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}