'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateCampaignDto } from '@/types';
import { formatDateInput } from '@/lib/utils';
import { postCallApi } from '@/lib/api';
import PostCallConfigSection, { PostCallConfigSectionRef } from '@/components/PostCallConfigSection';
import toast from 'react-hot-toast';

interface CampaignFormProps {
  initialData?: Partial<CreateCampaignDto>;
  onSubmit: (data: CreateCampaignDto) => Promise<string | void>;
  onCancel: () => void;
  onSuccess?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  campaignId?: string;
}

export interface CampaignFormRef {
  savePostCall: (campaignId: string) => Promise<void>;
  hasPostCallChanges: boolean;
}

export const CampaignForm = forwardRef<CampaignFormRef, CampaignFormProps>(({
  initialData,
  onSubmit,
  onCancel,
  onSuccess,
  isLoading,
  submitLabel = 'Crear Campaña',
  campaignId,
}, formRef) => {
  const postCallRef = useRef<PostCallConfigSectionRef>(null);

  const postCallStateRef = useRef<{
    active: boolean;
    greeting: string;
    options: { key: string; action: string; text: string }[];
  } | null>(null);

  // ─── LOG: Mount / unmount ──────────────────────────────────────────────
  useEffect(() => {
    console.log('📌 [CampaignForm] MONTADO. campaignId prop:', campaignId, '| modo:', campaignId ? 'EDICIÓN' : 'CREACIÓN');
    return () => {
      console.log('📌 [CampaignForm] DESMONTADO. campaignId:', campaignId);
    };
  }, [campaignId]);

  // ─── LOG: Monitorea el ref de PostCallConfigSection cada 500ms ─────────
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔍 [CampaignForm] postCallRef.current:', postCallRef.current === null ? 'NULL' : 'CONECTADO');
      console.log('🔍 [CampaignForm] postCallStateRef.current:', postCallStateRef.current);
    }, 500);
    // Solo corre durante 3 segundos para no floodar
    const stop = setTimeout(() => clearInterval(interval), 3000);
    return () => { clearInterval(interval); clearTimeout(stop); };
  }, []);

  const handlePostCallStateChange = (state: {
    active: boolean;
    greeting: string;
    options: { key: string; action: string; text: string }[];
  }) => {
    console.log('📡 [CampaignForm] onStateChange recibió estado desde PostCallConfigSection:', state);
    postCallStateRef.current = state;
  };

  useImperativeHandle(formRef, () => ({
    savePostCall: async (id: string) => {
      console.log('📌 [CampaignForm] useImperativeHandle.savePostCall llamado con id:', id);
      if (postCallRef.current) {
        await postCallRef.current.save(id);
      }
    },
    get hasPostCallChanges() {
      return postCallRef.current?.hasChanges ?? false;
    },
  }));

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [formData, setFormData] = useState<CreateCampaignDto>({
    name: initialData?.name || '',
    startDate: initialData?.startDate || formatDateInput(now),
    endDate: initialData?.endDate || formatDateInput(tomorrow),
    maxRetries: initialData?.maxRetries ?? 3,
    concurrentCalls: initialData?.concurrentCalls ?? 2,
    retryOnAnswer: initialData?.retryOnAnswer ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es requerida';
    if (!formData.endDate) newErrors.endDate = 'La fecha de fin es requerida';
    if (formData.maxRetries < 0) newErrors.maxRetries = 'Los reintentos deben ser >= 0';
    if (formData.concurrentCalls < 1) newErrors.concurrentCalls = 'Debe haber al menos 1 canal';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.warn('⚠️ [CampaignForm] Validación falló:', newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  // ─── FALLBACK: guarda post-call directo vía API ───────────────────────
  const savePostCallDirect = async (targetId: string): Promise<void> => {
    const state = postCallStateRef.current;
    if (!state) {
      console.warn('⚠️ [CampaignForm] savePostCallDirect: postCallStateRef es null. No hay datos.');
      return;
    }
    console.log('📡 [CampaignForm] savePostCallDirect: enviando a API...', { targetId, payload: state });
    try {
      await postCallApi.createConfig(targetId, {
        active: state.active,
        greeting: state.greeting,
        options: state.options,
      });
      console.log('✅ [CampaignForm] savePostCallDirect: API respondió OK');
      toast.success(state.active ? 'Menú post-llamada activado' : 'Menú post-llamada desactivado');
    } catch (err: any) {
      console.error('❌ [CampaignForm] savePostCallDirect: error en API:', err);
      toast.error('Error al guardar configuración del menú');
    }
  };

  // ─── SUBMIT PRINCIPAL ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('▶️  [CampaignForm] handleSubmit INICIO');
    console.log('   campaignId prop:', campaignId);
    console.log('   formData:', formData);

    if (!validate()) {
      console.warn('⚠️  [CampaignForm] handleSubmit abortado por validación');
      return;
    }

    // PASO 1: Guardar campaña
    console.log('   [PASO 1] Llamando onSubmit (guardar campaña)...');
    let savedId: string | void;
    try {
      savedId = await onSubmit(formData);
      console.log('   [PASO 1] onSubmit retornó:', savedId, '| tipo:', typeof savedId);
    } catch (err: any) {
      console.error('❌ [PASO 1] onSubmit lanzó error:', err);
      return; // Si la campaña no se guardó, no seguimos
    }

    // PASO 2: Resolver targetId
    const targetId = savedId || campaignId;
    console.log('   [PASO 2] targetId resuelto:', targetId);

    if (!targetId) {
      console.warn('⚠️  [PASO 2] No hay targetId. Terminando sin guardar post-call.');
      if (onSuccess) onSuccess();
      return;
    }

    // PASO 3: Guardar post-call
    console.log('   [PASO 3] postCallRef.current es:', postCallRef.current === null ? 'NULL' : 'CONECTADO');
    console.log('   [PASO 3] postCallStateRef.current es:', postCallStateRef.current);

    if (postCallRef.current) {
      console.log('   [PASO 3] ✅ Usando postCallRef.current.save()');
      try {
        await postCallRef.current.save(targetId);
        console.log('   [PASO 3] ✅ postCallRef.save() terminó OK');
      } catch (err: any) {
        console.error('❌ [PASO 3] postCallRef.save() lanzó error:', err);
      }
    } else {
      console.log('   [PASO 3] ⚡ postCallRef es NULL → usando savePostCallDirect (fallback)');
      await savePostCallDirect(targetId);
    }

    // PASO 4: Finalizar
    console.log('   [PASO 4] Llamando onSuccess para cerrar modal');
    if (onSuccess) {
      onSuccess();
    }
    console.log('✅ [CampaignForm] handleSubmit FINALIZADO');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nombre de la campaña"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="Ej: Campaña de cobranza Enero"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de inicio"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          error={errors.startDate}
          placeholder="dd-MM-yyyy HH:mm:ss"
          helperText="Formato: dd-MM-yyyy HH:mm:ss"
        />
        <Input
          label="Fecha de fin"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          error={errors.endDate}
          placeholder="dd-MM-yyyy HH:mm:ss"
          helperText="Formato: dd-MM-yyyy HH:mm:ss"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Máximo de reintentos"
          type="number"
          min={0}
          max={10}
          value={formData.maxRetries}
          onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 0 })}
          error={errors.maxRetries}
        />
        <Input
          label="Llamadas concurrentes"
          type="number"
          min={1}
          max={100}
          value={formData.concurrentCalls}
          onChange={(e) => setFormData({ ...formData, concurrentCalls: parseInt(e.target.value) || 1 })}
          error={errors.concurrentCalls}
        />
      </div>

      <div className="flex items-center gap-3 p-1">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="retryOnAnswer"
            checked={formData.retryOnAnswer}
            onChange={(e) => setFormData({ ...formData, retryOnAnswer: e.target.checked })}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-input bg-background transition-all checked:border-primary checked:bg-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity"
            width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <label htmlFor="retryOnAnswer" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
          Reintentar inmediatamente si no contestan
        </label>
      </div>

      {/* ── Sección menú post-llamada ── */}
      <PostCallConfigSection
        ref={postCallRef}
        campaignId={campaignId}
        onStateChange={handlePostCallStateChange}
      />

      <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-background" disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
});

CampaignForm.displayName = 'CampaignForm';