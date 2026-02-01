// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  CALLCENTER = 'CALLCENTER',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: UserRole;
  canAccessIvrs: boolean;
  extension?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxRetries: number;
  concurrentCalls: number;
  status: CampaignStatus;
  retryOnAnswer: boolean;
  createdBy: string;
  contacts?: Contact[];
}

export type CampaignStatus = 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Contact {
  id: string;
  identification: string;
  name: string;
  phone: string;
  message: string;
  attemptCount: number;
  callStatus: CallStatus;
  hangupCode?: string;
  hangupCause?: string;
  startedAt?: string;
  answeredAt?: string;
  finishedAt?: string;
  activeChannelId?: string;
}

export type CallStatus = 'NOT_CALLED' | 'CALLING' | 'SUCCESS' | 'FAILED';

export interface CreateCampaignDto {
  name: string;
  startDate: string;
  endDate: string;
  maxRetries: number;
  concurrentCalls: number;
  retryOnAnswer?: boolean;
}

export interface UpdateCampaignDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  maxRetries?: number;
  concurrentCalls?: number;
  retryOnAnswer?: boolean;
}

export interface ContactInput {
  name: string;
  phone: string;
  message: string;
  identification: string;
}

// Stats types
export interface DashboardOverview {
  ivr: {
    activeCampaigns: MetricWithChange;
    ongoingCalls: MetricWithChange;
    successRate: MetricWithChange;
    channels: ChannelInfo;
  };
}

export interface MetricWithChange {
  value: number;
  change: number;
}

export interface ChannelInfo {
  total: number;
  used: number;
  available: number;
}

export interface CallsPerDay {
  day: string;
  llamadas: number;
  exitosas: number;
}

export interface CallsPerMonth {
  month: string;
  llamadas: number;
  exitosas: number;
}

export interface CallStatusDistribution {
  status: string;
  total: number;
}

export interface HangupCause {
  cause: string;
  total: number;
}

export interface AgentPerformance {
  userid: string;
  username: string;
  totalcalls: number;
  successfulcalls: number;
  successrate: number;
}

export interface CampaignLeaderboard {
  id: string;
  name: string;
  total: number;
  ok: number;
  successrate: number;
}

// Channel Limit types
export interface ChannelLimit {
  id: string;
  user: User;
  maxChannels: number;
  usedChannels: number;
}

export interface SystemChannels {
  totalChannels: number;
}

// Live contacts response
export interface LiveContactsResponse {
  total: number;
  calling: number;
  success: number;
  failed: number;
  pending: number;
  rows: Contact[];
}

// Contactos externos
export interface PadreNivel {
  padre: string;
  niveles_concatenados: string;
  es_propia: boolean;
}

export interface ContactoExterno {
  cedula: string;
  nombre: string;
  valorpagado: number;
  numero: string;
}

// WebSocket events
export interface DashboardUpdate {
  event: string;
  campaignId?: string;
  contactId?: string;
  status?: string;
  _targetUserId?: string;
  _broadcast?: boolean;
  timestamp?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-CALL MENU & AGENT TRANSFER TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Configuración del menú post-llamada por campaña */
export interface PostCallConfig {
  id: string;
  campaignId: string;
  active: boolean;
  menuAudioText: string;
  option1Label: string;
  option2Label: string;
  confirmationAudioText: string;
  invalidInputAudioText: string;
  queueAudioText: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostCallConfigDto {
  campaignId: string;
  active: boolean;
  menuAudioText: string;
  option1Label: string;
  option2Label: string;
  confirmationAudioText: string;
  invalidInputAudioText: string;
  queueAudioText: string;
}

export interface UpdatePostCallConfigDto {
  active?: boolean;
  menuAudioText?: string;
  option1Label?: string;
  option2Label?: string;
  confirmationAudioText?: string;
  invalidInputAudioText?: string;
  queueAudioText?: string;
}

/** Estado de un asesor en tiempo real */
export type AgentStatus = 'AVAILABLE' | 'ON_CALL' | 'OFFLINE';

export interface Agent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  extension: string;
  status: AgentStatus;
  activeCalls: number;
  totalCallsToday: number;
  currentContact?: AgentCurrentContact | null;
}

export interface AgentCurrentContact {
  contactId: string;
  cedula: string;
  nombre: string;
  telefono: string;
  campaignId: string;
  campaignName: string;
  connectedAt: string;
}

/** Entrada en la cola de espera */
export interface QueueEntry {
  contactId: string;
  cedula: string;
  nombre: string;
  telefono: string;
  campaignId: string;
  campaignName: string;
  position: number;
  enqueuedAt: string;
  waitingSeconds: number;
}

/** Evento WebSocket que llega al panel del asesor */
export interface AgentCallEvent {
  type: 'INCOMING_CALL' | 'CALL_ENDED' | 'COMMITMENT_REGISTERED';
  contactId: string;
  cedula: string;
  nombre: string;
  telefono: string;
  campaignId: string;
  campaignName: string;
  connectedAt?: string;
  commitment?: Commitment;
}

/** Compromiso de pago */
export interface Commitment {
  id: string;
  contactId: string;
  cedula: string;
  campaignId: string;
  promisedDate: string;
  registeredAt: string;
  registeredBy: 'AUTOMATIC' | 'MANUAL';
  agentId: string | null;
  agentUsername: string | null;
  notes: string | null;
}

export interface CreateCommitmentDto {
  contactId: string;
  cedula: string;
  campaignId: string;
  promisedDate: string;
  registeredBy: 'AUTOMATIC' | 'MANUAL';
  agentId?: string;
  notes?: string;
}

/** Resumen de la mesa de control (snapshot en tiempo real) */
export interface MesaControlSnapshot {
  agents: Agent[];
  queue: QueueEntry[];
  activeCalls: number;
  totalCommitmentsToday: number;
}