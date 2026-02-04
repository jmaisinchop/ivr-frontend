'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { useAgentEvents } from '@/hooks/useAgentSocket';
import { commitmentsApi, agentApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { AgentCallEvent, Commitment } from '@/types';
import { cn } from '@/lib/utils';
import {
  Headset, Phone, PhoneOff, Clock, CheckCircle2, Plus, X,
  Loader2, Activity, LogOut, Calendar, Search, AlertCircle,
  Coffee, ArrowLeftCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── UTILS ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Timer de llamada activa */
function CallTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span className="font-mono text-2xl font-bold text-cyan-600 dark:text-cyan-400">{formatTime(elapsed)}</span>;
}

/** Timer de tiempo en descanso */
function BreakTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{formatTime(elapsed)}</span>;
}

// ─── MODAL COMPROMISO ────────────────────────────────────────────────────────

interface CommitmentModalProps {
  open: boolean;
  onClose: () => void;
  call: AgentCallEvent;
  agentId: string;
  onSaved: (commitment: Commitment) => void;
}

function CommitmentModal({ open, onClose, call, agentId, onSaved }: CommitmentModalProps) {
  const [promisedDate, setPromisedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState('');

  const validateDate = (val: string) => {
    if (!val) { setDateError(''); return true; }
    const d = new Date(val + 'T12:00:00');
    const day = d.getDay();
    if (day === 0 || day === 6) { setDateError('Debe ser día laborable (lun–viernes)'); return false; }
    if (d.getDate() > 28) { setDateError('El día no puede ser mayor a 28'); return false; }
    setDateError('');
    return true;
  };

  const handleSave = async () => {
    if (!promisedDate || !validateDate(promisedDate)) return;
    setSaving(true);
    try {
      const res = await commitmentsApi.create({
        contactId: call.contactId,
        cedula: call.cedula,
        campaignId: call.campaignId,
        promisedDate,
        agentId,
        notes: notes || undefined,
      });
      toast.success('Compromiso registrado');
      onSaved(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Registrar compromiso</h3>
              <p className="text-xs text-muted-foreground">{call.nombre} · C.I. {call.cedula}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Fecha prometida
            </label>
            <input
              type="date"
              value={promisedDate}
              min={minDate}
              onChange={(e) => { setPromisedDate(e.target.value); validateDate(e.target.value); }}
              className={cn(
                'w-full bg-muted/40 border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
                dateError ? 'border-red-400' : 'border-border focus:border-primary'
              )}
            />
            {dateError && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs text-red-500">{dateError}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notas del compromiso..."
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!promisedDate || saving || !!dateError}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <CheckCircle2 className="w-3.5 h-3.5" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function AsesorPage() {
  const { user } = useAuthStore();
  const [callHistory, setCallHistory]         = useState<any[]>([]);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [currentCommitment, setCurrentCommitment]     = useState<Commitment | null>(null);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [showBreakModal, setShowBreakModal]   = useState(false);

  const [dateFilter, setDateFilter] = useState({
    start: new Date().toISOString().split('T')[0],
    end:   new Date().toISOString().split('T')[0],
  });

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await agentApi.getHistory(dateFilter.start, dateFilter.end);
      if (Array.isArray(data)) setCallHistory(data);
    } catch {
      toast.error('No se pudo cargar el historial');
    } finally {
      setHistoryLoading(false);
    }
  }, [dateFilter.start, dateFilter.end]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const {
    currentCall, isOnCall, clearSession,
    agentState, breakLoading, requestBreak, clearBreak,
  } = useAgentEvents(
    useCallback((event: AgentCallEvent) => {
      const evt = event as any;
      const type = evt.type || evt.event;

      if (type === 'CONNECTED' || type === 'INCOMING_CALL' || type === 'agent-call-connected') {
        setCurrentCommitment(null);
      }
      if (type === 'COMMITMENT_REGISTERED' && evt.commitment) {
        setCurrentCommitment(evt.commitment);
        setCallHistory(prev =>
          prev.map(c =>
            c.id === evt.contactId || c.contactId === evt.contactId
              ? { ...c, commitment: evt.commitment }
              : c
          )
        );
      }
      if (type === 'FINISHED' || type === 'CALL_ENDED' || type === 'agent-call-ended') {
        const today = new Date().toISOString().split('T')[0];
        if (dateFilter.start <= today && dateFilter.end >= today) {
          setCallHistory(prev => {
            const exists = prev.some(
              (item: any) =>
                item.contactId === evt.contactId &&
                item.status === 'FINISHED' &&
                Math.abs(new Date(item.connectedAt).getTime() - Date.now()) < 5000
            );
            if (exists) return prev;
            return [{ ...event, status: 'FINISHED', connectedAt: new Date().toISOString() }, ...prev];
          });
        }
      }
    }, [dateFilter])
  );

  const handleCommitmentSaved = useCallback((commitment: Commitment) => {
    setCurrentCommitment(commitment);
    fetchHistory();
  }, [fetchHistory]);

  // ─── CONFIG DE BADGES ────────────────────────────────────────────────────
  const statusConfig = {
    AVAILABLE: {
      label: 'Disponible',
      badge:  'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400',
      dot:    'bg-emerald-500',
      card:   'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/30',
    },
    ON_CALL: {
      label: 'En llamada',
      badge:  'text-cyan-700 bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-400',
      dot:    'bg-cyan-500',
      card:   'bg-cyan-50/30 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-500/30',
    },
    ON_BREAK: {
      label: 'En descanso',
      badge:  'text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400',
      dot:    'bg-amber-500',
      card:   'bg-amber-50/40 dark:bg-amber-900/15 border-amber-300 dark:border-amber-500/30',
    },
    OFFLINE: {
      label: 'Desconectado',
      badge:  'text-gray-500 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-400',
      dot:    'bg-gray-400',
      card:   'bg-gray-50/40 dark:bg-gray-900/15 border-gray-300 dark:border-gray-500/30',
    },
  };
  const cfg = statusConfig[agentState.status];

  // Motivos de descanso
  const breakReasons = [
    { label: 'Baño',  icon: '🚻' },
    { label: 'Lunch', icon: '🍽️' },
    { label: 'Otro',  icon: '⏸️' },
  ];

  return (
    <DashboardLayout>
      <Header title="Panel Asesor" subtitle="Tu espacio de trabajo" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* ════════════════════════════════════════════════════════════════
            BARRA DE ESTADO + CONTROLES DE BREAK
            ════════════════════════════════════════════════════════════ */}
        <div className={cn('rounded-2xl border p-4 flex items-center justify-between transition-all duration-300', cfg.card)}>
          {/* Izquierda: badge + motivo + timer de break */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', cfg.badge)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot, agentState.status !== 'OFFLINE' && 'animate-pulse')} />
              {cfg.label}
            </span>

            {agentState.status === 'ON_BREAK' && agentState.breakReason && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                — {agentState.breakReason}
              </span>
            )}

            {agentState.status === 'ON_BREAK' && agentState.breakStartedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <BreakTimer startedAt={agentState.breakStartedAt} />
              </span>
            )}
          </div>

          {/* Derecha: botones */}
          <div className="flex items-center gap-2">
            {/* "En descanso" — solo cuando AVAILABLE */}
            {agentState.status === 'AVAILABLE' && (
              <button
                onClick={() => setShowBreakModal(true)}
                disabled={breakLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-colors disabled:opacity-50"
              >
                {breakLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Coffee className="w-3.5 h-3.5" />
                }
                En descanso
              </button>
            )}

            {/* "Volver" — solo cuando ON_BREAK */}
            {agentState.status === 'ON_BREAK' && (
              <button
                onClick={clearBreak}
                disabled={breakLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
              >
                {breakLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ArrowLeftCircle className="w-3.5 h-3.5" />
                }
                Volver
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MODAL: Elegir motivo de descanso
            ════════════════════════════════════════════════════════════ */}
        {showBreakModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBreakModal(false)} />
            <div className="relative z-10 w-full max-w-xs mx-4 bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4.5 h-4.5 text-amber-600" />
                  <h3 className="font-semibold text-foreground text-sm">¿Qué necesitas?</h3>
                </div>
                <button onClick={() => setShowBreakModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-2">
                {breakReasons.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => { requestBreak(r.label); setShowBreakModal(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-500/10 transition-all"
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-xs font-semibold text-foreground">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TARJETA DE LLAMADA ACTIVA / ACW / ESPERA
            ════════════════════════════════════════════════════════════ */}
        <div className={cn(
          'rounded-2xl border p-5 transition-all duration-500',
          currentCall
            ? (isOnCall
                ? 'bg-cyan-50/40 dark:bg-cyan-900/15 border-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'bg-orange-50/40 dark:bg-orange-900/15 border-orange-300 shadow-sm')
            : 'bg-background border-border'
        )}>
          {currentCall ? (
            <div>
              {/* Header tarjeta llamada */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isOnCall ? 'bg-cyan-100 dark:bg-cyan-500/20 animate-pulse' : 'bg-orange-100 dark:bg-orange-500/20'
                  )}>
                    {isOnCall
                      ? <Phone className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      : <PhoneOff className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    }
                  </div>
                  <div>
                    <span className={cn(
                      'text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                      isOnCall ? 'text-cyan-600 bg-cyan-100' : 'text-orange-600 bg-orange-100'
                    )}>
                      {isOnCall ? 'Llamada activa' : 'Llamada finalizada'}
                    </span>
                    <p className="text-lg font-bold text-foreground mt-0.5">{currentCall.nombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOnCall && (
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Duración</p>
                      {currentCall.connectedAt
                        ? <CallTimer startedAt={currentCall.connectedAt} />
                        : <span className="font-mono text-2xl font-bold text-cyan-600">—</span>
                      }
                    </div>
                  )}
                  {!isOnCall && (
                    <button
                      onClick={clearSession}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg hover:bg-black hover:scale-105 transition-all shadow-md"
                    >
                      <LogOut className="w-4 h-4" /> Finalizar Gestión
                    </button>
                  )}
                </div>
              </div>

              {/* Datos del contacto */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'C.I.',      value: currentCall.cedula },
                  { label: 'Teléfono',  value: currentCall.telefono },
                  { label: 'Campaña',   value: currentCall.campaignName },
                ].map((item, i) => (
                  <div key={i} className="bg-background/60 rounded-lg p-2.5 border border-border">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground truncate font-mono">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Compromiso ya registrado */}
              {currentCommitment && (
                <div className="mb-4 p-3 bg-emerald-50/60 dark:bg-emerald-900/15 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Compromiso registrado ({currentCommitment.registeredBy === 'AUTOMATIC' ? 'automático' : 'manual'})
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300">
                        Fecha: <strong>{currentCommitment.promisedDate?.toString().split('T')[0]}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón registrar compromiso */}
              <div className="flex items-center gap-3">
                {!currentCommitment && (
                  <button
                    onClick={() => setShowCommitmentModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Registrar compromiso
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {currentCommitment ? 'Compromiso ya registrado.' : 'El cliente no tiene compromiso aún.'}
                </span>
              </div>
            </div>
          ) : (
            /* Estado de espera / break / offline */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Headset className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {agentState.status === 'ON_BREAK'  ? 'En descanso'
                : agentState.status === 'OFFLINE'  ? 'Desconectado'
                : 'Esperando llamada'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[320px]">
                {agentState.status === 'ON_BREAK'
                  ? 'Estás en descanso. Las llamadas van a otros asesores disponibles.'
                  : agentState.status === 'OFFLINE'
                  ? 'No estás conectado al sistema.'
                  : 'Cuando un cliente solicite un asesor, la llamada se conectará aquí.'}
              </p>
              {agentState.status === 'AVAILABLE' && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Disponible y escuchando</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MÉTRICAS
            ════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Activity className="w-4.5 h-4.5 text-indigo-500" />,     label: 'Llamadas',    value: callHistory.length,                                    bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { icon: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />, label: 'Compromisos', value: callHistory.filter((h: any) => h.commitment).length,  bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: <Clock className="w-4.5 h-4.5 text-cyan-500" />,          label: 'Estado',      value: cfg.label,                                             bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
          ].map((m, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', m.bg)}>{m.icon}</div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                  <p className="text-lg font-bold text-foreground">{m.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            HISTORIAL
            ════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Historial de llamadas
            </h2>
            <div className="flex items-center gap-3 bg-background border border-border p-1.5 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 px-2 border-r border-border">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Filtro</span>
              </div>
              <input type="date" value={dateFilter.start} onChange={(e) => setDateFilter(p => ({ ...p, start: e.target.value }))}
                className="bg-transparent text-xs border-none focus:ring-0 text-foreground w-28 outline-none" />
              <span className="text-xs text-muted-foreground">–</span>
              <input type="date" value={dateFilter.end} onChange={(e) => setDateFilter(p => ({ ...p, end: e.target.value }))}
                className="bg-transparent text-xs border-none focus:ring-0 text-foreground w-28 outline-none" />
              <button onClick={fetchHistory} disabled={historyLoading}
                className="bg-primary text-primary-foreground p-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50">
                {historyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl overflow-hidden min-h-[200px]">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : callHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center">
                <Clock className="w-8 h-8 mb-2 opacity-20" /> No se encontraron llamadas
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {callHistory.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 py-3 px-4 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-500/20 flex items-center justify-center">
                      <PhoneOff className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{entry.contactName || entry.nombre || 'Desconocido'}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        C.I.: {entry.contactIdentification || entry.cedula || '—'} · {entry.campaignName}
                      </p>
                    </div>
                    {entry.commitment && (
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full mb-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Compromiso
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {entry.commitment.promisedDate ? new Date(entry.commitment.promisedDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-foreground font-mono">{entry.duration ? `${entry.duration}s` : '0s'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                        {entry.connectedAt
                          ? new Date(entry.connectedAt).toLocaleString('es-EC', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal compromiso */}
      {currentCall && (
        <CommitmentModal
          open={showCommitmentModal}
          onClose={() => setShowCommitmentModal(false)}
          call={currentCall}
          agentId={user?.id || ''}
          onSaved={handleCommitmentSaved}
        />
      )}
    </DashboardLayout>
  );
}