'use client';

import { useEffect, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { DashboardUpdate } from '@/types';

export function useSocket() {
  const { token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      socketClient.connect(token);
      
      const checkConnection = setInterval(() => {
        setIsConnected(socketClient.isConnected());
      }, 1000);

      return () => {
        clearInterval(checkConnection);
      };
    }
  }, [token]);

  const subscribe = useCallback((channel: string) => {
    socketClient.subscribe(channel);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    socketClient.unsubscribe(channel);
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
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
