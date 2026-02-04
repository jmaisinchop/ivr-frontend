import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (globalThis.window !== undefined) {
      const token = globalThis.window.localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🚨 ERROR DE AUTENTICACIÓN (401) 🚨');
      console.error('El backend rechazó el usuario o contraseña.');
      console.error('Detalles:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/me'),
};

// Campaigns API
export const campaignsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    // Convierte el objeto de params a query string (ej: ?page=1&limit=10...)
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    return api.get(`/campaigns/all/minimal?${query.toString()}`);
  },

  getById: (id: string) => api.get(`/campaigns/${id}`),

  create: (data: any) => api.post('/campaigns', data),

  update: (id: string, data: any) => api.patch(`/campaigns/${id}`, data),

  duplicate: (id: string, data: any) => api.post(`/campaigns/${id}/duplicate`, data),

  addContacts: (id: string, contacts: any[]) =>
    api.post(`/campaigns/${id}/contacts`, { contacts }),

  start: (id: string) => api.post(`/campaigns/${id}/start`),

  pause: (id: string) => api.post(`/campaigns/${id}/pause`),

  cancel: (id: string) => api.post(`/campaigns/${id}/cancel`),

  getLiveContacts: (id: string, status = 'ALL', limit = 50, offset = 0) =>
    api.get(`/campaigns/${id}/contacts/live`, { params: { status, limit, offset } }),

  getPages: (id: string, status = 'ALL', limit = 50) =>
    api.get(`/campaigns/${id}/contacts/pages`, { params: { status, limit } }),

  getContacts: (id: string) => api.get(`/campaigns/${id}/contacts`),

  spyCall: (contactId: string) => api.post(`/campaigns/contacts/${contactId}/spy`),
};

// Stats API
export const statsApi = {
  getDashboardOverview: () => api.get('/stats/dashboard-overview'),

  getOverview: () => api.get('/stats/overview'),

  getCallsDaily: (days = 30) => api.get('/stats/calls/daily', { params: { days } }),

  getCallsMonthly: (months = 12) => api.get('/stats/calls/monthly', { params: { months } }),

  getCallsHourly: (days = 7) => api.get('/stats/calls/hourly', { params: { days } }),

  getSuccessTrend: (days = 30) => api.get('/stats/calls/success-trend', { params: { days } }),

  getStatusDistribution: (days = 30) =>
    api.get('/stats/calls/status-distribution', { params: { days } }),

  getAttemptsEfficiency: (days = 30) =>
    api.get('/stats/calls/attempts-efficiency', { params: { days } }),

  getHangupCauses: (limit = 5, days = 30) =>
    api.get('/stats/calls/hangup-causes', { params: { limit, days } }),

  getRetryRate: (days = 30) => api.get('/stats/calls/retry-rate', { params: { days } }),

  getAgentPerformance: (days = 30) =>
    api.get('/stats/agents/performance', { params: { days } }),

  getCampaignLeaderboard: (limit = 5) =>
    api.get('/stats/campaigns/leaderboard', { params: { limit } }),

  getAgentLeaderboard: (days = 30) =>
    api.get('/stats/agents/leaderboard', { params: { days } }),

  getChannelsUsage: () => api.get('/stats/channels/usage'),

  getChannelPressure: () => api.get('/stats/channels/pressure'),

  getFailureTrend: (days = 30) =>
    api.get('/stats/calls/failure-trend', { params: { days } }),

  getBusyHours: (limit = 5, days = 30) =>
    api.get('/stats/calls/busy-hours', { params: { limit, days } }),

  getCampaignSummary: (start: string, end: string) =>
    api.get('/stats/campaigns/summary', { params: { start, end } }),

  downloadReport: (start: string, end: string) =>
    api.get('/stats/campaigns/report', {
      params: { start, end },
      responseType: 'blob',
    }),
};

export const usersApi = {
  getAll: () => api.get('/users'),

  create: (data: any) => api.post('/users', data),

  update: (id: string, data: any) => api.put(`/users/${id}`, data),

  updatePassword: (userId: string, newPassword: string) =>
    api.put('/users/update-password', { userId, newPassword }),
};

// Channel Limits API
export const channelLimitsApi = {
  getAll: () => api.get('/channel-limit/all'),

  getForUser: (userId: string) => api.get(`/channel-limit/${userId}`),

  assign: (userId: string, maxChannels: number) =>
    api.post('/channel-limit/assign', { userId, maxChannels }),

  update: (userId: string, newMaxChannels: number) =>
    api.put('/channel-limit/update', { userId, newMaxChannels }),
};

export const systemChannelsApi = {
  getTotal: () => api.get('/system-channels/total'),

  setTotal: (totalChannels: number) =>
    api.post('/system-channels/set', { totalChannels }),
};

export const contactosApi = {
  getPadresNiveles: () => api.get('/contactos/padres-niveles'),

  getContactosPorNivel: (niveles: string, esPropia: boolean) =>
    api.post('/contactos/contactosnivel', { niveles, esPropia }),
};

export const amiApi = {
  testCall: (texto: string, numero: string, contactId?: string) =>
    api.post('/ami/call', { texto, numero, contactId }),
};

// ─────────────────────────────────────────────────────────────────────────────
// POST-CALL MENU API
// Rutas reales del backend: /post-call/menu/:campaignId
// ─────────────────────────────────────────────────────────────────────────────
export const postCallApi = {
  getConfigByCampaign: (campaignId: string) =>
    api.get(`/post-call/menu/${campaignId}`),

  createConfig: (campaignId: string, data: {
    active: boolean;
    greeting: string;
    options: { key: string; action: string; text: string }[];
  }) =>
    api.post(`/post-call/menu/${campaignId}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENTS (ASESORES) API
// Rutas reales del backend: /post-call/agents, /post-call/queue
// ─────────────────────────────────────────────────────────────────────────────
export const agentsApi = {
  getAll: () => api.get('/post-call/agents'),

  getQueue: () => api.get('/post-call/queue'),
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT PERSONAL API (NUEVO)
// Rutas reales del backend: /post-call/history/me, /post-call/my-state
// ─────────────────────────────────────────────────────────────────────────────
export const agentApi = {
  // Obtener historial personal del asesor con filtros opcionales
  getHistory: (startDate?: string, endDate?: string) => {
    return api.get('/post-call/history/me', {
      params: { startDate, endDate }
    });
  },

  // Recuperar el estado actual de la sesión (para persistencia F5)
  getMyState: () => api.get('/post-call/my-state'),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPROMISOS DE PAGO API
// Rutas reales del backend: /post-call/commitments/...
// ─────────────────────────────────────────────────────────────────────────────
export const commitmentsApi = {
  create: (data: {
    contactId: string,
    cedula: string,
    campaignId: string,
    promisedDate: string,
    agentId: string,
    notes?: string
  }) => {
    return api.post('/post-call/commitments/manual', {
      contactId: data.contactId,
      campaignId: data.campaignId,
      agentId: data.agentId,
      note: data.notes,

      // Mapeo clave para el backend
      commitmentDate: data.promisedDate
    });
  },

  getByContact: (contactId: string) =>
    api.get(`/post-call/commitments/contact/${contactId}`),

  getByCampaign: (campaignId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/post-call/commitments/campaign/${campaignId}`, { params }),
};