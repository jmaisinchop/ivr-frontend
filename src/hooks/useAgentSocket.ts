'use client';

import { useEffect, useState, useCallback } from 'react';
import { socketClient } from '@/lib/socket';
import { AgentCallEvent, Agent, QueueEntry } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── TIPOS ───────────────────────────────────────────────────────────────────
export type AgentStatus = 'AVAILABLE' | 'ON_CALL' | 'ON_BREAK' | 'OFFLINE';

export interface AgentLocalState {
  status: AgentStatus;
  breakReason: string | null;
  breakStartedAt: string | null;
}

// Normaliza campos inconsistentes del socket
const normalizeData = (data: any): AgentCallEvent => {
  if (!data) return data;
  return {
    ...data,
    nombre:      data.contactName || data.nombre || 'Desconocido',
    cedula:      data.contactIdentification || data.cedula || '—',
    telefono:    data.contactPhone || data.telefono || '—',
    campaignName: data.campaignName || 'Campaña General',
    contactId:   data.contactId || data.id,
    connectedAt: data.connectedAt || new Date().toISOString(),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: Panel del Asesor
// ═══════════════════════════════════════════════════════════════════════════════

export function useAgentEvents(onCallEvent?: (event: AgentCallEvent) => void) {
  const [currentCall, setCurrentCall]   = useState<AgentCallEvent | null>(null);
  const [isOnCall, setIsOnCall]         = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);

  // Estado real del asesor sincronizado con el backend
  const [agentState, setAgentState] = useState<AgentLocalState>({
    status: 'OFFLINE',
    breakReason: null,
    breakStartedAt: null,
  });

  // ─── RESTAURAR ESTADO AL MONTAR (F5 / primera carga) ────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const { data } = await api.get('/post-call/my-state');
        if (!data) return;

        setAgentState({
          status:         data.status || 'OFFLINE',
          breakReason:    data.breakReason || null,
          breakStartedAt: data.breakStartedAt || null,
        });

        // Si tiene llamada activa en el backend, restaurarla
        if (data.currentContact && data.status === 'ON_CALL') {
          setCurrentCall(normalizeData(data.currentContact));
          setIsOnCall(true);
        }
      } catch {
        // Normal si no hay sesión aún
      }
    };
    restore();
  }, []);

  // ─── SINCRONIZACIÓN DE ESTADO DESDE EL BACKEND ──────────────────────────
  // Se emite cuando:
  //   • El asesor conecta por WebSocket (confirmación)
  //   • El asesor hace break/clear y el backend confirma
  //   • El asesor reconecta tras caída de red
  const handleStatusSync = useCallback((data: any) => {
    console.log('[Agent] status-sync:', data);
    setAgentState({
      status:         data.status || 'OFFLINE',
      breakReason:    data.breakReason || null,
      breakStartedAt: data.breakStartedAt || null,
    });

    if (data.status === 'ON_CALL') {
      setIsOnCall(true);
      if (data.currentContact) setCurrentCall(normalizeData(data.currentContact));
    } else if (data.status !== 'ON_CALL') {
      // Si hay currentContact en sync pero no es ON_CALL, limpiar
      if (!data.currentContact) {
        setIsOnCall(false);
      }
    }
  }, []);

  // Se emite cuando un supervisor fuerza el estado del asesor
  const handleStatusForced = useCallback((data: any) => {
    console.log('[Agent] status-forced por supervisor:', data);
    setAgentState({
      status:         data.status || 'OFFLINE',
      breakReason:    data.breakReason || null,
      breakStartedAt: data.breakStartedAt || null,
    });

    // Notificar al asesor visualmente
    const messages: Record<string, string> = {
      AVAILABLE: 'Un supervisor te puso como disponible',
      ON_BREAK:  data.breakReason
        ? `Un supervisor te pausó: ${data.breakReason}`
        : 'Un supervisor te pausó',
      OFFLINE:   'Un supervisor te desconectó',
    };
    if (data.forcedBy === 'supervisor' && messages[data.status]) {
      toast(messages[data.status], { icon: '👥', duration: 4000 });
    }

    if (data.status === 'ON_CALL') setIsOnCall(true);
    else setIsOnCall(false);
  }, []);

  // ─── LLAMADA ENTRANTE ────────────────────────────────────────────────────
  const handleIncoming = useCallback((data: any) => {
    console.log('[Agent] llamada entrante:', data);
    const normalized = normalizeData(data);
    setCurrentCall(normalized);
    setIsOnCall(true);
    setAgentState(prev => ({ ...prev, status: 'ON_CALL' }));
    onCallEvent?.(normalized);
  }, [onCallEvent]);

  // ─── BRIDGE CONECTADO ────────────────────────────────────────────────────
  const handleConnected = useCallback((data: any) => {
    console.log('[Agent] bridge conectado:', data);
    const normalized = normalizeData(data);
    setCurrentCall(prev => prev ? { ...prev, ...normalized } : normalized);
    setIsOnCall(true);
    setAgentState(prev => ({ ...prev, status: 'ON_CALL' }));
    onCallEvent?.(normalized);
  }, [onCallEvent]);

  // ─── LLAMADA FINALIZADA ──────────────────────────────────────────────────
  const handleEnded = useCallback((data: any) => {
    console.log('[Agent] llamada finalizada:', data);
    setIsOnCall(false);
    setAgentState(prev => ({ ...prev, status: 'AVAILABLE' }));

    if (data.durationSeconds) {
      setCurrentCall(prev => prev ? { ...prev, durationSeconds: data.durationSeconds } : prev);
    }
    onCallEvent?.(normalizeData(data));
  }, [onCallEvent]);

  // ─── COMPROMISO CREADO ───────────────────────────────────────────────────
  const handleCommitment = useCallback((data: any) => {
    console.log('[Agent] compromiso:', data);
    if (data.commitment) {
      setCurrentCall(prev => {
        if (prev && prev.contactId === data.contactId) {
          return { ...prev, commitment: data.commitment };
        }
        return prev;
      });
    }
    onCallEvent?.({ ...data, type: 'COMMITMENT_REGISTERED' } as AgentCallEvent);
  }, [onCallEvent]);

  // ─── LIMPIAR SESIÓN (manual del asesor tras ACW) ────────────────────────
  const clearSession = useCallback(() => {
    setCurrentCall(null);
    setIsOnCall(false);
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // FUNCIONES DE BREAK
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Solicitar descanso. POST al backend.
   * El backend responde { success, message } y emite agent-status-sync por socket.
   */
  const requestBreak = useCallback(async (reason: string = 'Descanso') => {
    setBreakLoading(true);
    try {
      const { data } = await api.post('/post-call/agents/break', { reason });
      if (!data.success) {
        toast.error(data.message);
      }
      // Estado se actualiza por socket (agent-status-sync), no aquí
    } catch (err: any) {
      toast.error('Error al solicitar descanso');
      console.error('[Agent] break error:', err);
    } finally {
      setBreakLoading(false);
    }
  }, []);

  /**
   * Volver del descanso. POST al backend.
   */
  const clearBreak = useCallback(async () => {
    setBreakLoading(true);
    try {
      const { data } = await api.post('/post-call/agents/break/clear');
      if (!data.success) {
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error('Error al volver de descanso');
      console.error('[Agent] clear break error:', err);
    } finally {
      setBreakLoading(false);
    }
  }, []);

  // ─── SUSCRIPCIONES WEBSOCKET ─────────────────────────────────────────────
  useEffect(() => {
    socketClient.on('agent-call-incoming',  handleIncoming);
    socketClient.on('agent-call-connected', handleConnected);
    socketClient.on('agent-call-ended',     handleEnded);
    socketClient.on('commitment-created',   handleCommitment);
    socketClient.on('agent-status-sync',    handleStatusSync);
    socketClient.on('agent-status-forced',  handleStatusForced);

    return () => {
      socketClient.off('agent-call-incoming',  handleIncoming);
      socketClient.off('agent-call-connected', handleConnected);
      socketClient.off('agent-call-ended',     handleEnded);
      socketClient.off('commitment-created',   handleCommitment);
      socketClient.off('agent-status-sync',    handleStatusSync);
      socketClient.off('agent-status-forced',  handleStatusForced);
    };
  }, [handleIncoming, handleConnected, handleEnded, handleCommitment, handleStatusSync, handleStatusForced]);

  return {
    currentCall,
    isOnCall,
    clearSession,
    agentState,
    breakLoading,
    requestBreak,
    clearBreak,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: Mesa de Control (Supervisores)
// ═══════════════════════════════════════════════════════════════════════════════

export function useMesaControlUpdates(
  onAgentsUpdate?: (agents: Agent[]) => void,
  onQueueUpdate?: (queue: QueueEntry[]) => void,
) {
  useEffect(() => {
    const handleAgents = (data: { agents: Agent[] }) => {
      if (data?.agents) onAgentsUpdate?.(data.agents);
    };
    const handleQueue = (data: { queue: QueueEntry[] }) => {
      if (data?.queue) onQueueUpdate?.(data.queue);
    };

    socketClient.on('agents-state-update', handleAgents);
    socketClient.on('queue-state-update',  handleQueue);

    return () => {
      socketClient.off('agents-state-update', handleAgents);
      socketClient.off('queue-state-update',  handleQueue);
    };
  }, [onAgentsUpdate, onQueueUpdate]);
}