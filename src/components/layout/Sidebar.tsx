'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Phone,
  Gauge,
  LogOut,
  User,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  requireIvrs?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Campañas',
    href: '/campaigns',
    icon: <Megaphone className="w-5 h-5" />,
    requireIvrs: true,
  },
  {
    label: 'Estadísticas',
    href: '/stats',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Usuarios',
    href: '/users',
    icon: <Users className="w-5 h-5" />,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    label: 'Canales',
    href: '/channels',
    icon: <Gauge className="w-5 h-5" />,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    label: 'Test Llamada',
    href: '/test-call',
    icon: <Phone className="w-5 h-5" />,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout, canAccessIvrs } = useAuthStore();

  const filteredItems = navItems.filter((item) => {
    if (item.roles && !item.roles.includes(user?.role || '')) {
      return false;
    }
    if (item.requireIvrs && !canAccessIvrs()) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-dark-900 border-r border-dark-800 transition-all duration-300 z-40 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-800">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">IVR System</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              )}
            >
              {item.icon}
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-dark-800">
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl bg-dark-800/50',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-accent-violet to-accent-rose rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-dark-400 truncate">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => logout()}
          className={cn(
            'w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
