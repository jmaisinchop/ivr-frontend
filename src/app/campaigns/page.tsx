'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { useCampaignStore } from '@/stores/campaign.store';
import { Campaign, CreateCampaignDto, CampaignStatus } from '@/types';
import { Plus, Search, Filter } from 'lucide-react';
import { PageLoading, SkeletonCard } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { formatDateInput } from '@/lib/utils';

export default function CampaignsPage() {
  const { campaigns, fetchCampaigns, createCampaign, duplicateCampaign, isLoading, error } = useCampaignStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [campaignToDuplicate, setCampaignToDuplicate] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (data: CreateCampaignDto) => {
    setCreating(true);
    try {
      const campaign = await createCampaign(data);
      toast.success('Campaña creada exitosamente');
      setShowCreateModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicateClick = (campaign: Campaign) => {
    setCampaignToDuplicate(campaign);
    setShowDuplicateModal(true);
  };

  const handleDuplicate = async (data: CreateCampaignDto) => {
    if (!campaignToDuplicate) return;
    setCreating(true);
    try {
      await duplicateCampaign(campaignToDuplicate.id, data);
      toast.success('Campaña duplicada exitosamente');
      setShowDuplicateModal(false);
      setCampaignToDuplicate(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const statusOptions = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'SCHEDULED', label: 'Programadas' },
    { value: 'RUNNING', label: 'En ejecución' },
    { value: 'PAUSED', label: 'Pausadas' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ];

  const counts = {
    total: campaigns.length,
    running: campaigns.filter((c) => c.status === 'RUNNING').length,
    paused: campaigns.filter((c) => c.status === 'PAUSED').length,
    scheduled: campaigns.filter((c) => c.status === 'SCHEDULED').length,
  };

  return (
    <DashboardLayout>
      <Header title="Campañas" subtitle="Gestiona tus campañas de llamadas IVR" />

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4">
            <p className="text-3xl font-bold text-white">{counts.total}</p>
            <p className="text-sm text-dark-400">Total</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-3xl font-bold text-green-400">{counts.running}</p>
            <p className="text-sm text-dark-400">En ejecución</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-3xl font-bold text-yellow-400">{counts.paused}</p>
            <p className="text-sm text-dark-400">Pausadas</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-3xl font-bold text-blue-400">{counts.scheduled}</p>
            <p className="text-sm text-dark-400">Programadas</p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <Input
                placeholder="Buscar campañas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Campaña
          </Button>
        </div>

        {/* Campaigns grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-dark-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay campañas</h3>
            <p className="text-dark-400 mb-4">
              {search || statusFilter !== 'ALL'
                ? 'No se encontraron campañas con los filtros aplicados'
                : 'Crea tu primera campaña para comenzar'}
            </p>
            {!search && statusFilter === 'ALL' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Campaña
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDuplicate={handleDuplicateClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Campaña"
        size="lg"
      >
        <CampaignForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={creating}
        />
      </Modal>

      {/* Duplicate Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setCampaignToDuplicate(null);
        }}
        title={`Duplicar: ${campaignToDuplicate?.name}`}
        size="lg"
      >
        {campaignToDuplicate && (
          <CampaignForm
            initialData={{
              name: `${campaignToDuplicate.name} (copia)`,
              maxRetries: campaignToDuplicate.maxRetries,
              concurrentCalls: campaignToDuplicate.concurrentCalls,
              retryOnAnswer: campaignToDuplicate.retryOnAnswer,
            }}
            onSubmit={handleDuplicate}
            onCancel={() => {
              setShowDuplicateModal(false);
              setCampaignToDuplicate(null);
            }}
            isLoading={creating}
            submitLabel="Duplicar Campaña"
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
