import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';
import { socketClient } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  
  isAdmin: () => boolean;
  isSupervisor: () => boolean;
  isCallCenter: () => boolean;
  canAccessIvrs: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login(username, password);
          const { access_token, user } = data;
          
          localStorage.setItem('token', access_token);
          
          // Connect socket
          socketClient.connect(access_token);
          
          set({ user, token: access_token, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Error al iniciar sesión';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('token');
          socketClient.disconnect();
          set({ user: null, token: null });
        }
      },

      refreshProfile: async () => {
        try {
          const { data } = await authApi.getProfile();
          set({ user: data });
        } catch (error) {
          // If refresh fails, logout
          get().logout();
        }
      },

      clearError: () => set({ error: null }),

      isAdmin: () => get().user?.role === UserRole.ADMIN,
      
      isSupervisor: () => get().user?.role === UserRole.SUPERVISOR,
      
      isCallCenter: () => get().user?.role === UserRole.CALLCENTER,
      
      canAccessIvrs: () => get().user?.canAccessIvrs ?? false,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
