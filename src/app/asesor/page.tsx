'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { useAgentEvents } from '@/hooks/useAgentSocket';
import { commitmentsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { AgentCallEvent, Commitment } from '@/types';
import { cn } from '@/lib/utils';
import {
  Headset,
  Phone,
  PhoneOff,
  User,
  Clock,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  Activity,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Formatear segundos como mm:ss ─────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Timer en vivo para duración de llamada ────────────────────────────────
function CallTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startedAt]);

  return <span className="font-mono text-2xl font-bold text-cyan-600 dark:text-cyan-400">{formatTime(elapsed)}</span>;
}

// ─── Modal: Registrar compromiso manual ────────────────────────────────────
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

  // Validar que la fecha sea laborable (lunes a viernes) y <= día 28
  const validateDate = (val: string) => {
    if (!val) { setDateError(''); return true; }
    const d = new Date(val + 'T12:00:00'); // evitar timezone offset
    const day = d.getDay(); // 0=dom, 6=sab
    if (day === 0 || day === 6) {
      setDateError('La fecha debe ser un día laborable (lun–viernes)');
      return false;
    }
    if (d.getDate() > 28) {
      setDateError('El día no puede ser mayor a 28');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromisedDate(e.target.value);
    validateDate(e.target.value);
  };

  const handleSave = async () => {
    if (!promisedDate) return;
    if (!validateDate(promisedDate)) return;

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
      toast.success('Compromiso registrado exitosamente');
      onSaved(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar compromiso');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Fecha mínima: mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-2xl shadow-xl">
        {/* Header */}
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Fecha de pago prometida
            </label>
            <input
              type="date"
              value={promisedDate}
              min={minDate}
              onChange={handleDateChange}
              className={cn(
                'w-full bg-muted/40 border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
                dateError ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary'
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
              placeholder="Notas sobre la conversación..."
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!promisedDate || saving || !!dateError}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <CheckCircle2 className="w-3.5 h-3.5" />
            Guardar compromiso
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ───────────────────────────────────────────────────────
export default function AsesorPage() {
  const { user } = useAuthStore();
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [currentCommitment, setCurrentCommitment] = useState<Commitment | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Hook de eventos WebSocket del asesor
  const { currentCall, isOnCall } = useAgentEvents(
    useCallback((event: AgentCallEvent) => {
      if (event.type === 'CALL_ENDED') {
        setCurrentCommitment(null);
      }
      if (event.type === 'COMMITMENT_REGISTERED' && event.commitment) {
        setCurrentCommitment(event.commitment);
      }
    }, [])
  );

  // Cuando se guarda un compromiso manual
  const handleCommitmentSaved = useCallback((commitment: Commitment) => {
    setCurrentCommitment(commitment);
  }, []);

  return (
    <DashboardLayout>
      <Header title="Panel Asesor" subtitle="Tu espacio de trabajo" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* ── Estado de la llamada actual ── */}
        <div className={cn(
          'rounded-2xl border p-5 transition-all duration-500',
          isOnCall && currentCall
            ? 'bg-cyan-50/40 dark:bg-cyan-900/15 border-cyan-300 dark:border-cyan-500/40 shadow-lg shadow-cyan-500/10'
            : 'bg-background border-border'
        )}>
          {isOnCall && currentCall ? (
            // ── EN LLAMADA ──
            <div>
              {/* Header llamada */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center animate-pulse">
                    <Phone className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest bg-cyan-100 dark:bg-cyan-500/20 px-2 py-0.5 rounded-full">
                        Llamada activa
                      </span>
                    </div>
                    <p className="text-lg font-bold text-foreground mt-0.5">{currentCall.nombre}</p>
                  </div>
                </div>
                {/* Timer */}
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Duración</p>
                  {currentCall.connectedAt ? (
                    <CallTimer startedAt={currentCall.connectedAt} />
                  ) : (
                    <span className="font-mono text-2xl font-bold text-cyan-600 dark:text-cyan-400">—</span>
                  )}
                </div>
              </div>

              {/* Info del contacto */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'C.I.', value: currentCall.cedula },
                  { label: 'Teléfono', value: currentCall.telefono },
                  { label: 'Campaña', value: currentCall.campaignName },
                ].map((item, i) => (
                  <div key={i} className="bg-background/60 rounded-lg p-2.5 border border-cyan-200/40 dark:border-cyan-500/20">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground truncate font-mono">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Compromiso automático si ya existe */}
              {currentCommitment && (
                <div className="mb-4 p-3 bg-emerald-50/60 dark:bg-emerald-900/15 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Compromiso registrado ({currentCommitment.registeredBy === 'AUTOMATIC' ? 'automático' : 'manual'})
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300">
                        Fecha prometida: <strong>{currentCommitment.promisedDate}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center gap-3">
                {!currentCommitment && (
                  <button
                    onClick={() => setShowCommitmentModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar compromiso
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {currentCommitment ? 'El compromiso ya fue registrado para esta llamada.' : 'El cliente no ha registrado compromiso aún.'}
                </span>
              </div>
            </div>
          ) : (
            // ── SIN LLAMADA ACTIVA ──
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Headset className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Esperando llamada</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[320px]">
                Cuando un cliente solicite hablar con un asesor, la llamada se conectará automáticamente aquí.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Disponible</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Métricas del asesor ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Activity className="w-4.5 h-4.5 text-indigo-500" />, label: 'Llamadas hoy', value: callHistory.length, bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { icon: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />, label: 'Compromisos', value: callHistory.filter((h: any) => h.commitment).length, bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { icon: <Clock className="w-4.5 h-4.5 text-cyan-500" />, label: 'Estado', value: isOnCall ? 'En llamada' : 'Disponible', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
          ].map((m, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', m.bg)}>
                  {m.icon}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                  <p className="text-lg font-bold text-foreground">{m.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Historial de llamadas ── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Historial de llamadas hoy
          </h2>

          <div className="bg-background border border-border rounded-xl overflow-hidden">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : callHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay llamadas registradas hoy
              </div>
            ) : (
              callHistory.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-4 py-3 px-4 border-b border-border/30 last:border-0">
                  {/* Ícono estado */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    entry.status === 'FINISHED' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-gray-100 dark:bg-gray-500/20'
                  )}>
                    {entry.status === 'FINISHED'
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <PhoneOff className="w-4 h-4 text-gray-500" />
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {entry.contactName || entry.nombre || 'Contacto desconocido'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      C.I.: {entry.cedula || entry.contactIdentification || '—'} · {entry.duration ? `${entry.duration}s` : '—'}
                    </p>
                  </div>
                  {/* Badge compromiso si existe */}
                  {entry.commitment && (
                    <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      Compromiso: {entry.commitment.promisedDate}
                    </span>
                  )}
                  {/* Timestamp */}
                  <p className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                    {entry.connectedAt ? new Date(entry.connectedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal compromiso manual */}
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