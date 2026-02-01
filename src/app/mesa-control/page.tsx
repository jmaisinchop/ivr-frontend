'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { useMesaControlUpdates } from '@/hooks/useAgentSocket';
import { agentsApi, campaignsApi } from '@/lib/api';
import {
  Agent,
  AgentStatus,
  QueueEntry,
  Campaign,
} from '@/types';
import { cn } from '@/lib/utils';
import {
  Phone,
  Users,
  Clock,
  CheckCircle2,
  User,
  Headset,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Badge de estado del asesor ─────────────────────────────────────────────
function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const styles: Record<AgentStatus, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    ON_CALL:   'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
    OFFLINE:   'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400',
  };
  const labels: Record<AgentStatus, string> = {
    AVAILABLE: 'Disponible',
    ON_CALL:   'En llamada',
    OFFLINE:   'Desconectado',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', styles[status])}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-emerald-500 animate-pulse': status === 'AVAILABLE',
        'bg-cyan-500 animate-pulse':    status === 'ON_CALL',
        'bg-gray-400':                  status === 'OFFLINE',
      })} />
      {labels[status]}
    </span>
  );
}

// ─── Tarjeta del asesor ─────────────────────────────────────────────────────
function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className={cn(
      'bg-background border border-border rounded-xl p-4 transition-all duration-300',
      agent.status === 'ON_CALL' && 'border-cyan-300 dark:border-cyan-500/40 shadow-md shadow-cyan-500/10',
      agent.status === 'OFFLINE' && 'opacity-50',
    )}>
      {/* Header asesor */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            agent.status === 'ON_CALL' ? 'bg-cyan-100 dark:bg-cyan-500/20' : 'bg-muted',
          )}>
            <User className={cn('w-5 h-5', agent.status === 'ON_CALL' ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{agent.firstName} {agent.lastName}</p>
            <p className="text-xs text-muted-foreground font-mono">Ext: {agent.extension || '—'}</p>
          </div>
        </div>
        <AgentStatusBadge status={agent.status} />
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Activas</p>
          <p className={cn('text-lg font-bold', agent.activeCalls > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-foreground')}>
            {agent.activeCalls}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hoy</p>
          <p className="text-lg font-bold text-foreground">{agent.totalCallsToday}</p>
        </div>
      </div>

      {/* Contacto actual si está en llamada */}
      {agent.status === 'ON_CALL' && agent.currentContact && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Phone className="w-3 h-3 text-cyan-500" />
            <span className="text-[9px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">En llamada con</span>
          </div>
          <div className="bg-cyan-50/60 dark:bg-cyan-900/15 rounded-lg p-2.5 border border-cyan-100 dark:border-cyan-500/20">
            <p className="font-semibold text-foreground text-sm">{agent.currentContact.nombre}</p>
            <p className="text-xs text-muted-foreground font-mono">C.I.: {agent.currentContact.cedula}</p>
            <p className="text-xs text-muted-foreground font-mono">{agent.currentContact.telefono}</p>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1 font-medium truncate">
              {agent.currentContact.campaignName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fila de la cola de espera ──────────────────────────────────────────────
function QueueRow({ entry }: { entry: QueueEntry }) {
  const waitMin = Math.floor(entry.waitingSeconds / 60);
  const waitSec = entry.waitingSeconds % 60;
  const waitLabel = waitMin > 0 ? `${waitMin}m ${waitSec}s` : `${waitSec}s`;

  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
      {/* Posición */}
      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{entry.position}</span>
      </div>
      {/* Info contacto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{entry.nombre}</p>
        <p className="text-xs text-muted-foreground font-mono">C.I.: {entry.cedula} · {entry.telefono}</p>
      </div>
      {/* Campaña */}
      <div className="hidden sm:block">
        <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{entry.campaignName}</span>
      </div>
      {/* Tiempo de espera */}
      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-mono font-semibold">{waitLabel}</span>
      </div>
    </div>
  );
}


// ─── PÁGINA PRINCIPAL ───────────────────────────────────────────────────────
export default function MesaControlPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [commitmentsToday, setCommitmentsToday] = useState(0);

  // Carga inicial
  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, queueRes, campaignsRes] = await Promise.all([
        agentsApi.getAll(),
        agentsApi.getQueue(),
        campaignsApi.getAll(),
      ]);
      setAgents(agentsRes.data);
      setQueue(queueRes.data);
      setCampaigns(campaignsRes.data?.data || campaignsRes.data || []);
    } catch (err) {
      console.error('[MesaControl] Error al cargar datos:', err);
      toast.error('Error al cargar datos de la mesa de control');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket updates en tiempo real
  useMesaControlUpdates(
    useCallback((updatedAgents: Agent[]) => setAgents(updatedAgents), []),
    useCallback((updatedQueue: QueueEntry[]) => setQueue(updatedQueue), []),
  );

  // Métricas derivadas
  const activeCalls = agents.reduce((sum, a) => sum + a.activeCalls, 0);
  const availableAgents = agents.filter(a => a.status === 'AVAILABLE').length;

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
      <Header title="Mesa de Control" subtitle="Supervisión en tiempo real de asesores y cola" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* ── Métricas superiores ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Users className="w-5 h-5 text-indigo-500" />, label: 'Asesores activos', value: agents.length, sub: `${availableAgents} disponibles`, bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { icon: <Phone className="w-5 h-5 text-cyan-500" />, label: 'Llamadas activas', value: activeCalls, sub: 'En este momento', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
            { icon: <Clock className="w-5 h-5 text-amber-500" />, label: 'En cola', value: queue.length, sub: queue.length > 0 ? `Máx espera: ${Math.max(...queue.map(q => q.waitingSeconds))}s` : 'Cola vacía', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: 'Compromisos hoy', value: commitmentsToday, sub: 'Auto + manual', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          ].map((m, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', m.bg)}>
                  {m.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold text-foreground">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Título sección asesores ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Headset className="w-4 h-4 text-muted-foreground" />
            Monitor de Asesores
          </h2>
        </div>

        {/* ── Grid de asesores ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent, i) => (
            <AgentCard key={agent.id ?? `agent-${i}`} agent={agent} />
          ))}
          {agents.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground text-sm">
              No hay asesores registrados. Asegure que los usuarios tengan extensión configurada.
            </div>
          )}
        </div>

        {/* ── Cola de espera ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Cola de espera
              {queue.length > 0 && (
                <span className="ml-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {queue.length} esperando
                </span>
              )}
            </h2>
          </div>

          <div className="bg-background border border-border rounded-xl overflow-hidden">
            {queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                La cola está vacía — todos los clientes están siendo atendidos
              </div>
            ) : (
              queue.map(entry => <QueueRow key={entry.contactId} entry={entry} />)
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}