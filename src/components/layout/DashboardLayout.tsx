'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { PageLoading } from '@/components/ui/Spinner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

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
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <main className="pl-20 lg:pl-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
