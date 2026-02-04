import { create } from 'zustand';
import { Campaign, Contact, LiveContactsResponse, CreateCampaignDto, UpdateCampaignDto } from '@/types';
import { campaignsApi } from '@/lib/api';

interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  liveContacts: LiveContactsResponse | null;
  isLoading: boolean;
  error: string | null;
  
  fetchCampaigns: () => Promise<void>;
  fetchCampaignById: (id: string) => Promise<void>;
  createCampaign: (data: CreateCampaignDto) => Promise<Campaign>;
  updateCampaign: (id: string, data: UpdateCampaignDto) => Promise<void>;
  duplicateCampaign: (id: string, data: any) => Promise<Campaign>;
  addContacts: (id: string, contacts: any[]) => Promise<void>;
  startCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;
  cancelCampaign: (id: string) => Promise<void>;
  fetchLiveContacts: (id: string, status?: string, limit?: number, offset?: number) => Promise<void>;
  clearError: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  liveContacts: null,
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await campaignsApi.getAll();
      set({ campaigns: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCampaignById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await campaignsApi.getById(id);
      set({ currentCampaign: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createCampaign: async (data: CreateCampaignDto) => {
    set({ isLoading: true, error: null });
    try {
      const { data: campaign } = await campaignsApi.create(data);
      set((state) => ({
        campaigns: [campaign, ...state.campaigns],
        isLoading: false,
      }));
      return campaign;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear campaña';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  // ─── FIX: NO toca isLoading ──────────────────────────────────────────────
  // Antes hacía set({ isLoading: true }) aquí. Eso causaba que CampaignDetailPage
  // re-renderizara con <PageLoading />, lo cual desmontaba el Modal + CampaignForm
  // + PostCallConfigSection MIENTRAS el handleSubmit del form aún estaba en medio
  // de su flujo async. Al desmontarse, postCallRef quedaba null y save() nunca se ejecutaba.
  //
  // La solución: updateCampaign solo actualiza el estado en memoria silenciosamente.
  // El loading del botón "Guardar" ya lo maneja CampaignDetailPage con su propio
  // state local `updating` que pasa como isLoading al form. No falta más.
  // ─────────────────────────────────────────────────────────────────────────
  updateCampaign: async (id: string, data: UpdateCampaignDto) => {
    set({ error: null });
    try {
      const { data: updated } = await campaignsApi.update(id, data);
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? updated : c)),
        currentCampaign: state.currentCampaign?.id === id ? updated : state.currentCampaign,
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al actualizar campaña';
      set({ error: message });
      throw new Error(message);
    }
  },

  duplicateCampaign: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const { data: campaign } = await campaignsApi.duplicate(id, data);
      set((state) => ({
        campaigns: [campaign, ...state.campaigns],
        isLoading: false,
      }));
      return campaign;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al duplicar campaña';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  addContacts: async (id: string, contacts: any[]) => {
    set({ isLoading: true, error: null });
    try {
      await campaignsApi.addContacts(id, contacts);
      await get().fetchCampaignById(id);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al agregar contactos';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  startCampaign: async (id: string) => {
    try {
      await campaignsApi.start(id);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, status: 'RUNNING' as const } : c
        ),
        currentCampaign:
          state.currentCampaign?.id === id
            ? { ...state.currentCampaign, status: 'RUNNING' as const }
            : state.currentCampaign,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al iniciar campaña');
    }
  },

  pauseCampaign: async (id: string) => {
    try {
      await campaignsApi.pause(id);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, status: 'PAUSED' as const } : c
        ),
        currentCampaign:
          state.currentCampaign?.id === id
            ? { ...state.currentCampaign, status: 'PAUSED' as const }
            : state.currentCampaign,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al pausar campaña');
    }
  },

  cancelCampaign: async (id: string) => {
    try {
      await campaignsApi.cancel(id);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, status: 'CANCELLED' as const } : c
        ),
        currentCampaign:
          state.currentCampaign?.id === id
            ? { ...state.currentCampaign, status: 'CANCELLED' as const }
            : state.currentCampaign,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cancelar campaña');
    }
  },

  fetchLiveContacts: async (id: string, status = 'ALL', limit = 50, offset = 0) => {
    try {
      const { data } = await campaignsApi.getLiveContacts(id, status, limit, offset);
      set({ liveContacts: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));