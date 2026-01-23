'use client';

import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/auth.store';
import { Bell, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isConnected } = useSocket();
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-dark-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>En línea</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Desconectado</span>
            </>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
