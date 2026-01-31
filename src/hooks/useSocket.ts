'use client';

import { useEffect, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { DashboardUpdate } from '@/types';

interface LatencyMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  samples: number[];
}

export function useSocket() {
  const { token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [latency, setLatency] = useState<LatencyMetrics>({
    current: 0,
    average: 0,
    min: Infinity,
    max: 0,
    samples: [],
  });

  useEffect(() => {
    if (token) {
      socketClient.connect(token);
      
      const checkConnection = setInterval(() => {
        setIsConnected(socketClient.isConnected());
        setReconnectAttempts(socketClient.getReconnectAttempts());
        setLatency(socketClient.getLatencyMetrics());
      }, 1000);

      const handleMaxAttempts = () => {
        console.error('❌ Máximo de intentos de reconexión alcanzado');
      };

      const handleLatencyUpdate = (metrics: LatencyMetrics) => {
        setLatency(metrics);
      };

      socketClient.on('maxReconnectAttemptsReached', handleMaxAttempts);
      socketClient.on('latencyUpdate', handleLatencyUpdate);

      return () => {
        clearInterval(checkConnection);
        socketClient.off('maxReconnectAttemptsReached', handleMaxAttempts);
        socketClient.off('latencyUpdate', handleLatencyUpdate);
      };
    }
  }, [token]);

  const subscribe = useCallback((channel: string) => {
    socketClient.subscribe(channel);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    socketClient.unsubscribe(channel);
  }, []);

  const forceReconnect = useCallback(() => {
    socketClient.forceReconnect();
  }, []);

  const ping = useCallback(() => {
    socketClient.ping();
  }, []);

  return {
    isConnected,
    reconnectAttempts,
    latency,
    subscribe,
    unsubscribe,
    forceReconnect,
    ping,
  };
}

export function useDashboardUpdates(callback: (data: DashboardUpdate) => void) {
  useEffect(() => {
    socketClient.on('dashboardUpdate', callback);
    return () => {
      socketClient.off('dashboardUpdate', callback);
    };
  }, [callback]);
}

export function useAdminUpdates(callback: (data: any) => void) {
  useEffect(() => {
    socketClient.on('adminUpdate', callback);
    return () => {
      socketClient.off('adminUpdate', callback);
    };
  }, [callback]);
}