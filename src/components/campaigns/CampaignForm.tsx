'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateCampaignDto } from '@/types';
import { formatDateInput } from '@/lib/utils';
import { cn } from '@/lib/utils';
import PostCallConfigSection, { PostCallConfigSectionRef } from '@/components/PostCallConfigSection';

interface CampaignFormProps {
  initialData?: Partial<CreateCampaignDto>;
  onSubmit: (data: CreateCampaignDto) => Promise<string | void>; // retorna campaignId si es nuevo
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  campaignId?: string; // existe = editar, no existe = crear/duplicar
}

// Ref que el padre usa para guardar post-llamada después de crear la campaña
export interface CampaignFormRef {
  savePostCall: (campaignId: string) => Promise<void>;
  hasPostCallChanges: boolean;
}

export const CampaignForm = forwardRef<CampaignFormRef, CampaignFormProps>(({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Crear Campaña',
  campaignId,
}, formRef) => {
  const postCallRef = useRef<PostCallConfigSectionRef>(null);

  useImperativeHandle(formRef, () => ({
    savePostCall: async (id: string) => {
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

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'La fecha de fin es requerida';
    }
    if (formData.maxRetries < 0) {
      newErrors.maxRetries = 'Los reintentos deben ser >= 0';
    }
    if (formData.concurrentCalls < 1) {
      newErrors.concurrentCalls = 'Debe haber al menos 1 canal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // 1. Crear/editar la campaña → el padre retorna el id (nuevo o existente)
    const savedId = await onSubmit(formData);

    // 2. Si hay cambios en post-llamada, guardarlos con el id de la campaña
    const targetId = savedId || campaignId;
    if (targetId && postCallRef.current?.hasChanges) {
      await postCallRef.current.save(targetId);
    }
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
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <label htmlFor="retryOnAnswer" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
          Reintentar inmediatamente si no contestan
        </label>
      </div>

      {/* ── Sección menú post-llamada ── */}
      <PostCallConfigSection ref={postCallRef} campaignId={campaignId} />

      <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-background">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
});

CampaignForm.displayName = 'CampaignForm';