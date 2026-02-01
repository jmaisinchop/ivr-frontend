'use client';

import { useEffect, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket';
import { AgentCallEvent, Agent, QueueEntry } from '@/types';

/**
 * Hook para el Panel del Asesor.
 * Escucha eventos WebSocket específicos del asesor autenticado:
 *  - agent-call-incoming        → llega una llamada transferida
 *  - agent-call-connected       → bridge activo (datos del contacto)
 *  - agent-call-ended           → la llamada actual terminó
 *  - commitment-created         → compromiso registrado (auto o manual)
 */
export function useAgentEvents(onCallEvent?: (event: AgentCallEvent) => void) {
  const [currentCall, setCurrentCall] = useState<AgentCallEvent | null>(null);
  const [isOnCall, setIsOnCall] = useState(false);

  const handleIncoming = useCallback((data: AgentCallEvent) => {
    console.log('📞 [Agent] Llamada entrante:', data);
    setCurrentCall(data);
    setIsOnCall(true);
    onCallEvent?.(data);
  }, [onCallEvent]);

  const handleConnected = useCallback((data: AgentCallEvent) => {
    console.log('🔗 [Agent] Bridge conectado:', data);
    setCurrentCall((prev: AgentCallEvent | null) => prev ? { ...prev, ...data } : data);
    setIsOnCall(true);
    onCallEvent?.(data);
  }, [onCallEvent]);

  const handleEnded = useCallback((data: AgentCallEvent) => {
    console.log('📵 [Agent] Llamada finalizada:', data);
    setCurrentCall(null);
    setIsOnCall(false);
    onCallEvent?.(data);
  }, [onCallEvent]);

  const handleCommitment = useCallback((data: any) => {
    console.log('💳 [Agent] Compromiso registrado:', data);
    if (data.commitment) {
      setCurrentCall((prev: AgentCallEvent | null) => {
        if (prev && prev.contactId === data.contactId) {
          return { ...prev, commitment: data.commitment };
        }
        return prev;
      });
    }
    onCallEvent?.({ ...data, type: 'COMMITMENT_REGISTERED' } as AgentCallEvent);
  }, [onCallEvent]);

  useEffect(() => {
    socketClient.on('agent-call-incoming',   handleIncoming);
    socketClient.on('agent-call-connected',  handleConnected);
    socketClient.on('agent-call-ended',      handleEnded);
    socketClient.on('commitment-created',    handleCommitment);

    return () => {
      socketClient.off('agent-call-incoming',   handleIncoming);
      socketClient.off('agent-call-connected',  handleConnected);
      socketClient.off('agent-call-ended',      handleEnded);
      socketClient.off('commitment-created',    handleCommitment);
    };
  }, [handleIncoming, handleConnected, handleEnded, handleCommitment]);

  return { currentCall, isOnCall };
}

/**
 * Hook para la Mesa de Control (supervisión).
 * Escucha actualizaciones en tiempo real de todos los asesores y la cola.
 */
export function useMesaControlUpdates(
  onAgentsUpdate?: (agents: Agent[]) => void,
  onQueueUpdate?: (queue: QueueEntry[]) => void
) {
  useEffect(() => {
    const handleAgents = (data: { agents: Agent[] }) => {
      console.log('👥 [MesaControl] Agentes actualizados');
      onAgentsUpdate?.(data.agents);
    };

    const handleQueue = (data: { queue: QueueEntry[] }) => {
      console.log('📋 [MesaControl] Cola actualizada');
      onQueueUpdate?.(data.queue);
    };

    socketClient.on('agents-state-update', handleAgents);
    socketClient.on('queue-state-update',  handleQueue);

    return () => {
      socketClient.off('agents-state-update', handleAgents);
      socketClient.off('queue-state-update',  handleQueue);
    };
  }, [onAgentsUpdate, onQueueUpdate]);
}