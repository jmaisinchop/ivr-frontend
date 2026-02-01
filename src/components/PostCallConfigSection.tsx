'use client';

import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { postCallApi } from '@/lib/api';
import { PostCallConfig } from '@/types';
import { cn } from '@/lib/utils';
import { Phone, Users, ChevronDown, Loader2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Ref expuesta al padre para llamar save() después de crear la campaña ────
export interface PostCallConfigSectionRef {
  save: (campaignId: string) => Promise<void>;
  hasChanges: boolean;
}

interface PostCallConfigSectionProps {
  campaignId?: string; // undefined = campaña nueva (no guardada aún)
}

const PostCallConfigSection = forwardRef<PostCallConfigSectionRef, PostCallConfigSectionProps>(
  ({ campaignId }, ref) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Estado de la configuración
    const [active, setActive] = useState(true);
    const [menuAudio, setMenuAudio] = useState('');
    const [opt1, setOpt1] = useState('');
    const [opt2, setOpt2] = useState('');
    const [confirmAudio, setConfirmAudio] = useState('');
    const [invalidAudio, setInvalidAudio] = useState('');
    const [queueAudio, setQueueAudio] = useState('');

    // Valores por defecto cuando no existe config aún
    const applyDefaults = useCallback(() => {
      setActive(true);
      setMenuAudio('Para hablar con un asesor marque 1. Para registrar un compromiso de pago marque 2.');
      setOpt1('Transferencia a asesor');
      setOpt2('Compromiso de pago');
      setConfirmAudio('Su compromiso ha sido registrado correctamente. Gracias por su llamada.');
      setInvalidAudio('Entrada no válida. Por favor intente nuevamente.');
      setQueueAudio('Usted es el número {position} en la fila. Por favor espere.');
    }, []);

    // Cargar config existente cuando hay campaignId
    useEffect(() => {
      if (!campaignId) {
        applyDefaults();
        return;
      }
      setLoading(true);
      postCallApi.getConfigByCampaign(campaignId)
        .then((res: any) => {
          const c = res.data;
          setActive(c.active);
          setMenuAudio(c.menuAudioText);
          setOpt1(c.option1Label);
          setOpt2(c.option2Label);
          setConfirmAudio(c.confirmationAudioText);
          setInvalidAudio(c.invalidInputAudioText);
          setQueueAudio(c.queueAudioText);
          setOpen(true); // auto-abrir si ya tiene config
        })
        .catch(() => {
          applyDefaults();
        })
        .finally(() => setLoading(false));
    }, [campaignId, applyDefaults]);

    // Función save que el padre invoca con el campaignId (útil cuando la campaña es nueva)
    const save = useCallback(async (id: string) => {
      setSaving(true);
      try {
        const payload = {
          active,
          menuAudioText: menuAudio,
          option1Label: opt1,
          option2Label: opt2,
          confirmationAudioText: confirmAudio,
          invalidInputAudioText: invalidAudio,
          queueAudioText: queueAudio,
        };
        await postCallApi.createConfig(id, payload);
        toast.success('Menú post-llamada configurado');
        setHasChanges(false);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Error al guardar menú post-llamada');
        throw err;
      } finally {
        setSaving(false);
      }
    }, [active, menuAudio, opt1, opt2, confirmAudio, invalidAudio, queueAudio]);

    // Exponer ref al padre
    useImperativeHandle(ref, () => ({ save, hasChanges }), [save, hasChanges]);

    // Marcar cambios cuando el usuario edita algo
    const markChange = () => setHasChanges(true);

    return (
      <div className="border border-border rounded-xl overflow-hidden">
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
                {hasChanges && (
                  <span className="text-[9px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    Sin guardar
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {campaignId
                  ? 'Configuración del menú DTMF que se reproduce tras la llamada'
                  : 'Se configura automáticamente al guardar la campaña'}
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
          <div className="p-4 space-y-4 border-t border-border/50">
            {/* Toggle activo */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-foreground">Menú activo</p>
                <p className="text-xs text-muted-foreground">Activa/desactiva el menú post-llamada para esta campaña</p>
              </div>
              <button
                type="button"
                onClick={() => { setActive(!active); markChange(); }}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200',
                  active ? 'bg-emerald-500' : 'bg-muted'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                  active && 'translate-x-5'
                )} />
              </button>
            </div>

            {/* Audio menú principal */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Audio del menú principal (TTS)
              </label>
              <textarea
                value={menuAudio}
                onChange={(e) => { setMenuAudio(e.target.value); markChange(); }}
                rows={3}
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Texto que se reproduce como menú..."
              />
            </div>

            {/* Etiquetas opciones */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Opción 1 — Etiqueta
                </label>
                <input
                  type="text"
                  value={opt1}
                  onChange={(e) => { setOpt1(e.target.value); markChange(); }}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Ej: Transferencia a asesor"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Opción 2 — Etiqueta
                </label>
                <input
                  type="text"
                  value={opt2}
                  onChange={(e) => { setOpt2(e.target.value); markChange(); }}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Ej: Compromiso de pago"
                />
              </div>
            </div>

            {/* Audio confirmación compromiso */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Audio de confirmación (compromiso)
              </label>
              <textarea
                value={confirmAudio}
                onChange={(e) => { setConfirmAudio(e.target.value); markChange(); }}
                rows={2}
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Audio entrada inválida */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Audio de entrada inválida
              </label>
              <textarea
                value={invalidAudio}
                onChange={(e) => { setInvalidAudio(e.target.value); markChange(); }}
                rows={2}
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Audio cola de espera */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Audio de cola de espera
              </label>
              <textarea
                value={queueAudio}
                onChange={(e) => { setQueueAudio(e.target.value); markChange(); }}
                rows={2}
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Use <code className="bg-muted px-1 rounded">{'{position}'}</code> para insertar automáticamente la posición en la cola.
              </p>
            </div>

            {/* Botón guardar (solo visible si hay campaignId, es decir campaña existente) */}
            {campaignId && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => save(campaignId)}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 dark:bg-violet-500 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 dark:hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar menú post-llamada
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PostCallConfigSection.displayName = 'PostCallConfigSection';
export default PostCallConfigSection;