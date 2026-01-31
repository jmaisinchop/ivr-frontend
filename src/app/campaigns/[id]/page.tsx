'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ContactsTable } from '@/components/campaigns/ContactsTable';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import AddContactsModal  from '@/components/campaigns/AddContactsModal';
import { useCampaignStore } from '@/stores/campaign.store';
import { useDashboardUpdates } from '@/hooks/useSocket';
import { formatDate, formatDateInput } from '@/lib/utils';
import { PageLoading } from '@/components/ui/Spinner';
import {
  Play,
  Pause,
  XCircle,
  Edit2,
  UserPlus,
  Calendar,
  RefreshCw,
  Phone,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const {
    currentCampaign: campaign,
    fetchCampaignById,
    updateCampaign,
    addContacts,
    startCampaign,
    pauseCampaign,
    cancelCampaign,
    isLoading,
  } = useCampaignStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddContactsModal, setShowAddContactsModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCampaignById(campaignId);
  }, [campaignId, fetchCampaignById]);

  // Listen to real-time updates
  useDashboardUpdates(
    useCallback(
      (update) => {
        if (update.campaignId === campaignId) {
          fetchCampaignById(campaignId);
        }
      },
      [campaignId, fetchCampaignById]
    )
  );

  const handleStart = async () => {
    try {
      await startCampaign(campaignId);
      toast.success('Campaña iniciada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePause = async () => {
    try {
      await pauseCampaign(campaignId);
      toast.success('Campaña pausada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async () => {
    if (confirm('¿Estás seguro de cancelar esta campaña? Esta acción no se puede deshacer.')) {
      try {
        await cancelCampaign(campaignId);
        toast.success('Campaña cancelada');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleUpdate = async (data: any) => {
    setUpdating(true);
    try {
      await updateCampaign(campaignId, data);
      toast.success('Campaña actualizada');
      setShowEditModal(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddContacts = async (contacts: any[]) => {
    await addContacts(campaignId, contacts);
  };

  if (isLoading || !campaign) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  const canStart = ['SCHEDULED', 'PAUSED'].includes(campaign.status);
  const canPause = campaign.status === 'RUNNING';
  const canCancel = !['COMPLETED', 'CANCELLED'].includes(campaign.status);
  const canEdit = !['COMPLETED', 'CANCELLED'].includes(campaign.status);
  const canAddContacts = !['COMPLETED', 'CANCELLED', 'RUNNING'].includes(campaign.status);

  return (
    <DashboardLayout>
      <Header title={campaign.name} subtitle={`ID: ${campaign.id}`} />

      <div className="p-6 space-y-6">
        {/* Back link and actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/campaigns"
            className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a campañas
          </Link>

          <div className="flex items-center gap-2">
            {canStart && (
              <Button onClick={handleStart}>
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            )}
            {canPause && (
              <Button variant="secondary" onClick={handlePause}>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" onClick={() => setShowEditModal(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Campaign info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Estado</p>
                  <StatusBadge status={campaign.status} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-cyan/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-accent-cyan" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Canales</p>
                  <p className="text-xl font-bold text-white">{campaign.concurrentCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-amber/20 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-accent-amber" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Reintentos</p>
                  <p className="text-xl font-bold text-white">{campaign.maxRetries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-violet/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent-violet" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Período</p>
                  <p className="text-sm text-white">
                    {formatDate(campaign.startDate, { month: 'short', day: 'numeric' })} -{' '}
                    {formatDate(campaign.endDate, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Contactos</h3>
            {canAddContacts && (
              <Button variant="outline" onClick={() => setShowAddContactsModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Agregar Contactos
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ContactsTable campaignId={campaignId} />
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Campaña"
        size="lg"
      >
        <CampaignForm
          initialData={{
            name: campaign.name,
            startDate: formatDateInput(new Date(campaign.startDate)),
            endDate: formatDateInput(new Date(campaign.endDate)),
            maxRetries: campaign.maxRetries,
            concurrentCalls: campaign.concurrentCalls,
            retryOnAnswer: campaign.retryOnAnswer,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          isLoading={updating}
          submitLabel="Guardar Cambios"
        />
      </Modal>

      {/* Add Contacts Modal */}
      <AddContactsModal
        isOpen={showAddContactsModal}
        onClose={() => setShowAddContactsModal(false)}
        onAdd={handleAddContacts}
      />
    </DashboardLayout>
  );
}
