'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart3,
  Phone,
  Gauge,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Command
} from 'lucide-react';

// --- IMPORTANTE: Definimos que este componente recibe estas props ---
interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

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

// --- Recibimos 'collapsed' y 'setCollapsed' aquí ---
export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
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
        'fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-500 ease-out',
        'bg-background/80 backdrop-blur-2xl border-r border-border/50 supports-[backdrop-filter]:bg-background/60',
        collapsed ? 'w-[88px]' : 'w-[280px]'
      )}
    >
      {/* --- Header / Logo --- */}
      <div className="h-20 flex items-center justify-between px-6 mb-2">
        {!collapsed ? (
          <div className="flex items-center gap-3 animate-in fade-in duration-500 slide-in-from-left-4">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <Command className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none text-foreground">IVR System</h1>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Workspace</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
               <Command className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* --- Botón Toggle --- */}
      <div className="absolute -right-3 top-9 z-50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-6 h-6 bg-background border border-border shadow-sm rounded-full text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* --- Navegación --- */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide py-4">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 ease-out relative overflow-hidden',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:scale-[1.02]'
              )}
            >
              <span className={cn(
                "flex items-center justify-center transition-transform duration-300",
                isActive ? "scale-100" : "group-hover:scale-110"
              )}>
                {item.icon}
              </span>
              
              {!collapsed && (
                <span className={cn(
                  "font-medium text-[15px] tracking-tight animate-in fade-in duration-300",
                  isActive ? "font-semibold" : ""
                )}>
                  {item.label}
                </span>
              )}
              
              {!isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- Footer / Perfil --- */}
      <div className="p-4 mx-4 mb-4 mt-auto">
        <div className={cn(
          "relative overflow-hidden rounded-3xl bg-muted/30 border border-border/40 p-1 transition-all duration-500",
          !collapsed ? "h-[140px]" : "h-[60px] bg-transparent border-none"
        )}>
          
          {!collapsed && (
             <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
          )}

          <div className={cn(
            "flex flex-col h-full justify-between",
             collapsed && "items-center justify-center"
          )}>
            <div className={cn("flex items-center gap-3 p-2", collapsed && "p-0")}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500 p-[2px] shadow-sm">
                 <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    <User className="w-5 h-5 text-indigo-500" />
                 </div>
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{user?.firstName}</p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{user?.role}</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={() => logout()}
                className="mx-1 mb-1 flex items-center justify-center gap-2 bg-background hover:bg-destructive hover:text-destructive-foreground text-muted-foreground text-xs font-medium py-2.5 rounded-xl transition-colors duration-200 border border-border/50 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            )}
            
            {collapsed && (
               <button
               onClick={() => logout()}
               className="mt-2 w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
               title="Cerrar sesión"
             >
               <LogOut className="w-5 h-5" />
             </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}