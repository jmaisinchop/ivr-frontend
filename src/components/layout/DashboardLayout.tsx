'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { PageLoading } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils'; // Asegúrate de importar cn

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  // Estado elevado: El layout controla si el sidebar está colapsado
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.push('/login');
    }
  }, [mounted, token, router]);

  if (!mounted || !token) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* Pasamos el estado y la función para cambiarlo al Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* El <main> ajusta su padding izquierdo (pl) según el estado.
         Usamos las mismas medidas exactas que el Sidebar: 
         - Expandido: 280px
         - Colapsado: 88px
         - duration-500 y ease-out para que la animación sea idéntica a la del Sidebar
      */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-500 ease-out",
          sidebarCollapsed ? "pl-[88px]" : "pl-[280px]"
        )}
      >
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}