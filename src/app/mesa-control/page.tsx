'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { useMesaControlUpdates } from '@/hooks/useAgentSocket';
import { Agent, QueueEntry } from '@/types';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Users, Phone, Clock, ChevronDown, X, Coffee,
  Loader2, AlertCircle, UserCheck, UserX, ArrowLeftCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

type AgentStatus = 'AVAILABLE' | 'ON_CALL' | 'ON_BREAK' | 'OFFLINE';

// ─── CONFIG DE COLORES POR ESTADO ────────────────────────────────────────────
const STATUS_CONFIG: Record<AgentStatus, {
  label: string;
  badge: string;
  dot: string;
  card: string;
  icon: React.ReactNode;
}> = {
  AVAILABLE: {
    label: 'Disponible',
    badge: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400',
    dot:   'bg-emerald-500',
    card:  'border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300',
    icon:  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  },
  ON_CALL: {
    label: 'En llamada',
    badge: 'text-cyan-700 bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-400',
    dot:   'bg-cyan-500',
    card:  'border-cyan-200 dark:border-cyan-500/30 hover:border-cyan-300 shadow-sm shadow-cyan-500/10',
    icon:  <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
  },
  ON_BREAK: {
    label: 'En descanso',
    badge: 'text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400',
    dot:   'bg-amber-500',
    card:  'border-amber-200 dark:border-amber-500/30 hover:border-amber-300',
    icon:  <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  },
  OFFLINE: {
    label: 'Desconectado',
    badge: 'text-gray-500 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-400',
    dot:   'bg-gray-400',
    card:  'border-gray-200 dark:border-gray-500/30 opacity-60',
    icon:  <UserX className="w-4 h-4 text-gray-400" />,
  },
};

// ─── TIMER DE BREAK ──────────────────────────────────────────────────────────
function BreakTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">{m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}</span>;
}

// ─── TIMER DE LLAMADA ────────────────────────────────────────────────────────
function CallTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">{m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Tarjeta del Asesor
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentCardProps {
  agent: Agent;
  onForceStatus: (agentId: string, status: 'AVAILABLE' | 'ON_BREAK' | 'OFFLINE', reason?: string) => void;
}

function AgentCard({ agent, onForceStatus }: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = (agent.status || 'OFFLINE') as AgentStatus;
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={cn(
      'bg-background border rounded-xl p-3.5 transition-all duration-200 relative',
      cfg.card
    )}>
      {/* Header: avatar + nombre + badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* Avatar con dot de estado */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              {cfg.icon}
            </div>
            <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background', cfg.dot, status !== 'OFFLINE' && 'animate-pulse')} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {agent.firstName} {agent.lastName}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">Ext. {agent.extension}</p>
          </div>
        </div>

        {/* Badge de estado */}
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.badge)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      {/* Info de break (si está en descanso) */}
      {status === 'ON_BREAK' && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <Coffee className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-amber-600 dark:text-amber-400">{agent.breakReason || 'Descanso'}</span>
          {agent.breakStartedAt && (
            <>
              <span className="text-[10px] text-muted-foreground">·</span>
              <Clock className="w-3 h-3 text-muted-foreground" />
              <BreakTimer startedAt={agent.breakStartedAt} />
            </>
          )}
        </div>
      )}

      {/* Info de llamada activa */}
      {status === 'ON_CALL' && agent.currentContact && (
        <div className="mt-2.5 p-2 bg-cyan-50/40 dark:bg-cyan-900/15 rounded-lg border border-cyan-200/50 dark:border-cyan-500/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide flex items-center gap-1">
              <Phone className="w-3 h-3" /> En llamada
            </p>
            {agent.currentContact.connectedAt && (
              <CallTimer startedAt={agent.currentContact.connectedAt} />
            )}
          </div>
          <p className="text-xs font-semibold text-foreground">{agent.currentContact.nombre}</p>
          <p className="text-[10px] text-muted-foreground font-mono">
            C.I. {agent.currentContact.cedula} · {agent.currentContact.campaignName}
          </p>
        </div>
      )}

      {/* Botones de acción del supervisor */}
      <div className="mt-3 pt-3 border-t border-border/40 relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/40 transition-colors"
        >
          <span>Acciones del supervisor</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', menuOpen && 'rotate-180')} />
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {/* Poner disponible — solo si no está ON_CALL ni AVAILABLE */}
            {status !== 'AVAILABLE' && status !== 'ON_CALL' && (
              <button
                onClick={() => { onForceStatus(agent.id, 'AVAILABLE'); setMenuOpen(false); }}
                disabled={!agent.connected}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" /> Poner disponible
              </button>
            )}

            {/* Pausar — solo si está AVAILABLE */}
            {status === 'AVAILABLE' && (
              <button
                onClick={() => { onForceStatus(agent.id, 'ON_BREAK', 'Pausado por supervisor'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
              >
                <Coffee className="w-3.5 h-3.5" /> Pausar asesor
              </button>
            )}

            {/* Desconectar — si está conectado y no en llamada */}
            {status !== 'ON_CALL' && status !== 'OFFLINE' && (
              <button
                onClick={() => { onForceStatus(agent.id, 'OFFLINE'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <UserX className="w-3.5 h-3.5" /> Desconectar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Tarjeta de Cola
// ═══════════════════════════════════════════════════════════════════════════════

function QueueCard({ entry }: { entry: QueueEntry }) {
  const [waitSec, setWaitSec] = useState(entry.waitingSeconds || 0);
  useEffect(() => {
    setWaitSec(entry.waitingSeconds || 0);
    const iv = setInterval(() => setWaitSec(prev => prev + 1), 1000);
    return () => clearInterval(iv);
  }, [entry.waitingSeconds]);

  const m = Math.floor(waitSec / 60);
  const s = waitSec % 60;
  const isUrgent = waitSec > 120; // más de 2 minutos

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      isUrgent
        ? 'bg-red-50/40 dark:bg-red-900/15 border-red-200 dark:border-red-500/30'
        : 'bg-background border-border'
    )}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold',
        isUrgent ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
      )}>
        #{entry.position}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-foreground truncate">Contacto en espera</p>
        <p className="text-[10px] text-muted-foreground font-mono">Campaña: {entry.campaignId}</p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1">
          <Clock className={cn('w-3 h-3', isUrgent ? 'text-red-500' : 'text-muted-foreground')} />
          <span className={cn('font-mono text-[11px] font-bold', isUrgent ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
            {m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}
          </span>
        </div>
        {isUrgent && <p className="text-[9px] text-red-500 font-semibold text-right">⚠️ Espera larga</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL: Mesa de Control
// ═══════════════════════════════════════════════════════════════════════════════

export default function MesaControlPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [queue, setQueue]   = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceLoading, setForceLoading] = useState<string | null>(null);

  // ─── Carga inicial desde REST ──────────────────────────────────────────
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [agentsRes, queueRes] = await Promise.all([
          api.get('/post-call/agents'),
          api.get('/post-call/queue'),
        ]);
        if (Array.isArray(agentsRes.data)) setAgents(agentsRes.data);
        if (Array.isArray(queueRes.data))  setQueue(queueRes.data);
      } catch {
        toast.error('Error cargando datos de la mesa de control');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // ─── WebSocket tiempo real ─────────────────────────────────────────────
  useMesaControlUpdates(
    useCallback((updatedAgents: Agent[]) => setAgents(updatedAgents), []),
    useCallback((updatedQueue: QueueEntry[]) => setQueue(updatedQueue), []),
  );

  // ─── Forzar estado desde supervisor ────────────────────────────────────
  const handleForceStatus = useCallback(async (
    agentId: string,
    status: 'AVAILABLE' | 'ON_BREAK' | 'OFFLINE',
    reason?: string,
  ) => {
    setForceLoading(agentId);
    try {
      const { data } = await api.post(`/post-call/agents/${agentId}/force-status`, { status, reason });
      if (!data.success) {
        toast.error(data.message);
      } else {
        toast.success(`Estado del asesor cambiado a ${status}`);
        // El update real viene por WebSocket (agents-state-update)
      }
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setForceLoading(null);
    }
  }, []);

  // ─── MÉTRICAS calculadas en tiempo real ───────────────────────────────
  const metrics = {
    disponibles: agents.filter(a => a.status === 'AVAILABLE').length,
    enLlamada:   agents.filter(a => a.status === 'ON_CALL').length,
    enDescanso:  agents.filter(a => a.status === 'ON_BREAK').length,
    offline:     agents.filter(a => a.status === 'OFFLINE').length,
    enCola:      queue.length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header title="Mesa de Control" subtitle="Supervisión en tiempo real" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* ════════════════════════════════════════════════════════════════
            MÉTRICAS TOP
            ════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Disponibles',  value: metrics.disponibles,  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500' },
            { label: 'En llamada',   value: metrics.enLlamada,    color: 'text-cyan-600',    bg: 'bg-cyan-50 dark:bg-cyan-500/10',       dot: 'bg-cyan-500' },
            { label: 'En descanso',  value: metrics.enDescanso,   color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10',     dot: 'bg-amber-500' },
            { label: 'Offline',      value: metrics.offline,      color: 'text-gray-500',    bg: 'bg-gray-50 dark:bg-gray-500/10',       dot: 'bg-gray-400' },
            { label: 'En cola',      value: metrics.enCola,       color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-500/10',   dot: 'bg-indigo-500' },
          ].map((m, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('w-2 h-2 rounded-full', m.dot)} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{m.label}</p>
              </div>
              <p className={cn('text-2xl font-bold', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            GRID DE ASESORES
            ════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" /> Asesores ({agents.length})
            </h2>
            {/* Filtros rápidos por estado */}
            <div className="flex items-center gap-1.5">
              {(['AVAILABLE', 'ON_CALL', 'ON_BREAK', 'OFFLINE'] as AgentStatus[]).map(s => (
                <span key={s} className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', STATUS_CONFIG[s].badge)}>
                  {STATUS_CONFIG[s].label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onForceStatus={handleForceStatus}
              />
            ))}
            {agents.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay asesores registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLA DE ESPERA
            ════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Cola de espera
              {queue.length > 0 && (
                <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                  {queue.length}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-2">
            {queue.length === 0 ? (
              <div className="bg-background border border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">Cola vacía — todos los clientes están siendo atendidos</p>
              </div>
            ) : (
              queue.map((entry, i) => <QueueCard key={i} entry={entry} />)
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}