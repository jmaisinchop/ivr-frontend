'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from 'next-themes';
import { 
  Bell, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  RefreshCw, 
  Activity, 
  Zap, 
  Moon, 
  Sun 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isConnected, reconnectAttempts, latency, forceReconnect } = useSocket();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme(); // Hook para el tema
  const [mounted, setMounted] = useState(false);
  
  // Estados para la lógica de conexión
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const [showLatencyDetails, setShowLatencyDetails] = useState(false);

  // Evitar hidratación incorrecta del tema
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lógica de notificaciones de conexión
  useEffect(() => {
    if (!isConnected) {
      setWasDisconnected(true);
      const timer = setTimeout(() => {
        setShowReconnecting(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowReconnecting(false);
      if (wasDisconnected) {
        setTimeout(() => {
          setWasDisconnected(false);
        }, 3000);
      }
    }
  }, [isConnected, wasDisconnected]);

  const getLatencyColor = (ms: number) => {
    if (ms < 100) return 'text-green-600 dark:text-green-400';
    if (ms < 200) return 'text-amber-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLatencyStatus = (ms: number) => {
    if (ms < 100) return 'Excelente';
    if (ms < 200) return 'Buena';
    if (ms < 500) return 'Regular';
    return 'Lenta';
  };

  // Toggle Theme Function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header 
        className={cn(
          // Layout Base
          "sticky top-0 z-30 h-20 w-full flex items-center justify-between px-6 transition-all duration-300",
          // Estilo iOS Glassmorphism (Coincide con Sidebar)
          "bg-background/80 backdrop-blur-2xl border-b border-border/50 supports-[backdrop-filter]:bg-background/60"
        )}
      >
        {/* Títulos con animación de entrada */}
        <div className="animate-in fade-in slide-in-from-left-2 duration-500">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          
          {/* --- Connection Badge (Estilo Píldora iOS) --- */}
          <div className="relative group">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border shadow-sm",
                isConnected
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 animate-pulse"
              )}
              onMouseEnter={() => setShowLatencyDetails(true)}
              onMouseLeave={() => setShowLatencyDetails(false)}
            >
              {isConnected ? (
                <>
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </div>
                  <span className="hidden sm:inline">En línea</span>
                  {latency.current > 0 && (
                    <span className={cn("font-mono ml-1", getLatencyColor(latency.current))}>
                      {latency.current}ms
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Latency Tooltip (Estilo iOS Popover) */}
            {showLatencyDetails && isConnected && latency.samples.length > 0 && (
              <div className="absolute top-full right-0 mt-4 w-64 bg-popover/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-200 z-50">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Estado de Red</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Calidad</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md bg-muted", getLatencyColor(latency.average))}>
                      {getLatencyStatus(latency.average)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <p className="text-muted-foreground mb-1">Actual</p>
                      <p className={cn("font-mono font-semibold", getLatencyColor(latency.current))}>{latency.current}ms</p>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <p className="text-muted-foreground mb-1">Promedio</p>
                      <p className="font-mono font-semibold">{latency.average.toFixed(0)}ms</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>{latency.samples.length} muestras</span>
                    </div>
                    <span className="font-mono">Min:{latency.min} / Max:{latency.max}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Separador Vertical */}
          <div className="h-6 w-px bg-border/50 mx-1" />

          {/* --- Theme Toggle (Estilo iOS Switch) --- */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-full text-foreground hover:bg-muted/60 transition-all duration-300 active:scale-95 group"
              aria-label="Cambiar tema"
            >
              <div className="relative w-5 h-5">
                <Sun className={cn(
                  "w-5 h-5 absolute top-0 left-0 transition-all duration-500 rotate-0 scale-100",
                  theme === 'dark' ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                )} />
                <Moon className={cn(
                  "w-5 h-5 absolute top-0 left-0 transition-all duration-500 rotate-90 scale-0 opacity-0",
                  theme === 'dark' ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
                )} />
              </div>
              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}

          {/* --- Notifications Button --- */}
          <button className="relative p-2.5 rounded-full text-foreground hover:bg-muted/60 transition-all duration-300 active:scale-95 group">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-background rounded-full group-hover:scale-110 transition-transform" />
          </button>

        </div>
      </header>

      {/* --- Connection Banners (Estilo Notificaciones iOS) --- */}
      
      {/* Reconectando */}
      {!isConnected && showReconnecting && (
        <div className="sticky top-20 z-20 bg-amber-500/10 backdrop-blur-md border-b border-amber-500/20 px-6 py-2 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="relative">
               <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
               <span className="absolute inset-0 animate-ping opacity-75 bg-amber-400 rounded-full h-full w-full -z-10"></span>
            </div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Reconectando al servidor... <span className="opacity-70 text-xs ml-1">Intento {reconnectAttempts}</span>
            </p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={forceReconnect}
            className="h-8 text-amber-700 hover:text-amber-900 hover:bg-amber-500/20 dark:text-amber-400"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Conexión Restaurada */}
      {isConnected && wasDisconnected && (
        <div className="sticky top-20 z-20 bg-emerald-500/10 backdrop-blur-md border-b border-emerald-500/20 px-6 py-2 flex items-center gap-3 animate-in slide-in-from-top-2 fade-out duration-1000 delay-3000 fill-mode-forwards">
          <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Conexión restablecida correctamente
          </p>
        </div>
      )}
    </>
  );
}