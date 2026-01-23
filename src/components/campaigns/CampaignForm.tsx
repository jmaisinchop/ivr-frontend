'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CreateCampaignDto } from '@/types';
import { formatDateInput } from '@/lib/utils';

interface CampaignFormProps {
  initialData?: Partial<CreateCampaignDto>;
  onSubmit: (data: CreateCampaignDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CampaignForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Crear Campaña',
}: CampaignFormProps) {
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
    if (validate()) {
      await onSubmit(formData);
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

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="retryOnAnswer"
          checked={formData.retryOnAnswer}
          onChange={(e) => setFormData({ ...formData, retryOnAnswer: e.target.checked })}
          className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="retryOnAnswer" className="text-sm text-dark-300">
          Reintentar inmediatamente si no contestan
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
