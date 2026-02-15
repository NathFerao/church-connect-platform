'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';
import {
  LayoutDashboard,
  Bell,
  Heart,
  BookOpen,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Settings,
  ChevronRight,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',       href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Announcements',   href: '/announcements',  icon: Bell },
  { label: 'Prayer Requests', href: '/prayers',        icon: Heart },
  { label: 'Testimonies',     href: '/testimonies',    icon: BookOpen },
  { label: 'Events',          href: '/events',         icon: Calendar },
  { label: 'Members',         href: '/members',        icon: Users },
  { label: 'Messages',        href: '/messages',       icon: MessageSquare },
  { label: 'Settings',        href: '/settings',       icon: Settings },
];

// Helper to get image URL
const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

export default function Sidebar() {
  const [open, setOpen] = useState(false);
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
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-md"
        onClick={() => setOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel - FULL HEIGHT */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50
          border-r border-gray-200 flex flex-col
          transform transition-transform duration-300
          lg:relative lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button (mobile) */}
        <button 
          className="absolute top-4 right-4 lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors" 
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>

        {/* Brand / logo section */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="w-14 h-14 flex-shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden">
                <img 
                  src={logoUrl} 
                  alt={churchName} 
                  className="w-full h-full object-cover"
                  style={{ width: '56px', height: '56px' }}
                />
              </div>
            ) : (
              <div
                className="w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-md"
                style={{ backgroundColor: primary }}
              >
                {churchName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{churchName}</h2>
              <p className="text-xs text-gray-500">Church Management</p>
            </div>
          </div>
        </div>
        {/* User info section */}
        {user && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm"
                   style={{ backgroundColor: primary }}>
                {user.firstName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.firstName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation links - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-1">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              
              // Hide Settings for non-admins
              if (label === 'Settings' && !['CHURCH_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) {
                return null;
              }
              
              return (
                <button
                  key={href}
                  onClick={() => { router.push(href); setOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group
                    ${active
                      ? 'text-white shadow-lg shadow-primary/30'
                      : 'text-gray-700 hover:bg-white hover:shadow-sm'}
                  `}
                  style={active ? { backgroundColor: primary } : {}}
                >
                  <Icon size={20} className={active ? 'text-white' : 'text-gray-500 group-hover:text-primary'} />
                  <span className="flex-1 text-left">{label}</span>
                  {active && <ChevronRight size={16} />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout at bottom - Fixed */}
        <div className="border-t border-gray-200 px-4 py-4 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                       text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600
                       transition-all duration-200 group"
          >
            <LogOut size={20} className="text-gray-500 group-hover:text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}