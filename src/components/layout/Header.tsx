'use client';

import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/auth.store';
import { Bell, Wifi, WifiOff, AlertCircle, RefreshCw, Activity, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isConnected, reconnectAttempts, latency, forceReconnect } = useSocket();
  const { user } = useAuthStore();
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const [showLatencyDetails, setShowLatencyDetails] = useState(false);

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
    if (ms < 100) return 'text-green-400';
    if (ms < 200) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLatencyStatus = (ms: number) => {
    if (ms < 100) return 'Excelente';
    if (ms < 200) return 'Buena';
    if (ms < 500) return 'Regular';
    return 'Lenta';
  };

  return (
    <>
      <header className="h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 flex items-center justify-between px-6 sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-dark-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status with latency */}
          <div className="relative">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isConnected
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
              }`}
              onMouseEnter={() => setShowLatencyDetails(true)}
              onMouseLeave={() => setShowLatencyDetails(false)}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>En línea</span>
                  {latency.current > 0 && (
                    <span className={getLatencyColor(latency.current)}>
                      {latency.current}ms
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Desconectado</span>
                </>
              )}
            </div>

            {/* Latency details tooltip */}
            {showLatencyDetails && isConnected && latency.samples.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-dark-800 border border-dark-700 rounded-lg shadow-xl p-4 animate-slide-down">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-primary-400" />
                  <h3 className="text-sm font-semibold text-white">Métricas de Conexión</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark-400">Estado:</span>
                    <span className={`text-xs font-medium ${getLatencyColor(latency.average)}`}>
                      {getLatencyStatus(latency.average)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark-400">Actual:</span>
                    <span className={`text-xs font-medium ${getLatencyColor(latency.current)}`}>
                      {latency.current}ms
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark-400">Promedio:</span>
                    <span className="text-xs text-white font-medium">
                      {latency.average.toFixed(0)}ms
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark-400">Mín / Máx:</span>
                    <span className="text-xs text-white">
                      {latency.min}ms / {latency.max}ms
                    </span>
                  </div>

                  <div className="pt-2 border-t border-dark-700">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-dark-400">
                        {latency.samples.length} mediciones
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Banner de reconexión */}
      {!isConnected && showReconnecting && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-6 py-3 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-yellow-400">
                Conexión perdida - Reconectando... (Intento {reconnectAttempts}/10)
              </p>
              <p className="text-xs text-yellow-500">
                Las actualizaciones en tiempo real están pausadas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={forceReconnect}
              className="text-yellow-400 hover:text-yellow-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconectar ahora
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping animation-delay-200" />
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping animation-delay-400" />
            </div>
          </div>
        </div>
      )}

      {/* Banner de reconexión exitosa */}
      {isConnected && wasDisconnected && (
        <div className="bg-green-500/20 border-b border-green-500/30 px-6 py-3 flex items-center gap-3 animate-slide-down">
          <Wifi className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-400">
              ✓ Conexión restablecida
            </p>
            <p className="text-xs text-green-500">
              Las actualizaciones en tiempo real están activas nuevamente
            </p>
          </div>
        </div>
      )}
    </>
  );
}