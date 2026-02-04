'use client';

import { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { postCallApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2, Settings, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface MenuStep {
  prompt: string;
  capture: 'single_digit' | 'numeric';
  maxDigits?: number;
  validation: 'day_1_28' | 'day_laborable' | 'none';
  errorMessage: string;
  saveAs: string;
}

interface MenuOption {
  key: string;
  action: 'transfer_agent' | 'payment_commitment';
  text: string;
  steps: MenuStep[];
}

interface PostCallState {
  active: boolean;
  greeting: string;
  options: MenuOption[];
  queueMessage: string;
  confirmationMessage: string;
  errorMessage: string;
}

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

const DEFAULT_STATE: PostCallState = {
  active: true,
  greeting: 'Gracias por su llamada. Para hablar con un asesor marque 1. Para registrar un compromiso de pago marque 2.',
  options: [
    {
      key: '1',
      action: 'transfer_agent',
      text: 'Para hablar con un asesor marque 1',
      steps: [], // transfer_agent no tiene preguntas
    },
    {
      key: 'payment_commitment',
      action: 'payment_commitment',
      text: 'Para registrar un compromiso de pago marque 2',
      steps: [
        {
          prompt: 'Por favor ingrese el día de pago usando el teclado numérico.',
          capture: 'numeric',
          maxDigits: 2,
          validation: 'day_laborable',
          errorMessage: 'El día ingresado no es válido. Por favor intente nuevamente.',
          saveAs: 'commitmentDay',
        },
      ],
    },
  ],
  queueMessage: 'Todos los asesores están ocupados. Usted es el número {position} en la fila. Por favor espere.',
  confirmationMessage: 'Su compromiso ha sido registrado para el día {day}. Gracias por su llamada.',
  errorMessage: 'No se recibió respuesta. Adiós.',
};

// Fix: corregir la key de la segunda opción en defaults
DEFAULT_STATE.options[1].key = '2';

// ─── ACCIONES DISPONIBLES con etiquetas ─────────────────────────────────────
const ACTION_OPTIONS = [
  { value: 'transfer_agent', label: 'Transferir a asesor' },
  { value: 'payment_commitment', label: 'Compromiso de pago' },
];

// ─── VALIDACIONES DISPONIBLES ────────────────────────────────────────────────
const VALIDATION_OPTIONS = [
  { value: 'day_1_28', label: 'Día (1-28)' },
  { value: 'day_laborable', label: 'Día laborable (1-28, lun-vie)' },
  { value: 'none', label: 'Sin validación' },
];

// ─── REF ─────────────────────────────────────────────────────────────────────
export interface PostCallConfigSectionRef {
  save: (campaignId: string) => Promise<void>;
  hasChanges: boolean;
}

interface PostCallConfigSectionProps {
  campaignId?: string;
  onStateChange?: (state: PostCallState) => void;
}

// ─── SUB-COMPONENTE: STEP EDITOR ─────────────────────────────────────────────
function StepEditor({
  step,
  index,
  onChange,
  onRemove,
}: {
  step: MenuStep;
  index: number;
  onChange: (updated: MenuStep) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border/60 rounded-lg p-3 space-y-2.5 bg-muted/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pregunta {index + 1}
        </span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-[10px] text-muted-foreground mb-1">Texto que reproduce (TTS)</label>
        <textarea
          value={step.prompt}
          onChange={(e) => onChange({ ...step, prompt: e.target.value })}
          rows={2}
          className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Tipo de captura */}
        <div>
          <label className="block text-[10px] text-muted-foreground mb-1">Tipo de captura</label>
          <select
            value={step.capture}
            onChange={(e) => onChange({ ...step, capture: e.target.value as MenuStep['capture'] })}
            className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="single_digit">Un solo dígito</option>
            <option value="numeric">Múltiples dígitos</option>
          </select>
        </div>

        {/* Max dígitos (solo si capture = numeric) */}
        {step.capture === 'numeric' && (
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">Máx dígitos</label>
            <input
              type="number"
              min={1}
              max={9}
              value={step.maxDigits || 2}
              onChange={(e) => onChange({ ...step, maxDigits: parseInt(e.target.value) || 2 })}
              className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Validación */}
        <div>
          <label className="block text-[10px] text-muted-foreground mb-1">Validación</label>
          <select
            value={step.validation}
            onChange={(e) => onChange({ ...step, validation: e.target.value as MenuStep['validation'] })}
            className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {VALIDATION_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* saveAs */}
        <div>
          <label className="block text-[10px] text-muted-foreground mb-1">Guardar como</label>
          <input
            type="text"
            value={step.saveAs}
            onChange={(e) => onChange({ ...step, saveAs: e.target.value })}
            placeholder="ej: commitmentDay"
            className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Mensaje de error */}
      <div>
        <label className="block text-[10px] text-muted-foreground mb-1">Mensaje si falla la validación</label>
        <input
          type="text"
          value={step.errorMessage}
          onChange={(e) => onChange({ ...step, errorMessage: e.target.value })}
          className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTE: OPTION EDITOR ───────────────────────────────────────────
function OptionEditor({
  option,
  index,
  onChange,
  onRemove,
}: {
  option: MenuOption;
  index: number;
  onChange: (updated: MenuOption) => void;
  onRemove: () => void;
}) {
  const addStep = () => {
    onChange({
      ...option,
      steps: [
        ...option.steps,
        {
          prompt: '',
          capture: 'numeric',
          maxDigits: 2,
          validation: 'none',
          errorMessage: 'Entrada no válida.',
          saveAs: '',
        },
      ],
    });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header opción */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border/50">
        <span className="text-xs font-bold text-foreground">Opción {index + 1} — Tecla "{option.key}"</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Tecla DTMF */}
          <div>
            <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tecla DTMF</label>
            <select
              value={option.key}
              onChange={(e) => onChange({ ...option, key: e.target.value })}
              className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {['1','2','3','4','5','6','7','8','9','0','*','#'].map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Acción */}
          <div>
            <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Acción</label>
            <select
              value={option.action}
              onChange={(e) => {
                const newAction = e.target.value as MenuOption['action'];
                // Si cambio a transfer_agent, limpiar steps (no tiene preguntas)
                onChange({
                  ...option,
                  action: newAction,
                  steps: newAction === 'transfer_agent' ? [] : option.steps,
                });
              }}
              className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Texto anuncio */}
        <div>
          <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Texto del anuncio</label>
          <input
            type="text"
            value={option.text}
            onChange={(e) => onChange({ ...option, text: e.target.value })}
            placeholder="Ej: Para hablar con un asesor marque 1"
            className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Steps (preguntas) — solo si la acción no es transfer_agent */}
        {option.action !== 'transfer_agent' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Preguntas ({option.steps.length})
              </span>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/70 font-semibold transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar pregunta
              </button>
            </div>
            {option.steps.map((step, si) => (
              <StepEditor
                key={si}
                step={step}
                index={si}
                onChange={(updated) => {
                  const newSteps = [...option.steps];
                  newSteps[si] = updated;
                  onChange({ ...option, steps: newSteps });
                }}
                onRemove={() => {
                  onChange({ ...option, steps: option.steps.filter((_, idx) => idx !== si) });
                }}
              />
            ))}
            {option.steps.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">
                Esta opción no tiene preguntas. Agrega una si necesitas capturar datos del cliente.
              </p>
            )}
          </div>
        )}

        {option.action === 'transfer_agent' && (
          <p className="text-[10px] text-muted-foreground italic">
            La transferencia a asesor no tiene preguntas. El cliente pasa directamente a la cola.
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const PostCallConfigSection = forwardRef<PostCallConfigSectionRef, PostCallConfigSectionProps>(
  ({ campaignId, onStateChange }, ref) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [state, setState] = useState<PostCallState>(DEFAULT_STATE);
    const stateRef = useRef<PostCallState>(DEFAULT_STATE);

    // ─── Sincroniza ref interno + sube estado al padre ──────────────────
    useEffect(() => {
      stateRef.current = state;
      if (onStateChange) {
        onStateChange(state);
      }
    }, [state, onStateChange]);

    // ─── Carga inicial desde API ─────────────────────────────────────────
    useEffect(() => {
      if (!campaignId) {
        setState(DEFAULT_STATE);
        return;
      }

      setLoading(true);
      postCallApi.getConfigByCampaign(campaignId)
        .then((res: any) => {
          const c = res.data;
          if (!c || !c.active && !c.greeting && (!c.options || c.options.length === 0)) {
            setState(DEFAULT_STATE);
            return;
          }

          // Mapear datos de la API al estado local
          const loaded: PostCallState = {
            active: c.active === true,
            greeting: c.greeting || DEFAULT_STATE.greeting,
            options: c.options && c.options.length > 0
              ? c.options.map((opt: any) => ({
                  key: opt.key,
                  action: opt.action,
                  text: opt.text || '',
                  steps: opt.steps || [],
                }))
              : DEFAULT_STATE.options,
            queueMessage: c.queueMessage || DEFAULT_STATE.queueMessage,
            confirmationMessage: c.confirmationMessage || DEFAULT_STATE.confirmationMessage,
            errorMessage: c.errorMessage || DEFAULT_STATE.errorMessage,
          };

          setState(loaded);
          setOpen(true);
        })
        .catch(() => {
          setState(DEFAULT_STATE);
        })
        .finally(() => setLoading(false));
    }, [campaignId]);

    // ─── SAVE ──────────────────────────────────────────────────────────────
    const save = useCallback(async (id: string) => {
      const current = stateRef.current;
      const payload = {
        active: current.active,
        greeting: current.greeting,
        options: current.options,
        queueMessage: current.queueMessage,
        confirmationMessage: current.confirmationMessage,
        errorMessage: current.errorMessage,
      };

      try {
        await postCallApi.createConfig(id, payload);
        toast.success(current.active ? 'Menú post-llamada activado' : 'Menú post-llamada desactivado');
      } catch (err: any) {
        console.error('[PostCallConfigSection] save error:', err);
        toast.error('Error al guardar configuración del menú');
      }
    }, []);

    useImperativeHandle(ref, () => ({
      save,
      get hasChanges() { return true; },
    }), [save]);

    // ─── HANDLERS ────────────────────────────────────────────────────────
    const updateOption = (index: number, updated: MenuOption) => {
      setState(prev => ({
        ...prev,
        options: prev.options.map((opt, i) => i === index ? updated : opt),
      }));
    };

    const addOption = () => {
      // Buscar la siguiente tecla disponible
      const usedKeys = new Set(state.options.map(o => o.key));
      const nextKey = ['1','2','3','4','5','6','7','8','9','0'].find(k => !usedKeys.has(k)) || '0';

      setState(prev => ({
        ...prev,
        options: [
          ...prev.options,
          {
            key: nextKey,
            action: 'transfer_agent',
            text: '',
            steps: [],
          },
        ],
      }));
    };

    const removeOption = (index: number) => {
      setState(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    };

    // ─── RENDER ──────────────────────────────────────────────────────────
    return (
      <div className="border border-border rounded-xl overflow-hidden mt-4">
        {/* Header colapsible */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-500/20 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                Menú post-llamada
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                  state.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {state.active ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {state.options.length} opción{state.options.length !== 1 ? 'es' : ''} configurada{state.options.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </div>
        </button>

        {/* Cuerpo expandible */}
        {open && !loading && (
          <div className="p-4 space-y-5 border-t border-border/50">

            {/* TOGGLE ACTIVO/INACTIVO */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-semibold text-foreground">Menú activo</p>
                <p className="text-xs text-muted-foreground">Activa o desactiva el menú para esta campaña</p>
              </div>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, active: !prev.active }))}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                  state.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                  state.active && 'translate-x-5'
                )} />
              </button>
            </div>

            <div className={cn("space-y-5 transition-opacity duration-200", !state.active && "opacity-50 pointer-events-none")}>

              {/* SALUDO */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Saludo (texto que reproduce al inicio)
                </label>
                <textarea
                  value={state.greeting}
                  onChange={(e) => setState(prev => ({ ...prev, greeting: e.target.value }))}
                  rows={3}
                  placeholder="Gracias por su llamada. Para hablar con un asesor marque 1..."
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Este texto se convierte en audio TTS automáticamente. El cliente puede presionar una tecla mientras se reproduce.
                </p>
              </div>

              {/* OPCIONES DEL MENÚ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Opciones del menú
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/70 font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar opción
                  </button>
                </div>

                <div className="space-y-3">
                  {state.options.map((opt, i) => (
                    <OptionEditor
                      key={i}
                      option={opt}
                      index={i}
                      onChange={(updated) => updateOption(i, updated)}
                      onRemove={() => removeOption(i)}
                    />
                  ))}
                  {state.options.length === 0 && (
                    <div className="border border-dashed border-border rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground">No hay opciones. Agrega al menos una.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* MENSAJES CONFIGURABLES */}
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Mensajes del sistema
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Estos mensajes se reproducen en situaciones específicas. Soportan placeholders: <code className="bg-muted px-1 rounded">{'{position}'}</code> para posición en cola, <code className="bg-muted px-1 rounded">{'{day}'}</code> para el día capturado.
                </p>

                {/* Mensaje en cola */}
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Mensaje cuando el cliente está en espera</label>
                  <input
                    type="text"
                    value={state.queueMessage}
                    onChange={(e) => setState(prev => ({ ...prev, queueMessage: e.target.value }))}
                    placeholder="Usted es el número {position} en la fila..."
                    className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Mensaje de confirmación */}
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Mensaje de confirmación exitosa</label>
                  <input
                    type="text"
                    value={state.confirmationMessage}
                    onChange={(e) => setState(prev => ({ ...prev, confirmationMessage: e.target.value }))}
                    placeholder="Su compromiso ha sido registrado para el día {day}..."
                    className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Mensaje de error general */}
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Mensaje si el cliente no responde</label>
                  <input
                    type="text"
                    value={state.errorMessage}
                    onChange={(e) => setState(prev => ({ ...prev, errorMessage: e.target.value }))}
                    placeholder="No se recibió respuesta. Adiós."
                    className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PostCallConfigSection.displayName = 'PostCallConfigSection';
export default PostCallConfigSection;